"""
Chat API Router
────────────────
POST /api/v1/chat/ask — Ask a question against indexed documents
"""

from fastapi import APIRouter, HTTPException, status

from app.core.logger import logger
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag_pipeline import rag_pipeline
from app.core.config import settings


router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest):
    """
    Ask a question. The RAG pipeline will:
      1. Embed the question
      2. Retrieve top-K similar chunks from FAISS
      3. Feed chunks + history to GPT-4
      4. Return the answer with source citations
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        answer, sources, tokens_used, response_time_ms = rag_pipeline.answer(
            question=request.question,
            conversation_history=request.conversation_history,
            top_k=request.top_k,
        )
        return ChatResponse(
            answer=answer,
            sources=sources,
            model_used=settings.OPENAI_MODEL,
            tokens_used=tokens_used,
            response_time_ms=response_time_ms,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal error during RAG pipeline execution.")
