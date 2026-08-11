from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.survey import Survey, SurveyQuestion, SurveyResponse
from app.utils.decorators import admin_required

survey_bp = Blueprint("survey", __name__)


def survey_or_404(survey_id):
    return db.session.get(Survey, survey_id)


@survey_bp.route("", methods=["GET"])
@jwt_required()
def list_surveys():
    return jsonify([s.to_dict() for s in Survey.query.order_by(Survey.created_at.desc()).all()]), 200


@survey_bp.route("/<int:survey_id>", methods=["GET"])
@jwt_required()
def get_survey(survey_id):
    survey = survey_or_404(survey_id)
    return (jsonify(survey.to_dict()), 200) if survey else (jsonify({"error": "Survey not found"}), 404)


@survey_bp.route("", methods=["POST"])
@admin_required
def create_survey():
    data = request.get_json() or {}
    title = str(data.get("title", "")).strip()
    if not title:
        return jsonify({"error": "title is required"}), 400
    survey = Survey(title=title, description=str(data.get("description", "")).strip())
    db.session.add(survey)
    db.session.flush()
    error = add_questions(survey, data.get("questions", []))
    if error:
        db.session.rollback()
        return jsonify({"error": error}), 400
    db.session.commit()
    return jsonify(survey.to_dict()), 201


@survey_bp.route("/<int:survey_id>", methods=["PUT"])
@admin_required
def update_survey(survey_id):
    survey = survey_or_404(survey_id)
    if not survey:
        return jsonify({"error": "Survey not found"}), 404
    data = request.get_json() or {}
    if "title" in data:
        title = str(data["title"]).strip()
        if not title:
            return jsonify({"error": "title is required"}), 400
        survey.title = title
    if "description" in data:
        survey.description = str(data["description"]).strip()
    db.session.commit()
    return jsonify(survey.to_dict()), 200


@survey_bp.route("/<int:survey_id>", methods=["DELETE"])
@admin_required
def delete_survey(survey_id):
    survey = survey_or_404(survey_id)
    if not survey:
        return jsonify({"error": "Survey not found"}), 404
    db.session.delete(survey)
    db.session.commit()
    return jsonify({"message": "Survey deleted"}), 200


def add_questions(survey, questions):
    for index, item in enumerate(questions):
        text = str(item.get("question_text", "")).strip()
        qtype = item.get("question_type")
        if not text or qtype not in ("likert", "text"):
            return "Every question needs text and a type of 'likert' or 'text'"
        db.session.add(SurveyQuestion(survey_id=survey.id, question_text=text,
            question_type=qtype, is_required=bool(item.get("is_required", True)),
            order_index=item.get("order_index", index)))


@survey_bp.route("/<int:survey_id>/questions", methods=["POST"])
@admin_required
def create_question(survey_id):
    survey = survey_or_404(survey_id)
    if not survey:
        return jsonify({"error": "Survey not found"}), 404
    data = request.get_json() or {}
    error = add_questions(survey, [data])
    if error:
        return jsonify({"error": error}), 400
    db.session.commit()
    return jsonify(survey.questions[-1].to_dict()), 201


@survey_bp.route("/questions/<int:question_id>", methods=["PUT"])
@admin_required
def update_question(question_id):
    q = db.session.get(SurveyQuestion, question_id)
    if not q:
        return jsonify({"error": "Question not found"}), 404
    data = request.get_json() or {}
    if "question_text" in data:
        text = str(data["question_text"]).strip()
        if not text: return jsonify({"error": "question_text is required"}), 400
        q.question_text = text
    if "question_type" in data:
        if data["question_type"] not in ("likert", "text"):
            return jsonify({"error": "Invalid question type"}), 400
        q.question_type = data["question_type"]
    if "is_required" in data: q.is_required = bool(data["is_required"])
    if "order_index" in data: q.order_index = int(data["order_index"])
    db.session.commit()
    return jsonify(q.to_dict()), 200


@survey_bp.route("/questions/<int:question_id>", methods=["DELETE"])
@admin_required
def delete_question(question_id):
    q = db.session.get(SurveyQuestion, question_id)
    if not q: return jsonify({"error": "Question not found"}), 404
    db.session.delete(q); db.session.commit()
    return jsonify({"message": "Question deleted"}), 200


@survey_bp.route("/<int:survey_id>/my-responses", methods=["GET"])
@jwt_required()
def my_responses(survey_id):
    rows = (SurveyResponse.query.join(SurveyQuestion)
            .filter(SurveyResponse.user_id == int(get_jwt_identity()), SurveyQuestion.survey_id == survey_id).all())
    return jsonify({str(r.question_id): {"answer_value": r.answer_value,
        "submitted_at": r.submitted_at.isoformat()} for r in rows}), 200


@survey_bp.route("/<int:survey_id>/responses", methods=["POST"])
@jwt_required()
def submit_responses(survey_id):
    survey = survey_or_404(survey_id)
    if not survey: return jsonify({"error": "Survey not found"}), 404
    user_id = int(get_jwt_identity())
    answers = (request.get_json() or {}).get("answers", [])
    valid = {q.id: q for q in survey.questions}
    existing = {r.question_id for r in SurveyResponse.query.filter_by(user_id=user_id).all()}
    supplied = {a.get("question_id"): str(a.get("answer_value", "")).strip() for a in answers}
    missing = [q.id for q in survey.questions if q.is_required and q.id not in existing and not supplied.get(q.id)]
    if missing: return jsonify({"error": "All required questions must be answered", "question_ids": missing}), 400
    created = []
    for qid, value in supplied.items():
        if qid not in valid or qid in existing or not value: continue
        if valid[qid].question_type == "likert" and value not in ("1", "2", "3", "4", "5"):
            return jsonify({"error": "Likert answers must be between 1 and 5"}), 400
        row = SurveyResponse(user_id=user_id, question_id=qid, answer_value=value)
        db.session.add(row); created.append(row)
    db.session.commit()
    return jsonify([r.to_dict() for r in created]), 201
