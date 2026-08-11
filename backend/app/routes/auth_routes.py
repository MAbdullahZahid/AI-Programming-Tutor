from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User, ParticipantIdentity, ConsentRecord

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Student self-signup. Admin accounts are never created through this route —
    see backend/scripts/create_admin.py."""
    data = request.get_json() or {}
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")

    if not all([full_name, email, password]):
        return jsonify({"error": "full_name, email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(full_name=full_name, email=email, role="student")
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    next_number = (db.session.query(db.func.max(ParticipantIdentity.id)).scalar() or 0) + 1
    db.session.add(ParticipantIdentity(user_id=user.id, participant_code=f"P{next_number:02d}"))
    db.session.commit()

    return jsonify({"message": "Registered successfully", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "full_name": user.full_name},
    )

    return jsonify({"access_token": token, "user": user.to_dict()}), 200


@auth_bp.route("/consent", methods=["GET"])
@jwt_required()
def consent_status():
    user = db.session.get(User, int(get_jwt_identity()))
    record = user.consent_record if user else None
    return jsonify({"has_consented": record is not None,
                    "consented_at": record.consented_at.isoformat() if record else None,
                    "information_version": "1.0"}), 200


@auth_bp.route("/consent", methods=["POST"])
@jwt_required()
def give_consent():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != "student":
        return jsonify({"error": "Student account required"}), 403
    data = request.get_json() or {}
    if data.get("accepted") is not True:
        return jsonify({"error": "You must actively accept the consent statement"}), 400
    if not user.consent_record:
        db.session.add(ConsentRecord(user_id=user.id, information_version="1.0"))
        db.session.commit()
    return jsonify({"message": "Consent recorded", "user": user.to_dict()}), 201
