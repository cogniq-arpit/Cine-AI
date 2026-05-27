import httpx
import asyncio
from typing import Dict, List, Optional
from app.core.config import settings
import logging

logger = logging.getLogger("cineai-movie-service")

class MovieMetadataService:
    def __init__(self):
        self.api_key = settings.TMDB_API_KEY
        self.access_token = settings.TMDB_ACCESS_TOKEN
        self.base_url = "https://api.themoviedb.org/3/"

    def _get_auth_config(self) -> tuple[Dict, Dict]:
        """Returns headers and query params configured robustly based on available TMDB credentials."""
        headers = {"accept": "application/json"}
        params = {}
        
        # Use Bearer Access Token if configured and not dummy
        if self.access_token and self.access_token != "dummy_tmdb_token" and len(self.access_token) > 30:
            headers["Authorization"] = f"Bearer {self.access_token}"
        # Otherwise fall back to API key query parameter
        elif self.api_key and self.api_key != "dummy_tmdb_key":
            params["api_key"] = self.api_key
            
        return headers, params

    def _map_tmdb_to_unified_schema(self, movie: Dict) -> Dict:
        """Maps TMDB movie details payload to the unified schema expected by the React Native frontend."""
        # Release Year
        release_date = movie.get("release_date", "")
        year = release_date.split("-")[0] if release_date else "N/A"
        
        # Poster URL (using TMDB w500 for optimized mobile loading)
        poster_path = movie.get("poster_path")
        poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else ""
        
        # Genres
        genres = movie.get("genres", [])
        genre_str = ", ".join([g["name"] for g in genres]) if genres else "N/A"
        
        # Plot Overview
        plot = movie.get("overview") or "No plot overview available."
        
        # Rating (convert TMDB 0.0-10.0 to string rating)
        vote_average = movie.get("vote_average", 0.0)
        rating_str = f"{vote_average:.1f}" if vote_average else "N/A"
        
        # Director & Cast (from credits append_to_response if available)
        credits = movie.get("credits", {})
        
        # Extract Director
        crew = credits.get("crew", [])
        directors = [member["name"] for member in crew if member.get("job") == "Director"]
        director_str = ", ".join(directors) if directors else "N/A"
        
        # Extract Top 4 Cast members
        cast = credits.get("cast", [])
        actors = [member["name"] for member in cast[:4]]
        actors_str = ", ".join(actors) if actors else "N/A"
        
        return {
            "imdbID": movie.get("imdb_id") or "",
            "Title": movie.get("title") or movie.get("original_title") or "Unknown Title",
            "Year": year,
            "Poster": poster_url,
            "Genre": genre_str,
            "Plot": plot,
            "imdbRating": rating_str,
            "Director": director_str,
            "Actors": actors_str,
            "poster_path": f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None,
            "backdrop_path": f"https://image.tmdb.org/t/p/w780{movie.get('backdrop_path')}" if movie.get('backdrop_path') else None,
            "original_language": movie.get("original_language") or "en",
            "vote_average": vote_average,
            "vote_count": movie.get("vote_count") or 1000,
            "genre_ids": movie.get("genre_ids") or ([g["id"] for g in genres] if genres else []),
            "release_date": release_date or "2000-01-01",
            "videos": movie.get("videos") or {"results": []}
        }

    async def fetch_by_imdb_id(self, imdb_id: str) -> Optional[Dict]:
        """Fetches unified movie details from TMDB using a standard IMDb ID."""
        headers, base_params = self._get_auth_config()
        async with httpx.AsyncClient() as client:
            try:
                # 1. Look up the TMDB internal ID using the external IMDb ID
                find_url = f"{self.base_url}find/{imdb_id}"
                find_params = {**base_params, "external_source": "imdb_id"}
                response = await client.get(find_url, headers=headers, params=find_params, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"TMDB /find returned status {response.status_code} for IMDb ID {imdb_id}: {response.text}")
                    return None
                
                find_data = response.json()
                movie_results = find_data.get("movie_results", [])
                if not movie_results:
                    logger.error(f"No TMDB movie found matching IMDb ID {imdb_id}")
                    return None
                
                # Extract matching internal TMDB ID
                tmdb_id = movie_results[0]["id"]
                
                # 2. Fetch full details including credits
                detail_url = f"{self.base_url}movie/{tmdb_id}"
                detail_params = {**base_params, "append_to_response": "credits,videos"}
                detail_resp = await client.get(detail_url, headers=headers, params=detail_params, timeout=10.0)
                if detail_resp.status_code != 200:
                    logger.error(f"TMDB details fetch returned status {detail_resp.status_code} for TMDB ID {tmdb_id}: {detail_resp.text}")
                    return None
                
                movie_data = detail_resp.json()
                # Map to unified schema for full frontend compatibility
                return self._map_tmdb_to_unified_schema(movie_data)
            except Exception as e:
                logger.error(f"Failed calling TMDB API for IMDb ID {imdb_id}: {str(e)}")
                return None

    async def search_movies(self, query: str, limit: int = 6) -> List[Dict]:
        """Searches movies from TMDB and resolves their IMDb IDs concurrently."""
        headers, base_params = self._get_auth_config()
        async with httpx.AsyncClient() as client:
            try:
                # 1. Call TMDB search endpoint
                search_url = f"{self.base_url}search/movie"
                search_params = {**base_params, "query": query}
                response = await client.get(search_url, headers=headers, params=search_params, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"TMDB search returned status {response.status_code} for query '{query}': {response.text}")
                    return []
                
                results = response.json().get("results", [])
                # Take top results to satisfy the request cleanly and quickly
                top_results = results[:limit]
                
                # 2. Resolve complete metadata (including imdb_id) for top results concurrently
                tasks = [
                    self._fetch_details_by_tmdb_id(client, headers, base_params, item["id"])
                    for item in top_results
                ]
                detailed_responses = await asyncio.gather(*tasks, return_exceptions=True)
                
                search_list = []
                for res in detailed_responses:
                    if isinstance(res, dict) and res.get("imdb_id"):
                        mapped = self._map_tmdb_to_unified_schema(res)
                        search_list.append(mapped)
                
                return search_list
            except Exception as e:
                logger.error(f"Failed searching TMDB API for query '{query}': {str(e)}")
                return []

    async def fetch_trending_movies(self, limit: int = 10) -> List[Dict]:
        """Fetches trending movies directly from TMDB."""
        headers, base_params = self._get_auth_config()
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}trending/movie/week"
                response = await client.get(url, headers=headers, params=base_params, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"TMDB trending returned status {response.status_code}: {response.text}")
                    return []
                
                results = response.json().get("results", [])
                top_results = results[:limit]  # Take top results
                
                tasks = [
                    self._fetch_details_by_tmdb_id(client, headers, base_params, item["id"])
                    for item in top_results
                ]
                detailed_responses = await asyncio.gather(*tasks, return_exceptions=True)
                
                output = []
                for res in detailed_responses:
                    if isinstance(res, dict) and res.get("imdb_id"):
                        mapped = self._map_tmdb_to_unified_schema(res)
                        output.append(mapped)
                return output
            except Exception as e:
                logger.error(f"Failed fetching TMDB trending movies: {str(e)}")
                return []

    async def fetch_popular_movies(self, limit: int = 10) -> List[Dict]:
        """Fetches popular movies directly from TMDB."""
        headers, base_params = self._get_auth_config()
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}movie/popular"
                response = await client.get(url, headers=headers, params=base_params, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"TMDB popular returned status {response.status_code}: {response.text}")
                    return []
                
                results = response.json().get("results", [])
                top_results = results[:limit]  # Take top results
                
                tasks = [
                    self._fetch_details_by_tmdb_id(client, headers, base_params, item["id"])
                    for item in top_results
                ]
                detailed_responses = await asyncio.gather(*tasks, return_exceptions=True)
                
                output = []
                for res in detailed_responses:
                    if isinstance(res, dict) and res.get("imdb_id"):
                        mapped = self._map_tmdb_to_unified_schema(res)
                        output.append(mapped)
                return output
            except Exception as e:
                logger.error(f"Failed fetching TMDB popular movies: {str(e)}")
                return []

    async def fetch_upcoming_movies(self, limit: int = 10) -> List[Dict]:
        """Fetches upcoming movies directly from TMDB."""
        headers, base_params = self._get_auth_config()
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}movie/upcoming"
                response = await client.get(url, headers=headers, params=base_params, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"TMDB upcoming returned status {response.status_code}: {response.text}")
                    return []
                
                results = response.json().get("results", [])
                top_results = results[:limit]  # Take top results
                
                tasks = [
                    self._fetch_details_by_tmdb_id(client, headers, base_params, item["id"])
                    for item in top_results
                ]
                detailed_responses = await asyncio.gather(*tasks, return_exceptions=True)
                
                output = []
                for res in detailed_responses:
                    if isinstance(res, dict) and res.get("imdb_id"):
                        mapped = self._map_tmdb_to_unified_schema(res)
                        output.append(mapped)
                return output
            except Exception as e:
                logger.error(f"Failed fetching TMDB upcoming movies: {str(e)}")
                return []

    async def fetch_top_rated_movies(self, limit: int = 10) -> List[Dict]:
        """Fetches top rated movies directly from TMDB."""
        headers, base_params = self._get_auth_config()
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}movie/top_rated"
                response = await client.get(url, headers=headers, params=base_params, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"TMDB top rated returned status {response.status_code}: {response.text}")
                    return []
                
                results = response.json().get("results", [])
                top_results = results[:limit]  # Take top results
                
                tasks = [
                    self._fetch_details_by_tmdb_id(client, headers, base_params, item["id"])
                    for item in top_results
                ]
                detailed_responses = await asyncio.gather(*tasks, return_exceptions=True)
                
                output = []
                for res in detailed_responses:
                    if isinstance(res, dict) and res.get("imdb_id"):
                        mapped = self._map_tmdb_to_unified_schema(res)
                        output.append(mapped)
                return output
            except Exception as e:
                logger.error(f"Failed fetching TMDB top rated movies: {str(e)}")
                return []

    async def _fetch_details_by_tmdb_id(self, client: httpx.AsyncClient, headers: Dict, base_params: Dict, tmdb_id: int) -> Optional[Dict]:
        """Helper to fetch single movie details by internal TMDB ID (used for concurrent resolution)."""
        try:
            detail_url = f"{self.base_url}movie/{tmdb_id}"
            detail_params = {**base_params, "append_to_response": "credits,videos"}
            response = await client.get(detail_url, headers=headers, params=detail_params, timeout=5.0)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            logger.error(f"Error fetching TMDB detail during search resolution for TMDB ID {tmdb_id}: {str(e)}")
            return None

    async def discover_movies(self, params: dict) -> List[Dict]:
        """Queries TMDB discover endpoint directly with custom filters."""
        headers, base_params = self._get_auth_config()
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}discover/movie"
                # Merge base params with input params
                discover_params = {**base_params, **params}
                response = await client.get(url, headers=headers, params=discover_params, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"TMDB discover returned status {response.status_code}: {response.text}")
                    return []
                
                results = response.json().get("results", [])
                limit = int(params.get("limit", 20))
                top_results = results[:limit]
                
                tasks = [
                    self._fetch_details_by_tmdb_id(client, headers, base_params, item["id"])
                    for item in top_results
                ]
                detailed_responses = await asyncio.gather(*tasks, return_exceptions=True)
                
                output = []
                for res in detailed_responses:
                    if isinstance(res, dict) and res.get("imdb_id"):
                        mapped = self._map_tmdb_to_unified_schema(res)
                        output.append(mapped)
                return output
            except Exception as e:
                logger.error(f"Failed querying TMDB discover: {str(e)}")
                return []

movie_metadata_service = MovieMetadataService()

