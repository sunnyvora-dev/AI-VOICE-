import datetime
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Request, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.db import init_db, get_db, Message, ToolRun
from app.security import check_security, verify_api_key
from app.agent import run_agent_loop
from app.twilio_routes import router as twilio_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield


app = FastAPI(
    title="Voice Agent API",
    description="A voice-controlled AI agent powered by Claude and allowlisted tools",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Setup
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include Twilio webhooks
app.include_router(twilio_router)

# Request schema
class AgentRunRequest(BaseModel):
    session_id: str
    text: str


@app.get("/health")
def health_check():
    """Health check endpoint for Render/uptime monitoring."""
    return {
        "status": "ok",
        "timestamp": datetime.datetime.now().isoformat(),
        "model": settings.GEMINI_MODEL
    }


@app.post("/api/agent/run")
def api_run_agent(
    req_body: AgentRunRequest,
    request: Request,
    db: Session = Depends(get_db),
    api_key: Optional[str] = Depends(verify_api_key)
):
    """Run agent tool loop for text input and return response + executed tools."""
    # Enforce rate limits & input size validation
    check_security(request, req_body.text)
    
    session_id = req_body.session_id.strip() or "default-session"
    text = req_body.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Text prompt cannot be empty.")
        
    result = run_agent_loop(session_id=session_id, user_text=text, db=db)
    return result


@app.get("/api/history/{session_id}")
def get_session_history(
    session_id: str,
    db: Session = Depends(get_db),
    api_key: Optional[str] = Depends(verify_api_key)
):
    """Retrieve message history and tool executions for a given session ID."""
    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    
    tool_runs = (
        db.query(ToolRun)
        .filter(ToolRun.session_id == session_id)
        .order_by(ToolRun.executed_at.asc())
        .all()
    )

    return {
        "session_id": session_id,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ],
        "tool_runs": [
            {
                "id": t.id,
                "tool_name": t.tool_name,
                "input_params": t.input_params,
                "output": t.output,
                "status": t.status,
                "executed_at": t.executed_at.isoformat() if t.executed_at else None
            }
            for t in tool_runs
        ]
    }


# Serve static files for frontend interface
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    """Serve main web voice dashboard."""
    return FileResponse("static/index.html")
