from typing import List, Optional, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

class TemplateTaskGroup(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    order: int = Field(0, validation_alias="display_order")
    tasks: List[str] = [] # List of Task IDs
    eligibilityCriteriaId: Optional[str] = Field(None, validation_alias="eligibility_criteria_id")

    @field_validator('tasks', mode='before')
    @classmethod
    def extract_task_ids(cls, v: Any) -> List[str]:
        if not v:
            return []
        return [str(t.id) for t in v if hasattr(t, 'id')]

    class Config:
        from_attributes = True

class ChecklistTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    # clientName: Optional[str] = None # Commented out to avoid attribute error if missing on ORM
    isActive: bool = Field(True, validation_alias="is_active")
    version: int = 1

class ChecklistTemplateCreate(ChecklistTemplateBase):
    clientId: Optional[str] = None

class ChecklistTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    isActive: Optional[bool] = None
    clientId: Optional[str] = None

class ChecklistTemplate(ChecklistTemplateBase):
    id: str
    clientId: Optional[str] = Field(None, validation_alias="client_id")
    # Made optional for debugging
    createdAt: Optional[datetime] = Field(None, validation_alias="created_at")
    updatedAt: Optional[datetime] = Field(None, validation_alias="updated_at")
    createdBy: Optional[str] = Field(None, validation_alias="created_by")
    taskGroups: List[TemplateTaskGroup] = Field([], validation_alias="task_groups")
    eligibilityCriteriaId: Optional[str] = Field(None, validation_alias="eligibility_criteria_id")

    class Config:
        from_attributes = True

class ChecklistTemplateDetail(ChecklistTemplate):
    pass

class CloneTemplateRequest(BaseModel):
    name: str

class ReorderGroupsRequest(BaseModel):
    groupOrder: List[str]

class AddGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    order: int
