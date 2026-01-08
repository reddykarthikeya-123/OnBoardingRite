from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid as uuid_lib

from app.core.database import get_db
from app.models.models import Project, Requisition, RequisitionLineItem, ProjectAssignment, TeamMember, Communication
from app.schemas.requisitions import (
    RequisitionResponse, RequisitionLineItemResponse,
    CreateRequisitionRequest, AssignMemberRequest,
    CommunicationRequest, CommunicationResponse
)

router = APIRouter()

@router.get("/{project_id}/requisitions", response_model=List[RequisitionResponse])
def get_project_requisitions(project_id: str, db: Session = Depends(get_db)):
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get requisitions linked via PPM project
    if not project.ppm_project_id:
        return []
    
    reqs = db.query(Requisition).filter(
        Requisition.ppm_project_id == project.ppm_project_id
    ).all()
    
    response = []
    for r in reqs:
        # Count candidates (we'd need a candidates table, using line items for now)
        candidates = sum(li.filled_quantity or 0 for li in r.line_items)
        
        response.append(RequisitionResponse(
            id=str(r.id),
            externalId=r.external_id,
            title=r.title,
            description=r.description,
            status=r.status or "OPEN",
            candidatesCount=candidates,
            lineItems=[
                RequisitionLineItemResponse(
                    id=str(li.id),
                    trade=li.trade,
                    quantity=li.quantity or 0,
                    filledQuantity=li.filled_quantity or 0
                ) for li in r.line_items
            ]
        ))
    
    return response

@router.post("/{project_id}/requisitions", response_model=RequisitionResponse)
def create_requisition(project_id: str, data: CreateRequisitionRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create requisition (would normally link to PPM project)
    req_id = uuid_lib.uuid4()
    new_req = Requisition(
        id=req_id,
        ppm_project_id=project.ppm_project_id,
        external_id=f"REQ-{datetime.now().strftime('%Y')}-{str(req_id)[:4].upper()}",
        title=data.title,
        description=data.description,
        status="OPEN",
        created_at=datetime.utcnow()
    )
    
    db.add(new_req)
    db.flush()
    
    # Add line item for trade
    line_item = RequisitionLineItem(
        id=uuid_lib.uuid4(),
        requisition_id=req_id,
        trade=data.trade,
        quantity=data.quantity,
        filled_quantity=0,
        created_at=datetime.utcnow()
    )
    
    db.add(line_item)
    db.commit()
    db.refresh(new_req)
    
    return RequisitionResponse(
        id=str(new_req.id),
        externalId=new_req.external_id,
        title=new_req.title,
        description=new_req.description,
        status=new_req.status,
        candidatesCount=0,
        lineItems=[RequisitionLineItemResponse(
            id=str(line_item.id),
            trade=line_item.trade,
            quantity=line_item.quantity,
            filledQuantity=0
        )]
    )

@router.post("/{project_id}/members", response_model=dict)
def assign_member_to_project(project_id: str, data: AssignMemberRequest, db: Session = Depends(get_db)):
    # Convert string UUIDs to UUID objects
    try:
        project_uuid = uuid_lib.UUID(project_id)
        member_uuid = uuid_lib.UUID(data.teamMemberId)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    project = db.query(Project).filter(Project.id == project_uuid).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    member = db.query(TeamMember).filter(TeamMember.id == member_uuid).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    # Check if already assigned
    existing = db.query(ProjectAssignment).filter(
        ProjectAssignment.project_id == project_uuid,
        ProjectAssignment.team_member_id == member_uuid
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Member already assigned to project")
    
    assignment = ProjectAssignment(
        id=uuid_lib.uuid4(),
        project_id=project_uuid,
        team_member_id=member_uuid,
        status="PENDING",
        category=data.category,
        trade=data.trade or "General",
        assigned_at=datetime.utcnow()
    )
    
    db.add(assignment)
    db.commit()
    
    return {"success": True, "assignmentId": str(assignment.id)}

@router.delete("/{project_id}/members/{member_id}")
def remove_member_from_project(project_id: str, member_id: str, db: Session = Depends(get_db)):
    assignment = db.query(ProjectAssignment).filter(
        ProjectAssignment.project_id == project_id,
        ProjectAssignment.team_member_id == member_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    
    return {"success": True}

@router.post("/{project_id}/communications", response_model=CommunicationResponse)
def send_communication(project_id: str, data: CommunicationRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get target members
    if data.memberIds:
        members = db.query(TeamMember).filter(TeamMember.id.in_(data.memberIds)).all()
    else:
        # Get all members from project assignments
        assignments = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == project_id
        ).all()
        members = [a.team_member for a in assignments if a.team_member]
    
    # Create communication records
    comm_id = uuid_lib.uuid4()
    sent_count = 0
    
    for member in members:
        comm = Communication(
            id=uuid_lib.uuid4(),
            project_id=project.id,
            team_member_id=member.id,
            type=data.type,
            direction="OUTBOUND",
            subject=data.subject,
            message=data.message,
            sent_at=datetime.utcnow(),
            status="SENT"
        )
        db.add(comm)
        sent_count += 1
    
    db.commit()
    
    return CommunicationResponse(
        id=str(comm_id),
        type=data.type,
        status="SENT",
        sentCount=sent_count
    )
