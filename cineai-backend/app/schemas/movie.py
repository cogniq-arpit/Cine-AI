from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WatchlistToggleRequest(BaseModel):
    imdb_id: str = Field(..., min_length=5, max_length=20)
    title: str = Field(..., max_length=255)
    poster: Optional[str] = Field(None, max_length=512)

class WatchlistResponse(BaseModel):
    imdb_id: str
    title: str
    poster: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class RecentlyViewedRequest(BaseModel):
    imdb_id: str = Field(..., min_length=5, max_length=20)

class SavedMovieToggleRequest(BaseModel):
    imdb_id: str = Field(..., min_length=5, max_length=20)

class TrendingInteractionCreate(BaseModel):
    imdb_id: str = Field(..., min_length=5, max_length=20)
    interaction_type: str = Field(..., pattern="^(click|like|search)$")

class RecommendationRequest(BaseModel):
    mood_prompt: str = Field(..., min_length=2, max_length=500)

class MovieDetailResponse(BaseModel):
    imdbID: str
    Title: str
    Year: str
    Poster: str
    Genre: Optional[str] = None
    Plot: Optional[str] = None
    imdbRating: Optional[str] = None
    Director: Optional[str] = None
    Actors: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    original_language: Optional[str] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    genre_ids: Optional[List[int]] = None
    release_date: Optional[str] = None
    videos: Optional[dict] = None
