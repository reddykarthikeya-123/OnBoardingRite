from typing import List, Optional, Any, Union
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID
from .tasks import TaskLibraryItem

class TemplateTaskGroup(BaseModel):
    id: Union[str, UUID]
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    order: int = Field(0, validation_alias="display_order")
    tasks: List[TaskLibraryItem] = [] # List of full Task objects
    eligibilityCriteriaId: Optional[Union[str, UUID]] = Field(None, validation_alias="eligibility_criteria_id")

    class Config:
        from_attributes = True

class ChecklistTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    # clientName: Optional[str] = None # Commented out to avoid attribute error if missing on ORM
    isActive: bool = Field(True, validation_alias="is_active")
    version: int = 1

class ChecklistTemplateCreate(ChecklistTemplateBase):
    clientId: Optional[Union[str, UUID]] = None

class ChecklistTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    isActive: Optional[bool] = None
    clientId: Optional[Union[str, UUID]] = None

class ChecklistTemplate(ChecklistTemplateBase):
    id: Union[str, UUID]
    clientId: Optional[Union[str, UUID]] = Field(None, validation_alias="client_id")
    # Made optional for debugging
    createdAt: Optional[datetime] = Field(None, validation_alias="created_at")
    updatedAt: Optional[datetime] = Field(None, validation_alias="updated_at")
    createdBy: Optional[Union[str, UUID]] = Field(None, validation_alias="created_by")
    taskGroups: List[TemplateTaskGroup] = Field([], validation_alias="task_groups")
    eligibilityCriteriaId: Optional[Union[str, UUID]] = Field(None, validation_alias="eligibility_criteria_id")

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

class AddTaskToGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    category: Optional[str] = "FORMS"
    isRequired: bool = True
    configuration: Optional[dict] = None

class ReorderTasksRequest(BaseModel):
    taskOrder: List[str]
