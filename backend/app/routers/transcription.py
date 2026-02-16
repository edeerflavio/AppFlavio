from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.transcription_service import TranscriptionService

router = APIRouter(prefix="/api/transcribe", tags=["Transcription"])

@router.post("/", summary="Transcribe audio file")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Receives an audio file (mp3, wav, webm, etc.) and returns the transcription text.
    Uses OpenAI Whisper model.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    text = await TranscriptionService.transcribe_audio(file)
    return {"text": text}
