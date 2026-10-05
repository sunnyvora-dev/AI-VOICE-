# Deployment Guide 🌐

This document covers deploying the Voice AI Agent to **Render (Free Tier)** and an alternative **Oracle Always Free VM** setup with Docker & Caddy.

---

## ☁️ Option A: Render Free Tier Deployment (Recommended)

### 1. Push Code to GitHub
Ensure your repository is pushed to GitHub or GitLab.

### 2. Create New Web Service on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` or you can manually configure:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 3. Environment Variables
Add the following key-value pairs under **Environment**:

| Environment Variable | Recommended Value | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Your secret Anthropic API key |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` | Model identifier |
| `API_KEY` | `your-production-secret-key` | Protects `/api/*` routes |
| `TWILIO_AUTH_TOKEN` | `your-twilio-auth-token` | For verifying webhook signatures |
| `PUBLIC_URL` | `https://voice-agent.onrender.com` | Your deployed Render HTTPS URL |
| `DATABASE_URL` | `sqlite:///./voice_agent.db` | Persistent SQLite path |
| `DAILY_REQUEST_LIMIT` | `500` | Daily IP rate limit cap |
| `ALLOWED_ORIGINS` | `*` | Allowed CORS origins |

> [!WARNING]
> **Render Cold Starts & Twilio 15s Timeout**: Render free tier web services spin down after 15 minutes of inactivity. The first request after sleep (cold start) can take 20-40 seconds, exceeding Twilio's strict 15-second webhook HTTP timeout.
> 
> **Solution**: Set up a free monitor on [UptimeRobot](https://uptimerobot.com) targeting `https://your-app.onrender.com/health` every 5 minutes to keep the service warm.

---

## 📞 Twilio Webhook Configuration

1. Log in to [Twilio Console](https://console.twilio.com/).
2. Go to **Phone Numbers** -> **Active Numbers** -> Click your assigned phone number.
3. Scroll to **Voice & Fax** section:
   - **A CALL COMES IN**: Select `Webhook`.
   - URL: `https://your-app.onrender.com/twilio/voice`
   - HTTP Method: `HTTP POST`
4. Save configuration. Test by dialing your Twilio phone number!

---

## 🐳 Option B: Oracle Always Free VM + Docker + Caddy

For zero cold starts and 100% free dedicated hosting:

```bash
# 1. Install Docker & Compose on Ubuntu VM
sudo apt update && sudo apt install -y docker.io docker-compose caddy

# 2. Clone repository & build container
git clone https://github.com/your-username/voice-agent.git
cd voice-agent
cp .env.example .env && nano .env
docker-compose up -d --build

# 3. Configure Caddyfile for automatic SSL
sudo nano /etc/caddy/Caddyfile
```

**Caddyfile Content:**
```caddy
your-domain.com {
    reverse_proxy localhost:8000
}
```

```bash
sudo systemctl reload caddy
```

---

## 🔄 Updates & Rollbacks

- **Trigger Deployment**: Push to `main` branch to trigger automatic Render build.
- **Rollback**: Open Render service dashboard -> **Events** tab -> Select previous successful commit -> Click **Rollback**.
