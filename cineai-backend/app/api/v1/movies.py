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

@router.get("/trending", response_model=List[dict])
async def get_trending_movies(db: AsyncSession = Depends(get_db)):
    """Resolves trending movies dynamically by consolidating highest global interaction rates."""
    # Standard fallback trending movies list if database records are minimal
    fallback = [
        {"imdbID": "tt1375666", "Title": "Inception", "Year": "2010", "Poster": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=300"},
        {"imdbID": "tt0816692", "Title": "Interstellar", "Year": "2014", "Poster": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300"},
        {"imdbID": "tt1160419", "Title": "Dune", "Year": "2021", "Poster": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300"},
        {"imdbID": "tt2582802", "Title": "Whiplash", "Year": "2014", "Poster": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300"}
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
            # Fetch metadata dynamically from OMDb
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

@router.get("/details/{imdb_id}", response_model=MovieDetailResponse)
async def get_movie_details(imdb_id: str, current_user: Optional[User] = Depends(get_optional_user), db: AsyncSession = Depends(get_db)):
    """Fetches details from OMDb, appends records into RecentlyViewed logs, and records a trending interaction."""
    # 1. Fetch metadata
    details = await movie_metadata_service.fetch_by_imdb_id(imdb_id)
    if not details:
        raise HTTPException(status_code=404, detail="Movie not found on OMDb API")
        
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
async def search_movies(query: str):
    """Searches movies securely via consolidated backend OMDb service."""
    results = await movie_metadata_service.search_movies(query)
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
