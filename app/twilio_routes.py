import logging
from fastapi import APIRouter, Request, Response, Depends
from sqlalchemy.orm import Session
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.request_validator import RequestValidator

from app.config import settings
from app.db import get_db, Call
from app.agent import run_agent_loop

logger = logging.getLogger("voice_agent.twilio")

router = APIRouter(prefix="/twilio", tags=["Twilio Webhooks"])


def verify_twilio_signature(request: Request, url_override: str = None) -> bool:
    """Validate incoming Twilio webhook request signature."""
    auth_token = settings.TWILIO_AUTH_TOKEN
    if not auth_token:
        # If no Twilio auth token configured, skip verification for local test
        return True

    signature = request.headers.get("X-Twilio-Signature", "")
    full_url = url_override or str(request.url)
    
    # Handle public URL replacement if specified in settings
    if settings.PUBLIC_URL and settings.PUBLIC_URL != "http://localhost:8000":
        parsed = request.url
        full_url = f"{settings.PUBLIC_URL.rstrip('/')}{parsed.path}"
        if parsed.query:
            full_url += f"?{parsed.query}"

    validator = RequestValidator(auth_token)
    # Form data params for POST
    form_params = getattr(request, "_form", {})
    return validator.validate(full_url, form_params, signature)


@router.post("/voice")
@router.get("/voice")
async def twilio_voice_entry(request: Request, db: Session = Depends(get_db)):
    """Initial webhook hit when a phone call arrives."""
    form_data = await request.form()
    request._form = dict(form_data)

    if not verify_twilio_signature(request):
        logger.warning("Twilio signature validation failed for /voice endpoint.")
        return Response(content="Unauthorized Twilio Signature", status_code=403)

    call_sid = form_data.get("CallSid", "web-call-" + request.client.host)
    session_id = f"twilio-{call_sid}"

    # Log call to DB
    call_record = Call(twilio_call_sid=call_sid, session_id=session_id, status="active")
    db.add(call_record)
    db.commit()

    resp = VoiceResponse()
    gather = Gather(
        input="speech",
        action="/twilio/respond",
        method="POST",
        speech_timeout="auto",
        timeout=5
    )
    gather.say("Hello! I am your AI assistant. How can I help you today?", voice=settings.TWILIO_VOICE)
    resp.append(gather)
    resp.say("We did not hear any response. Thank you for calling. Goodbye!", voice=settings.TWILIO_VOICE)
    resp.hangup()

    return Response(content=str(resp), media_type="application/xml")


@router.post("/respond")
async def twilio_voice_respond(request: Request, db: Session = Depends(get_db)):
    """Callback endpoint for speech recognition results from Twilio <Gather>."""
    form_data = await request.form()
    request._form = dict(form_data)

    if not verify_twilio_signature(request):
        logger.warning("Twilio signature validation failed for /respond endpoint.")
        return Response(content="Unauthorized Twilio Signature", status_code=403)

    call_sid = form_data.get("CallSid", "unknown-call")
    session_id = f"twilio-{call_sid}"
    speech_result = form_data.get("SpeechResult", "").strip()

    resp = VoiceResponse()

    # Check for goodbye / exit signals
    if not speech_result or speech_result.lower() in ["bye", "goodbye", "quit", "exit", "stop", "no"]:
        resp.say("Thank you for calling. Have a great day! Goodbye.", voice=settings.TWILIO_VOICE)
        resp.hangup()
        return Response(content=str(resp), media_type="application/xml")

    # Run agent loop with speech input
    agent_output = run_agent_loop(session_id=session_id, user_text=speech_result, db=db)
    agent_reply = agent_output.get("reply", "I am standing by for your next instruction.")

    # Loop back with new <Gather>
    gather = Gather(
        input="speech",
        action="/twilio/respond",
        method="POST",
        speech_timeout="auto",
        timeout=5
    )
    gather.say(agent_reply, voice=settings.TWILIO_VOICE)
    resp.append(gather)
    resp.say("Thank you for calling. Goodbye!", voice=settings.TWILIO_VOICE)
    resp.hangup()

    return Response(content=str(resp), media_type="application/xml")
