import os
from pydantic_settings import BaseSettings

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
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore leftover Oracle env vars

settings = Settings()
