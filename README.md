# Voice AI Agent 🎙️🤖

A secure, multi-interface voice-controlled AI assistant powered by **Claude Sonnet**, **FastAPI**, **Twilio Voice**, and an allowlisted tool execution engine.

---

## 📐 Architecture & Flow Diagram

```
                 +-----------------------------------+
                 |           USER INTERFACES         |
                 +-----------------------------------+
                 /                 |                 \
     (A) Browser Mic       (B) Twilio Phone       (C) Text API
     (Web Speech API)       (/twilio/voice)     (POST /api/agent/run)
                 \                 |                 /
                  +----------------+----------------+
                                   |
                                   v
                      +-------------------------+
                      |   FastAPI Web Server    |
                      |  (Security & Limits)    |
                      +-------------------------+
                                   |
                                   v
                      +-------------------------+
                      |   Claude Agent Loop     |
                      |  (Tool-Use Engine)      |
                      +-------------------------+
                                   |
                                   v
                      +-------------------------+
                      | ALLOWLISTED TOOL RUNNER |
                      | (System, Docker, Git)   |
                      +-------------------------+
                                   |
                                   v
                      +-------------------------+
                      |  SQLAlchemy + SQLite    |
                      | (Session & Tool Logs)   |
                      +-------------------------+
```

---

## ✨ Features

- **Multi-Interface Access**:
  - **Web Dashboard**: Real-time browser speech recognition (Web Speech API) and Text-To-Speech reply playback.
  - **Phone Call**: Twilio Voice webhook integration supporting dynamic speech gather `<Gather input="speech">`.
  - **REST API**: Direct `POST /api/agent/run` interface with `X-API-Key` protection.
- **Strict Tool Allowlisting & Sandboxing**:
  - Executes only pre-approved system handlers (`system_status`, `list_files`, `docker_ps`, `git_status`, `current_time`, `http_check`).
  - Blocks directory traversal and private internal IP scanning.
  - **2-Step Confirmation** required for high-risk tools (`restart_container`).
- **Resilient Voice Agent**:
  - Autonomous multi-turn tool calling loop (up to 5 rounds).
  - Short spoken-style system prompt tailored for voice synthesis.
  - Speech mishear detection with automatic clarification prompts.
- **Production Guardrails**:
  - IP-based rate limiting (30 req/min) and daily request quotas.
  - Render free-tier deployment ready (`0.0.0.0:$PORT`).

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, SQLAlchemy, Pydantic Settings
- **AI Model**: Anthropic SDK (`claude-sonnet-5-5`)
- **Voice Integrations**: Web Speech API (browser), Twilio Voice TwiML SDK (telephony)
- **Database**: SQLite3 (zero-config local persistence)
- **Testing**: Pytest, FastAPI TestClient, unittest.mock
- **DevOps**: Docker, Docker Compose, Render (`render.yaml`)

---

## ⚡ Quick Start

```bash
# 1. Clone repository and navigate to directory
cd voice-agent

# 2. Create virtual environment & install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Copy environment configuration
cp .env.example .env

# 4. Start the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open your browser at `http://localhost:8000` to access the voice dashboard!

---

## 💼 Portfolio Highlights

1. **Defense-in-Depth AI Security**: Implemented strict input validation, tool allowlists, path sandboxing, and explicit user confirmation for state-mutating actions.
2. **Telephony & Web Dual-Mode Architecture**: Handled heterogeneous event streams from web browsers and Twilio TwiML Voice webhooks seamlessly.
3. **Optimized for Low-Latency Spoken Interfaces**: Constructed tight system prompts and response token bounds (max 400) to ensure snappy speech generation.
