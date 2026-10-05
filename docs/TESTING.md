# Testing Guide & Voice Phrases 🧪

Instructions for executing automated test suites, sample voice evaluation test phrases, and troubleshooting common issues.

---

## 🏃 Running Automated Tests

Run `pytest` from the root project directory:

```bash
# Run pytest with detailed output
pytest -v tests/test_agent.py
```

---

## 🎙️ 10 Sample Voice Phrases & Expected Behaviors

| # | Spoken Voice Phrase | Expected Executed Tool | Expected Behavior & Response |
|---|---|---|---|
| 1 | *"What time is it right now?"* | `current_time` | Agent calls `current_time` and speaks the ISO / local time. |
| 2 | *"Can you check the system status?"* | `system_status` | Returns OS, architecture, and system health status. |
| 3 | *"List all files inside the sandbox directory."* | `list_files` | Calls `list_files` and lists sandbox contents. |
| 4 | *"Check active docker containers."* | `docker_ps` | Runs `docker_ps` and formats running container details. |
| 5 | *"Check git status of the project."* | `git_status` | Returns modified/untracked files status. |
| 6 | *"Check if google.com is online."* | `http_check` | Performs HTTP GET to `https://google.com` -> status 200 OK. |
| 7 | *"Check HTTP status of 127.0.0.1"* | `http_check` | **Security Block**: Rejects private IP address. |
| 8 | *"Restart the voice-agent container."* | None | **Confirmation Triggered**: Asks *"Requires confirmation. Say YES to confirm."* |
| 9 | *"YES confirm restart."* | `restart_container` | Executes container restart after receiving confirmation. |
| 10 | *"asdfghjkl zzz"* | None | **Garbled Input**: Asks *"I couldn't hear that clearly. Could you repeat?"* |

---

## 🔧 Troubleshooting Matrix

| Issue / Symptom | Root Cause | Solution |
|---|---|---|
| **Microphone button inactive** | Browser lacks Web Speech API support or permission denied | Use Google Chrome/Edge, check browser HTTPS/permissions, or use text fallback. |
| **`401 Unauthorized` on `/api/agent/run`** | `X-API-Key` header missing or mismatch | Match `API_KEY` setting in `.env` or pass `-H "X-API-Key: <key>"`. |
| **`403 Forbidden` on Twilio webhooks** | `TWILIO_AUTH_TOKEN` mismatch or `PUBLIC_URL` misconfigured | Ensure `PUBLIC_URL` matches your exact public domain (e.g. ngrok/Render URL). |
| **`429 Too Many Requests`** | Exceeded 30 requests/min rate limit | Wait 60 seconds before making new requests. |
| **Anthropic API key error** | `ANTHROPIC_API_KEY` invalid or expired | Check API key quota on Anthropic dashboard; offline mock fallback will active if unconfigured. |
