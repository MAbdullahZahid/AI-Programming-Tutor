from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.chat import Chat
from app.models.message import Message
from app.services.gemini_service import get_tutor_response

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("", methods=["GET"])
@jwt_required()
def list_chats():
    """Sidebar: return all previous chats for the logged-in user, newest first."""
    user_id = get_jwt_identity()
    chats = Chat.query.filter_by(user_id=user_id).order_by(Chat.created_at.desc()).all()
    return jsonify([c.to_dict() for c in chats]), 200


@chat_bp.route("", methods=["POST"])
@jwt_required()
def create_chat():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    title = data.get("title", "New Chat")

    chat = Chat(user_id=user_id, title=title)
    db.session.add(chat)
    db.session.commit()

    return jsonify(chat.to_dict()), 201


@chat_bp.route("/<int:chat_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(chat_id):
    user_id = get_jwt_identity()
    chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
    if not chat:
        return jsonify({"error": "Chat not found"}), 404

    return jsonify([m.to_dict() for m in chat.messages]), 200


@chat_bp.route("/<int:chat_id>/messages", methods=["POST"])
@jwt_required()
def send_message(chat_id):
    user_id = get_jwt_identity()
    chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
    if not chat:
        return jsonify({"error": "Chat not found"}), 404

    data = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"error": "Message content is required"}), 400

    # Self-healing auto-title: if this chat currently has no messages —
    # whether it's brand-new or an old empty "New Chat" row left over from
    # before this behaviour existed — name it from the first message sent.
    if len(chat.messages) == 0:
        chat.title = content[:45] + ("..." if len(content) > 45 else "")

    user_msg = Message(chat_id=chat.id, sender="user", content=content)
    db.session.add(user_msg)

    history = [m.to_dict() for m in chat.messages]
    tutor_reply = get_tutor_response(content, history)

    tutor_msg = Message(chat_id=chat.id, sender="tutor", content=tutor_reply)
    db.session.add(tutor_msg)

    db.session.commit()

    return jsonify({
        "chat": chat.to_dict(),
        "user_message": user_msg.to_dict(),
        "tutor_message": tutor_msg.to_dict(),
    }), 201
