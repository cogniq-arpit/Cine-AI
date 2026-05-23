import httpx
from typing import Dict, List, Optional
from app.core.config import settings
import json
import logging

logger = logging.getLogger("cineai-ai-service")

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    async def generate_chat_response(self, prompt: str, chat_context: List[Dict] = None) -> str:
        """Sends the user message alongside context to Google Gemini to fetch conversational responses."""
        if not self.api_key or self.api_key == "AIzaSyD_dummy_gemini_key":
            return "Cine AI is operating in preview mode. Set a valid GEMINI_API_KEY in your env settings to experience real conversations."

        # Compile system prompts with strict cinematic personas
        system_instruction = (
            "You are Cine AI, a premium movie recommendation voice assistant. "
            "Respond conversationally and keep your answers under 3-4 sentences. "
            "Always maintain a dark, sophisticated, and warm cinematic tone."
        )

        formatted_contents = []
        if chat_context:
            for msg in chat_context:
                formatted_contents.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [{"text": msg["content"]}]
                })
        
        # Append latest prompt
        formatted_contents.append({
            "role": "user",
            "parts": [{"text": f"{system_instruction}\n\nUser: {prompt}"}]
        })

        async with httpx.AsyncClient() as client:
            try:
                headers = {"Content-Type": "application/json"}
                url = f"{self.base_url}?key={self.api_key}"
                payload = {
                    "contents": formatted_contents,
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 300,
                    }
                }
                response = await client.post(url, headers=headers, json=payload, timeout=15.0)
                if response.status_code == 200:
                    result = response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return text.strip()
                logger.error(f"Gemini API returned code {response.status_code}: {response.text}")
                return "I encountered a minor issue parsing that request. Tell me again, what type of cinema are you in the mood for?"
            except Exception as e:
                logger.error(f"Gemini API execution failed: {str(e)}")
                return "My cinematic neural nets are temporarily recalibrating. Try asking me for recommendations in a few moments!"

    async def generate_recommendations_list(self, mood_prompt: str) -> List[Dict]:
        """Leverages Gemini to extract a strictly structured JSON list of movie suggestions mapping to mood prompts."""
        if not self.api_key or self.api_key == "AIzaSyD_dummy_gemini_key":
            # Return dummy structure if api key is missing
            return [
                {"Title": "Inception", "imdbID": "tt1375666", "Year": "2010", "Poster": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=300"},
                {"Title": "Interstellar", "imdbID": "tt0816692", "Year": "2014", "Poster": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300"}
            ]

        # Instruct model to generate structured JSON output containing IMDB IDs
        instruction = (
            "Based on the user's mood query, output exactly 4 highly recommended movies. "
            "You MUST format your entire response as a raw JSON array of objects. "
            "Do NOT wrap the response in markdown blocks or write any introductory text. "
            "Each object MUST contain strictly: 'Title', 'imdbID' (must be a valid IMDb ID starting with tt), 'Year', and 'Poster' (leave Poster empty string or use unsplash placeholder). "
            "Here is the mood query: "
        )

        async with httpx.AsyncClient() as client:
            try:
                headers = {"Content-Type": "application/json"}
                url = f"{self.base_url}?key={self.api_key}"
                payload = {
                    "contents": [{
                        "role": "user",
                        "parts": [{"text": f"{instruction} '{mood_prompt}'"}]
                    }],
                    "generationConfig": {
                        "temperature": 0.5,
                        "maxOutputTokens": 800,
                    }
                }
                response = await client.post(url, headers=headers, json=payload, timeout=20.0)
                if response.status_code == 200:
                    result = response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                        # Clean markdown json formatting wrapper if generated
                        if text.startswith("```json"):
                            text = text[7:]
                        if text.endswith("```"):
                            text = text[:-3]
                        text = text.strip()
                        
                        movie_list = json.loads(text)
                        if isinstance(movie_list, list):
                            return movie_list
                logger.error(f"Gemini API returned error for list generation: {response.text}")
                return []
            except Exception as e:
                logger.error(f"Failed generating structured recommendation list: {str(e)}")
                return []

ai_service = AIService()
