from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
import logging

from app.core.config import settings
from app.api.v1.api import api_router

# Setup unified logging structure
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cineai-app")

# Rate limiter setup (enforce 50 requests per minute by default for key endpoints)
from app.db.session import async_engine
from app.db.base import Base

# Rate limiter setup (enforce 50 requests per minute by default for key endpoints)
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title=settings.PROJECT_NAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database schemas automatically...")
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schemas initialized successfully!")
    except Exception as e:
        logger.error(f"Database schemas initialization failed: {str(e)}")

# CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Latency benchmark and request auditing middleware
@app.middleware("http")
async def audit_logger(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(
        f"Client: {request.client.host} | Path: {request.url.path} | "
        f"Method: {request.method} | Code: {response.status_code} | "
        f"Latency: {duration:.4f}s"
    )
    return response

# Standardized error response layout for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "RequestValidationFailed",
            "details": [{"field": e["loc"][-1], "message": e["msg"]} for e in exc.errors()]
        }
    )

# Standard index greeting
@app.get("/", tags=["Root"])
async def root_index():
    return {
        "status": "active",
        "service": "Cine AI Backend",
        "version": "1.0.0",
        "documentation": "/docs"
    }

# Mount centralized router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Trigger clean environment reload
# DB and API keys sync complete.
