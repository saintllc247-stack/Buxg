import os
import uuid
import mimetypes
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Document
from app.schemas import DocumentOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 50 * 1024 * 1024


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Document).filter(Document.user_id == user.id).order_by(Document.created_at.desc()).all()


@router.post("/upload", response_model=DocumentOut)
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(400, "File name is required")
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 50MB)")
    ext = Path(file.filename).suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / stored_name
    file_path.write_bytes(content)
    mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    doc = Document(
        user_id=user.id,
        original_name=file.filename,
        stored_name=stored_name,
        file_size=len(content),
        mime_type=mime_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{doc_id}")
def download_document(doc_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user.id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    file_path = UPLOAD_DIR / doc.stored_name
    if not file_path.exists():
        raise HTTPException(404, "File not found on disk")
    from fastapi.responses import FileResponse
    return FileResponse(str(file_path), filename=doc.original_name, media_type=doc.mime_type)


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user.id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    file_path = UPLOAD_DIR / doc.stored_name
    if file_path.exists():
        file_path.unlink()
    db.delete(doc)
    db.commit()
    return {"ok": True}


class BulkDeleteIds(BaseModel):
    ids: list[int]


@router.post("/bulk-delete")
def bulk_delete_documents(data: BulkDeleteIds, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    docs = db.query(Document).filter(Document.id.in_(data.ids), Document.user_id == user.id).all()
    for doc in docs:
        file_path = UPLOAD_DIR / doc.stored_name
        if file_path.exists():
            file_path.unlink()
        db.delete(doc)
    db.commit()
    return {"deleted": len(docs)}
