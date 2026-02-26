from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "production"
    LOG_LEVEL: str = "info"
    WORKERS: int = 2
    CORS_ORIGINS: str = "*"
    MAX_UPLOAD_SIZE_MB: int = 100

    # JWT Auth
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # PostgreSQL
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "taxonline_dashboard"
    POSTGRES_USER: str = "taxonline"
    POSTGRES_PASSWORD: str

    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_GRPC_PORT: int = 6334
    QDRANT_COLLECTION: str = "taxonline_chunks"

    # OpenSearch
    OPENSEARCH_HOST: str = "localhost"
    OPENSEARCH_PORT: int = 9200
    OPENSEARCH_INDEX: str = "taxonline_docs"

    # Ollama
    OLLAMA_HOST: str = "localhost"
    OLLAMA_PORT: int = 11434
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"

    # S3 / MinIO
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_BUCKET: str = "taxonline-documents"
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = False
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
