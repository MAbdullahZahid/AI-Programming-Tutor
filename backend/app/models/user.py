from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class ParticipantIdentity(db.Model):
    """Admin-only identity key. Research exports never join this table."""
    __tablename__ = "participant_identities"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    participant_code = db.Column(db.String(20), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ConsentRecord(db.Model):
    """Consent is deliberately stored separately from chats and surveys."""
    __tablename__ = "consent_records"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    consented_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    information_version = db.Column(db.String(30), nullable=False, default="1.0")


class DataDeletionAudit(db.Model):
    __tablename__ = "data_deletion_audits"
    id = db.Column(db.Integer, primary_key=True)
    participant_code = db.Column(db.String(20), nullable=False)
    deleted_by_admin_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    chats_deleted = db.Column(db.Integer, nullable=False, default=0)
    responses_deleted = db.Column(db.Integer, nullable=False, default=0)
    deleted_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="student")  # student | admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    chats = db.relationship("Chat", backref="user", cascade="all, delete-orphan")
    survey_responses = db.relationship("SurveyResponse", backref="user", cascade="all, delete-orphan")
    participant_identity = db.relationship("ParticipantIdentity", uselist=False, cascade="all, delete-orphan")
    consent_record = db.relationship("ConsentRecord", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def admin_exists() -> bool:
        """Used by the terminal admin-creation script to enforce a single admin."""
        return User.query.filter_by(role="admin").first() is not None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
            "has_consented": self.consent_record is not None,
        }
