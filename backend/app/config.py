from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Featherless AI (Kimi K2.5)
    featherless_api_key: str
    featherless_api_base: str = "https://api.featherless.ai/v1"
    featherless_model: str = "moonshotai/Kimi-K2.5"
    
    # ElevenLabs & Groq (Whisper)
    elevenlabs_api_key: str
    elevenlabs_voice_id: str
    groq_api_key: str  # For Whisper transcription
    
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str = ""  # Optional, for admin operations
    
    # Application Settings
    cors_origins: str = "http://localhost:3000"
    max_audio_size_mb: int = 10
    session_history_limit: int = 15
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    environment: str = "development"
    
    # Security (optional for future use)
    jwt_secret_key: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Settings factory with caching
@lru_cache()
def get_settings():
    return Settings()


# Global settings instance (for backward compatibility)
settings = get_settings()
