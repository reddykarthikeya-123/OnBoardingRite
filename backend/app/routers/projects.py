from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date, datetime
import json
import uuid as uuid_lib

from app.core.database import get_db
from app.models.models import Project, ProjectContact, ProjectAssignment, parse_json_field
from app.schemas.dashboard import ProjectFlags
from app.schemas.projects import (
    ProjectListResponse, ProjectListItem, ProjectStats, ContactInfo,
    CreateProjectRequest, ProjectDetail, ProjectTimeline, KeyMembers
)

router = APIRouter()

def get_contact(db, project_id, contact_type):
    c = db.query(ProjectContact).filter(
        ProjectContact.project_id == project_id,
        ProjectContact.contact_type == contact_type
    ).first()
    if c:
        return ContactInfo(name=c.name, email=c.email, phone=c.phone, role=c.contact_type)
    return None

@router.get("/", response_model=ProjectListResponse)
def list_projects(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    
    # Filters
    if status and status != 'ALL':
        query = query.filter(Project.status == status)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Project.name.ilike(search_term),
                Project.client_name.ilike(search_term)
            )
        )
        
    # Pagination
    total = query.count()
    offset = (page - 1) * limit
    projects = query.offset(offset).limit(limit).all()
    
    items = []
    for p in projects:
        # Get stats from assignments
        total_members = db.query(ProjectAssignment).filter(ProjectAssignment.project_id == p.id).count()
        completed = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == p.id,
            ProjectAssignment.status == 'COMPLETED'
        ).count()
        in_progress = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == p.id,
            ProjectAssignment.status == 'IN_PROGRESS'
        ).count()
        
        pm = get_contact(db, p.id, 'PM')
        
        items.append(ProjectListItem(
            id=str(p.id),
            name=p.name,
            clientName=p.client_name,
            location=p.location,
            startDate=p.start_date,
            endDate=p.end_date,
            status=p.status,
            flags=ProjectFlags(isODRISA=bool(p.is_odrisa), isDOD=bool(p.is_dod)),
            stats=ProjectStats(
                totalMembers=total_members,
                completed=completed,
                inProgress=in_progress,
                pending=total_members - completed - in_progress
            ),
            projectManager=pm
        ))
        
    return ProjectListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )

@router.post("/", response_model=ProjectDetail)
def create_project(data: CreateProjectRequest, db: Session = Depends(get_db)):
    new_id = uuid_lib.uuid4()
    
    new_project = Project(
        id=new_id,
        name=data.name,
        description=data.description,
        client_name=data.clientName,
        location=data.location,
        start_date=data.startDate,
        end_date=data.endDate,
        status=data.status,
        is_dod=data.isDOD,
        is_odrisa=data.isODRISA,
        template_id=data.templateId if hasattr(data, 'templateId') else None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return ProjectDetail(
        id=str(new_project.id),
        name=new_project.name,
        description=new_project.description,
        clientName=new_project.client_name,
        location=new_project.location,
        startDate=new_project.start_date,
        endDate=new_project.end_date,
        status=new_project.status,
        flags=ProjectFlags(isDOD=bool(new_project.is_dod), isODRISA=bool(new_project.is_odrisa)),
        timeline=ProjectTimeline(daysRemaining=0, targetEndDate=new_project.end_date),
        keyMembers=KeyMembers(),
        stats=ProjectStats()
    )

@router.get("/{project_id}", response_model=ProjectDetail)
def get_project_details(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Calculate days remaining
    days_remaining = 0
    if p.end_date:
        delta = p.end_date - date.today()
        days_remaining = max(0, delta.days)
    
    # Get stats
    total_members = db.query(ProjectAssignment).filter(ProjectAssignment.project_id == p.id).count()
    completed = db.query(ProjectAssignment).filter(
        ProjectAssignment.project_id == p.id,
        ProjectAssignment.status == 'COMPLETED'
    ).count()
    in_progress = db.query(ProjectAssignment).filter(
        ProjectAssignment.project_id == p.id,
        ProjectAssignment.status == 'IN_PROGRESS'
    ).count()
        
    # Get template name if template_id exists
    template_name = None
    if p.template_id:
        from app.models.models import ChecklistTemplate
        template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == p.template_id).first()
        if template:
            template_name = template.name
    
    return ProjectDetail(
        id=str(p.id),
        name=p.name,
        description=p.description,
        clientName=p.client_name,
        location=p.location,
        startDate=p.start_date,
        endDate=p.end_date,
        status=p.status,
        flags=ProjectFlags(isDOD=bool(p.is_dod), isODRISA=bool(p.is_odrisa)),
        templateName=template_name,
        timeline=ProjectTimeline(
            daysRemaining=days_remaining,
            targetEndDate=p.end_date
        ),
        keyMembers=KeyMembers(
            projectManager=get_contact(db, p.id, 'PM'),
            siteLead=get_contact(db, p.id, 'SITE_CONTACT'),
            safetyLead=get_contact(db, p.id, 'SAFETY_LEAD')
        ),
        stats=ProjectStats(
            totalMembers=total_members,
            completed=completed,
            inProgress=in_progress,
            pending=total_members - completed - in_progress
        )
    )
