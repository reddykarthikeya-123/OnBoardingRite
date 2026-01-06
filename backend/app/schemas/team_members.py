from typing import List, Optional, Union
from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from uuid import UUID

class TeamMemberBase(BaseModel):
    firstName: str = Field(..., validation_alias="first_name")
    lastName: str = Field(..., validation_alias="last_name")
    email: EmailStr
    phone: Optional[str] = None
    dateOfBirth: Optional[date] = Field(None, validation_alias="date_of_birth")
    
    # Address
    addressLine1: Optional[str] = Field(None, validation_alias="address_line1")
    addressLine2: Optional[str] = Field(None, validation_alias="address_line2")
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = Field(None, validation_alias="zip_code")
    country: Optional[str] = 'USA'

class TeamMemberCreate(TeamMemberBase):
    employeeId: str = Field(..., validation_alias="employee_id")
    ssn: Optional[str] = None # Will be encrypted

class TeamMemberUpdate(BaseModel):
    firstName: Optional[str] = Field(None, validation_alias="first_name")
    lastName: Optional[str] = Field(None, validation_alias="last_name")
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dateOfBirth: Optional[date] = Field(None, validation_alias="date_of_birth")
    
    addressLine1: Optional[str] = Field(None, validation_alias="address_line1")
    addressLine2: Optional[str] = Field(None, validation_alias="address_line2")
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = Field(None, validation_alias="zip_code")
    country: Optional[str] = None
    
    employeeId: Optional[str] = Field(None, validation_alias="employee_id")
    ssn: Optional[str] = None

class TeamMember(TeamMemberBase):
    id: Union[str, UUID]
    employeeId: str = Field(..., validation_alias="employee_id")
    createdAt: Optional[datetime] = Field(None, validation_alias="created_at")
    updatedAt: Optional[datetime] = Field(None, validation_alias="updated_at")
    
    # Exclude SSN from response
    
    class Config:
        from_attributes = True
        populate_by_name = True

class TeamMemberList(BaseModel):
    items: List[TeamMember]
    total: int
    page: int
    size: int
