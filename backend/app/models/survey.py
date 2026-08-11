from datetime import datetime
from app.extensions import db


class Survey(db.Model):
    __tablename__ = "surveys"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    questions = db.relationship(
        "SurveyQuestion", backref="survey", cascade="all, delete-orphan",
        order_by="SurveyQuestion.order_index",
    )

    def to_dict(self, include_questions=True):
        result = {
            "id": self.id, "title": self.title, "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_questions:
            result["questions"] = [q.to_dict() for q in self.questions]
        return result


class SurveyQuestion(db.Model):
    __tablename__ = "survey_questions"

    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False)
    is_required = db.Column(db.Boolean, nullable=False, default=True, server_default=db.true())
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    responses = db.relationship("SurveyResponse", backref="question", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "survey_id": self.survey_id, "question_text": self.question_text,
                "question_type": self.question_type, "is_required": self.is_required,
                "order_index": self.order_index}


class SurveyResponse(db.Model):
    __tablename__ = "survey_responses"
    __table_args__ = (db.UniqueConstraint("user_id", "question_id", name="uq_response_user_question"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("survey_questions.id", ondelete="CASCADE"), nullable=False)
    answer_value = db.Column(db.Text, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {"id": self.id, "user_id": self.user_id, "question_id": self.question_id,
                "answer_value": self.answer_value, "submitted_at": self.submitted_at.isoformat()}
