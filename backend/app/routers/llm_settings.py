"""
app/routers/llm_settings.py — LLM Settings API
GET/PUT config, POST /test to validate API key.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI, AuthenticationError, APIConnectionError

from app.services.llm_config import LLMConfigService

logger = logging.getLogger("medical-scribe")

router = APIRouter(prefix="/api/settings/llm", tags=["LLM Settings"])


# ── Models ──

class LLMSettingsResponse(BaseModel):
    provider: str
    api_key_masked: str
    has_api_key: bool
    transcription_model: str
    chat_model: str
    available_transcription_models: list[str] = ["whisper-1"]
    available_chat_models: list[str] = [
        "gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"
    ]


class LLMSettingsUpdate(BaseModel):
    api_key: Optional[str] = None
    transcription_model: Optional[str] = None
    chat_model: Optional[str] = None
    provider: Optional[str] = None


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    model_tested: str = ""


# ── Endpoints ──

@router.get("/", response_model=LLMSettingsResponse)
async def get_llm_settings():
    """Returns the current LLM configuration (API key masked)."""
    config = LLMConfigService.get_config()
    api_key = config.get("api_key", "")

    return LLMSettingsResponse(
        provider=config.get("provider", "openai"),
        api_key_masked=LLMConfigService.mask_api_key(api_key),
        has_api_key=bool(api_key),
        transcription_model=config.get("transcription_model", "whisper-1"),
        chat_model=config.get("chat_model", "gpt-4o-mini"),
    )


@router.put("/", response_model=LLMSettingsResponse)
async def update_llm_settings(settings: LLMSettingsUpdate):
    """Updates LLM configuration. Only provided fields are changed."""
    try:
        config = LLMConfigService.save_config(
            api_key=settings.api_key,
            transcription_model=settings.transcription_model,
            chat_model=settings.chat_model,
            provider=settings.provider,
        )
    except IOError:
        raise HTTPException(status_code=500, detail="Erro ao salvar configurações")

    api_key = config.get("api_key", "")

    return LLMSettingsResponse(
        provider=config.get("provider", "openai"),
        api_key_masked=LLMConfigService.mask_api_key(api_key),
        has_api_key=bool(api_key),
        transcription_model=config.get("transcription_model", "whisper-1"),
        chat_model=config.get("chat_model", "gpt-4o-mini"),
    )


@router.post("/test", response_model=TestConnectionResponse)
async def test_llm_connection():
    """Tests the current API key by listing available models."""
    config = LLMConfigService.get_config()
    api_key = config.get("api_key", "")

    if not api_key:
        return TestConnectionResponse(
            success=False,
            message="Nenhuma API Key configurada. Adicione sua chave nas configurações.",
        )

    try:
        client = AsyncOpenAI(api_key=api_key)
        # Lightweight call — just list models to verify the key
        models = await client.models.list()
        model_ids = [m.id for m in models.data[:5]]

        return TestConnectionResponse(
            success=True,
            message=f"Conexão estabelecida com sucesso! {len(models.data)} modelos disponíveis.",
            model_tested=", ".join(model_ids),
        )

    except AuthenticationError:
        return TestConnectionResponse(
            success=False,
            message="API Key inválida. Verifique sua chave em platform.openai.com/api-keys",
        )
    except APIConnectionError:
        return TestConnectionResponse(
            success=False,
            message="Não foi possível conectar ao servidor da OpenAI. Verifique sua conexão.",
        )
    except Exception as e:
        logger.error(f"LLM connection test failed: {e}")
        return TestConnectionResponse(
            success=False,
            message=f"Erro inesperado: {str(e)}",
        )
