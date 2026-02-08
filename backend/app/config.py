from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Featherless AI (Kimi K2.5)
    featherless_api_key: str
    featherless_api_base: str = "https://api.featherless.ai/v1"
    featherless_model: str = "moonshotai/Kimi-K2.5"

    # Dedalus AI (Literature-based case generation)
    dedalus_api_key: str = ""  # Optional, for literature search and case generation

    # Claude API
    anthropic_api_key: str = ""  # Optional, for case generation

    # Reddit API (for patient case scraping)
    reddit_client_id: str = ""  # Optional
    reddit_client_secret: str = ""  # Optional

    # SafetyKit API (for content filtering)
    safetykit_api_key: str = ""  # Optional
    
    # ElevenLabs & AssemblyAI
    elevenlabs_api_key: str
    elevenlabs_voice_id: str
    assemblyai_api_key: str
    
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
        extra = "ignore"  # Ignore extra fields from .env (e.g., VITE_ prefixed frontend vars)
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Settings factory - no caching to pick up .env changes
def get_settings():
    s = Settings()
    print(f"[CONFIG] Loaded ELEVENLABS_API_KEY from .env: {s.elevenlabs_api_key[:10]}...{s.elevenlabs_api_key[-4:]}")
    return s


# Global settings instance for main.py and other modules
settings = get_settings()
