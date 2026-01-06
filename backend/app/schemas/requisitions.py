from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from uuid import UUID

class RequisitionLineItemResponse(BaseModel):
    id: str
    trade: Optional[str] = None
    quantity: int = 0
    filledQuantity: int = 0

class RequisitionResponse(BaseModel):
    id: str
    externalId: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str
    candidatesCount: int = 0
    lineItems: List[RequisitionLineItemResponse] = []

class CreateRequisitionRequest(BaseModel):
    title: str
    description: Optional[str] = None
    trade: str
    quantity: int = 1

class AssignMemberRequest(BaseModel):
    teamMemberId: str
    trade: Optional[str] = None
    category: str = "NEW_HIRE"  # NEW_HIRE, REHIRE, ACTIVE_TRANSFER

class CommunicationRequest(BaseModel):
    type: str  # EMAIL, SMS
    subject: Optional[str] = None
    message: str
    memberIds: List[str] = []  # Empty = send to all

class CommunicationResponse(BaseModel):
    id: str
    type: str
    status: str
    sentCount: int
