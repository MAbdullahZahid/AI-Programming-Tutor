from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.survey import SurveyQuestion, SurveyResponse, SurveySettings
from app.utils.decorators import admin_required

survey_bp = Blueprint("survey", __name__)


# ---- Admin: survey name/description ----

@survey_bp.route("/settings", methods=["GET"])
@jwt_required()
def get_settings():
    settings = SurveySettings.get_or_create(db.session)
    return jsonify(settings.to_dict()), 200


@survey_bp.route("/settings", methods=["PUT"])
@admin_required
def update_settings():
    data = request.get_json() or {}
    settings = SurveySettings.get_or_create(db.session)

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()

    if title:
        settings.title = title
    if description:
        settings.description = description

    db.session.commit()
    return jsonify(settings.to_dict()), 200


# ---- Admin: manage survey questions (created via the Admin Dashboard UI after login) ----

@survey_bp.route("/questions", methods=["POST"])
@admin_required
def create_question():
    data = request.get_json() or {}
    question_text = data.get("question_text")
    question_type = data.get("question_type")  # "likert" or "text"
    order_index = data.get("order_index", 0)
    is_required = data.get("is_required", True)

    if question_type not in ("likert", "text"):
        return jsonify({"error": "question_type must be 'likert' or 'text'"}), 400
    if not question_text:
        return jsonify({"error": "question_text is required"}), 400

    q = SurveyQuestion(
        question_text=question_text,
        question_type=question_type,
        order_index=order_index,
        is_required=bool(is_required),
    )
    db.session.add(q)
    db.session.commit()
    return jsonify(q.to_dict()), 201


@survey_bp.route("/questions/<int:question_id>", methods=["DELETE"])
@admin_required
def delete_question(question_id):
    q = SurveyQuestion.query.get(question_id)
    if not q:
        return jsonify({"error": "Question not found"}), 404
    db.session.delete(q)
    db.session.commit()
    return jsonify({"message": "Question deleted"}), 200


# ---- Student + Admin: read active questions ----

@survey_bp.route("/questions", methods=["GET"])
@jwt_required()
def list_questions():
    questions = SurveyQuestion.query.order_by(SurveyQuestion.order_index).all()
    return jsonify([q.to_dict() for q in questions]), 200


# ---- Student: view my own answers so far ----

@survey_bp.route("/my-responses", methods=["GET"])
@jwt_required()
def my_responses():
    """
    Returns the current student's answers, keyed by question_id, so the
    frontend can show already-answered questions as locked/view-only and
    only leave newly-added questions open to fill in.
    """
    user_id = int(get_jwt_identity())
    responses = SurveyResponse.query.filter_by(user_id=user_id).all()
    return jsonify({
        str(r.question_id): {"answer_value": r.answer_value, "submitted_at": r.submitted_at.isoformat()}
        for r in responses
    }), 200


# ---- Student: submit answers ----

@survey_bp.route("/responses", methods=["POST"])
@jwt_required()
def submit_responses():
    """
    Body: { "answers": [ { "question_id": 1, "answer_value": "5" }, ... ] }
    Likert answers: answer_value = "1".."5"
    Text answers: answer_value = free text

    Tracked per question, not per student: a student can't resubmit an
    answer to a question they've already answered, but if the admin adds
    new questions later, those stay open until answered. Any incoming
    answers for questions the student already answered are ignored
    rather than rejecting the whole request, so submitting new answers
    alongside old ones (e.g. a stale form) still works for what's new.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    answers = data.get("answers", [])

    if not answers:
        return jsonify({"error": "answers array is required"}), 400

    already_answered_ids = {
        qid for (qid,) in db.session.query(SurveyResponse.question_id).filter_by(user_id=user_id).all()
    }

    created = []
    skipped_already_answered = 0
    for a in answers:
        question_id = a.get("question_id")
        answer_value = a.get("answer_value")
        if question_id is None or answer_value in (None, ""):
            continue
        if question_id in already_answered_ids:
            skipped_already_answered += 1
            continue
        response = SurveyResponse(user_id=user_id, question_id=question_id, answer_value=str(answer_value))
        db.session.add(response)
        created.append(response)
        already_answered_ids.add(question_id)  # guard against duplicate ids in the same payload

    if not created and skipped_already_answered:
        return jsonify({"error": "You've already answered all of these questions."}), 409

    db.session.commit()
    return jsonify([r.to_dict() for r in created]), 201
