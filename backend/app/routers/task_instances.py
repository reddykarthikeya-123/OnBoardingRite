from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import uuid as uuid_lib
import httpx
import json

from app.core.database import get_db
from app.models.models import TaskInstance, Task, ProjectAssignment, Document, Notification

router = APIRouter()


# =============================================
# PYDANTIC SCHEMAS
# =============================================

class TaskInstanceResponse(BaseModel):
    id: str
    taskId: str
    assignmentId: str
    status: str
    result: Optional[Dict[str, Any]]
    startedAt: Optional[datetime]
    completedAt: Optional[datetime]
    dueDate: Optional[datetime]
    isWaived: bool
    waivedReason: Optional[str]
    
    class Config:
        from_attributes = True


class TaskInstanceWithDetails(TaskInstanceResponse):
    taskName: str
    taskType: str
    taskCategory: Optional[str]
    taskConfiguration: Optional[Dict[str, Any]]


class SubmitFormRequest(BaseModel):
    formData: Dict[str, Any]
    documentIds: Optional[List[str]] = []


class ExecuteRestApiRequest(BaseModel):
    overrideData: Optional[Dict[str, Any]] = None  # Optional data to inject into request


class StartRedirectRequest(BaseModel):
    returnUrl: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: str
    result: Optional[Dict[str, Any]] = None


class RestApiExecutionResult(BaseModel):
    success: bool
    statusCode: Optional[int]
    response: Optional[Dict[str, Any]]
    error: Optional[str]


class RejectTaskRequest(BaseModel):
    remarks: str
    reviewedBy: str  # Admin user ID


# =============================================
# GET TASK INSTANCES
# =============================================

