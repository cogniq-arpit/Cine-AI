from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatHistory
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionHistoryResponse,
    GuestChatMessageCreate,
    GuestChatMessageResponse,
)
from app.services.ai_service import AIConfigurationError, AIProviderError, ai_service

router = APIRouter(tags=["AI Chatbot"])


def raise_ai_http_error(error: AIProviderError) -> None:
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    if isinstance(error, AIConfigurationError):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    elif error.status_code in {400, 401, 403, 404, 429}:
        status_code = status.HTTP_502_BAD_GATEWAY

    raise HTTPException(
        status_code=status_code,
        detail={
            "error": error.__class__.__name__,
            "message": str(error),
            "provider_status": error.status_code,
            "provider_detail": error.provider_detail,
        },
    )


@router.get("/diagnostics")
async def get_chat_diagnostics():
    """Returns non-secret AI provider diagnostics for deployment validation."""
    return ai_service.diagnostics()


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
    
    # 3. Call Gemini. Do not mask provider failure as static AI content.
    try:
        ai_response = await ai_service.generate_chat_response(schema.prompt, context[:-1])
    except AIProviderError as error:
        await db.rollback()
        raise_ai_http_error(error)
    
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

@router.post("/guest/message", response_model=GuestChatMessageResponse)
async def post_guest_chat_message(
    schema: GuestChatMessageCreate,
):
    """Handles guest chat requests by securely forwarding prompts and context to Gemini on the server side."""
    # Context format expected: [{"role": "user"|"model", "parts": [{"text": "..."}]}]
    # Map 'assistant' role to 'model' for compatibility
    mapped_context = []
    for msg in schema.context:
        mapped_context.append({
            "role": "model" if msg.get("role") == "assistant" else "user",
            "content": msg.get("content", "")
        })
    
    try:
        ai_response = await ai_service.generate_chat_response(schema.prompt, mapped_context)
    except AIProviderError as error:
        raise_ai_http_error(error)
    return GuestChatMessageResponse(content=ai_response)
