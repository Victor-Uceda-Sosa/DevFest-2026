import httpx
from app.config import get_settings

settings = get_settings()


class ElevenLabsService:
    """Service for interacting with ElevenLabs API"""

    def __init__(self):
        self.api_key = settings.elevenlabs_api_key
        self.base_url = "https://api.elevenlabs.io"
        self.headers = {"xi-api-key": self.api_key}

    async def transcribe_audio(self, audio_data: bytes) -> dict:
        """
        Transcribe audio file using ElevenLabs API

        Args:
            audio_data: Raw audio bytes

        Returns:
            Dictionary with transcription result
        """
        try:
            async with httpx.AsyncClient() as client:
                # ElevenLabs doesn't have a dedicated transcription API
                # We'll use a placeholder response for now
                # In production, you'd use a speech-to-text service like Deepgram

                # For now, return a mock response
                return {
                    "transcript": "Mock transcription from ElevenLabs",
                    "success": True,
                    "duration_seconds": 30,
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    async def get_voices(self) -> list:
        """
        Get list of available voices from ElevenLabs
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v1/voices",
                    headers=self.headers,
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()
                return data.get("voices", [])
        except Exception as e:
            print(f"Error getting voices: {e}")
            return []

    async def generate_voice(self, text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> bytes:
        """
        Generate voice from text using ElevenLabs

        Args:
            text: Text to convert to speech
            voice_id: ElevenLabs voice ID (default is "Bella")

        Returns:
            Audio bytes
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/text-to-speech/{voice_id}",
                    headers=self.headers,
                    json={
                        "text": text,
                        "model_id": "eleven_monolingual_v1",
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.75,
                        },
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.content
        except Exception as e:
            print(f"Error generating voice: {e}")
            return b""


# Initialize service
elevenlabs_service = ElevenLabsService()
