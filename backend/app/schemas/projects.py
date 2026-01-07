from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import date
from app.schemas.dashboard import ProjectFlags, ProjectSummary

# Reuse ProjectSummary for list items? 
# The UI shows slightly different info (StartDate, EndDate) in the list card vs dashboard card.
# Let's define a specific ProjectListItem to be safe/explicit.

class ProjectStats(BaseModel):
    totalMembers: int = 0
    completed: int = 0
    inProgress: int = 0
    pending: int = 0

class ContactInfo(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None # e.g. "Project Manager"

class ProjectListItem(BaseModel):
    id: str
    name: str
    clientName: Optional[str] = None
    location: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    status: str
    flags: ProjectFlags
    stats: ProjectStats
    projectManager: Optional[ContactInfo] = None

class ProjectListResponse(BaseModel):
    items: List[ProjectListItem]
    total: int
    page: int
    limit: int

class CreateProjectRequest(BaseModel):
    name: str
    clientName: str
    description: Optional[str] = None
    location: str
    startDate: date
    endDate: Optional[date] = None
    status: str = "DRAFT"
    isDOD: bool = False
    isODRISA: bool = False
    templateId: Optional[str] = None
    ppmProjectId: Optional[str] = None

class ProjectTimeline(BaseModel):
    daysRemaining: int
    targetEndDate: Optional[date] = None

class KeyMembers(BaseModel):
    projectManager: Optional[ContactInfo] = None
    siteLead: Optional[ContactInfo] = None
    safetyLead: Optional[ContactInfo] = None

# Task group schemas for ProjectDetail
class ProjectTask(BaseModel):
    id: str
    name: str
    isRequired: bool = False

class ProjectTaskGroup(BaseModel):
    id: str
    name: str
    tasks: List[ProjectTask] = []

class ProjectDetail(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    clientName: Optional[str] = None
    location: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    status: str
    flags: ProjectFlags
    templateName: Optional[str] = None
    templateId: Optional[str] = None
    timeline: ProjectTimeline
    keyMembers: KeyMembers
    stats: ProjectStats
    taskGroups: List[ProjectTaskGroup] = []
