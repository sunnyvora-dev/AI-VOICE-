import os
import logging
from typing import List, Dict, Any
from google import genai
from google.genai import types
from sqlalchemy.orm import Session
from app.config import settings
from app.tools import (
    system_status_handler,
    list_files_handler,
    docker_ps_handler,
    git_status_handler,
    current_time_handler,
    http_check_handler,
    restart_container_handler,
    execute_tool
)
from app.db import Message

logger = logging.getLogger("voice_agent.agent")

SYSTEM_PROMPT = """You are Vocalis AI, a fully open, helpful, and highly intelligent voice-controlled assistant.
You answer ANY question, topic, query, or task the user asks without barriers, hesitation, or arbitrary restrictions.
Speak in a short, clear, natural, and conversational tone suitable for text-to-speech reading.
Keep answers concise and direct (under 3-4 sentences) unless the user specifically asks for detailed explanations.
Do not use complex Markdown tables, long code blocks, or special symbols that sound unnatural when read aloud.
When executing system tools, mention the action in natural spoken language.
If the user's speech input appears garbled, briefly ask a clarifying question."""

CONFIRMATION_KEYWORDS = {"yes", "y", "confirm", "do it", "sure", "ok", "okay", "proceed", "yeah", "yep"}

SAFE_TOOL_FUNCTIONS = [
    system_status_handler,
    list_files_handler,
    docker_ps_handler,
    git_status_handler,
    current_time_handler,
    http_check_handler,
    restart_container_handler
]


def is_garbled_input(text: str) -> bool:
    """Check if speech input appears garbled or misheard."""
    clean = text.strip()
    if not clean:
        return True
    if len(clean) <= 2 and clean.lower() not in {"hi", "yo", "no", "ok"}:
        return True
    return False


def get_conversation_context(session_id: str, db: Session, limit: int = 18) -> List[Dict[str, Any]]:
    """Retrieve last 'limit' messages for a session from the DB."""
    if not db:
        return []
    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.id.desc())
        .limit(limit)
        .all()
    )
    messages.reverse()
    formatted = []
    for m in messages:
        if m.role in ("user", "assistant"):
            formatted.append({"role": m.role, "content": m.content})
    return formatted


def save_message(session_id: str, role: str, content: str, db: Session):
    """Save a single message entry to the database."""
    if not db:
        return
    try:
        msg = Message(session_id=session_id, role=role, content=content)
        db.add(msg)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to save message to DB: {e}")
        db.rollback()


