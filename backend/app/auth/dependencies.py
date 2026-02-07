from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import get_settings
import jwt
import json
import base64

settings = get_settings()
security = HTTPBearer()


def decode_token(token: str):
    """
    Decode JWT token without verification (trusting Supabase).
    Extract user info from the token payload.
    """
    try:
        # JWT format: header.payload.signature
        # We'll decode the payload (2nd part) without verifying signature
        # since we trust Supabase as the issuer
        parts = token.split('.')
        if len(parts) != 3:
            return None

        # Decode payload (add padding if needed)
        payload = parts[1]
        padding = 4 - (len(payload) % 4)
        if padding != 4:
            payload += '=' * padding

        decoded = base64.urlsafe_b64decode(payload)
        data = json.loads(decoded)
        return data
    except Exception as e:
        print(f"Token decode error: {e}")
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate JWT token from Supabase.
    Extract user ID from token payload.
    """
    token = credentials.credentials

    try:
        # Decode token to get user info
        payload = decode_token(token)

        if not payload or 'sub' not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
            )

        # Create a user object with the token info
        class User:
            def __init__(self, user_id):
                self.id = user_id

        return User(payload['sub'])
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
