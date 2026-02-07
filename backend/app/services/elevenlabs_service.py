"""
ElevenLabs service for speech-to-text and text-to-speech.
Uses direct HTTP API calls instead of SDK for better reliability.
"""
from typing import Optional
import httpx
from app.config import settings


class ElevenLabsService:
    """Service for ElevenLabs STT and TTS operations via HTTP API."""
    
    def __init__(self):
        """Initialize ElevenLabs service."""
        self.api_key = settings.elevenlabs_api_key
        self.voice_id = settings.elevenlabs_voice_id
        self.base_url = "https://api.elevenlabs.io/v1"
    
    async def transcribe_audio(self, audio_data: bytes) -> str:
        """
        Transcribe audio to text using ElevenLabs Speech-to-Text API.
        
        Args:
            audio_data: Raw audio file bytes
            
        Returns:
            Transcribed text
            
        Raises:
            Exception: If transcription fails
        """
        try:
            url = f"{self.base_url}/speech-to-text"
            headers = {
                "xi-api-key": self.api_key,
            }
            
            files = {
                "audio": ("audio.mp3", audio_data, "audio/mpeg")
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, files=files)
                response.raise_for_status()
                
                result = response.json()
                transcription = result.get("text", "")
                
                if not transcription:
                    raise Exception("Empty transcription received")
                
                return transcription
                
        except httpx.HTTPStatusError as e:
            print(f"ElevenLabs transcription HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Failed to transcribe audio: {e.response.status_code}")
        except Exception as e:
            print(f"ElevenLabs transcription error: {str(e)}")
            raise Exception(f"Failed to transcribe audio: {str(e)}")
    
    async def generate_speech(self, text: str, voice_id: Optional[str] = None) -> bytes:
        """
        Generate speech from text using ElevenLabs TTS API.
        
        Args:
            text: Text to convert to speech
            voice_id: Optional voice ID (uses default if not provided)
            
        Returns:
            Audio bytes (MP3 format)
            
        Raises:
            Exception: If speech generation fails
        """
        try:
            voice_id = voice_id or self.voice_id
            url = f"{self.base_url}/text-to-speech/{voice_id}"
            
            headers = {
                "xi-api-key": self.api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                
                # Response is audio bytes
                audio_bytes = response.content
                return audio_bytes
                
        except httpx.HTTPStatusError as e:
            print(f"ElevenLabs TTS HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Failed to generate speech: {e.response.status_code}")
        except Exception as e:
            print(f"ElevenLabs TTS error: {str(e)}")
            raise Exception(f"Failed to generate speech: {str(e)}")
    
    async def generate_speech_async(self, text: str, voice_id: Optional[str] = None) -> bytes:
        """
        Async wrapper for generate_speech (already async).
        
        Args:
            text: Text to convert to speech
            voice_id: Optional voice ID
            
        Returns:
            Audio bytes
        """
        return await self.generate_speech(text, voice_id)


# Global service instance
elevenlabs_service = ElevenLabsService()
