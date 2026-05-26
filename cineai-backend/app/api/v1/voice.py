from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.voice import VoiceSession
from app.services.ai_service import ai_service

router = APIRouter(tags=["AI Voice Assistant"])


class VoiceMessageRequest(BaseModel):
    transcript: str
    duration: float = 0.0


class VoiceMessageResponse(BaseModel):
    id: str
    transcript: str
    response_text: str
    duration: float
    audio_url: str | None
    created_at: object


@router.post("/message", response_model=dict, status_code=status.HTTP_201_CREATED)
async def post_voice_message(
    schema: VoiceMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Processes a voice transcript through the AI service, persists the voice session, and returns the AI response."""
    if not schema.transcript or not schema.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript cannot be empty"
        )

    # Get AI response for the voice transcript
    ai_response = await ai_service.generate_chat_response(schema.transcript, [])

    # Persist the voice session to DB
    session = VoiceSession(
        user_id=current_user.id,
        transcript=schema.transcript,
        response_text=ai_response,
        duration=schema.duration
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return {
        "id": str(session.id),
        "transcript": session.transcript,
        "response_text": session.response_text,
        "duration": session.duration,
        "audio_url": session.audio_url,
        "created_at": session.created_at
    }


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
