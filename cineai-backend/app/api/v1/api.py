from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.voice import router as voice_router
from app.api.v1.movies import router as movies_router
from app.api.v1.recommendations import router as rec_router
from app.db.session import async_engine
from sqlalchemy import text

api_router = APIRouter()

@api_router.get("/health/db")
async def db_health():
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        import traceback
        return {
            "status": "unhealthy",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# Register sub-routes
api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(chat_router, prefix="/chat")
api_router.include_router(voice_router, prefix="/voice")
api_router.include_router(movies_router, prefix="/movies")
api_router.include_router(rec_router, prefix="/recommendations")

