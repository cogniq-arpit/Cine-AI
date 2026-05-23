from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.voice import router as voice_router
from app.api.v1.movies import router as movies_router
from app.api.v1.recommendations import router as rec_router

api_router = APIRouter()

# Register sub-routes
api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(chat_router, prefix="/chat")
api_router.include_router(voice_router, prefix="/voice")
api_router.include_router(movies_router, prefix="/movies")
api_router.include_router(rec_router, prefix="/recommendations")
