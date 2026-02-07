from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

# Lazy initialization - only create when needed
_supabase_client = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        try:
            _supabase_client = create_client(
                supabase_url=settings.supabase_url,
                supabase_key=settings.supabase_key,
            )
        except Exception as e:
            print(f"Warning: Failed to initialize Supabase: {e}")
            print(f"URL: {settings.supabase_url}")
            raise
    return _supabase_client

# Keep backward compatibility
supabase = None  # Will be initialized on first use
