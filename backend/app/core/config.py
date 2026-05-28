from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Общая информация
    PROJECT_NAME: str = "ФинТранс CRM"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # ======================
    # PostgreSQL настройки
    # ======================
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    # Автоматически собираем строку подключения для Docker
    SQLALCHEMY_ASYNC_DATABASE_URI: Optional[str] = None

    @property
    def async_database_uri(self) -> str:
        if self.SQLALCHEMY_ASYNC_DATABASE_URI:
            return self.SQLALCHEMY_ASYNC_DATABASE_URI
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
        )

    # ======================
    # JWT
    # ======================
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 дней

    # ======================
    # Pydantic настройки
    # ======================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Создаём экземпляр настроек
settings = Settings()