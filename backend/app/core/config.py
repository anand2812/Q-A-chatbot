"""
Application Configuration Settings
Loads from environment variables / .env file
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # ── OpenAI ──────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 1024
    OPENAI_TEMPERATURE: float = 0.2

    # ── Embeddings ───────────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"   # HuggingFace Sentence Transformer

    # ── FAISS / Vector Store ─────────────────────────────────────────────────
    FAISS_INDEX_PATH: str = "./data/faiss_index"
    TOP_K: int = 5                                # Number of similar chunks to retrieve

    # ── Document Processing ──────────────────────────────────────────────────
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "txt", "md", "docx"]

    # ── Pinecone (Optional — for cloud-scale deployments) ───────────────────
    USE_PINECONE: bool = False
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    PINECONE_INDEX_NAME: str = "rag-chatbot"

    # ── Server ───────────────────────────────────────────────────────────────
    # ── Server ───────────────────────────────────────────────────────────────
    # Support both list (JSON) and comma-separated string
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    @property
    def cors_origins_list(self) -> List[str]:
        """Helper to ensure we always have a list, even if env var is a string."""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure data directory exists
os.makedirs(settings.FAISS_INDEX_PATH, exist_ok=True)
os.makedirs("./data/uploads", exist_ok=True)
