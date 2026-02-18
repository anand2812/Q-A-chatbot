"""
Documents API Router
────────────────────
POST   /api/v1/documents/upload   — Upload & index a document
GET    /api/v1/documents          — List all indexed documents
DELETE /api/v1/documents/{doc_id} — Remove a document from the index
"""

import os
import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, status

from app.core.config import settings
from app.core.logger import logger
from app.models.schemas import DocumentListResponse, DocumentMetadata, DeleteDocumentResponse
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import vector_store_service


router = APIRouter()
processor = DocumentProcessor()
UPLOAD_DIR = Path("./data/uploads")


@router.post("/upload", response_model=DocumentMetadata, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document (PDF/TXT/MD/DOCX), chunk it, embed it, and add to FAISS index.
    """
    ext = Path(file.filename).suffix.lstrip(".").lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )

    # Save to disk
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filepath = UPLOAD_DIR / file.filename

    try:
        with open(filepath, "wb") as f:
            shutil.copyfileobj(file.file, f)
        logger.info(f"Saved upload: {filepath}")

        # Process → chunk → embed → index
        chunks, metadata = processor.process_file(str(filepath))
        await vector_store_service.add_documents(chunks, metadata)

        return DocumentMetadata(**metadata)

    except Exception as e:
        # Cleanup on failure
        if filepath.exists():
            os.remove(filepath)
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=DocumentListResponse)
async def list_documents():
    """Return list of all indexed documents with their metadata."""
    docs = vector_store_service.get_all_metadata()
    return DocumentListResponse(
        documents=[DocumentMetadata(**d) for d in docs],
        total=len(docs),
    )


@router.delete("/{doc_id}", response_model=DeleteDocumentResponse)
async def delete_document(doc_id: str):
    """Remove a document and all its chunks from the vector index."""
    deleted = await vector_store_service.delete_document(doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")

    # Optionally remove the upload file
    for f in UPLOAD_DIR.glob("*"):
        pass  # We can't map doc_id → filename here without extra state

    return DeleteDocumentResponse(message="Document deleted successfully.", doc_id=doc_id)
