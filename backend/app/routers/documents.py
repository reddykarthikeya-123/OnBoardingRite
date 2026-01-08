from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
import uuid as uuid_lib
import base64

from app.core.database import get_db
from app.models.models import Document, TaskInstance, TeamMember

router = APIRouter()


# Pydantic schemas
class DocumentResponse(BaseModel):
    id: str
    taskInstanceId: Optional[str]
    filename: str
    originalFilename: str
    mimeType: str
    fileSize: int
    documentSide: Optional[str]
    documentNumber: Optional[str]
    expiryDate: Optional[str]
    uploadedBy: Optional[str]
    uploadedAt: Optional[datetime]
    createdAt: Optional[datetime]
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


class UploadResponse(BaseModel):
    success: bool
    document: DocumentResponse
    message: str


# Maximum file size: 5MB
MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    task_instance_id: Optional[str] = Form(None),
    document_side: Optional[str] = Form(None),
    document_number: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    uploaded_by: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload a document file (max 5MB)"""
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    # Validate task instance if provided
    if task_instance_id:
        task_instance = db.query(TaskInstance).filter(
            TaskInstance.id == task_instance_id
        ).first()
        if not task_instance:
            raise HTTPException(status_code=404, detail="Task instance not found")
    
    # Generate unique filename
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_filename = f"{uuid_lib.uuid4()}.{file_ext}" if file_ext else str(uuid_lib.uuid4())
    
    # Parse expiry date if provided
    parsed_expiry = None
    if expiry_date:
        try:
            parsed_expiry = datetime.strptime(expiry_date, "%Y-%m-%d").date()
        except ValueError:
            pass
    
    # Store file as base64 encoded string (for BYTEA compatibility)
    encoded_content = base64.b64encode(content).decode('utf-8')
    
    # Create document record
    new_doc = Document(
        id=uuid_lib.uuid4(),
        task_instance_id=uuid_lib.UUID(task_instance_id) if task_instance_id else None,
        filename=unique_filename,
        original_filename=file.filename,
        mime_type=file.content_type or 'application/octet-stream',
        file_size=file_size,
        file_data=encoded_content,
        document_side=document_side,
        document_number=document_number,
        expiry_date=parsed_expiry,
        uploaded_by=uuid_lib.UUID(uploaded_by) if uploaded_by else None,
        uploaded_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return UploadResponse(
        success=True,
        document=DocumentResponse(
            id=str(new_doc.id),
            taskInstanceId=str(new_doc.task_instance_id) if new_doc.task_instance_id else None,
            filename=new_doc.filename,
            originalFilename=new_doc.original_filename,
            mimeType=new_doc.mime_type,
            fileSize=new_doc.file_size,
            documentSide=new_doc.document_side,
            documentNumber=new_doc.document_number,
            expiryDate=str(new_doc.expiry_date) if new_doc.expiry_date else None,
            uploadedBy=str(new_doc.uploaded_by) if new_doc.uploaded_by else None,
            uploadedAt=new_doc.uploaded_at,
            createdAt=new_doc.created_at
        ),
        message="Document uploaded successfully"
    )


@router.get("/{document_id}")
def get_document(document_id: str, db: Session = Depends(get_db)):
    """Download/view a document by ID"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Decode base64 content back to binary
    content = base64.b64decode(doc.file_data)
    
    return Response(
        content=content,
        media_type=doc.mime_type,
        headers={
            "Content-Disposition": f'inline; filename="{doc.original_filename}"'
        }
    )


@router.get("/{document_id}/download")
def download_document(document_id: str, db: Session = Depends(get_db)):
    """Force download a document by ID"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Decode base64 content back to binary
    content = base64.b64decode(doc.file_data)
    
    return Response(
        content=content,
        media_type=doc.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{doc.original_filename}"'
        }
    )


@router.get("/{document_id}/info", response_model=DocumentResponse)
def get_document_info(document_id: str, db: Session = Depends(get_db)):
    """Get document metadata without the file content"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return DocumentResponse(
        id=str(doc.id),
        taskInstanceId=str(doc.task_instance_id) if doc.task_instance_id else None,
        filename=doc.filename,
        originalFilename=doc.original_filename,
        mimeType=doc.mime_type,
        fileSize=doc.file_size,
        documentSide=doc.document_side,
        documentNumber=doc.document_number,
        expiryDate=str(doc.expiry_date) if doc.expiry_date else None,
        uploadedBy=str(doc.uploaded_by) if doc.uploaded_by else None,
        uploadedAt=doc.uploaded_at,
        createdAt=doc.created_at
    )


@router.get("/task-instance/{task_instance_id}", response_model=DocumentListResponse)
def list_documents_by_task_instance(
    task_instance_id: str, 
    db: Session = Depends(get_db)
):
    """List all documents for a specific task instance"""
    docs = db.query(Document).filter(
        Document.task_instance_id == task_instance_id
    ).order_by(Document.uploaded_at.desc()).all()
    
    return DocumentListResponse(
        documents=[
            DocumentResponse(
                id=str(doc.id),
                taskInstanceId=str(doc.task_instance_id) if doc.task_instance_id else None,
                filename=doc.filename,
                originalFilename=doc.original_filename,
                mimeType=doc.mime_type,
                fileSize=doc.file_size,
                documentSide=doc.document_side,
                documentNumber=doc.document_number,
                expiryDate=str(doc.expiry_date) if doc.expiry_date else None,
                uploadedBy=str(doc.uploaded_by) if doc.uploaded_by else None,
                uploadedAt=doc.uploaded_at,
                createdAt=doc.created_at
            )
            for doc in docs
        ],
        total=len(docs)
    )


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document by ID"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(doc)
    db.commit()
    
    return {"success": True, "message": "Document deleted successfully"}
