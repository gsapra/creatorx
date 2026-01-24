from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "CreatorX"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str
    CLICKHOUSE_URL: str
    CLICKHOUSE_USER: str = "creatorx"
    CLICKHOUSE_PASSWORD: str = "creatorx_password"
    CLICKHOUSE_DATABASE: str = "creatorx"
    REDIS_URL: str
    
    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AI API Keys
    OPENAI_API_KEY: str
    GOOGLE_VERTEX_PROJECT_ID: str = ""
    GOOGLE_VERTEX_LOCATION: str = "us-central1"
    GROQ_API_KEY: str = ""
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://44.215.164.169",
        "http://44.215.164.169:8000",
        "https://minimalthreads.in",
        "https://www.minimalthreads.in",
        "http://minimalthreads.in",
        "http://www.minimalthreads.in"
    ]
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "./uploads"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file


settings = Settings()
