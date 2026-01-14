from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import uuid as uuid_lib

from app.core.database import get_db
from app.models.models import TeamMember
from app.schemas.team_members import (
    TeamMemberCreate, TeamMemberUpdate, TeamMember as TeamMemberSchema, TeamMemberList
)

router = APIRouter()

@router.get("/", response_model=List[TeamMemberSchema])
def list_team_members(
    search: Optional[str] = None,
    status: Optional[str] = Query(None, description="Filter by status: active, inactive, or all"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(TeamMember)
    
    # Filter by active status
    if status == "active":
        query = query.filter(TeamMember.is_active == True)
    elif status == "inactive":
        query = query.filter(TeamMember.is_active == False)
    # "all" or None returns all members
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                TeamMember.first_name.ilike(search_term),
                TeamMember.last_name.ilike(search_term),
                TeamMember.email.ilike(search_term),
                TeamMember.employee_id.ilike(search_term)
            )
        )
        
    return query.offset(skip).limit(limit).all()

@router.get("/{member_id}", response_model=TeamMemberSchema)
def get_team_member(member_id: str, db: Session = Depends(get_db)):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member

@router.post("/", response_model=TeamMemberSchema)
def create_team_member(data: TeamMemberCreate, db: Session = Depends(get_db)):
    # Check for existing email or employee ID (case-insensitive email check)
    existing = db.query(TeamMember).filter(
        or_(
            TeamMember.email == data.email.lower(),
            TeamMember.employee_id == data.employeeId
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Team member with this email or Employee ID already exists")
    
    # Simple placeholder for encryption - in production use proper encryption
    encrypted_ssn = data.ssn # distinct field name to make consumption explicit
    
    new_member = TeamMember(
        id=uuid_lib.uuid4(),
        employee_id=data.employeeId,
        first_name=data.firstName,
        last_name=data.lastName,
        email=data.email.lower(),  # Store email as lowercase for consistent login
        phone=data.phone,
        date_of_birth=data.dateOfBirth,
        address_line1=data.addressLine1,
        address_line2=data.addressLine2,
        city=data.city,
        state=data.state,
        zip_code=data.zipCode,
        country=data.country,
        ssn_encrypted=encrypted_ssn,
        is_active=True,  # New members are active by default
        is_first_login=True,  # Explicit for first-time login flow
        password_hash=None,   # No password yet
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.put("/{member_id}", response_model=TeamMemberSchema)
def update_team_member(member_id: str, data: TeamMemberUpdate, db: Session = Depends(get_db)):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
        
    if data.firstName is not None: member.first_name = data.firstName
    if data.lastName is not None: member.last_name = data.lastName
    if data.email is not None: member.email = data.email
    if data.phone is not None: member.phone = data.phone
    if data.dateOfBirth is not None: member.date_of_birth = data.dateOfBirth
    
    if data.addressLine1 is not None: member.address_line1 = data.addressLine1
    if data.addressLine2 is not None: member.address_line2 = data.addressLine2
    if data.city is not None: member.city = data.city
    if data.state is not None: member.state = data.state
    if data.zipCode is not None: member.zip_code = data.zipCode
    if data.country is not None: member.country = data.country
    
    if data.employeeId is not None: member.employee_id = data.employeeId
    if data.ssn is not None: member.ssn_encrypted = data.ssn
    
    member.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(member)
    return member


# =============================================
# TOGGLE MEMBER STATUS (Active/Inactive)
# =============================================

class UpdateStatusRequest(BaseModel):
    isActive: bool

@router.patch("/{member_id}/status")
def update_member_status(
    member_id: str, 
    data: UpdateStatusRequest,
    db: Session = Depends(get_db)
):
    """
    Toggle a team member's active/inactive status.
    
    When DEACTIVATING:
    - All project assignments are archived (status='ARCHIVED')
    - Submitted form data remains accessible via history
    - Member cannot see projects in candidate portal
    
    When REACTIVATING:
    - Member starts fresh with NO projects
    - Must be manually assigned to new projects
    - Historical submissions still visible in profile
    """
    from app.models.models import ProjectAssignment
    
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    assignments_archived = 0
    
    # When deactivating, archive all project assignments and wipe login credentials
    if not data.isActive:
        assignments_archived = db.query(ProjectAssignment).filter(
            ProjectAssignment.team_member_id == member.id,
            ProjectAssignment.status != 'ARCHIVED'
        ).update(
            {"status": "ARCHIVED", "updated_at": datetime.utcnow()},
            synchronize_session=False
        )
        # Wipe login credentials - they'll need to do first-time login again if reactivated
        member.password_hash = None
        member.is_first_login = True
    
    member.is_active = data.isActive
    member.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(member)
    
    status_text = "active" if data.isActive else "inactive"
    result = {
        "success": True,
        "message": f"Member status changed to {status_text}",
        "isActive": member.is_active
    }
    
    if assignments_archived > 0:
        result["assignmentsArchived"] = assignments_archived
        result["message"] += f". {assignments_archived} project assignment(s) archived."
    
    return result

@router.delete("/{member_id}")
def delete_team_member(member_id: str, db: Session = Depends(get_db)):
    # Convert string UUID to UUID object
    try:
        member_uuid = uuid_lib.UUID(member_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    member = db.query(TeamMember).filter(TeamMember.id == member_uuid).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    # Import related models here to avoid circular imports
    from app.models.models import ProjectAssignment, Communication
    
    try:
        # CASCADING DELETE - Delete all related records manually
        
        # 1. Delete all project assignments for this team member
        assignments_deleted = db.query(ProjectAssignment).filter(
            ProjectAssignment.team_member_id == member_uuid
        ).delete(synchronize_session=False)
        
        # 2. Set team_member_id to NULL in communications to preserve history
        communications_updated = db.query(Communication).filter(
            Communication.team_member_id == member_uuid
        ).update({Communication.team_member_id: None}, synchronize_session=False)
        
        # 3. Delete the team member
        db.delete(member)
        db.commit()
        
        return {
            "message": "Team member deleted",
            "assignments_deleted": assignments_deleted,
            "communications_updated": communications_updated
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete team member: {str(e)}")
