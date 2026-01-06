from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class TaskConfig(BaseModel):
    formId: Optional[str] = None
    documentType: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    type: str = Field(alias="taskType") # API uses 'type', DB has 'TASK_TYPE'
    category: Optional[str] = None
    isRequired: bool
    eligibility: str = "ALL" # Mock for now
    configuration: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True

class TaskGroupItemResponse(BaseModel):
    taskId: str
    sortOrder: int
    task: TaskResponse

class TaskGroupResponse(BaseModel):
    id: str
    name: str
    category: str
    taskCount: int
    tasks: List[TaskResponse]

class CreateTaskGroupRequest(BaseModel):
    name: str
    category: str = "FORMS"
    templateId: Optional[str] = None

class CreateTaskRequest(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    isRequired: bool = True
    category: str = "FORMS"
    configuration: Optional[Dict[str, Any]] = None
