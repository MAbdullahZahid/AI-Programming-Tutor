from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.survey import SurveyQuestion, SurveyResponse
from app.utils.decorators import admin_required

survey_bp = Blueprint("survey", __name__)


# ---- Admin: manage survey questions (created via the Admin Dashboard UI after login) ----

@survey_bp.route("/questions", methods=["POST"])
@admin_required
def create_question():
    data = request.get_json() or {}
    question_text = data.get("question_text")
    question_type = data.get("question_type")  # "likert" or "text"
    order_index = data.get("order_index", 0)

    if question_type not in ("likert", "text"):
        return jsonify({"error": "question_type must be 'likert' or 'text'"}), 400
    if not question_text:
        return jsonify({"error": "question_text is required"}), 400

    q = SurveyQuestion(question_text=question_text, question_type=question_type, order_index=order_index)
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


# ---- Student: submit answers ----

@survey_bp.route("/responses", methods=["POST"])
@jwt_required()
def submit_responses():
    """
    Body: { "answers": [ { "question_id": 1, "answer_value": "5" }, ... ] }
    Likert answers: answer_value = "1".."5"
    Text answers: answer_value = free text
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    answers = data.get("answers", [])

    if not answers:
        return jsonify({"error": "answers array is required"}), 400

    created = []
    for a in answers:
        question_id = a.get("question_id")
        answer_value = a.get("answer_value")
        if question_id is None or answer_value in (None, ""):
            continue
        response = SurveyResponse(user_id=user_id, question_id=question_id, answer_value=str(answer_value))
        db.session.add(response)
        created.append(response)

    db.session.commit()
    return jsonify([r.to_dict() for r in created]), 201
