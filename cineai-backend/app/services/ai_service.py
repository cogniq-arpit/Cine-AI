import json
import logging
from typing import Any, Dict, List

import httpx

from app.core.config import settings

logger = logging.getLogger("cineai-ai-service")


class AIProviderError(RuntimeError):
    """Raised when Gemini cannot produce a valid live response."""

    def __init__(self, message: str, *, status_code: int | None = None, provider_detail: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.provider_detail = provider_detail


class AIConfigurationError(AIProviderError):
    """Raised when the backend is missing required AI provider configuration."""


class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = settings.GEMINI_API_BASE_URL.rstrip("/")
        self.timeout_seconds = settings.GEMINI_TIMEOUT_SECONDS

    @property
    def provider_url(self) -> str:
        return f"{self.base_url}/models/{self.model}:generateContent"

    def diagnostics(self) -> Dict[str, Any]:
        return {
            "provider": "google-gemini",
            "model": self.model,
            "base_url": self.base_url,
            "api_key_configured": bool(self.api_key),
            "api_key_length": len(self.api_key or ""),
            "timeout_seconds": self.timeout_seconds,
        }

    def _assert_configured(self) -> None:
        if not self.api_key:
            raise AIConfigurationError(
                "GEMINI_API_KEY is not configured on the backend.",
                provider_detail="Set GEMINI_API_KEY in the deployed backend environment.",
            )
        if not self.model:
            raise AIConfigurationError(
                "GEMINI_MODEL is not configured on the backend.",
                provider_detail="Set GEMINI_MODEL to a Gemini model that supports generateContent.",
            )

    def _build_system_instruction(self) -> str:
        return (
            "You are Cine AI, an elite cinematic intelligence and personal movie companion. "
            "You respond like a warm, specific, opinionated film critic. "
            "Never use generic filler. Always adapt to the user's exact prompt, including people, directors, actors, genres, languages, moods, dates, and constraints.\n\n"
            "Return ONLY strict JSON with this shape:\n"
            "{\n"
            "  \"message\": \"A natural 2-4 sentence response tailored to the user prompt.\",\n"
            "  \"movieSearchQueries\": [\"Exact Movie Title 1\", \"Exact Movie Title 2\", \"Exact Movie Title 3\"],\n"
            "  \"moodTags\": [\"tag1\", \"tag2\", \"tag3\"]\n"
            "}\n\n"
            "Rules:\n"
            "1. movieSearchQueries must contain real film titles suitable for TMDB search.\n"
            "2. For director or actor prompts, recommend movies strongly connected to that person.\n"
            "3. For greetings or non-recommendation chatter, use empty arrays for movieSearchQueries and moodTags.\n"
            "4. Do not wrap JSON in markdown fences.\n"
            "5. Do not invent platform availability or ratings.\n"
            "6. If you cannot satisfy the exact request, explain briefly in message and return the closest valid titles."
        )

    def _format_context(self, chat_context: List[Dict] | None) -> List[Dict]:
        formatted: List[Dict] = []
        for msg in (chat_context or [])[-12:]:
            content = str(msg.get("content", "")).strip()
            if not content:
                continue
            formatted.append({
                "role": "model" if msg.get("role") in {"assistant", "model"} else "user",
                "parts": [{"text": content}],
            })
        return formatted

    def _parse_text_from_response(self, payload: Dict[str, Any]) -> str:
        candidates = payload.get("candidates") or []
        if not candidates:
            raise AIProviderError(
                "Gemini returned no candidates.",
                provider_detail=json.dumps(payload)[:1000],
            )

        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(part.get("text", "") for part in parts if not part.get("thought")).strip()
        if not text and parts:
            text = "".join(part.get("text", "") for part in parts).strip()
        if not text:
            raise AIProviderError(
                "Gemini returned an empty text response.",
                provider_detail=json.dumps(payload)[:1000],
            )
        return text

    def _validate_json_response(self, text: str) -> str:
        clean = text.replace("```json", "").replace("```", "").strip()
        try:
            parsed = json.loads(clean)
        except json.JSONDecodeError as exc:
            raise AIProviderError(
                "Gemini returned non-JSON content.",
                provider_detail=f"{exc}: {clean[:1000]}",
            ) from exc

        if not isinstance(parsed, dict) or not isinstance(parsed.get("message"), str):
            raise AIProviderError(
                "Gemini JSON response did not match the required schema.",
                provider_detail=clean[:1000],
            )
        if not isinstance(parsed.get("movieSearchQueries", []), list):
            raise AIProviderError(
                "Gemini movieSearchQueries was not an array.",
                provider_detail=clean[:1000],
            )
        if not isinstance(parsed.get("moodTags", []), list):
            raise AIProviderError(
                "Gemini moodTags was not an array.",
                provider_detail=clean[:1000],
            )
        return json.dumps({
            "message": parsed.get("message", "").strip(),
            "movieSearchQueries": [str(title).strip() for title in parsed.get("movieSearchQueries", []) if str(title).strip()][:6],
            "moodTags": [str(tag).strip() for tag in parsed.get("moodTags", []) if str(tag).strip()][:8],
        })

    async def generate_chat_response(self, prompt: str, chat_context: List[Dict] | None = None) -> str:
        self._assert_configured()

        contents = self._format_context(chat_context)
        contents.append({
            "role": "user",
            "parts": [{"text": f"{self._build_system_instruction()}\n\nUser prompt: {prompt}"}],
        })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.75,
                "maxOutputTokens": 2500,
                "responseMimeType": "application/json",
            },
        }
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(self.provider_url, headers=headers, json=payload)
        except httpx.TimeoutException as exc:
            raise AIProviderError("Gemini request timed out.", provider_detail=str(exc)) from exc
        except httpx.HTTPError as exc:
            raise AIProviderError("Gemini request failed before receiving a response.", provider_detail=str(exc)) from exc

        if response.status_code != 200:
            detail = response.text[:2000]
            logger.error("Gemini API returned %s: %s", response.status_code, detail)
            raise AIProviderError(
                "Gemini rejected the request.",
                status_code=response.status_code,
                provider_detail=detail,
            )

        text = self._parse_text_from_response(response.json())
        return self._validate_json_response(text)

    async def generate_recommendations_list(self, mood_prompt: str) -> List[Dict]:
        raw = await self.generate_chat_response(mood_prompt, [])
        parsed = json.loads(raw)
        return [{"Title": title} for title in parsed.get("movieSearchQueries", [])]


ai_service = AIService()
