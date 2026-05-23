from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict

from app.db.session import get_db
from app.api.deps import get_optional_user
from app.models.user import User
from app.models.recommendation import Recommendation
from app.schemas.movie import RecommendationRequest
from app.services.ai_service import ai_service

router = APIRouter(tags=["AI Recommendations"])

@router.post("", response_model=List[dict])
async def get_mood_recommendations(
    schema: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user) # Optional for Guests
):
    """Processes mood-based request queries, retrieves matching JSON lists from Gemini, and logs recommendations."""
    # Call Gemini list generation service
    movies = await ai_service.generate_recommendations_list(schema.mood_prompt)
    if not movies:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed generating movie recommendations. Rephrase your query."
        )
        
    # Log recommendation event if user is authenticated
    if current_user:
        log_entry = Recommendation(
            user_id=current_user.id,
            mood_prompt=schema.mood_prompt,
            movies_metadata=movies
        )
        db.add(log_entry)
        await db.commit()
        
    return movies
