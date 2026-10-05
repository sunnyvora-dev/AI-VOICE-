import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash-lite"
    API_KEY: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_VOICE: str = "Polly.Joanna-Neural"
    PUBLIC_URL: str = "http://localhost:8000"
    DATABASE_URL: str = "sqlite:///./voice_agent.db"
    DAILY_REQUEST_LIMIT: int = 500
    ALLOWED_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
