from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./accounting.db"
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    DEBUG: bool = True

    class Config:
        env_file = ".env"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if v is None or v == "":
            return "sqlite:///./accounting.db"
        return v


settings = Settings()