@router.get("/", response_model=List[TaskInstanceResponse])
def list_task_instances(
    assignment_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List task instances with optional filters"""
    query = db.query(TaskInstance)
    
    if assignment_id:
        query = query.filter(TaskInstance.assignment_id == assignment_id)
    
    if status:
        query = query.filter(TaskInstance.status == status)
    
    instances = query.all()
    
    return [
        TaskInstanceResponse(
            id=str(ti.id),
            taskId=str(ti.task_id),
            assignmentId=str(ti.assignment_id),
            status=ti.status,
            result=ti.result,
            startedAt=ti.started_at,
            completedAt=ti.completed_at,
            dueDate=ti.due_date,
            isWaived=ti.is_waived or False,
            waivedReason=ti.waived_reason
        )
        for ti in instances
    ]


@router.get("/{instance_id}", response_model=TaskInstanceWithDetails)
def get_task_instance(instance_id: str, db: Session = Depends(get_db)):
    """Get a task instance with full task details"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    task = db.query(Task).filter(Task.id == ti.task_id).first()
    
    return TaskInstanceWithDetails(
        id=str(ti.id),
        taskId=str(ti.task_id),
        assignmentId=str(ti.assignment_id),
        status=ti.status,
        result=ti.result,
        startedAt=ti.started_at,
        completedAt=ti.completed_at,
        dueDate=ti.due_date,
        isWaived=ti.is_waived or False,
        waivedReason=ti.waived_reason,
        taskName=task.name if task else "Unknown",
        taskType=task.type if task else "UNKNOWN",
        taskCategory=task.category if task else None,
        taskConfiguration=task.configuration if task else None
    )


# =============================================
# CUSTOM FORM SUBMISSION
# =============================================

@router.post("/{instance_id}/submit-form")
def submit_form(
    instance_id: str, 
    data: SubmitFormRequest, 
    db: Session = Depends(get_db)
):
    """Submit custom form data for a task instance"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    # Get the task to validate form fields
    task = db.query(Task).filter(Task.id == ti.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.type != 'CUSTOM_FORM':
        raise HTTPException(status_code=400, detail="This task is not a custom form")
    
    # Validate required fields
    config = task.configuration or {}
    form_fields = config.get('formFields', [])
    
    errors = []
    for field in form_fields:
        if field.get('required') and field.get('name') not in data.formData:
            errors.append(f"Required field '{field.get('name')}' is missing")
    
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    # Update task instance with form data
    ti.result = {
        "formData": data.formData,
        "documentIds": data.documentIds,
        "submittedAt": datetime.utcnow().isoformat()
    }
    ti.status = 'COMPLETED'
    ti.completed_at = datetime.utcnow()
    
    
    if not ti.started_at:
        ti.started_at = datetime.utcnow()
        
    # Reset review status on new submission
    ti.review_status = 'PENDING_REVIEW'
    ti.admin_remarks = None
    ti.reviewed_by = None
    ti.reviewed_at = None
    
    db.commit()
    db.refresh(ti)
    
    return {
        "success": True,
        "message": "Form submitted successfully",
        "taskInstanceId": str(ti.id),
        "status": ti.status
    }


# =============================================
# DOCUMENT UPLOAD COMPLETION
# =============================================

@router.post("/{instance_id}/complete-upload")
def complete_document_upload(
    instance_id: str,
    document_ids: List[str],
    document_number: Optional[str] = None,
    expiry_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Mark a document upload task as complete with uploaded document references"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    task = db.query(Task).filter(Task.id == ti.task_id).first()
    if task and task.type != 'DOCUMENT_UPLOAD':
        raise HTTPException(status_code=400, detail="This task is not a document upload")
    
    # Verify documents exist
    for doc_id in document_ids:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
    
    # Update task instance
    ti.result = {
        "documentIds": document_ids,
        "documentNumber": document_number,
        "expiryDate": expiry_date,
        "uploadedAt": datetime.utcnow().isoformat()
    }
    ti.status = 'COMPLETED'
    ti.completed_at = datetime.utcnow()
    
    
    if not ti.started_at:
        ti.started_at = datetime.utcnow()

    # Reset review status on new submission
    ti.review_status = 'PENDING_REVIEW'
    ti.admin_remarks = None
    ti.reviewed_by = None
    ti.reviewed_at = None
    
    db.commit()
    
    return {
        "success": True,
        "message": "Document upload completed",
        "taskInstanceId": str(ti.id)
    }


# =============================================
# REST API EXECUTION
# =============================================

@router.post("/{instance_id}/execute-api", response_model=RestApiExecutionResult)
async def execute_rest_api(
    instance_id: str,
    data: ExecuteRestApiRequest,
    db: Session = Depends(get_db)
):
    """Execute the REST API call configured for this task"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    task = db.query(Task).filter(Task.id == ti.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.type != 'REST_API':
        raise HTTPException(status_code=400, detail="This task is not a REST API task")
    
    config = task.configuration or {}
    
    # Build the request
    base_url = config.get('baseUrl', '')
    endpoint = config.get('endpoint', '')
    method = config.get('method', 'GET').upper()
    headers_config = config.get('headers', [])
    request_body_template = config.get('requestBodyTemplate', '')
    auth_config = config.get('authentication', {})
    
    # Build full URL
    url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}" if base_url else endpoint
    
    # Build headers
    headers = {}
    for h in headers_config:
        if h.get('key') and h.get('value'):
            headers[h['key']] = h['value']
    
    # Add authentication
    auth_type = auth_config.get('type', 'NONE')
    if auth_type == 'BEARER':
        headers['Authorization'] = f"Bearer {auth_config.get('token', '')}"
    elif auth_type == 'API_KEY':
        header_name = auth_config.get('headerName', 'X-API-Key')
        headers[header_name] = auth_config.get('apiKey', '')
    elif auth_type == 'BASIC':
        import base64
        credentials = f"{auth_config.get('username', '')}:{auth_config.get('password', '')}"
        encoded = base64.b64encode(credentials.encode()).decode()
        headers['Authorization'] = f"Basic {encoded}"
    
    # Build request body
    body = None
    if request_body_template and method in ['POST', 'PUT', 'PATCH']:
        try:
            body = json.loads(request_body_template)
            # Merge with override data if provided
            if data.overrideData:
                body.update(data.overrideData)
        except json.JSONDecodeError:
            body = request_body_template
    
    # Mark as started
    if not ti.started_at:
        ti.started_at = datetime.utcnow()
        ti.status = 'IN_PROGRESS'
        db.commit()
    
    # Execute the API call
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == 'GET':
                response = await client.get(url, headers=headers)
            elif method == 'POST':
                response = await client.post(url, headers=headers, json=body)
            elif method == 'PUT':
                response = await client.put(url, headers=headers, json=body)
            elif method == 'PATCH':
                response = await client.patch(url, headers=headers, json=body)
            elif method == 'DELETE':
                response = await client.delete(url, headers=headers)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported method: {method}")
        
        # Parse response
        try:
            response_data = response.json()
        except:
            response_data = {"raw": response.text}
        
        # Check if successful
        expected_codes = config.get('expectedStatusCodes', [200, 201, 204])
        is_success = response.status_code in expected_codes
        
        # Update task instance
        ti.result = {
            "statusCode": response.status_code,
            "response": response_data,
            "executedAt": datetime.utcnow().isoformat(),
            "success": is_success
        }
        
        if is_success:
            ti.status = 'COMPLETED'
            ti.completed_at = datetime.utcnow()
        else:
            ti.status = 'BLOCKED'
        
        db.commit()
        
        return RestApiExecutionResult(
            success=is_success,
            statusCode=response.status_code,
            response=response_data,
            error=None if is_success else f"Unexpected status code: {response.status_code}"
        )
        
    except httpx.TimeoutException:
        ti.result = {"error": "Request timed out"}
        ti.status = 'BLOCKED'
        db.commit()
        
        return RestApiExecutionResult(
            success=False,
            statusCode=None,
            response=None,
            error="Request timed out"
        )
    except Exception as e:
        ti.result = {"error": str(e)}
        ti.status = 'BLOCKED'
        db.commit()
        
        return RestApiExecutionResult(
            success=False,
            statusCode=None,
            response=None,
            error=str(e)
        )


