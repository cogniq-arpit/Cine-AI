from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class ChatMessageCreate(BaseModel):
    session_token: str = Field(..., min_length=5, max_length=100)
    prompt: str = Field(..., min_length=1, max_length=2000)

class ChatMessageResponse(BaseModel):
    id: UUID
    session_token: str
    message_role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionHistoryResponse(BaseModel):
    session_token: str
    messages: List[ChatMessageResponse]

class GuestChatMessageCreate(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    context: List[dict] = []

class GuestChatMessageResponse(BaseModel):
    content: str

