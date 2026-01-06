from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import date

class GlobalStatsResponse(BaseModel):
    activeProjects: int
    totalTeamMembers: int
    completedOnboarding: int
    inProgress: int
    blockedMembers: int
    memberGrowthThisWeek: int

class ProjectFlags(BaseModel):
    isODRISA: bool
    isDOD: bool

class ProjectSummary(BaseModel):
    id: str
    name: str
    clientName: Optional[str] = None
    location: Optional[str] = None
    flags: ProjectFlags
    totalMembers: int
    completedMembers: int
    completionPercentage: int

class TaskStats(BaseModel):
    completed: int
    total: int

class TaskCategoryStats(BaseModel):
    forms: TaskStats
    docs: TaskStats
    compliance: TaskStats
    training: TaskStats

class LastActivity(BaseModel):
    description: str
    timeAgo: str # e.g. "2h ago" (computed field)

class TeamMemberDetail(BaseModel):
    id: str
    firstName: str
    lastName: str
    ssn: Optional[str] = None
    trade: Optional[str] = None
    category: Optional[str] = None
    status: str
    progressPercentage: int
    assignedProcessorName: Optional[str] = None
    lastActivity: Optional[LastActivity] = None
    taskStats: TaskCategoryStats
