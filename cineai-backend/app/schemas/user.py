from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PreferenceUpdate(BaseModel):
    favorite_genres: Optional[List[str]] = None
    favorite_actors: Optional[List[str]] = None
    preferred_language: Optional[str] = "en"

class PreferenceResponse(BaseModel):
    favorite_genres: List[str]
    favorite_actors: List[str]
    preferred_language: str
    updated_at: datetime

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    id: str
    name: str
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True