# =============================================
# REDIRECT TASK HANDLING
# =============================================

@router.post("/{instance_id}/start-redirect")
def start_redirect(
    instance_id: str,
    data: StartRedirectRequest,
    db: Session = Depends(get_db)
):
    """Generate the redirect URL for a redirect task"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    task = db.query(Task).filter(Task.id == ti.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.type != 'REDIRECT':
        raise HTTPException(status_code=400, detail="This task is not a redirect task")
    
    config = task.configuration or {}
    
    # Build redirect URL
    base_redirect_url = config.get('redirectUrl', '')
    url_params = config.get('urlParameters', [])
    
    # Build query string from parameters
    params = []
    for p in url_params:
        if p.get('key') and p.get('value'):
            # Variable substitution could happen here
            value = p['value']
            # Replace placeholders like {{taskInstanceId}}
            value = value.replace('{{taskInstanceId}}', str(ti.id))
            value = value.replace('{{assignmentId}}', str(ti.assignment_id))
            params.append(f"{p['key']}={value}")
    
    # Add return URL if provided
    if data.returnUrl:
        params.append(f"returnUrl={data.returnUrl}")
    
    # Construct full URL
    if params:
        separator = '&' if '?' in base_redirect_url else '?'
        full_url = f"{base_redirect_url}{separator}{'&'.join(params)}"
    else:
        full_url = base_redirect_url
    
    # Mark as started
    if not ti.started_at:
        ti.started_at = datetime.utcnow()
    ti.status = 'IN_PROGRESS'
    ti.result = {
        "redirectUrl": full_url,
        "startedAt": datetime.utcnow().isoformat()
    }
    db.commit()
    
    return {
        "success": True,
        "redirectUrl": full_url,
        "openInNewTab": config.get('openInNewTab', True),
        "taskInstanceId": str(ti.id)
    }


@router.post("/{instance_id}/poll-status")
async def poll_redirect_status(
    instance_id: str,
    db: Session = Depends(get_db)
):
    """Poll external system to check redirect task completion status"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    task = db.query(Task).filter(Task.id == ti.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.type != 'REDIRECT':
        raise HTTPException(status_code=400, detail="This task is not a redirect task")
    
    config = task.configuration or {}
    status_tracking = config.get('statusTracking', {})
    
    if not status_tracking.get('enabled'):
        return {"success": False, "message": "Status tracking not enabled for this task"}
    
    polling_url = status_tracking.get('pollingUrl', '')
    if not polling_url:
        return {"success": False, "message": "Polling URL not configured"}
    
    # Replace placeholders in polling URL
    polling_url = polling_url.replace('{{taskInstanceId}}', str(ti.id))
    polling_url = polling_url.replace('{{assignmentId}}', str(ti.assignment_id))
    
    polling_method = status_tracking.get('pollingMethod', 'GET').upper()
    polling_headers = {}
    
    for h in status_tracking.get('pollingHeaders', []):
        if h.get('key') and h.get('value'):
            polling_headers[h['key']] = h['value']
    
    # Add polling authentication
    polling_auth = status_tracking.get('pollingAuthentication', {})
    auth_type = polling_auth.get('type', 'NONE')
    if auth_type == 'BEARER':
        polling_headers['Authorization'] = f"Bearer {polling_auth.get('token', '')}"
    elif auth_type == 'API_KEY':
        header_name = polling_auth.get('headerName', 'X-API-Key')
        polling_headers[header_name] = polling_auth.get('apiKey', '')
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if polling_method == 'GET':
                response = await client.get(polling_url, headers=polling_headers)
            else:
                response = await client.post(polling_url, headers=polling_headers)
        
        response_data = response.json()
        
        # Extract status from response using configured path
        status_field_path = status_tracking.get('statusFieldPath', 'status')
        external_status = response_data
        for key in status_field_path.split('.'):
            if isinstance(external_status, dict):
                external_status = external_status.get(key)
            else:
                external_status = None
                break
        
        # Map external status to internal status
        status_mapping = status_tracking.get('statusMapping', [])
        new_status = None
        for mapping in status_mapping:
            if mapping.get('externalStatus') == str(external_status):
                new_status = mapping.get('taskStatus')
                break
        
        if new_status:
            ti.status = new_status
            if new_status == 'COMPLETED':
                ti.completed_at = datetime.utcnow()
            
            # Update result
            existing_result = ti.result or {}
            existing_result['polledStatus'] = external_status
            existing_result['lastPolledAt'] = datetime.utcnow().isoformat()
            ti.result = existing_result
            db.commit()
        
        return {
            "success": True,
            "externalStatus": external_status,
            "mappedStatus": new_status,
            "currentStatus": ti.status
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# =============================================
# MANUAL STATUS UPDATE
# =============================================

@router.put("/{instance_id}/status")
def update_task_instance_status(
    instance_id: str,
    data: UpdateStatusRequest,
    db: Session = Depends(get_db)
):
    """Manually update task instance status"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    valid_statuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'WAIVED']
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    ti.status = data.status
    
    if data.status == 'IN_PROGRESS' and not ti.started_at:
        ti.started_at = datetime.utcnow()
    elif data.status == 'COMPLETED':
        ti.completed_at = datetime.utcnow()
    
    if data.result:
        existing_result = ti.result or {}
        existing_result.update(data.result)
        ti.result = existing_result
    
    ti.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "message": f"Status updated to {data.status}",
        "taskInstanceId": str(ti.id)
    }


# =============================================
# WAIVE TASK
# =============================================

@router.post("/{instance_id}/waive")
def waive_task_instance(
    instance_id: str,
    reason: str,
    waived_by: str,
    waived_until: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Waive a task instance"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    ti.is_waived = True
    ti.waived_reason = reason
    ti.waived_by = uuid_lib.UUID(waived_by)
    ti.waived_at = datetime.utcnow()
    
    if waived_until:
        try:
            ti.waived_until = datetime.strptime(waived_until, "%Y-%m-%d")
        except ValueError:
            pass
    
    ti.status = 'WAIVED'
    ti.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "message": "Task waived successfully",
        "taskInstanceId": str(ti.id)
    }


# =============================================
# ADMIN REVIEW - APPROVE/REJECT
# =============================================

@router.post("/{instance_id}/approve")
def approve_task_instance(
    instance_id: str,
    reviewed_by: str,
    db: Session = Depends(get_db)
):
    """Approve a submitted task instance"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    if ti.status != 'COMPLETED':
        raise HTTPException(status_code=400, detail="Can only approve completed tasks")
    
    ti.review_status = 'APPROVED'
    ti.reviewed_by = uuid_lib.UUID(reviewed_by)
    ti.reviewed_at = datetime.utcnow()
    ti.admin_remarks = None  # Clear any previous rejection remarks
    ti.updated_at = datetime.utcnow()
    
    # Get team member ID for notification
    assignment = db.query(ProjectAssignment).filter(
        ProjectAssignment.id == ti.assignment_id
    ).first()
    
    if assignment:
        # Create approval notification
        task = db.query(Task).filter(Task.id == ti.task_id).first()
        notification = Notification(
            team_member_id=assignment.team_member_id,
            type='TASK_APPROVED',
            title='Task Approved',
            message=f'Your submission for "{task.name if task else "task"}" has been approved.',
            task_instance_id=ti.id,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notification)
    
    db.commit()
    
    return {
        "success": True,
        "message": "Task approved successfully",
        "taskInstanceId": str(ti.id),
        "reviewStatus": "APPROVED"
    }


@router.post("/{instance_id}/reject")
def reject_task_instance(
    instance_id: str,
    data: RejectTaskRequest,
    db: Session = Depends(get_db)
):
    """Reject a submitted task instance with remarks for resubmission"""
    ti = db.query(TaskInstance).filter(TaskInstance.id == instance_id).first()
    if not ti:
        raise HTTPException(status_code=404, detail="Task instance not found")
    
    if ti.status != 'COMPLETED':
        raise HTTPException(status_code=400, detail="Can only reject completed tasks")
    
    if not data.remarks or len(data.remarks.strip()) == 0:
        raise HTTPException(status_code=400, detail="Rejection remarks are required")
    
    # Clean up associated documents (orphans)
    documents = db.query(Document).filter(Document.task_instance_id == instance_id).all()
    for doc in documents:
        db.delete(doc)

    # Clear form data
    ti.result = None
    
    ti.review_status = 'REJECTED'
    ti.admin_remarks = data.remarks.strip()
    ti.reviewed_by = uuid_lib.UUID(data.reviewedBy)
    ti.reviewed_at = datetime.utcnow()
    # Reset status to allow resubmission
    ti.status = 'IN_PROGRESS'
    ti.completed_at = None
    ti.updated_at = datetime.utcnow()
    
    # Get team member ID for notification
    assignment = db.query(ProjectAssignment).filter(
        ProjectAssignment.id == ti.assignment_id
    ).first()
    
    if assignment:
        # Create rejection notification with remarks
        task = db.query(Task).filter(Task.id == ti.task_id).first()
        notification = Notification(
            team_member_id=assignment.team_member_id,
            type='TASK_REJECTED',
            title='Task Needs Revision',
            message=f'Your submission for "{task.name if task else "task"}" was rejected. Reason: {data.remarks.strip()}',
            task_instance_id=ti.id,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notification)
        
        # Update assignment progress (decrement completed tasks)
        if assignment.completed_tasks and assignment.completed_tasks > 0:
            assignment.completed_tasks -= 1
            if assignment.total_tasks > 0:
                assignment.progress_percentage = round(
                    (assignment.completed_tasks / assignment.total_tasks) * 100, 2
                )
            assignment.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Task rejected and candidate notified",
        "taskInstanceId": str(ti.id),
        "reviewStatus": "REJECTED"
    }

