# Local Setup Guide 🚀

Follow this step-by-step guide to run and test the Voice AI Agent on your local development machine.

---

## 📋 Prerequisites

- **Python 3.12** or higher installed.
- **Git** installed.
- **Anthropic API Key** (from [console.anthropic.com](https://console.anthropic.com/)).

---

## 🛠️ Step-by-Step Installation

### 1. Clone & Enter Directory
```bash
cd voice-agent
```

### 2. Set Up Virtual Environment
```bash
# On Linux/macOS:
python3 -m venv venv
source venv/bin/activate

# On Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and fill in your settings:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-sonnet-5-5
API_KEY=my-secret-key-123
PUBLIC_URL=http://localhost:8000
DATABASE_URL=sqlite:///./voice_agent.db
```

---

## 🏃 Running the Application

Start the Uvicorn development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The application will start at `http://localhost:8000`.

---

## 🧪 Testing the Setup

### 1. Health Check (cURL)
```bash
curl http://localhost:8000/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-10-05T14:13:59",
  "model": "claude-sonnet-5-5"
}
```

### 2. Agent Run (cURL)
```bash
curl -X POST http://localhost:8000/api/agent/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-key-123" \
  -d '{"session_id": "curl-test-1", "text": "What is the current system status?"}'
```

### 3. Browser Interface
1. Open Google Chrome or Microsoft Edge at `http://localhost:8000`.
2. Click **Allow Microphone Permissions**.
3. Click the large **Microphone Button** and say *"Check system status"*.
4. Observe the live transcript, tool activity indicator, and audio reply.
