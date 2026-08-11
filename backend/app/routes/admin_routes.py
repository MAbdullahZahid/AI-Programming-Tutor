from flask import Blueprint, jsonify
from app.extensions import db
from app.models.user import User
from app.models.chat import Chat
from app.models.survey import SurveyResponse, SurveyQuestion
from app.utils.decorators import admin_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    """Total users + basic activity summary for the admin dashboard."""
    users = User.query.filter_by(role="student").order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        chat_count = Chat.query.filter_by(user_id=u.id).count()
        survey_count = SurveyResponse.query.filter_by(user_id=u.id).count()
        result.append({
            **u.to_dict(),
            "chat_count": chat_count,
            "survey_response_count": survey_count,
        })
    return jsonify({"total_users": len(result), "users": result}), 200


@admin_bp.route("/users/<int:user_id>/chats", methods=["GET"])
@admin_required
def user_chats(user_id):
    chats = Chat.query.filter_by(user_id=user_id).order_by(Chat.created_at.desc()).all()
    return jsonify([c.to_dict() for c in chats]), 200


@admin_bp.route("/users/<int:user_id>/survey-responses", methods=["GET"])
@admin_required
def user_survey_responses(user_id):
    """All survey answers for one user, joined with question text — for analysis."""
    responses = SurveyResponse.query.filter_by(user_id=user_id).all()
    result = []
    for r in responses:
        question = SurveyQuestion.query.get(r.question_id)
        result.append({
            "question": question.question_text if question else None,
            "question_type": question.question_type if question else None,
            "answer": r.answer_value,
            "submitted_at": r.submitted_at.isoformat(),
        })
    return jsonify(result), 200


@admin_bp.route("/survey/analytics", methods=["GET"])
@admin_required
def survey_analytics():
    """
    Aggregated results across ALL students, per question — for the
    Survey Results dashboard:
      - Likert questions: 1-5 distribution counts + average score
      - Text questions: the full list of free-text answers
    Also returns overall completion stats (how many of the total
    registered students have submitted at least one survey answer).
    """
    total_students = User.query.filter_by(role="student").count()
    respondent_count = (
        db.session.query(SurveyResponse.user_id).distinct().count()
    )

    questions = SurveyQuestion.query.order_by(SurveyQuestion.order_index).all()
    question_results = []

    for q in questions:
        responses = SurveyResponse.query.filter_by(question_id=q.id).all()

        if q.question_type == "likert":
            counts = {str(i): 0 for i in range(1, 6)}
            valid_total = 0
            score_sum = 0
            for r in responses:
                if r.answer_value in counts:
                    counts[r.answer_value] += 1
                    valid_total += 1
                    score_sum += int(r.answer_value)
            average = round(score_sum / valid_total, 2) if valid_total > 0 else None

            question_results.append({
                "id": q.id,
                "survey_id": q.survey_id,
                "survey_title": q.survey.title,
                "question_text": q.question_text,
                "question_type": "likert",
                "counts": counts,
                "total_responses": valid_total,
                "average": average,
            })
        else:
            question_results.append({
                "id": q.id,
                "survey_id": q.survey_id,
                "survey_title": q.survey.title,
                "question_text": q.question_text,
                "question_type": "text",
                "responses": [r.answer_value for r in responses],
                "total_responses": len(responses),
            })

    return jsonify({
        "total_students": total_students,
        "respondent_count": respondent_count,
        "completion_rate": round((respondent_count / total_students) * 100, 1) if total_students > 0 else 0,
        "questions": question_results,
    }), 200
