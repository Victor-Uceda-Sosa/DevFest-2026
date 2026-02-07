from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_key: str
    supabase_service_key: str

    # API Keys
    elevenlabs_api_key: str = ""
    assemblyai_api_key: str = ""
    k2_api_key: str = ""
    k2_api_url: str = ""
    featherless_api_key: str = ""
    figma_access_token: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Application Settings
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    environment: str = "development"

    # Security
    jwt_secret_key: str
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()
