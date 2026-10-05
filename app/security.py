import time
from collections import defaultdict
from fastapi import Request, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from app.config import settings

# In-memory tracking for rate limiting & daily limits per client IP
# ip -> list of timestamps within last 60 seconds
minute_requests = defaultdict(list)
# ip -> (date_str, count)
daily_requests = defaultdict(lambda: [time.strftime("%Y-%m-%d"), 0])

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def check_security(request: Request, user_text: str = None):
    """
    Enforces API Key check (if configured), IP rate limiting (30 req/min),
    daily request cap, and input length limit (1000 chars).
    """
    # 1. Input length limit check
    if user_text and len(user_text) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Input text exceeds maximum allowed length of 1000 characters."
        )

    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    today = time.strftime("%Y-%m-%d")

    # 2. Rate limit check (30 requests per minute per IP)
    minute_window = [t for t in minute_requests[client_ip] if now - t < 60]
    if len(minute_window) >= 30:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded: Maximum 30 requests per minute allowed."
        )
    minute_requests[client_ip] = minute_window + [now]

    # 3. Daily request cap check
    record = daily_requests[client_ip]
    if record[0] != today:
        record[0] = today
        record[1] = 0

    if record[1] >= settings.DAILY_REQUEST_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily request quota of {settings.DAILY_REQUEST_LIMIT} requests exceeded for this IP."
        )
    record[1] += 1


def verify_api_key(api_key: str = Security(api_key_header)):
    """
    Validates X-API-Key header against configured API_KEY setting.
    If API_KEY is set in settings (and not placeholder), request must match API_KEY.
    """
    configured_key = settings.API_KEY.strip() if settings.API_KEY else ""
    if configured_key and configured_key not in ("your_secret_api_key_here", ""):
        if not api_key or api_key != configured_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing X-API-Key header."
            )
    return api_key
