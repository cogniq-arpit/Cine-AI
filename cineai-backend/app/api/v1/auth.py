from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta

from app.db.session import get_db
from app.models.user import User, UserPreference
from app.schemas.auth import SignUpRequest, LoginRequest, TokenResponse, RefreshRequest
from app.core.security import get_password_hash, verify_password, create_token, decode_token
from app.core.config import settings

router = APIRouter(tags=["Authentication"])

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(schema: SignUpRequest, db: AsyncSession = Depends(get_db)):
    """Registers a new User, validates duplicate credentials, maps an empty preference graph, and issues JWT tokens."""
    # Check duplicate email/username
    query = select(User).where((User.email == schema.email) | (User.username == schema.username))
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or Email already registered"
        )
        
    new_user = User(
        name=schema.name,
        username=schema.username,
        email=schema.email,
        password_hash=get_password_hash(schema.password)
    )
    db.add(new_user)
    await db.flush() # Populate user ID onto instance
    
    # Initialize basic preferences one-to-one
    prefs = UserPreference(user_id=new_user.id)
    db.add(prefs)
    
    # Issue Tokens
    access_token = create_token(
        {"sub": str(new_user.id), "username": new_user.username},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_token(
        {"sub": str(new_user.id)},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_refresh=True
    )
    
    new_user.refresh_token = refresh_token
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {"id": str(new_user.id), "name": new_user.name, "username": new_user.username}
    }

@router.post("/login", response_model=TokenResponse)
async def login(schema: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticates the credentials against email OR username, and generates updated JWT access/refresh token pairs."""
    # Authenticate by Email OR Username
    query = select(User).where((User.email == schema.identifier) | (User.username == schema.identifier))
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user or not verify_password(schema.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
        
    access_token = create_token(
        {"sub": str(user.id), "username": user.username},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_token(
        {"sub": str(user.id)},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_refresh=True
    )
    
    user.refresh_token = refresh_token
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "name": user.name, "username": user.username}
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(schema: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Decrypted and rotates standard tokens. Ensures single token concurrency in database context."""
    payload = decode_token(schema.refresh_token, is_refresh=True)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user or user.refresh_token != schema.refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked or mismatch")
        
    access_token = create_token(
        {"sub": str(user.id), "username": user.username},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    new_refresh = create_token(
        {"sub": str(user.id)},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_refresh=True
    )
    
    user.refresh_token = new_refresh
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "user": {"id": str(user.id), "name": user.name, "username": user.username}
    }
