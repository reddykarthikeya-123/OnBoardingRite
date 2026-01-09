from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import uuid as uuid_lib

from app.core.database import get_db
from app.models.models import ChecklistTemplate, TaskGroup, Task, User
from app.schemas.templates import (
    ChecklistTemplateCreate, ChecklistTemplateUpdate, ChecklistTemplate as ChecklistTemplateSchema,
    CloneTemplateRequest, AddGroupRequest, ReorderGroupsRequest,
    AddTaskToGroupRequest, ReorderTasksRequest
)


router = APIRouter()

def get_user_name(db: Session, user_id) -> Optional[str]:
    """Helper to get user's full name from ID"""
    if not user_id:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return f"{user.first_name} {user.last_name}".strip()
    return None

@router.get("/", response_model=List[ChecklistTemplateSchema])
def list_templates(
    status: Optional[str] = None,
    client_name: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ChecklistTemplate)
    
    if status == 'active':
        query = query.filter(ChecklistTemplate.is_active == True)
    elif status == 'inactive':
        query = query.filter(ChecklistTemplate.is_active == False)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                ChecklistTemplate.name.ilike(search_term),
                ChecklistTemplate.description.ilike(search_term)
            )
        )
    
    templates = query.all()
    
    # Build response with createdByName
    result = []
    for t in templates:
        schema = ChecklistTemplateSchema.model_validate(t)
        schema.createdByName = get_user_name(db, t.created_by)
        result.append(schema)
    
    return result

@router.get("/{template_id}", response_model=ChecklistTemplateSchema)
def get_template(template_id: str, db: Session = Depends(get_db)):
    t = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
        
    # Sort groups
    t.task_groups.sort(key=lambda x: x.display_order)
    
    # Build response with createdByName
    schema = ChecklistTemplateSchema.model_validate(t)
    schema.createdByName = get_user_name(db, t.created_by)
    
    return schema

