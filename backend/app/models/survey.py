from datetime import datetime
from app.extensions import db


class SurveyQuestion(db.Model):
    __tablename__ = "survey_questions"

    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False)  # likert | text
    is_required = db.Column(db.Boolean, nullable=False, default=True, server_default=db.true())
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    responses = db.relationship("SurveyResponse", backref="question", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "question_text": self.question_text,
            "question_type": self.question_type,
            "is_required": self.is_required,
            "order_index": self.order_index,
        }


class SurveySettings(db.Model):
    """
    Single-row table holding the survey's admin-set name/description.
    Row is created on first read if it doesn't exist yet.
    """
    __tablename__ = "survey_settings"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, default="Post-Use Survey")
    description = db.Column(
        db.Text,
        nullable=False,
        default="Your honest feedback helps improve the tutor for future students.",
    )
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        return {"title": self.title, "description": self.description}

    @classmethod
    def get_or_create(cls, db_session):
        settings = cls.query.first()
        if not settings:
            settings = cls()
            db_session.add(settings)
            db_session.commit()
        return settings


class SurveyResponse(db.Model):
    __tablename__ = "survey_responses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("survey_questions.id"), nullable=False)
    answer_value = db.Column(db.Text, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "answer_value": self.answer_value,
            "submitted_at": self.submitted_at.isoformat(),
        }