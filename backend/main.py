"""
GenAI-Powered RAG Document Q&A Chatbot
FastAPI Backend Entry Point
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import documents, chat, health
from app.core.config import settings
from app.core.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("🚀 Starting RAG Chatbot API...")
    logger.info(f"   Model:       {settings.OPENAI_MODEL}")
    logger.info(f"   Embeddings:  {settings.EMBEDDING_MODEL}")
    logger.info(f"   Chunk Size:  {settings.CHUNK_SIZE}")
    logger.info(f"   Top K:       {settings.TOP_K}")
    yield
    logger.info("🛑 Shutting down RAG Chatbot API...")


app = FastAPI(
    title="RAG Document Q&A Chatbot",
    description="An end-to-end Retrieval-Augmented Generation chatbot powered by LangChain, OpenAI GPT-4, HuggingFace Sentence Transformers, and FAISS.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
