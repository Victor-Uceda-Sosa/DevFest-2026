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
            print(f"DEBUG: Starting transcription, audio size: {len(audio_data)} bytes")

            # Save audio to temp file for transcription
            import tempfile
            import os

            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name

            try:
                # Transcribe from file
                print(f"DEBUG: Transcribing from file: {tmp_path}")
                transcriber = aai.Transcriber()
                config = aai.TranscriptionConfig(
                    language_code="en",
                    speech_models=["universal-2"]
                )

                transcript = transcriber.transcribe(tmp_path, config=config)

                print(f"DEBUG: Transcription status: {transcript.status}")
                if transcript.status == aai.TranscriptStatus.error:
                    error_msg = transcript.error or "Unknown error"
                    print(f"ERROR: Transcription failed: {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg,
                    }

                result_text = transcript.text or ""
                print(f"DEBUG: Transcription successful: {result_text}")
                print("\n" + "="*80)
                print(f"TRANSCRIPTION RESULT:")
                print(f"Text: {result_text}")
                print("="*80 + "\n")

                return {
                    "transcript": result_text,
                    "success": True,
                    "duration_seconds": 0,
                }
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        except Exception as e:
            print(f"ERROR: Transcription error: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
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
