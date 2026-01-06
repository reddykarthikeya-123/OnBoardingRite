from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import datetime
import uuid as uuid_lib

from app.core.database import get_db
from app.models.models import Task
from app.schemas.tasks import TaskLibraryItem, CreateTaskRequest, UpdateTaskRequest

router = APIRouter()

@router.get("/", response_model=List[TaskLibraryItem])
def list_tasks(
    search: Optional[str] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all tasks in the library (tasks without a task_group_id = library tasks)"""
    query = db.query(Task)
    
    # Filter to only library tasks (no group assignment) or all tasks
    # For now, let's return all tasks since they're in the task library
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Task.name.ilike(search_term),
                Task.description.ilike(search_term)
            )
        )
    
    if type and type != 'ALL':
        query = query.filter(Task.type == type)
    
    if category and category != 'ALL':
        query = query.filter(Task.category == category)
    
    tasks = query.order_by(Task.created_at.desc()).all()
    
    return [
        TaskLibraryItem(
            id=str(t.id),
            name=t.name,
            description=t.description,
            type=t.type,
            category=t.category,
            isRequired=t.is_required if t.is_required is not None else True,
            configuration=t.configuration,
            createdAt=t.created_at,
            updatedAt=t.updated_at
        )
        for t in tasks
    ]

@router.get("/{task_id}", response_model=TaskLibraryItem)
def get_task(task_id: str, db: Session = Depends(get_db)):
    """Get a specific task by ID"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskLibraryItem(
        id=str(task.id),
        name=task.name,
        description=task.description,
        type=task.type,
        category=task.category,
        isRequired=task.is_required if task.is_required is not None else True,
        configuration=task.configuration,
        createdAt=task.created_at,
        updatedAt=task.updated_at
    )

@router.post("/", response_model=TaskLibraryItem)
def create_task(data: CreateTaskRequest, db: Session = Depends(get_db)):
    """Create a new task in the library"""
    new_task = Task(
        id=uuid_lib.uuid4(),
        name=data.name,
        description=data.description,
        type=data.type,
        category=data.category,
        is_required=data.isRequired,
        display_order=0,
        configuration=data.configuration or {},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return TaskLibraryItem(
        id=str(new_task.id),
        name=new_task.name,
        description=new_task.description,
        type=new_task.type,
        category=new_task.category,
        isRequired=new_task.is_required if new_task.is_required is not None else True,
        configuration=new_task.configuration,
        createdAt=new_task.created_at,
        updatedAt=new_task.updated_at
    )

@router.put("/{task_id}", response_model=TaskLibraryItem)
def update_task(task_id: str, data: UpdateTaskRequest, db: Session = Depends(get_db)):
    """Update an existing task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update only provided fields
    if data.name is not None:
        task.name = data.name
    if data.description is not None:
        task.description = data.description
    if data.type is not None:
        task.type = data.type
    if data.category is not None:
        task.category = data.category
    if data.isRequired is not None:
        task.is_required = data.isRequired
    if data.configuration is not None:
        task.configuration = data.configuration
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    return get_task(task_id, db)

@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task from the library"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    
    return {"success": True, "message": "Task deleted"}
