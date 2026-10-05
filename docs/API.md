# REST API Documentation 📡

Complete specification for all API endpoints exposed by the Voice AI Agent.

---

## 🟢 1. Health Check
Checks service health and current model version.

- **URL**: `/health`
- **Method**: `GET`
- **Auth Required**: No

### Response (200 OK)
```json
{
  "status": "ok",
  "timestamp": "2026-10-05T14:13:59.123456",
  "model": "claude-sonnet-5-5"
}
```

---

## 🤖 2. Agent Execution Endpoint
Submits user speech/text prompt to the Claude agent loop.

- **URL**: `/api/agent/run`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `X-API-Key: <YOUR_API_KEY>` (Optional if API_KEY not set)

### Request Payload
```json
{
  "session_id": "user-session-101",
  "text": "What is the current server status?"
}
```

### Response (200 OK)
```json
{
  "reply": "System status summary: OS: Linux | Python: 3.12.0 | Status: Healthy",
  "tools_used": [
    "system_status"
  ],
  "needs_confirmation": false
}
```

---

## 📜 3. Session History Endpoint
Retrieves full message dialogue and tool execution logs for a session.

- **URL**: `/api/history/{session_id}`
- **Method**: `GET`
- **Headers**:
  - `X-API-Key: <YOUR_API_KEY>`

### Response (200 OK)
```json
{
  "session_id": "user-session-101",
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "What is the current server status?",
      "created_at": "2026-10-05T14:14:00"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "System status summary: OS: Linux | Status: Healthy",
      "created_at": "2026-10-05T14:14:02"
    }
  ],
  "tool_runs": [
    {
      "id": 1,
      "tool_name": "system_status",
      "input_params": "{}",
      "output": "OS: Linux | Status: Healthy",
      "status": "success",
      "executed_at": "2026-10-05T14:14:01"
    }
  ]
}
```

---

## 📞 4. Twilio Telephony Webhooks

### A. Initial Voice Endpoint
- **URL**: `/twilio/voice`
- **Method**: `POST` / `GET`
- **Headers**: `X-Twilio-Signature: <SIGNATURE>`

#### Response (200 OK - TwiML XML)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="/twilio/respond" input="speech" method="POST" speechTimeout="auto" timeout="5">
        <Say>Hello! I am your AI assistant. How can I help you today?</Say>
    </Gather>
    <Say>We did not hear any response. Thank you for calling. Goodbye!</Say>
    <Hangup/>
</Response>
```

### B. Speech Result Handler
- **URL**: `/twilio/respond`
- **Method**: `POST`
- **Form Data**: `SpeechResult=Check+time`

#### Response (200 OK - TwiML XML)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="/twilio/respond" input="speech" method="POST" speechTimeout="auto" timeout="5">
        <Say>The current server time is 2026-10-05 14:15:00.</Say>
    </Gather>
    <Say>Thank you for calling. Goodbye!</Say>
    <Hangup/>
</Response>
```

---

## ⚠️ HTTP Status Codes Reference

| Status Code | Reason | Cause |
|---|---|---|
| **400 Bad Request** | Input Too Long / Empty | Text prompt missing or > 1000 characters |
| **401 Unauthorized** | Invalid API Key | Invalid or missing `X-API-Key` header |
| **403 Forbidden** | Invalid Twilio Signature | Webhook request failed signature validation |
| **429 Too Many Requests** | Rate Limit Exceeded | Exceeded 30 req/min or daily request cap |
| **500 Server Error** | Internal Failure | Unhandled backend exception |
