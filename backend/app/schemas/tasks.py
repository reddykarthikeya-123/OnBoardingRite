from pydantic import BaseModel, Field
from typing import List, Optional, Any, Union
from datetime import datetime
from uuid import UUID

# Task in library (standalone, not part of template)
class TaskLibraryItem(BaseModel):
    id: Union[str, UUID]
    name: str
    description: Optional[str] = None
    type: str  # CUSTOM_FORM, DOCUMENT_UPLOAD, REST_API, REDIRECT
    category: Optional[str] = None  # FORMS, DOCUMENTS, CERTIFICATIONS, etc.
    isRequired: bool = Field(default=True, validation_alias="is_required")
    configuration: Optional[dict] = None
    createdAt: Optional[datetime] = Field(default=None, validation_alias="created_at")
    updatedAt: Optional[datetime] = Field(default=None, validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True

# Create/Update task request
class CreateTaskRequest(BaseModel):
    name: str
    description: Optional[str] = None
    type: str  # CUSTOM_FORM, DOCUMENT_UPLOAD, REST_API, REDIRECT
    category: Optional[str] = "FORMS"
    isRequired: bool = True
    configuration: Optional[dict] = None

class UpdateTaskRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    isRequired: Optional[bool] = None
    configuration: Optional[dict] = None
