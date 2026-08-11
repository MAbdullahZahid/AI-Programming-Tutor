import csv
import io
import re
from datetime import datetime
from flask import Blueprint, jsonify, Response
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message
from app.models.survey import SurveyResponse, SurveyQuestion
from app.models.user import ParticipantIdentity, DataDeletionAudit
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
            "participant_code": u.participant_identity.participant_code if u.participant_identity else None,
            "chat_count": chat_count,
            "survey_response_count": survey_count,
        })
    return jsonify({"total_users": len(result), "users": result}), 200


def anonymise_text(value, user):
    """Remove common direct identifiers from free-text research exports."""
    text = str(value or "")
    text = re.sub(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", "[EMAIL REDACTED]", text, flags=re.I)
    if user:
        identifiers = [user.full_name, user.email]
        identifiers.extend(part for part in user.full_name.split() if len(part) > 2)
        for identifier in sorted(set(identifiers), key=len, reverse=True):
            text = re.sub(re.escape(identifier), "[NAME REDACTED]", text, flags=re.I)
    return text


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
                "percentages": {score: round((count / valid_total) * 100, 1) if valid_total else 0 for score, count in counts.items()},
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


@admin_bp.route("/analysis/export", methods=["GET"])
@admin_required
def anonymised_analysis_export():
    """Raw research dataset containing participant codes but no names/emails/user IDs."""
    participants = ParticipantIdentity.query.order_by(ParticipantIdentity.participant_code).all()
    output = {"generated_at": datetime.utcnow().isoformat(), "chats": [], "survey_responses": []}
    for identity in participants:
        code = identity.participant_code
        user = db.session.get(User, identity.user_id)
        for chat in Chat.query.filter_by(user_id=identity.user_id).all():
            for message in chat.messages:
                output["chats"].append({"participant_code": code, "chat_id": chat.id,
                    "sender": message.sender, "content": anonymise_text(message.content, user),
                    "timestamp": message.timestamp.isoformat()})
        for response in SurveyResponse.query.filter_by(user_id=identity.user_id).all():
            output["survey_responses"].append({"participant_code": code,
                "survey": response.question.survey.title, "question": response.question.question_text,
                "question_type": response.question.question_type, "answer": anonymise_text(response.answer_value, user),
                "submitted_at": response.submitted_at.isoformat()})
    return jsonify(output), 200


@admin_bp.route("/survey/export.csv", methods=["GET"])
@admin_required
def survey_csv_export():
    """Analysis-ready, anonymised survey CSV with raw answers and aggregate statistics."""
    buffer = io.StringIO(newline="")
    fields = ["row_type", "participant_code", "survey", "question", "question_type", "answer",
              "score", "count", "percentage", "mean", "submitted_at"]
    writer = csv.DictWriter(buffer, fieldnames=fields)
    writer.writeheader()
    identities = {item.user_id: item.participant_code for item in ParticipantIdentity.query.all()}
    users = {user.id: user for user in User.query.filter_by(role="student").all()}
    questions = SurveyQuestion.query.order_by(SurveyQuestion.survey_id, SurveyQuestion.order_index).all()
    for question in questions:
        responses = SurveyResponse.query.filter_by(question_id=question.id).all()
        for response in responses:
            writer.writerow({"row_type": "response", "participant_code": identities.get(response.user_id, "UNKNOWN"),
                "survey": question.survey.title, "question": question.question_text,
                "question_type": question.question_type, "answer": anonymise_text(response.answer_value, users.get(response.user_id)),
                "submitted_at": response.submitted_at.isoformat()})
        if question.question_type == "likert":
            valid = [int(r.answer_value) for r in responses if r.answer_value in {"1", "2", "3", "4", "5"}]
            mean = round(sum(valid) / len(valid), 2) if valid else ""
            for score in range(1, 6):
                count = valid.count(score)
                writer.writerow({"row_type": "aggregate", "survey": question.survey.title,
                    "question": question.question_text, "question_type": "likert", "score": score,
                    "count": count, "percentage": round(count / len(valid) * 100, 1) if valid else 0,
                    "mean": mean})
    return Response(buffer.getvalue(), mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=anonymised-survey-analysis.csv"})


@admin_bp.route("/users/<int:user_id>/data", methods=["DELETE"])
@admin_required
def delete_participant_data(user_id):
    user = User.query.filter_by(id=user_id, role="student").first()
    if not user:
        return jsonify({"error": "Student not found"}), 404
    identity = user.participant_identity
    code = identity.participant_code if identity else f"LEGACY-{user.id}"
    chats = Chat.query.filter_by(user_id=user.id).all()
    chat_count = len(chats)
    response_count = SurveyResponse.query.filter_by(user_id=user.id).count()
    for chat in chats:
        db.session.delete(chat)
    SurveyResponse.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    db.session.add(DataDeletionAudit(participant_code=code,
        deleted_by_admin_id=int(get_jwt_identity()), chats_deleted=chat_count,
        responses_deleted=response_count))
    db.session.commit()
    return jsonify({"message": "Participant research data deleted", "participant_code": code,
                    "chats_deleted": chat_count, "responses_deleted": response_count}), 200


@admin_bp.route("/data-deletion-audits", methods=["GET"])
@admin_required
def deletion_audits():
    rows = DataDeletionAudit.query.order_by(DataDeletionAudit.deleted_at.desc()).all()
    return jsonify([{"id": row.id, "participant_code": row.participant_code,
        "chats_deleted": row.chats_deleted, "responses_deleted": row.responses_deleted,
        "deleted_at": row.deleted_at.isoformat()} for row in rows]), 200
