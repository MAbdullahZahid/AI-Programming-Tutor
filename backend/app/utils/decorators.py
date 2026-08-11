from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request


def admin_required(fn):
    """Restrict a route to the single admin account only."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def consent_required(fn):
    """Prevent research interaction collection before recorded consent."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        from app.models.user import ConsentRecord
        if not ConsentRecord.query.filter_by(user_id=int(get_jwt_identity())).first():
            return jsonify({"error": "Consent is required before using the tutor"}), 403
        return fn(*args, **kwargs)
    return wrapper
