import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.db import init_db, SessionLocal
from app.tools import execute_tool
from app.agent import run_agent_loop
from app.config import settings

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield


def test_allowlist_blocks_unknown_tools():
    """Verify that execute_tool blocks tools that are not in the ALLOWLIST dictionary."""
    session_id = "test-session-allowlist"
    res = execute_tool("dangerous_rm_rf", {"path": "/"}, session_id)
    assert res["status"] == "failed"
    assert "not in the allowed tools list" in res["output"]


def test_confirmation_flow_for_risky_tool():
    """Verify 2-step confirmation flow for restart_container tool."""
    db = SessionLocal()
    session_id = "test-session-confirm"

    # Step 1: Initial unconfirmed request to restart container
    res1 = run_agent_loop(
        session_id=session_id,
        user_text="Please restart the voice-agent container",
        db=db
    )
    assert res1["needs_confirmation"] is True
    assert "requires confirmation" in res1["reply"].lower()

    # Step 2: User responds with explicit YES confirmation
    res2 = run_agent_loop(
        session_id=session_id,
        user_text="YES confirm restart",
        db=db
    )
    assert res2["needs_confirmation"] is False
    assert "restart_container" in res2["tools_used"]
    assert "confirmed" in res2["reply"].lower() or "completed" in res2["reply"].lower()
    db.close()


def test_api_agent_run_endpoint():
    """Test POST /api/agent/run API endpoint."""
    headers = {"X-API-Key": settings.API_KEY} if settings.API_KEY else {}
    response = client.post(
        "/api/agent/run",
        json={"session_id": "test-api-session", "text": "What time is it?"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "tools_used" in data
    assert "needs_confirmation" in data


def test_twilio_signature_rejects_bad_request():
    """Test Twilio webhook signature verification rejection with bad signature."""
    old_token = settings.TWILIO_AUTH_TOKEN
    settings.TWILIO_AUTH_TOKEN = "fake_twilio_secret_token_12345"

    try:
        response = client.post(
            "/twilio/voice",
            data={"CallSid": "CA123456789"},
            headers={"X-Twilio-Signature": "invalid_bogus_signature"}
        )
        assert response.status_code == 403
        assert "Unauthorized" in response.text
    finally:
        settings.TWILIO_AUTH_TOKEN = old_token


@patch("google.genai.Client")
def test_gemini_agent_loop_execution(mock_genai_client_class):
    """Verify new google.genai SDK client integration."""
    settings.GEMINI_API_KEY = "test_gemini_api_key_123"

    mock_chat = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Hello! I am your Gemini voice assistant."
    mock_chat.send_message.return_value = mock_response

    mock_client = MagicMock()
    mock_client.chats.create.return_value = mock_chat
    mock_genai_client_class.return_value = mock_client

    db = SessionLocal()
    session_id = "test-gemini-session"

    res = run_agent_loop(
        session_id=session_id,
        user_text="Hello Gemini",
        db=db,
        client=mock_client
    )

    assert "reply" in res
    assert res["reply"] == "Hello! I am your Gemini voice assistant."
    settings.GEMINI_API_KEY = ""
    db.close()
