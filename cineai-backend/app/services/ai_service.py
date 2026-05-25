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

        # Compile system prompts with strict cinematic personas and structured JSON requirements
        system_instruction = (
            "You are Cine AI — an elite cinematic intelligence and personal movie companion. "
            "You feel like having a conversation with a brilliant, warm film critic who deeply understands emotions and moods.\n\n"
            "Your personality:\n"
            "- Conversational, warm, intelligent — like a trusted film critic friend\n"
            "- You use rich, evocative language about cinema\n"
            "- You understand emotional context: 'I just went through a breakup', 'I want to cry', 'I need something uplifting'\n"
            "- You remember the conversation context and reference earlier messages naturally\n"
            "- You are specific and opinionated, not generic\n\n"
            "Response format — ALWAYS return valid JSON exactly like this:\n"
            "{\n"
            "  \"message\": \"Your warm, conversational response here (2-4 sentences max). Be natural and specific.\",\n"
            "  \"movieSearchQueries\": [\"Exact Movie Title 1\", \"Exact Movie Title 2\", \"Exact Movie Title 3\"],\n"
            "  \"moodTags\": [\"emotional\", \"cinematic\", \"tag3\"]\n"
            "}\n\n"
            "Rules:\n"
            "1. movieSearchQueries must be EXACT movie titles that exist in OMDb (real films only)\n"
            "2. Recommend 3–6 movies that precisely match the request\n"
            "3. Write engaging, emotionally intelligent messages — not generic lists\n"
            "4. For conversational messages (greetings, thanks, etc.) use empty arrays for queries and tags\n"
            "5. Always reference the specific genres, directors, moods or themes the user mentioned\n"
            "6. moodTags should capture the emotional vibe (e.g. \"mind-bending\", \"tear-jerker\", \"hopeful\", \"dark\", \"nostalgic\")"
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
                        "temperature": 0.8,
                        "maxOutputTokens": 600,
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
                        return text.strip()
                logger.error(f"Gemini API returned code {response.status_code}: {response.text}")
                return self._generate_local_cinematic_fallback(prompt)
            except Exception as e:
                logger.error(f"Gemini API execution failed: {str(e)}")
                return self._generate_local_cinematic_fallback(prompt)

    def _generate_local_cinematic_fallback(self, prompt: str) -> str:
        """Generates an ultra-premium local fallback response to ensure a flawless chatbot experience even without a working Gemini API key."""
        prompt_lower = prompt.lower()
        
        # 1. Greetings / Conversational
        if any(greet in prompt_lower for greet in ["hi", "hello", "hey", "greetings", "yo", "sup"]):
            return json.dumps({
                "message": "Hello! I am Cine AI, your premium cinematic companion. Tell me what kind of genre, director, or emotional mood you are in the mood for tonight, and let's find your next favorite film!",
                "movieSearchQueries": [],
                "moodTags": ["cinema", "companion"]
            })
            
        # 2. Sci-Fi / Space / Future
        elif any(keyword in prompt_lower for keyword in ["sci-fi", "scifi", "science", "space", "future", "interstellar", "inception", "matrix"]):
            return json.dumps({
                "message": "Ah, seeking a journey beyond the boundaries of reality. I highly recommend these mind-bending science fiction masterpieces that will challenge your perception of time, space, and consciousness.",
                "movieSearchQueries": ["Interstellar", "Inception", "The Matrix"],
                "moodTags": ["mind-bending", "sci-fi", "cinematic"]
            })
            
        # 3. Thriller / Psychological / Mystery
        elif any(keyword in prompt_lower for keyword in ["thriller", "psychological", "mystery", "twist", "suspense", "dark"]):
            return json.dumps({
                "message": "I completely understand that craving for suspense. Here are three chilling psychological thrillers that feature superb acting, dark atmospheres, and plot twists that will keep you guessing until the final frame.",
                "movieSearchQueries": ["Shutter Island", "The Dark Knight", "Parasite"],
                "moodTags": ["dark", "thrilling", "suspense"]
            })
            
        # 4. Comedy / Feel-good / Uplifting
        elif any(keyword in prompt_lower for keyword in ["comedy", "funny", "laugh", "feel-good", "uplifting", "happy"]):
            return json.dumps({
                "message": "Looking for something to lift your spirits? These exceptionally crafted comedies combine wit, brilliant cinematography, and heartwarming stories that are perfect for a relaxed evening.",
                "movieSearchQueries": ["The Grand Budapest Hotel", "Barbie", "La La Land"],
                "moodTags": ["uplifting", "whimsical", "feel-good"]
            })
            
        # 5. Drama / Romance / Classic
        elif any(keyword in prompt_lower for keyword in ["drama", "romance", "romantic", "sad", "tear", "emotional", "art"]):
            return json.dumps({
                "message": "To deeply feel the human condition through art, I recommend these stunning cinematic dramas. They explore love, obsession, and ambition with breathtaking visual styling and scores.",
                "movieSearchQueries": ["Oppenheimer", "Whiplash", "La La Land"],
                "moodTags": ["emotional", "poignant", "masterpiece"]
            })
            
        # 6. Default Fallback
        else:
            return json.dumps({
                "message": f"Based on the emotional and visual depth of your prompt, I highly recommend diving into these spectacular modern masterpieces that define premium cinema.",
                "movieSearchQueries": ["Oppenheimer", "Dune: Part Two", "Interstellar"],
                "moodTags": ["curated", "premium", "masterpiece"]
            })

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
