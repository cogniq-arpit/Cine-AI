from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatHistory
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse, ChatSessionHistoryResponse
from app.services.ai_service import ai_service

router = APIRouter(tags=["AI Chatbot"])

@router.post("/message", response_model=ChatMessageResponse)
async def post_chat_message(
    schema: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Saves user message, requests the assistant response from Gemini, saves assistant message, and returns the response."""
    # 1. Save User prompt
    user_msg = ChatHistory(
        user_id=current_user.id,
        session_token=schema.session_token,
        message_role="user",
        content=schema.prompt
    )
    db.add(user_msg)
    await db.flush()
    
    # 2. Extract recent session history for context
    query = select(ChatHistory).where(
        (ChatHistory.user_id == current_user.id) & 
        (ChatHistory.session_token == schema.session_token)
    ).order_by(ChatHistory.created_at.asc())
    
    history_result = await db.execute(query)
    messages = history_result.scalars().all()
    
    context = [{"role": msg.message_role, "content": msg.content} for msg in messages]
    
    # 3. Call Gemini
    ai_response = await ai_service.generate_chat_response(schema.prompt, context[:-1])
    
    # 4. Save Assistant Response
    assistant_msg = ChatHistory(
        user_id=current_user.id,
        session_token=schema.session_token,
        message_role="assistant",
        content=ai_response
    )
    db.add(assistant_msg)
    await db.commit()
    
    return assistant_msg

@router.get("/history/{session_token}", response_model=List[ChatMessageResponse])
async def get_session_history(
    session_token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves standard conversational history lists for a specific persistent session token."""
    query = select(ChatHistory).where(
        (ChatHistory.user_id == current_user.id) & 
        (ChatHistory.session_token == session_token)
    ).order_by(ChatHistory.created_at.asc())
    
    result = await db.execute(query)
    messages = result.scalars().all()
    return messages
