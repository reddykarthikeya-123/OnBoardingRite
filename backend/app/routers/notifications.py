from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import uuid as uuid_lib

from app.core.database import get_db
from app.models.models import Notification, Task, TaskInstance

router = APIRouter()


# =============================================
# PYDANTIC SCHEMAS
# =============================================

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: Optional[str]
    taskInstanceId: Optional[str]
    taskName: Optional[str]
    isRead: bool
    createdAt: Optional[datetime]

    class Config:
        from_attributes = True


# =============================================
# GET NOTIFICATIONS
# =============================================

@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    team_member_id: str,
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List notifications for a team member"""
    query = db.query(Notification).filter(
        Notification.team_member_id == team_member_id
    )
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    result = []
    for n in notifications:
        # Get task name if task_instance_id exists
        task_name = None
        if n.task_instance_id:
            ti = db.query(TaskInstance).filter(TaskInstance.id == n.task_instance_id).first()
            if ti and ti.task_id:
                task = db.query(Task).filter(Task.id == ti.task_id).first()
                if task:
                    task_name = task.name
        
        result.append(NotificationResponse(
            id=str(n.id),
            type=n.type,
            title=n.title,
            message=n.message,
            taskInstanceId=str(n.task_instance_id) if n.task_instance_id else None,
            taskName=task_name,
            isRead=n.is_read or False,
            createdAt=n.created_at
        ))
    
    return result


@router.get("/count")
def get_unread_count(
    team_member_id: str,
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.team_member_id == team_member_id,
        Notification.is_read == False
    ).count()
    
    return {"unreadCount": count}


# =============================================
# MARK AS READ
# =============================================

@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    db: Session = Depends(get_db)
):
    """Mark a single notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {"success": True, "message": "Notification marked as read"}


@router.patch("/mark-all-read")
def mark_all_as_read(
    team_member_id: str,
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for a team member"""
    db.query(Notification).filter(
        Notification.team_member_id == team_member_id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {"success": True, "message": "All notifications marked as read"}
