from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ChatMessageCreate(BaseModel):
    session_token: str = Field(..., min_length=5, max_length=100)
    prompt: str = Field(..., min_length=1, max_length=2000)

class ChatMessageResponse(BaseModel):
    id: str
    session_token: str
    message_role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionHistoryResponse(BaseModel):
    session_token: str
    messages: List[ChatMessageResponse]
