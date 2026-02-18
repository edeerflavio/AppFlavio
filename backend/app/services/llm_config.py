"""
app/services/llm_config.py — LLM Configuration Service
Manages LLM settings (API key, model selection) with file-based persistence.
Falls back to OPENAI_API_KEY env var if no config file exists.
"""

import json
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger("medical-scribe")

# Config file path (relative to backend root)
CONFIG_FILE = Path(__file__).resolve().parent.parent.parent / "llm_config.json"

DEFAULT_CONFIG = {
    "provider": "openai",
    "api_key": "",
    "transcription_model": "whisper-1",
    "chat_model": "gpt-4o-mini",
}


class LLMConfigService:
    """Reads/writes LLM configuration from llm_config.json with env var fallback."""

    @staticmethod
    def get_config() -> dict:
        """Returns the current LLM config. Falls back to env var for api_key."""
        config = dict(DEFAULT_CONFIG)

        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    stored = json.load(f)
                config.update(stored)
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Failed to read LLM config file: {e}")

        # Fallback: if no api_key in config, use env var
        if not config.get("api_key"):
            config["api_key"] = os.getenv("OPENAI_API_KEY", "")

        return config

    @staticmethod
    def save_config(
        api_key: Optional[str] = None,
        transcription_model: Optional[str] = None,
        chat_model: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> dict:
        """Saves LLM config to llm_config.json. Only updates provided fields."""
        config = LLMConfigService.get_config()

        if api_key is not None:
            config["api_key"] = api_key
        if transcription_model is not None:
            config["transcription_model"] = transcription_model
        if chat_model is not None:
            config["chat_model"] = chat_model
        if provider is not None:
            config["provider"] = provider

        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            logger.info("LLM config saved successfully")
        except IOError as e:
            logger.error(f"Failed to save LLM config: {e}")
            raise

        return config

    @staticmethod
    def get_api_key() -> str:
        """Convenience: returns just the API key."""
        return LLMConfigService.get_config().get("api_key", "")

    @staticmethod
    def get_transcription_model() -> str:
        """Convenience: returns the transcription model name."""
        return LLMConfigService.get_config().get("transcription_model", "whisper-1")

    @staticmethod
    def get_chat_model() -> str:
        """Convenience: returns the chat model name."""
        return LLMConfigService.get_config().get("chat_model", "gpt-4o-mini")

    @staticmethod
    def mask_api_key(key: str) -> str:
        """Returns a masked version of the API key for display."""
        if not key or len(key) < 8:
            return "••••••••"
        return f"{key[:7]}...{key[-4:]}"
