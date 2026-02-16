import os
from fastapi import UploadFile, HTTPException
from openai import AsyncOpenAI
import tempfile
import shutil
from pathlib import Path

class TranscriptionService:
    @staticmethod
    async def transcribe_audio(file: UploadFile, doctor_name: str | None = None) -> str:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

        client = AsyncOpenAI(api_key=api_key)

        # 1. Transcribe with Whisper
        suffix = Path(file.filename).suffix if file.filename else ".webm"
        raw_text = ""
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                shutil.copyfileobj(file.file, tmp_file)
                tmp_path = tmp_file.name

            with open(tmp_path, "rb") as audio_file:
                transcription = await client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="pt"
                )
            raw_text = transcription.text

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        
        finally:
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.unlink(tmp_path)

        # 2. Format with LLM (Speaker Diarization)
        if not raw_text.strip():
            return ""

        formatted_text = await TranscriptionService.format_transcript_llm(client, raw_text, doctor_name)
        return formatted_text

    @staticmethod
    async def format_transcript_llm(client: AsyncOpenAI, raw_text: str, doctor_name: str | None) -> str:
        doc_label = doctor_name if doctor_name else "Médico"
        
        system_prompt = (
            f"You are a professional medical scribe. "
            f"Your task is to take a raw consultation transcript and format it into a clear dialogue. "
            f"Identify the speakers as '{doc_label}' and 'Paciente'. "
            f"Correct minor speech errors (stuttering, repetition) but keep the clinical content 100% accurate. "
            f"Do not summarize. Keep the dialogue format: '{doc_label}: ... \\nPaciente: ...'"
        )

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": raw_text}
                ],
                temperature=0.3
            )
            return response.choices[0].message.content or raw_text
        except Exception as e:
            print(f"LLM Formatting failed: {e}")
            return raw_text  # Fallback to raw Whisper output
