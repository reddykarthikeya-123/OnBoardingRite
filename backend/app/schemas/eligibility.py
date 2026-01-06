from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# API response models
class EligibilityCriteriaListItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    isActive: bool
    ruleCount: int
    createdAt: datetime
    updatedAt: datetime

class EligibilityCriteriaDetail(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    isActive: bool
    rootGroup: dict  # Simplified: accept any dict structure
    createdAt: datetime
    updatedAt: datetime

# Request models
class CreateEligibilityCriteriaRequest(BaseModel):
    name: str
    description: Optional[str] = None
    rootGroup: dict  # Simplified: accept any dict structure

class UpdateEligibilityCriteriaRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    isActive: Optional[bool] = None
    rootGroup: Optional[dict] = None  # Simplified: accept any dict structure

