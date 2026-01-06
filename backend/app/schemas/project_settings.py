from pydantic import BaseModel
from typing import Optional, Dict, Any

class ProjectSettingsDTO(BaseModel):
    isDOD: bool = False
    isODRISA: bool = False
    disaOwnerId: Optional[str] = None
    perDiemRules: Optional[Dict[str, Any]] = None
    mileageRules: Optional[Dict[str, Any]] = None
    dispatchSheet: Optional[Dict[str, Any]] = None

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    clientName: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    startDate: Optional[str] = None # Expecting ISO date string
    endDate: Optional[str] = None
