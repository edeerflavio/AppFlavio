"""
app/services/transcription_service.py — Audio Transcription Service
Uses OpenAI Whisper for transcription and GPT for speaker diarization.
Reads config from LLMConfigService with professional error handling.
"""

import logging
import os
import shutil
import tempfile
from pathlib import Path

from fastapi import UploadFile, HTTPException
from openai import AsyncOpenAI, AuthenticationError, APIConnectionError, RateLimitError

from app.services.llm_config import LLMConfigService

logger = logging.getLogger("medical-scribe")


class TranscriptionService:
    @staticmethod
    async def transcribe_audio(file: UploadFile, doctor_name: str | None = None) -> str:
        """Transcribes an audio file using Whisper and formats with GPT."""
        config = LLMConfigService.get_config()
        api_key = config.get("api_key", "")

        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="Modelo de IA indisponível — configure sua API Key em Configurações.",
            )

        client = AsyncOpenAI(api_key=api_key)
        transcription_model = config.get("transcription_model", "whisper-1")
        chat_model = config.get("chat_model", "gpt-4o-mini")

        # 1. Transcribe with Whisper
        suffix = Path(file.filename).suffix if file.filename else ".webm"
        raw_text = ""

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                shutil.copyfileobj(file.file, tmp_file)
                tmp_path = tmp_file.name

            with open(tmp_path, "rb") as audio_file:
                transcription = await client.audio.transcriptions.create(
                    model=transcription_model,
                    file=audio_file,
                    language="pt",
                )
            raw_text = transcription.text

        except AuthenticationError:
            raise HTTPException(
                status_code=401,
                detail="Modelo de IA indisponível — API Key inválida. Verifique em Configurações.",
            )
        except RateLimitError:
            raise HTTPException(
                status_code=429,
                detail="Limite de requisições da IA atingido. Aguarde alguns instantes e tente novamente.",
            )
        except APIConnectionError:
            raise HTTPException(
                status_code=503,
                detail="Serviço de IA indisponível — não foi possível conectar ao servidor. Verifique sua conexão.",
            )
        except Exception as e:
            logger.error(f"Transcription failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Erro na transcrição: {str(e)}",
            )
        finally:
            if "tmp_path" in locals() and os.path.exists(tmp_path):
                os.unlink(tmp_path)

        # 2. Format with LLM (Speaker Diarization)
        if not raw_text.strip():
            return ""

        formatted_text = await TranscriptionService._format_transcript_llm(
            client, raw_text, doctor_name, chat_model
        )
        return formatted_text

    @staticmethod
    async def _format_transcript_llm(
        client: AsyncOpenAI, raw_text: str, doctor_name: str | None, chat_model: str
    ) -> str:
        """Formats raw transcript into speaker-diarized dialogue using GPT."""
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
                model=chat_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": raw_text},
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content or raw_text
        except Exception as e:
            logger.warning(f"LLM formatting failed, returning raw Whisper output: {e}")
            return raw_text  # Fallback to raw Whisper output
