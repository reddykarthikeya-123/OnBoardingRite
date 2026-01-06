from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid as uuid_lib
import json

from app.core.database import get_db
from app.models.models import TaskGroup, Task, Project, ChecklistTemplate
from app.schemas.checklists import (
    TaskGroupResponse, TaskResponse, 
    CreateTaskGroupRequest, CreateTaskRequest
)

router = APIRouter()

@router.get("/{project_id}/checklist", response_model=List[TaskGroupResponse])
def get_project_checklist(project_id: str, db: Session = Depends(get_db)):
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get template for this project
    if not project.template_id:
        return []
        
    # Fetch groups for this template
    groups = db.query(TaskGroup)\
        .filter(TaskGroup.template_id == project.template_id)\
        .order_by(TaskGroup.display_order)\
        .all()
    
    response = []
    for g in groups:
        tasks_list = []
        for t in g.tasks:
            tasks_list.append(TaskResponse(
                id=str(t.id),
                name=t.name,
                description=t.description,
                type=t.type or "FORM",
                category=t.category,
                isRequired=bool(t.is_required),
                configuration=t.configuration or {}
            ))
            
        response.append(TaskGroupResponse(
            id=str(g.id),
            name=g.name,
            category=g.category or "GENERAL",
            taskCount=len(tasks_list),
            tasks=tasks_list
        ))
        
    return response

@router.post("/{project_id}/groups", response_model=TaskGroupResponse)
def create_task_group(
    project_id: str, 
    request: CreateTaskGroupRequest, 
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if not project.template_id:
        raise HTTPException(status_code=400, detail="Project has no template assigned")
    
    # Get max display order
    max_order = db.query(TaskGroup)\
        .filter(TaskGroup.template_id == project.template_id)\
        .count()
    
    new_group = TaskGroup(
        id=uuid_lib.uuid4(),
        template_id=project.template_id,
        name=request.name,
        category=request.category,
        display_order=max_order + 1
    )
    
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    return TaskGroupResponse(
        id=str(new_group.id),
        name=new_group.name,
        category=new_group.category,
        taskCount=0,
        tasks=[]
    )

@router.post("/{project_id}/groups/{group_id}/tasks", response_model=TaskResponse)
def add_task_to_group(
    project_id: str,
    group_id: str,
    request: CreateTaskRequest,
    db: Session = Depends(get_db)
):
    # Verify group exists
    group = db.query(TaskGroup).filter(TaskGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Task Group not found")
    
    # Get max display order
    max_order = db.query(Task).filter(Task.task_group_id == group_id).count()
        
    new_task = Task(
        id=uuid_lib.uuid4(),
        task_group_id=group.id,
        name=request.name,
        description=request.description,
        type=request.type,
        category=request.category,
        is_required=request.isRequired,
        display_order=max_order + 1,
        configuration=request.configuration
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return TaskResponse(
        id=str(new_task.id),
        name=new_task.name,
        description=new_task.description,
        type=new_task.type,
        category=new_task.category,
        isRequired=bool(new_task.is_required),
        configuration=new_task.configuration
    )
