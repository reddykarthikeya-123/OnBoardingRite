"""
Candidate Portal API Routes
Provides endpoints for candidates to view their assigned tasks and submit forms
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import uuid as uuid_lib

from app.core.database import get_db
from app.models.models import (
    TaskInstance, Task, ProjectAssignment, TeamMember, 
    Project, Document
)

router = APIRouter()


# =============================================
# PYDANTIC SCHEMAS
# =============================================

class CandidateDashboardResponse(BaseModel):
    """Dashboard summary for candidate home page"""
    candidateId: str
    candidateName: str
    projectName: str
    projectId: str
    trade: Optional[str]
    
    # Progress stats
    totalTasks: int
    completedTasks: int
    remainingTasks: int
    progressPercent: int
    
    # Days info
    daysUntilStart: Optional[int]
    startDate: Optional[str]
    
    # Category breakdown
    categories: List[Dict[str, Any]]
    
    # Priority/urgent tasks
    priorityTasks: List[Dict[str, Any]]


class CandidateTaskItem(BaseModel):
    """Individual task item for task list"""
    id: str
    taskId: str
    name: str
    description: Optional[str]
    type: str  # CUSTOM_FORM, DOCUMENT_UPLOAD, REST_API, REDIRECT
    category: Optional[str]
    status: str  # NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED, WAIVED
    dueDate: Optional[str]
    isRequired: bool
    configuration: Optional[Dict[str, Any]]
    result: Optional[Dict[str, Any]]
    startedAt: Optional[datetime]
    completedAt: Optional[datetime]
    
    class Config:
        from_attributes = True


class CandidateTaskListResponse(BaseModel):
    """Full task list for candidate"""
    assignmentId: str
    tasks: List[CandidateTaskItem]
    totalCount: int
    completedCount: int
    pendingCount: int


class FormSubmissionRequest(BaseModel):
    """Request to submit form data"""
    formData: Dict[str, Any]


class DocumentInfo(BaseModel):
    """Document metadata for display"""
    id: str
    originalFilename: str
    mimeType: str
    fileSize: int
    documentSide: Optional[str] = None


class SubmittedTaskItem(BaseModel):
    """Details of a submitted task"""
    id: str
    taskId: str
    taskName: str
    category: Optional[str]
    submittedAt: Optional[str]
    formData: Optional[Dict[str, Any]]
    documents: Optional[List[DocumentInfo]] = []
    
    class Config:
        from_attributes = True


class ProjectSubmissionGroup(BaseModel):
    """Group of submissions for a project"""
    projectId: str
    projectName: str
    role: Optional[str]
    submissions: List[SubmittedTaskItem]


# =============================================
# HELPER FUNCTIONS
# =============================================

def get_category_stats(task_instances, db: Session):
    """Calculate completion stats by category"""
    categories = {}
    
    for ti in task_instances:
        task = db.query(Task).filter(Task.id == ti.task_id).first()
        if not task:
            continue
            
        cat = task.category or 'OTHER'
        if cat not in categories:
            categories[cat] = {'id': cat.lower(), 'name': cat.replace('_', ' ').title(), 'completed': 0, 'total': 0}
        
        categories[cat]['total'] += 1
        if ti.status == 'COMPLETED':
            categories[cat]['completed'] += 1
    
    return list(categories.values())


def get_priority_tasks(task_instances, db: Session, limit: int = 3):
    """Get top priority incomplete tasks"""
    priority_tasks = []
    
    for ti in task_instances:
        if ti.status in ['COMPLETED', 'WAIVED']:
            continue
            
        task = db.query(Task).filter(Task.id == ti.task_id).first()
        if not task:
            continue
        
        # Calculate days until due
        days_until = None
        priority = 'low'
        if ti.due_date:
            days_until = (ti.due_date.date() - datetime.utcnow().date()).days
            if days_until <= 1:
                priority = 'high'
            elif days_until <= 3:
                priority = 'medium'
        
        priority_tasks.append({
            'id': str(ti.id),
            'taskId': str(task.id),
            'name': task.name,
            'type': task.type.lower() if task.type else 'form',
            'dueIn': days_until,
            'priority': priority,
            'status': ti.status
        })
    
    # Sort by priority (high first) and due date
    priority_order = {'high': 0, 'medium': 1, 'low': 2}
    priority_tasks.sort(key=lambda x: (priority_order.get(x['priority'], 3), x['dueIn'] or 999))
    
    return priority_tasks[:limit]


# =============================================
# DASHBOARD ENDPOINT
# =============================================

@router.get("/dashboard/{assignment_id}", response_model=CandidateDashboardResponse)
def get_candidate_dashboard(
    assignment_id: str,
    db: Session = Depends(get_db)
):
    """Get dashboard summary for a candidate's project assignment"""
    
    # Get assignment
    assignment = db.query(ProjectAssignment).filter(
        ProjectAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Get team member
    team_member = db.query(TeamMember).filter(
        TeamMember.id == assignment.team_member_id
    ).first()
    
    if not team_member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    # Get project
    project = db.query(Project).filter(
        Project.id == assignment.project_id
    ).first()
    
    # Get all task instances for this assignment
    task_instances = db.query(TaskInstance).filter(
        TaskInstance.assignment_id == assignment_id
    ).all()
    
    # Calculate stats
    total_tasks = len(task_instances)
    completed_tasks = sum(1 for ti in task_instances if ti.status == 'COMPLETED')
    remaining_tasks = total_tasks - completed_tasks
    progress_percent = int((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0)
    
    # Calculate days until start
    days_until_start = None
    start_date_str = None
    if project and project.start_date:
        start_date_str = project.start_date.isoformat()
        days_until_start = (project.start_date - datetime.utcnow().date()).days
    
    # Get category breakdown
    categories = get_category_stats(task_instances, db)
    
    # Get priority tasks
    priority_tasks = get_priority_tasks(task_instances, db)
    
    return CandidateDashboardResponse(
        candidateId=str(team_member.id),
        candidateName=f"{team_member.first_name} {team_member.last_name}",
        projectName=project.name if project else "Unknown Project",
        projectId=str(project.id) if project else "",
        trade=assignment.trade,
        totalTasks=total_tasks,
        completedTasks=completed_tasks,
        remainingTasks=remaining_tasks,
        progressPercent=progress_percent,
        daysUntilStart=days_until_start,
        startDate=start_date_str,
        categories=categories,
        priorityTasks=priority_tasks
    )


# =============================================
# TASKS LIST ENDPOINT
# =============================================

@router.get("/tasks/{assignment_id}", response_model=CandidateTaskListResponse)
def get_candidate_tasks(
    assignment_id: str,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all tasks for a candidate's assignment"""
    
    # Verify assignment exists
    assignment = db.query(ProjectAssignment).filter(
        ProjectAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Get task instances
    query = db.query(TaskInstance).filter(
        TaskInstance.assignment_id == assignment_id
    )
    
    task_instances = query.all()
    
    # Build task list with full details
    tasks = []
    for ti in task_instances:
        task = db.query(Task).filter(Task.id == ti.task_id).first()
        if not task:
            continue
        
        # Apply filters
        if category and task.category and task.category.lower() != category.lower():
            continue
        if status and ti.status != status:
            continue
        
        # If task has a source_task_id, use source task's editable fields
        # This allows library task edits to propagate to candidates
        effective_name = task.name
        effective_description = task.description
        effective_configuration = task.configuration
        
        if task.source_task_id:
            source_task = db.query(Task).filter(Task.id == task.source_task_id).first()
            if source_task:
                effective_name = source_task.name
                effective_description = source_task.description
                effective_configuration = source_task.configuration
        
        tasks.append(CandidateTaskItem(
            id=str(ti.id),
            taskId=str(task.id),
            name=effective_name,
            description=effective_description,
            type=task.type,
            category=task.category,
            status=ti.status,
            dueDate=ti.due_date.isoformat() if ti.due_date else None,
            isRequired=task.is_required if task.is_required is not None else True,
            configuration=effective_configuration,
            result=ti.result,
            startedAt=ti.started_at,
            completedAt=ti.completed_at
        ))
    
    # Calculate counts
    completed_count = sum(1 for t in tasks if t.status == 'COMPLETED')
    pending_count = len(tasks) - completed_count
    
    return CandidateTaskListResponse(
        assignmentId=assignment_id,
        tasks=tasks,
        totalCount=len(tasks),
        completedCount=completed_count,
        pendingCount=pending_count
    )


# =============================================
# SINGLE TASK DETAIL ENDPOINT
# =============================================

@router.get("/tasks/{assignment_id}/{task_instance_id}")
def get_candidate_task_detail(
    assignment_id: str,
    task_instance_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed info for a single task including form fields"""
    
    ti = db.query(TaskInstance).filter(
        TaskInstance.id == task_instance_id,
        TaskInstance.assignment_id == assignment_id
    ).first()
    
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    task = db.query(Task).filter(Task.id == ti.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get any uploaded documents for this task
    documents = db.query(Document).filter(
        Document.task_instance_id == task_instance_id
    ).all()
    
    document_list = [
        {
            "id": str(doc.id),
            "filename": doc.original_filename,
            "mimeType": doc.mime_type,
            "fileSize": doc.file_size,
            "documentSide": doc.document_side,
            "uploadedAt": doc.uploaded_at.isoformat() if doc.uploaded_at else None
        }
        for doc in documents
    ]
    
    return {
        "taskInstance": {
            "id": str(ti.id),
            "status": ti.status,
            "result": ti.result,
            "startedAt": ti.started_at.isoformat() if ti.started_at else None,
            "completedAt": ti.completed_at.isoformat() if ti.completed_at else None,
            "dueDate": ti.due_date.isoformat() if ti.due_date else None
        },
        "task": {
            "id": str(task.id),
            "name": task.name,
            "description": task.description,
            "type": task.type,
            "category": task.category,
            "isRequired": task.is_required,
            "configuration": task.configuration
        },
        "documents": document_list
    }


# =============================================
# FORM SUBMISSION ENDPOINT
# =============================================

@router.post("/tasks/{assignment_id}/{task_instance_id}/submit")
def submit_candidate_form(
    assignment_id: str,
    task_instance_id: str,
    data: FormSubmissionRequest,
    db: Session = Depends(get_db)
):
    """Submit form data for a custom form task or document upload task"""
    
    ti = db.query(TaskInstance).filter(
        TaskInstance.id == task_instance_id,
        TaskInstance.assignment_id == assignment_id
    ).first()
    
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    task = db.query(Task).filter(Task.id == ti.task_id).first()
    
    # Allow both CUSTOM_FORM and DOCUMENT_UPLOAD task types
    allowed_types = ['CUSTOM_FORM', 'DOCUMENT_UPLOAD']
    if task and task.type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"This task type ({task.type}) does not support submission")
    
    # Validate required fields for CUSTOM_FORM tasks only
    if task and task.type == 'CUSTOM_FORM' and task.configuration:
        form_fields = task.configuration.get('formFields', [])
        errors = []
        
        for field in form_fields:
            field_name = field.get('name')
            is_required = field.get('required', False)
            
            if is_required and (field_name not in data.formData or not data.formData[field_name]):
                errors.append(f"Field '{field.get('label', field_name)}' is required")
        
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})
    
    # For DOCUMENT_UPLOAD tasks, verify documents were uploaded
    if task and task.type == 'DOCUMENT_UPLOAD':
        document_ids = data.formData.get('documentIds', [])
        if not document_ids:
            raise HTTPException(status_code=400, detail="No documents were uploaded")
    
    # Save form data
    ti.result = {
        "formData": data.formData,
        "submittedAt": datetime.utcnow().isoformat()
    }
    ti.status = 'COMPLETED'
    ti.completed_at = datetime.utcnow()
    
    if not ti.started_at:
        ti.started_at = datetime.utcnow()
    
    db.commit()
    db.refresh(ti)
    
    return {
        "success": True,
        "message": "Form submitted successfully",
        "taskInstanceId": str(ti.id),
        "status": ti.status
    }


# =============================================
# START TASK ENDPOINT  
# =============================================

@router.post("/tasks/{assignment_id}/{task_instance_id}/start")
def start_candidate_task(
    assignment_id: str,
    task_instance_id: str,
    db: Session = Depends(get_db)
):
    """Mark a task as started/in-progress"""
    
    ti = db.query(TaskInstance).filter(
        TaskInstance.id == task_instance_id,
        TaskInstance.assignment_id == assignment_id
    ).first()
    
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    if ti.status == 'NOT_STARTED':
        ti.status = 'IN_PROGRESS'
        ti.started_at = datetime.utcnow()
        db.commit()
    
    return {
        "success": True,
        "status": ti.status,
        "startedAt": ti.started_at.isoformat() if ti.started_at else None
    }


# =============================================
# SUBMITTED FORMS ENDPOINT
# =============================================

@router.get("/profile/submissions/{candidate_id}", response_model=List[ProjectSubmissionGroup])
def get_submitted_tasks(
    candidate_id: str,
    db: Session = Depends(get_db)
):
    """Get all submitted/completed tasks grouped by project"""
    
    # Verify candidate exists
    candidate = db.query(TeamMember).filter(TeamMember.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Get all assignments for this candidate
    assignments = db.query(ProjectAssignment).filter(
        ProjectAssignment.team_member_id == candidate_id
    ).all()
    
    result = []
    
    for assignment in assignments:
        project = db.query(Project).filter(Project.id == assignment.project_id).first()
        if not project:
            continue
            
        # Get completed tasks for this assignment
        completed_instances = db.query(TaskInstance).filter(
            TaskInstance.assignment_id == assignment.id,
            TaskInstance.status == 'COMPLETED'
        ).all()
        
        if not completed_instances:
            continue
            
        submissions = []
        for ti in completed_instances:
            task = db.query(Task).filter(Task.id == ti.task_id).first()
            if not task:
                continue
                
            # Extract form data if available
            form_data = ti.result.get('formData') if ti.result else None
            
            # Fetch document details if this is a document upload task
            documents = []
            if form_data and 'documentIds' in form_data:
                document_ids = form_data.get('documentIds', [])
                for doc_id in document_ids:
                    doc = db.query(Document).filter(Document.id == doc_id).first()
                    if doc:
                        documents.append(DocumentInfo(
                            id=str(doc.id),
                            originalFilename=doc.original_filename,
                            mimeType=doc.mime_type,
                            fileSize=doc.file_size or 0,
                            documentSide=doc.document_side
                        ))
            
            submissions.append(SubmittedTaskItem(
                id=str(ti.id),
                taskId=str(task.id),
                taskName=task.name,
                category=task.category,
                submittedAt=ti.completed_at.isoformat() if ti.completed_at else None,
                formData=form_data,
                documents=documents
            ))
            
        if submissions:
            result.append(ProjectSubmissionGroup(
                projectId=str(project.id),
                projectName=project.name,
                role=assignment.trade,
                submissions=submissions
            ))
            
    return result


@router.get("/profile/submissions/{candidate_id}/project/{project_id}", response_model=List[SubmittedTaskItem])
def get_submitted_tasks_by_project(
    candidate_id: str,
    project_id: str,
    db: Session = Depends(get_db)
):
    """Get submitted/completed tasks for a specific candidate in a specific project"""
    
    # Get the assignment for this candidate in this project
    assignment = db.query(ProjectAssignment).filter(
        ProjectAssignment.team_member_id == candidate_id,
        ProjectAssignment.project_id == project_id
    ).first()
    
    if not assignment:
        return []  # No assignment found, return empty list
        
    # Get completed tasks for this assignment
    completed_instances = db.query(TaskInstance).filter(
        TaskInstance.assignment_id == assignment.id,
        TaskInstance.status == 'COMPLETED'
    ).all()
    
    submissions = []
    for ti in completed_instances:
        task = db.query(Task).filter(Task.id == ti.task_id).first()
        if not task:
            continue
            
        # Extract form data if available
        form_data = ti.result.get('formData') if ti.result else None
        
        # Fetch document details if this is a document upload task
        documents = []
        if form_data and 'documentIds' in form_data:
            document_ids = form_data.get('documentIds', [])
            for doc_id in document_ids:
                doc = db.query(Document).filter(Document.id == doc_id).first()
                if doc:
                    documents.append(DocumentInfo(
                        id=str(doc.id),
                        originalFilename=doc.original_filename,
                        mimeType=doc.mime_type,
                        fileSize=doc.file_size or 0,
                        documentSide=doc.document_side
                    ))
        
        submissions.append(SubmittedTaskItem(
            id=str(ti.id),
            taskId=str(task.id),
            taskName=task.name,
            category=task.category,
            submittedAt=ti.completed_at.isoformat() if ti.completed_at else None,
            formData=form_data,
            documents=documents
        ))
        
    return submissions
