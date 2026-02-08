"""
Input validation utilities.
"""
from fastapi import HTTPException, UploadFile
from typing import Optional


ALLOWED_AUDIO_FORMATS = {
    "audio/mpeg",  # mp3
    "audio/wav",
    "audio/wave",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a"
}

MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


def validate_audio_file(file: UploadFile, max_size_mb: int = 10) -> None:
    """
    Validate uploaded audio file.
    
    Args:
        file: The uploaded file
        max_size_mb: Maximum file size in MB
        
    Raises:
        HTTPException: If validation fails
    """
    # Check content type
    # Extract base MIME type (strip codec parameters like ";codecs=opus")
    content_type = file.content_type or ""
    base_content_type = content_type.split(";")[0].strip()
    
    if base_content_type not in ALLOWED_AUDIO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid audio format '{base_content_type}'. Allowed formats: {', '.join(sorted(ALLOWED_AUDIO_FORMATS))}"
        )
    
    # Check file size (if available)
    if hasattr(file, 'size') and file.size:
        max_size_bytes = max_size_mb * 1024 * 1024
        if file.size > max_size_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum of {max_size_mb}MB"
            )


def validate_student_id(student_id: str) -> None:
    """
    Validate student ID format.
    
    Args:
        student_id: The student identifier
        
    Raises:
        HTTPException: If validation fails
    """
    if not student_id or len(student_id.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Student ID cannot be empty"
        )
    
    if len(student_id) > 100:
        raise HTTPException(
            status_code=400,
            detail="Student ID too long (max 100 characters)"
        )


def validate_text_input(text: str, max_length: int = 5000) -> None:
    """
    Validate text input.
    
    Args:
        text: The input text
        max_length: Maximum allowed length
        
    Raises:
        HTTPException: If validation fails
    """
    if not text or len(text.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Text input cannot be empty"
        )
    
    if len(text) > max_length:
        raise HTTPException(
            status_code=400,
            detail=f"Text input too long (max {max_length} characters)"
        )