def run_agent_loop(
    session_id: str,
    user_text: str,
    db: Session = None,
    client: Any = None
) -> Dict[str, Any]:
    """
    Runs the modern Google GenAI tool-use loop with retries, safe tool execution,
    and 2-step confirmation for risky operations.
    """
    if is_garbled_input(user_text):
        reply = "I'm sorry, I couldn't quite hear or understand that clearly. Could you please repeat?"
        save_message(session_id, "user", user_text, db)
        save_message(session_id, "assistant", reply, db)
        return {"reply": reply, "tools_used": [], "needs_confirmation": False}

    save_message(session_id, "user", user_text, db)

    user_words = set(user_text.strip().lower().split())
    user_confirmed = bool(user_words.intersection(CONFIRMATION_KEYWORDS))
    text_lower = user_text.lower()

    # Intercept risky tool confirmation requirement before LLM execution
    if ("restart" in text_lower or "container" in text_lower) and "restart" in text_lower:
        if not user_confirmed:
            confirm_msg = "Restarting container requires confirmation. Are you sure you want to restart? Say YES to confirm."
            save_message(session_id, "assistant", confirm_msg, db)
            return {"reply": confirm_msg, "tools_used": ["restart_container"], "needs_confirmation": True}
        else:
            tool_res = execute_tool("restart_container", {"container_name": "voice-agent"}, session_id, db)
            reply = f"Container restart confirmed. {tool_res['output']}"
            save_message(session_id, "assistant", reply, db)
            return {"reply": reply, "tools_used": ["restart_container"], "needs_confirmation": False}

    raw_keys = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    api_keys = [k.strip() for k in raw_keys.split(",") if k.strip() and k.strip() not in ("your_gemini_api_key_here", "your_anthropic_api_key_here")]

    if not api_keys:
        return _fallback_agent_response(session_id, user_text, user_confirmed, db)

    tools_used = []
    final_reply = ""

    candidate_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", settings.GEMINI_MODEL]
    models_to_try = list(dict.fromkeys(m for m in candidate_models if m))

    last_error = None
    # Try across key pool & model pool
    for key_idx, key_val in enumerate(api_keys):
        try:
            curr_client = genai.Client(
                api_key=key_val,
                http_options=types.HttpOptions(timeout=30000)
            )
            config = types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=SAFE_TOOL_FUNCTIONS
            )

            for model_name in models_to_try:
                for attempt in range(2):  # Up to 2 attempts with brief backoff
                    try:
                        chat = curr_client.chats.create(
                            model=model_name,
                            config=config
                        )
                        response = chat.send_message(user_text)
                        if response and hasattr(response, 'text') and response.text:
                            final_reply = response.text.strip()
                            break
                    except Exception as exc:
                        last_error = exc
                        err_str = str(exc).lower()
                        if "429" in err_str or "503" in err_str or "quota" in err_str or "rate" in err_str:
                            logger.warning(f"Gemini {model_name} rate/capacity limit hit (Attempt {attempt+1}): {exc}. Backing off...")
                            import time
                            time.sleep(1.2 * (attempt + 1))
                            continue
                        else:
                            break  # Non-rate-limit error, skip to next model
                if final_reply:
                    break
            if final_reply:
                break
        except Exception as k_exc:
            last_error = k_exc
            continue

    if not final_reply and last_error:
        logger.warning(f"All Gemini API keys/models exhausted. Last error: {last_error}. Falling back to offline engine...")
        return _fallback_agent_response(session_id, user_text, user_confirmed, db)



    if not final_reply:
        final_reply = "I completed the requested operation."

    save_message(session_id, "assistant", final_reply, db)
    return {
        "reply": final_reply,
        "tools_used": tools_used,
        "needs_confirmation": False
    }


def _fallback_agent_response(
    session_id: str,
    user_text: str,
    user_confirmed: bool,
    db: Session = None
) -> Dict[str, Any]:
    """Offline / mock fallback agent logic when Gemini API key is not configured."""
    text_lower = user_text.lower()
    tools_used = []
    needs_confirmation = False

    if "time" in text_lower or "clock" in text_lower:
        tool_res = execute_tool("current_time", {}, session_id, db)
        tools_used.append("current_time")
        reply = f"The current server time is: {tool_res['output']}"
    elif "file" in text_lower or "list" in text_lower or "sandbox" in text_lower:
        tool_res = execute_tool("list_files", {}, session_id, db)
        tools_used.append("list_files")
        reply = f"Here are the sandbox files: {tool_res['output']}"
    elif "status" in text_lower or "system" in text_lower or "health" in text_lower:
        tool_res = execute_tool("system_status", {}, session_id, db)
        tools_used.append("system_status")
        reply = f"System status summary: {tool_res['output']}"
    elif "docker" in text_lower or "container" in text_lower or "restart" in text_lower:
        if "restart" in text_lower or "container" in text_lower:
            if not user_confirmed:
                needs_confirmation = True
                reply = "Restarting container requires confirmation. Are you sure you want to restart the container? Say YES to confirm."
                save_message(session_id, "assistant", reply, db)
                return {"reply": reply, "tools_used": ["restart_container"], "needs_confirmation": True}
            else:
                tool_res = execute_tool("restart_container", {"container_name": "voice-agent"}, session_id, db)
                tools_used.append("restart_container")
                reply = f"Container restart confirmed. {tool_res['output']}"
        else:
            tool_res = execute_tool("docker_ps", {}, session_id, db)
            tools_used.append("docker_ps")
            reply = f"Docker container list: {tool_res['output']}"
    elif "git" in text_lower:
        tool_res = execute_tool("git_status", {}, session_id, db)
        tools_used.append("git_status")
        reply = f"Git status: {tool_res['output']}"
    else:
        reply = f"I heard: '{user_text}'. I am ready to help you with system status, file lists, docker commands, or time."

    save_message(session_id, "assistant", reply, db)
    return {
        "reply": reply,
        "tools_used": tools_used,
        "needs_confirmation": needs_confirmation
    }
