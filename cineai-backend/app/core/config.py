from pydantic_settings import BaseSettings
from pydantic import Field, EmailStr
from typing import List, Union
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cine AI Backend"
    API_V1_STR: str = "/api/v1"
    
    # Security Configuration
    JWT_SECRET: str = Field(default="super_secure_sha256_access_token_signing_key_production_cineai", env="JWT_SECRET")
    JWT_REFRESH_SECRET: str = Field(default="super_secure_sha256_refresh_token_signing_key_production_cineai", env="JWT_REFRESH_SECRET")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"
    
    # Database Configuration
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/postgres", env="DATABASE_URL")
    
    # Third-Party Credentials
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    GEMINI_MODEL: str = Field(default="gemini-3.5-flash", env="GEMINI_MODEL")
    GEMINI_API_BASE_URL: str = Field(default="https://generativelanguage.googleapis.com/v1beta", env="GEMINI_API_BASE_URL")
    GEMINI_TIMEOUT_SECONDS: float = Field(default=30.0, env="GEMINI_TIMEOUT_SECONDS")
    TMDB_API_KEY: str = Field(default="dummy_tmdb_key", env="TMDB_API_KEY")
    TMDB_ACCESS_TOKEN: str = Field(default="dummy_tmdb_token", env="TMDB_ACCESS_TOKEN")
    
    # CORS Configurations
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
