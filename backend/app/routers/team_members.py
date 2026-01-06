from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
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
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(TeamMember)
    
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
    # Check for existing email or employee ID
    existing = db.query(TeamMember).filter(
        or_(
            TeamMember.email == data.email,
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
        email=data.email,
        phone=data.phone,
        date_of_birth=data.dateOfBirth,
        address_line1=data.addressLine1,
        address_line2=data.addressLine2,
        city=data.city,
        state=data.state,
        zip_code=data.zipCode,
        country=data.country,
        ssn_encrypted=encrypted_ssn,
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

@router.delete("/{member_id}")
def delete_team_member(member_id: str, db: Session = Depends(get_db)):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
        
    db.delete(member)
    db.commit()
    return {"message": "Team member deleted"}
