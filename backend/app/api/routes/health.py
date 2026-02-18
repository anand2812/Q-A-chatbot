"""Health check endpoint."""

from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.services.vector_store import vector_store_service
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        vector_store_ready=vector_store_service.is_ready,
        num_indexed_documents=vector_store_service.num_documents,
        num_total_chunks=vector_store_service.total_chunks,
        embedding_model=settings.EMBEDDING_MODEL,
        llm_model=settings.OPENAI_MODEL,
    )
