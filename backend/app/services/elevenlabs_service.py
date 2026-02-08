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
            print(f"🎤 AssemblyAI Transcription Starting...")
            print(f"   Audio size: {len(audio_data)} bytes")

            # Create transcriber with universal-3-pro model
            transcriber = aai.Transcriber()

            # AssemblyAI expects file path or URL, so we'll upload the audio
            # Convert bytes to file-like object
            audio_file = io.BytesIO(audio_data)

            # Configure transcription with speech models (list)
            config = aai.TranscriptionConfig(speech_models=["universal-2"])

            # Transcribe using AssemblyAI
            print(f"   Sending to AssemblyAI...")
            transcript = transcriber.transcribe(audio_file, config=config)

            print(f"   AssemblyAI response received")
            print(f"   Status: {transcript.status}")
            print(f"   Text: '{transcript.text}'")
            print(f"   Text length: {len(transcript.text) if transcript.text else 0}")
            print(f"   Confidence: {transcript.confidence if hasattr(transcript, 'confidence') else 'N/A'}")
            print(f"   Audio duration: {transcript.audio_duration if hasattr(transcript, 'audio_duration') else 'N/A'}s")

            if transcript.status == aai.TranscriptStatus.error:
                print(f"   ✗ Transcription error: {transcript.error}")
                return {
                    "success": False,
                    "error": transcript.error,
                }

            # Check if text is None or empty
            transcript_text = transcript.text if transcript.text else ""

            if not transcript_text or transcript_text.strip() == "":
                print(f"   ⚠️  Warning: Transcription completed but text is empty")
                print(f"   This usually means:")
                print(f"      - Audio was too short (< 0.5 seconds)")
                print(f"      - No speech detected in audio")
                print(f"      - Audio volume too low")
                print(f"      - Background noise only")

            return {
                "transcript": transcript_text,
                "success": True,
                "duration_seconds": transcript.audio_duration if hasattr(transcript, 'audio_duration') else 0,
            }
        except Exception as e:
            print(f"   ✗ Transcription exception: {type(e).__name__}: {e}")
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
            print(f"🔊 ElevenLabs TTS Starting...")
            print(f"   Text length: {len(text)} characters")
            print(f"   Text preview: {text[:200]}..." if len(text) > 200 else f"   Text: {text}")
            print(f"   Voice ID: {voice_id}")
            print(f"   API key (masked): {self.api_key[:10]}...{self.api_key[-4:]}")

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

                print(f"   HTTP Status: {response.status_code}")

                if response.status_code != 200:
                    print(f"   ✗ Error response body: {response.text[:500]}")

                response.raise_for_status()

                audio_bytes = response.content
                print(f"   ✓ TTS audio generated: {len(audio_bytes)} bytes")
                return audio_bytes

        except httpx.HTTPStatusError as e:
            print(f"   ✗ HTTP Error generating voice:")
            print(f"      Status: {e.response.status_code}")
            print(f"      Response: {e.response.text[:500]}")
            import traceback
            traceback.print_exc()
            return b""
        except httpx.TimeoutException as e:
            print(f"   ✗ Timeout error generating voice: {e}")
            import traceback
            traceback.print_exc()
            return b""
        except Exception as e:
            print(f"   ✗ Unexpected error generating voice:")
            print(f"      Type: {type(e).__name__}")
            print(f"      Message: {str(e)}")
            import traceback
            traceback.print_exc()
            return b""
    async def generate_voice_stream(self, text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM"):
        """
        Generate voice from text using ElevenLabs streaming API.
        Yields audio chunks as they're generated.

        Args:
            text: Text to convert to speech
            voice_id: ElevenLabs voice ID (default is "Bella")

        Yields:
            Audio bytes chunks
        """
        try:
            print(f"🔊 ElevenLabs Streaming TTS Starting...")
            print(f"   Text length: {len(text)} characters")
            print(f"   Voice ID: {voice_id}")

            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/v1/text-to-speech/{voice_id}/stream",
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
                ) as response:
                    print(f"   HTTP Status: {response.status_code}")

                    if response.status_code != 200:
                        print(f"   ✗ Error response: {await response.aread()}")
                        return

                    chunk_count = 0
                    async for chunk in response.aiter_bytes(chunk_size=1024):
                        if chunk:
                            chunk_count += 1
                            print(f"   ✓ Streaming chunk {chunk_count}: {len(chunk)} bytes")
                            yield chunk

        except httpx.HTTPStatusError as e:
            print(f"   ✗ HTTP Error generating voice:")
            print(f"      Status: {e.response.status_code}")
            import traceback
            traceback.print_exc()
        except httpx.TimeoutException as e:
            print(f"   ✗ Timeout error generating voice: {e}")
            import traceback
            traceback.print_exc()
        except Exception as e:
            print(f"   ✗ Unexpected error generating voice:")
            print(f"      Type: {type(e).__name__}")
            print(f"      Message: {str(e)}")
            import traceback
            traceback.print_exc()


# Initialize service
elevenlabs_service = ElevenLabsService()