@router.post("/", response_model=ChecklistTemplateSchema)
def create_template(data: ChecklistTemplateCreate, db: Session = Depends(get_db)):
    # Check if name exists
    exists = db.query(ChecklistTemplate).filter(ChecklistTemplate.name == data.name).first()
    if exists:
        # Just append timestamp to make unique if simple dup check fails, or error?
        # For now, let's allow same names or error. Let's allow but maybe warn users.
        pass

    new_template = ChecklistTemplate(
        id=uuid_lib.uuid4(),
        name=data.name,
        description=data.description,
        client_id=data.clientId,
        is_active=data.isActive,
        version=data.version,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template

@router.put("/{template_id}", response_model=ChecklistTemplateSchema)
def update_template(template_id: str, data: ChecklistTemplateUpdate, db: Session = Depends(get_db)):
    t = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
        
    if data.name is not None: t.name = data.name
    if data.description is not None: t.description = data.description
    if data.isActive is not None: t.is_active = data.isActive
    if data.clientId is not None: t.client_id = data.clientId
    
    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return t

@router.delete("/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db)):
    t = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
        
    # Soft delete
    t.is_active = False
    # Or hard delete? Frontend implies "Trash" which usually soft deletes or permanent?
    # Let's do soft delete by setting active=False for safety, or hard delete if requested.
    # Frontend logic usually filters out inactive. 
    # But delete button usually means GONE.
    db.delete(t)
    db.commit()
    return {"message": "Template deleted"}

@router.post("/{template_id}/clone", response_model=ChecklistTemplateSchema)
def clone_template(template_id: str, data: CloneTemplateRequest, db: Session = Depends(get_db)):
    original = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Template not found")
        
    new_template = ChecklistTemplate(
        id=uuid_lib.uuid4(),
        name=data.name,
        description=f"Cloned from {original.name}",
        client_id=original.client_id,
        is_active=True,
        version=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_template)
    db.flush() # Get ID
    
    # Clone groups and tasks
    for group in original.task_groups:
        new_group = TaskGroup(
            id=uuid_lib.uuid4(),
            template_id=new_template.id,
            name=group.name,
            description=group.description,
            category=group.category,
            display_order=group.display_order,
            eligibility_criteria_id=group.eligibility_criteria_id,
            created_at=datetime.utcnow()
        )
        db.add(new_group)
        db.flush()
        
        for task in group.tasks:
            new_task = Task(
                id=uuid_lib.uuid4(),
                task_group_id=new_group.id,
                name=task.name,
                description=task.description,
                type=task.type,
                category=task.category,
                is_required=task.is_required,
                display_order=task.display_order,
                configuration=task.configuration,
                created_at=datetime.utcnow()
            )
            db.add(new_task)
            
    db.commit()
    db.refresh(new_template)
    return new_template

@router.post("/{template_id}/groups")
def add_task_group(template_id: str, data: AddGroupRequest, db: Session = Depends(get_db)):
    t = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Auto-calculate order if not provided
    display_order = data.order
    if display_order == 0 or display_order is None:
        existing_groups = db.query(TaskGroup).filter(TaskGroup.template_id == template_id).count()
        display_order = existing_groups + 1
        
    new_group = TaskGroup(
        id=uuid_lib.uuid4(),
        template_id=template_id,
        name=data.name,
        description=data.description,
        category=data.category or "GENERAL",
        display_order=display_order,
        created_at=datetime.utcnow()
    )
    db.add(new_group)
    db.commit()
    return new_group


@router.post("/{template_id}/groups/reorder")
def reorder_groups(template_id: str, data: ReorderGroupsRequest, db: Session = Depends(get_db)):
    for idx, group_id in enumerate(data.groupOrder):
        group = db.query(TaskGroup).filter(TaskGroup.id == group_id, TaskGroup.template_id == template_id).first()
        if group:
            group.display_order = idx + 1
    db.commit()
    return {"message": "Groups reordered"}

# Reuse existing task management endpoints logic?
# The tasks are managed via /projects/{id}/groups... but here we work on TEMPLATES
# We likely need dedicated endpoints for Template Tasks if the URLs are different or
# we can reuse the logic. 
# Frontend likely calls: POST /templates/{id}/groups/{gid}/tasks
# Let's implement delete group here as well

@router.delete("/{template_id}/groups/{group_id}")
def delete_group(template_id: str, group_id: str, db: Session = Depends(get_db)):
    g = db.query(TaskGroup).filter(TaskGroup.id == group_id, TaskGroup.template_id == template_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if group has tasks? Cascade delete usually handles it if configured, 
    # otherwise we might need to manually delete tasks.
    # For now assume cascade or manual deletion isn't strictly enforced by DB constraint blocking it.
    
    db.delete(g)
    db.commit()
    return {"message": "Group deleted"}

@router.post("/{template_id}/groups/{group_id}/tasks")
def add_task_to_group(
    template_id: str, 
    group_id: str, 
    data: AddTaskToGroupRequest, 
    db: Session = Depends(get_db)
):
    # Verify group belongs to template
    group = db.query(TaskGroup).filter(TaskGroup.id == group_id, TaskGroup.template_id == template_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Calculate order (append to end)
    # This query counts tasks in this group
    count = db.query(Task).filter(Task.task_group_id == group_id).count()
    
    new_task = Task(
        id=uuid_lib.uuid4(),
        task_group_id=group_id,
        name=data.name,
        description=data.description,
        type=data.type,
        category=data.category,
        is_required=data.isRequired,
        display_order=count + 1,
        configuration=data.configuration or {},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task

@router.delete("/{template_id}/groups/{group_id}/tasks/{task_id}")
def delete_task_from_group(
    template_id: str, 
    group_id: str, 
    task_id: str, 
    db: Session = Depends(get_db)
):
    # Verify group belongs to template - strict check
    group = db.query(TaskGroup).filter(TaskGroup.id == group_id, TaskGroup.template_id == template_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    task = db.query(Task).filter(Task.id == task_id, Task.task_group_id == group_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(task)
    db.commit()
    
    return {"message": "Task deleted"}

@router.post("/{template_id}/groups/{group_id}/tasks/reorder")
def reorder_tasks(
    template_id: str, 
    group_id: str, 
    data: ReorderTasksRequest, 
    db: Session = Depends(get_db)
):
    # Verify group belongs to template
    group = db.query(TaskGroup).filter(TaskGroup.id == group_id, TaskGroup.template_id == template_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    for idx, task_id in enumerate(data.taskOrder):
        task = db.query(Task).filter(Task.id == task_id, Task.task_group_id == group_id).first()
        if task:
            task.display_order = idx + 1
            
    db.commit()
    return {"message": "Tasks reordered"}
