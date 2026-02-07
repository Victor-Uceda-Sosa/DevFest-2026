from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Featherless AI (Kimi K2.5)
    featherless_api_key: str
    featherless_api_base: str = "https://api.featherless.ai/v1"
    featherless_model: str = "moonshotai/Kimi-K2.5"
    
    # ElevenLabs
    elevenlabs_api_key: str
    elevenlabs_voice_id: str
    
    # Supabase
    supabase_url: str
    supabase_key: str
    
    # Application Settings
    cors_origins: str = "http://localhost:3000"
    max_audio_size_mb: int = 10
    session_history_limit: int = 15
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()
