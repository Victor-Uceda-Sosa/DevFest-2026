import httpx
import assemblyai as aai
from app.config import get_settings
import io

settings = get_settings()
aai.settings.api_key = settings.assemblyai_api_key


class ElevenLabsService:
    """Service for interacting with ElevenLabs API and transcription"""

    def __init__(self):
        self.api_key = settings.elevenlabs_api_key
        self.base_url = "https://api.elevenlabs.io"
        self.headers = {"xi-api-key": self.api_key}

    async def transcribe_audio(self, audio_data: bytes) -> dict:
        """
        Transcribe audio file using AssemblyAI API

        Args:
            audio_data: Raw audio bytes (webm format)

        Returns:
            Dictionary with transcription result
        """
        try:
            # Create transcriber
            transcriber = aai.Transcriber()

            # AssemblyAI expects file path or URL, so we'll upload the audio
            # Convert bytes to file-like object
            audio_file = io.BytesIO(audio_data)

            # Transcribe using AssemblyAI
            transcript = transcriber.transcribe(audio_file)

            if transcript.status == aai.TranscriptStatus.error:
                return {
                    "success": False,
                    "error": transcript.error,
                }

            return {
                "transcript": transcript.text,
                "success": True,
                "duration_seconds": 0,
            }
        except Exception as e:
            print(f"Transcription error: {e}")
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
