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
    GEMINI_API_KEY: str = Field(default="AIzaSyD_dummy_gemini_key", env="GEMINI_API_KEY")
    OMDB_API_KEY: str = Field(default="dummy_omdb_key", env="OMDB_API_KEY")
    
    # CORS Configurations
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
