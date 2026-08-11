"""
Gemini API integration for the tutor.
Enforces a hint-first system prompt so the tutor does NOT dump full
answers straight away — it guides the student instead.
"""

import os
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """You are a friendly, patient programming tutor for beginner students.
Rules you must always follow:
1. Never give a full, ready-to-copy solution immediately.
2. First give a hint or ask a guiding question to help the student think.
3. If they are still stuck after a hint, give a partial explanation, not the full code.
4. Only give a complete solution if the student explicitly says they still don't understand
   after at least one hint, and even then, explain the reasoning alongside the code.
5. Keep explanations beginner-friendly, avoid jargon, and encourage the student to reflect
   on why the bug happened or why the concept works this way.
6. Be encouraging and concise.
"""

_model = None
_title_model = None


def _get_model():
    global _model
    if _model is None:
        _model = genai.GenerativeModel(
            model_name="gemini-3.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )
    return _model


def get_tutor_response(user_message: str, history: list) -> str:
    """
    history: list of {"sender": "user"|"tutor", "content": str, ...}
    Returns the tutor's text reply.
    """
    if not GEMINI_API_KEY:
        return (
            "[Gemini API key not configured] This is a placeholder tutor reply. "
            "Set GEMINI_API_KEY in backend/.env to enable real responses."
        )

    model = _get_model()

    gemini_history = []
    for m in history:
        role = "user" if m["sender"] == "user" else "model"
        gemini_history.append({"role": role, "parts": [m["content"]]})

    chat = model.start_chat(history=gemini_history)
    response = chat.send_message(user_message)
    return response.text


def generate_chat_title(first_message: str) -> str:
    """Generate a short sidebar title from the first message."""
    fallback = first_message[:42].strip() + ("..." if len(first_message) > 42 else "")
    if not GEMINI_API_KEY:
        return fallback or "New Chat"

    global _title_model
    try:
        if _title_model is None:
            _title_model = genai.GenerativeModel(
                model_name="gemini-3.5-flash",
                system_instruction=(
                    "Create a concise title for a programming-help chat. "
                    "Return only the title, with no quotes. Use 2 to 6 words "
                    "and no more than 45 characters."
                ),
            )
        response = _title_model.generate_content(first_message)
        title = " ".join((response.text or "").strip().strip('"\'').split())
        return title[:45].rstrip(" .,:;-") or fallback or "New Chat"
    except Exception:
        return fallback or "New Chat"
