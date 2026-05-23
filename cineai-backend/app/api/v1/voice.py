from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.voice import VoiceSession

router = APIRouter(tags=["AI Voice Assistant"])

@router.get("/sessions", response_model=List[dict])
async def get_voice_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all voice assistant history records and metrics for the current authenticated user."""
    query = select(VoiceSession).where(VoiceSession.user_id == current_user.id).order_by(VoiceSession.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    return [
        {
            "id": str(s.id),
            "transcript": s.transcript,
            "response_text": s.response_text,
            "duration": s.duration,
            "audio_url": s.audio_url,
            "created_at": s.created_at
        } for s in sessions
    ]
