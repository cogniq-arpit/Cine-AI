import httpx
from typing import Dict, List, Optional
from app.core.config import settings
import logging

logger = logging.getLogger("cineai-movie-service")

class MovieMetadataService:
    def __init__(self):
        self.api_key = settings.OMDB_API_KEY
        self.base_url = "http://www.omdbapi.com/"

    async def fetch_by_imdb_id(self, imdb_id: str) -> Optional[Dict]:
        """Fetches unified movie details from the OMDb API."""
        async with httpx.AsyncClient() as client:
            try:
                params = {
                    "apikey": self.api_key,
                    "i": imdb_id,
                    "plot": "full"
                }
                response = await client.get(self.base_url, params=params, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("Response") == "True":
                        return data
                logger.error(f"OMDb returned error for ID {imdb_id}: {response.text}")
                return None
            except Exception as e:
                logger.error(f"Failed calling OMDb API for ID {imdb_id}: {str(e)}")
                return None

    async def search_movies(self, query: str) -> List[Dict]:
        """Searches movies from OMDb by keyword query."""
        async with httpx.AsyncClient() as client:
            try:
                params = {
                    "apikey": self.api_key,
                    "s": query,
                    "type": "movie"
                }
                response = await client.get(self.base_url, params=params, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("Response") == "True":
                        return data.get("Search", [])
                return []
            except Exception as e:
                logger.error(f"Failed searching OMDb API for query {query}: {str(e)}")
                return []

movie_metadata_service = MovieMetadataService()
