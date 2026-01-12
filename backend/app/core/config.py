import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Find root .env file (project root, parent of backend/)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ROOT_ENV = ROOT_DIR / ".env"

class Settings(BaseSettings):
    APP_NAME: str = "OnBoarding App"
    DEBUG: bool = True
    
    # PostgreSQL Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    
    # Security
    JWT_SECRET: str = "default-secret-key-change-me"
    
    # CORS
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:9009"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = str(ROOT_ENV) if ROOT_ENV.exists() else ".env"
        extra = "ignore"  # Ignore leftover Oracle env vars

settings = Settings()
