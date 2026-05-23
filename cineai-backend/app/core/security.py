from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from typing import Optional, Dict
from app.core.config import settings

# Initialize password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies that a plain text password matches its Bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generates a secure Bcrypt hash from plain text."""
    return pwd_context.hash(password)

def create_token(data: dict, expires_delta: timedelta, is_refresh: bool = False) -> str:
    """Generates an encrypted JWT access or refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": int(expire.timestamp())})
    secret = settings.JWT_REFRESH_SECRET if is_refresh else settings.JWT_SECRET
    return jwt.encode(to_encode, secret, algorithm=settings.ALGORITHM)

def decode_token(token: str, is_refresh: bool = False) -> Dict:
    """Decrypts and verifies a JWT token. Returns empty dict if invalid/expired."""
    secret = settings.JWT_REFRESH_SECRET if is_refresh else settings.JWT_SECRET
    try:
        payload = jwt.decode(token, secret, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return {}
