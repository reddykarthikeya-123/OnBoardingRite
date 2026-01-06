from typing import List, Optional, Union
from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from uuid import UUID

class TeamMemberBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    dateOfBirth: Optional[date] = None
    
    # Address
    addressLine1: Optional[str] = None
    addressLine2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None
    country: Optional[str] = 'USA'

class TeamMemberCreate(TeamMemberBase):
    employeeId: str
    ssn: Optional[str] = None # Will be encrypted

class TeamMemberUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dateOfBirth: Optional[date] = None
    
    addressLine1: Optional[str] = None
    addressLine2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None
    country: Optional[str] = None
    
    employeeId: Optional[str] = None
    ssn: Optional[str] = None

class TeamMember(BaseModel):
    id: Union[str, UUID]
    employeeId: Optional[str] = Field(None, validation_alias="employee_id")
    firstName: str = Field(..., validation_alias="first_name")
    lastName: str = Field(..., validation_alias="last_name")
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    createdAt: Optional[datetime] = Field(None, validation_alias="created_at")
    updatedAt: Optional[datetime] = Field(None, validation_alias="updated_at")
    
    # Address for full detail
    addressLine1: Optional[str] = Field(None, validation_alias="address_line1")
    addressLine2: Optional[str] = Field(None, validation_alias="address_line2")
    zipCode: Optional[str] = Field(None, validation_alias="zip_code")
    country: Optional[str] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True

class TeamMemberList(BaseModel):
    items: List[TeamMember]
    total: int
    page: int
    size: int

