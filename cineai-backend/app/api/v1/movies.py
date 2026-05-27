from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Dict, Optional

from app.db.session import get_db
from app.api.deps import get_current_user, get_optional_user
from app.models.user import User
from app.models.movie_list import Watchlist, RecentlyViewed, SavedMovie
from app.models.interaction import TrendingInteraction
from app.schemas.movie import (
    WatchlistToggleRequest, WatchlistResponse,
    RecentlyViewedRequest, SavedMovieToggleRequest,
    TrendingInteractionCreate, MovieDetailResponse
)
from app.services.movie_metadata import movie_metadata_service

router = APIRouter(tags=["Movies & Lists"])

import logging
logger = logging.getLogger("cineai-movies-router")

@router.get("/trending", response_model=List[dict])
async def get_trending_movies(limit: int = 10, db: AsyncSession = Depends(get_db)):
    """Resolves trending movies dynamically by consolidating highest global interaction rates or querying TMDB directly."""
    try:
        # 1. Try to fetch live trending movies from TMDB
        trending = await movie_metadata_service.fetch_trending_movies(limit=limit)
        if trending:
            return trending
    except Exception as e:
        logger.error(f"Live TMDB trending fetch failed: {str(e)}")

    # Standard fallback trending movies list if database records are minimal
    fallback = [
        {"imdbID": "tt15398776", "Title": "Oppenheimer", "Year": "2023", "Poster": "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", "Genre": "Biography, Drama, History", "Plot": "The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.", "imdbRating": "8.9", "Director": "Christopher Nolan", "Actors": "Cillian Murphy, Emily Blunt"},
        {"imdbID": "tt1375666", "Title": "Inception", "Year": "2010", "Poster": "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg", "Genre": "Action, Adventure, Sci-Fi", "Plot": "A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.", "imdbRating": "8.8", "Director": "Christopher Nolan", "Actors": "Leonardo DiCaprio, Joseph Gordon-Levitt"},
        {"imdbID": "tt0816692", "Title": "Interstellar", "Year": "2014", "Poster": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "Genre": "Adventure, Drama, Sci-Fi", "Plot": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", "imdbRating": "8.7", "Director": "Christopher Nolan", "Actors": "Matthew McConaughey, Anne Hathaway"},
        {"imdbID": "tt15239678", "Title": "Dune: Part Two", "Year": "2024", "Poster": "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", "Genre": "Action, Adventure, Sci-Fi", "Plot": "Paul Atreides unites with Chani and the Fremen while seeking revenge.", "imdbRating": "9.0", "Director": "Denis Villeneuve", "Actors": "Timothée Chalamet, Zendaya"},
        {"imdbID": "tt0111161", "Title": "The Shawshank Redemption", "Year": "1994", "Poster": "https://image.tmdb.org/t/p/w500/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg", "Genre": "Drama", "Plot": "Over the course of several years, two convicts form a friendship, seeking consolation and redemption.", "imdbRating": "9.3", "Director": "Frank Darabont", "Actors": "Tim Robbins, Morgan Freeman"},
        {"imdbID": "tt0468569", "Title": "The Dark Knight", "Year": "2008", "Poster": "https://image.tmdb.org/t/p/w500/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg", "Genre": "Action, Crime, Drama", "Plot": "When the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests of his ability.", "imdbRating": "9.0", "Director": "Christopher Nolan", "Actors": "Christian Bale, Heath Ledger"}
    ]

    try:
        # Group interaction counts by imdb_id to find global trending items
        query = (
            select(TrendingInteraction.imdb_id, func.count(TrendingInteraction.id).label("interaction_count"))
            .group_by(TrendingInteraction.imdb_id)
            .order_by(func.count(TrendingInteraction.id).desc())
            .limit(6)
        )
        result = await db.execute(query)
        rows = result.all()
        
        if not rows:
            return fallback
            
        trending_list = []
        for row in rows:
            imdb_id = row[0]
            # Fetch metadata dynamically from TMDB
            details = await movie_metadata_service.fetch_by_imdb_id(imdb_id)
            if details:
                trending_list.append({
                    "imdbID": details.get("imdbID", imdb_id),
                    "Title": details.get("Title", "Unknown Title"),
                    "Year": details.get("Year", "N/A"),
                    "Poster": details.get("Poster", "")
                })
                
        if not trending_list:
            return fallback
            
        return trending_list
    except Exception:
        return fallback

@router.get("/popular", response_model=List[dict])
async def get_popular_movies(limit: int = 10):
    """Fetches popular movies dynamically from TMDB."""
    try:
        popular = await movie_metadata_service.fetch_popular_movies(limit=limit)
        if popular:
            return popular
    except Exception as e:
        logger.error(f"Live TMDB popular fetch failed: {str(e)}")
    return []

@router.get("/upcoming", response_model=List[dict])
async def get_upcoming_movies(limit: int = 10):
    """Fetches upcoming movies dynamically from TMDB."""
    try:
        upcoming = await movie_metadata_service.fetch_upcoming_movies(limit=limit)
        if upcoming:
            return upcoming
    except Exception as e:
        logger.error(f"Live TMDB upcoming fetch failed: {str(e)}")
    return []

@router.get("/top_rated", response_model=List[dict])
async def get_top_rated_movies(limit: int = 10):
    """Fetches top-rated movies dynamically from TMDB."""
    try:
        top_rated = await movie_metadata_service.fetch_top_rated_movies(limit=limit)
        if top_rated:
            return top_rated
    except Exception as e:
        logger.error(f"Live TMDB top_rated fetch failed: {str(e)}")
    return []


@router.get("/details/{imdb_id}", response_model=MovieDetailResponse)
async def get_movie_details(imdb_id: str, current_user: Optional[User] = Depends(get_optional_user), db: AsyncSession = Depends(get_db)):
    """Fetches details from TMDB, appends records into RecentlyViewed logs, and records a trending interaction."""
    # 1. Fetch metadata
    details = await movie_metadata_service.fetch_by_imdb_id(imdb_id)
    if not details:
        raise HTTPException(status_code=404, detail="Movie not found on TMDB API")
        
    # 2. Append recently viewed and save interaction if logged in
    if current_user:
        # Save to recents
        recent = RecentlyViewed(user_id=current_user.id, imdb_id=imdb_id)
        db.add(recent)
        
        # Log interaction
        inter = TrendingInteraction(user_id=current_user.id, imdb_id=imdb_id, interaction_type="click")
        db.add(inter)
        
        await db.commit()
    else:
        # Anonymous Guest interaction log
        inter = TrendingInteraction(user_id=None, imdb_id=imdb_id, interaction_type="click")
        db.add(inter)
        await db.commit()
        
    return details

@router.get("/search", response_model=List[dict])
async def search_movies(query: str, limit: int = 6):
    """Searches movies securely via consolidated backend TMDB service."""
    results = await movie_metadata_service.search_movies(query, limit=limit)
    return results

@router.get("/discover", response_model=List[dict])
async def discover_movies(
    with_genres: Optional[str] = None,
    sort_by: Optional[str] = "popularity.desc",
    vote_average_gte: Optional[float] = None,
    vote_count_gte: Optional[int] = None,
    with_original_language: Optional[str] = None,
    primary_release_year: Optional[int] = None,
    page: Optional[int] = 1,
    limit: Optional[int] = 20
):
    """Proxies the standard TMDB discover endpoint for custom advanced query combinations."""
    params = {
        "page": page,
        "limit": limit
    }
    if with_genres:
        params["with_genres"] = with_genres
    if sort_by:
        params["sort_by"] = sort_by
    if vote_average_gte:
        params["vote_average.gte"] = vote_average_gte
    if vote_count_gte:
        params["vote_count.gte"] = vote_count_gte
    if with_original_language:
        params["with_original_language"] = with_original_language
    if primary_release_year:
        params["primary_release_year"] = primary_release_year
        
    results = await movie_metadata_service.discover_movies(params)
    return results

@router.post("/watchlist/toggle", status_code=status.HTTP_200_OK)
async def toggle_watchlist(
    schema: WatchlistToggleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggles movie inclusion inside the persistent Watchlist database."""
    query = select(Watchlist).where(
        (Watchlist.user_id == current_user.id) & 
        (Watchlist.imdb_id == schema.imdb_id)
    )
    result = await db.execute(query)
    existing = result.scalars().first()
    
    if existing:
        await db.delete(existing)
        message = "Removed from Watchlist"
    else:
        new_item = Watchlist(
            user_id=current_user.id,
            imdb_id=schema.imdb_id,
            title=schema.title,
            poster=schema.poster
        )
        db.add(new_item)
        message = "Added to Watchlist"
        
    await db.commit()
    return {"message": message}

@router.get("/watchlist", response_model=List[WatchlistResponse])
async def get_watchlist(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves watchlist items for the authenticated user."""
    query = select(Watchlist).where(Watchlist.user_id == current_user.id).order_by(Watchlist.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()
    return items

@router.post("/saved/toggle", status_code=status.HTTP_200_OK)
async def toggle_saved_movie(
    schema: SavedMovieToggleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggles movie inclusion inside the user's Saved Movies list."""
    query = select(SavedMovie).where(
        (SavedMovie.user_id == current_user.id) & 
        (SavedMovie.imdb_id == schema.imdb_id)
    )
    result = await db.execute(query)
    existing = result.scalars().first()
    
    if existing:
        await db.delete(existing)
        message = "Removed from Saved Movies"
    else:
        new_item = SavedMovie(user_id=current_user.id, imdb_id=schema.imdb_id)
        db.add(new_item)
        message = "Added to Saved Movies"
        
    await db.commit()
    return {"message": message}

@router.post("/interaction", status_code=status.HTTP_201_CREATED)
async def post_trending_interaction(
    schema: TrendingInteractionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Logs a custom trending interaction event (click, like, search) for analytical tracking."""
    uid = current_user.id if current_user else None
    inter = TrendingInteraction(
        user_id=uid,
        imdb_id=schema.imdb_id,
        interaction_type=schema.interaction_type
    )
    db.add(inter)
    await db.commit()
    return {"status": "success"}
