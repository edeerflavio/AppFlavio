import os
from fastapi import UploadFile, HTTPException
from openai import AsyncOpenAI
import tempfile
import shutil
from pathlib import Path

class TranscriptionService:
    @staticmethod
    async def transcribe_audio(file: UploadFile) -> str:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

        client = AsyncOpenAI(api_key=api_key)

        # Create a temporary file to save the uploaded audio
        # OpenAI API requires a file-like object with a filename or a path
        suffix = Path(file.filename).suffix if file.filename else ".webm"
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                # Copy uploaded file content to temp file
                shutil.copyfileobj(file.file, tmp_file)
                tmp_path = tmp_file.name

            # Open the file again for reading by OpenAI client
            with open(tmp_path, "rb") as audio_file:
                transcription = await client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="pt" # Force Portuguese or auto-detect
                )

            return transcription.text

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        
        finally:
            # Clean up temp file
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.unlink(tmp_path)
