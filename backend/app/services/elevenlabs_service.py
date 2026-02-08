import httpx
from app.config import get_settings

settings = get_settings()


class ElevenLabsService:
    """Service for interacting with ElevenLabs API and Groq Whisper transcription"""

    def __init__(self):
        self.api_key = settings.elevenlabs_api_key
        self.base_url = "https://api.elevenlabs.io"
        self.headers = {"xi-api-key": self.api_key}
        
        # Groq for fast Whisper transcription
        self.groq_api_key = settings.groq_api_key
        self.groq_base_url = "https://api.groq.com/openai/v1"

    async def transcribe_audio(self, audio_data: bytes) -> dict:
        """
        Transcribe audio file using Groq Whisper API (much faster than AssemblyAI)

        Args:
            audio_data: Raw audio bytes (webm format)

        Returns:
            Dictionary with transcription result
        """
        try:
            print(f"🎤 Groq Whisper Transcription Starting...")
            print(f"   Audio size: {len(audio_data)} bytes")
            
            # Prepare multipart form data for Groq API
            files = {
                "file": ("audio.webm", audio_data, "audio/webm")
            }
            data = {
                "model": "whisper-large-v3",  # Fastest and most accurate Whisper model
                "temperature": 0.0,
                "language": "en"
            }
            
            print(f"   Sending to Groq Whisper API...")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.groq_base_url}/audio/transcriptions",
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}"
                    },
                    files=files,
                    data=data,
                    timeout=10.0
                )
                
                print(f"   Groq response status: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f"   ✗ Groq API error: {error_text}")
                    return {
                        "success": False,
                        "error": f"Groq API error: {error_text}",
                    }
                
                result = response.json()
                transcript_text = result.get("text", "")
                
                print(f"   ✓ Transcription successful")
                print(f"   📝 Transcript: {transcript_text[:100]}..." if len(transcript_text) > 100 else f"   📝 Transcript: {transcript_text}")
                print(f"   Text length: {len(transcript_text)} characters")
                
                if not transcript_text or transcript_text.strip() == "":
                    print(f"   ⚠️  Warning: Transcription completed but text is empty")
                    return {
                        "success": False,
                        "error": "No speech detected in audio. Please try recording again."
                    }

                return {
                    "transcript": transcript_text,
                    "success": True,
                    "duration_seconds": result.get("duration", 0),
                }
                
        except httpx.TimeoutException as e:
            print(f"   ✗ Transcription timeout: {str(e)}")
            return {
                "success": False,
                "error": "Transcription timeout. Please try again.",
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


# Initialize service
elevenlabs_service = ElevenLabsService()
