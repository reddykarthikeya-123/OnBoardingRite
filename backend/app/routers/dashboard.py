from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.core.database import get_db
from app.models.models import Project, ProjectAssignment, TaskInstance, Task, TeamMember, ProjectContact
from app.schemas.dashboard import (
    GlobalStatsResponse, ProjectSummary, TeamMemberDetail, 
    TaskCategoryStats, TaskStats, LastActivity, ProjectFlags
)

router = APIRouter()

@router.get("/stats/global", response_model=GlobalStatsResponse)
def get_global_stats(db: Session = Depends(get_db)):
    # 1. Active Projects
    active_projects_count = db.query(Project).filter(Project.status == 'ACTIVE').count()
    
    # 2. Team Members (Active only)
    total_members = db.query(TeamMember).filter(TeamMember.is_active == True).count()
    
    # 3. Completion Stats
    completed = db.query(ProjectAssignment).filter(ProjectAssignment.status == 'COMPLETED').count()
    in_progress = db.query(ProjectAssignment).filter(ProjectAssignment.status == 'IN_PROGRESS').count()
    
    # 4. Blocked Members
    blocked_members = db.query(ProjectAssignment).filter(ProjectAssignment.status == 'BLOCKED').count()
    
    return GlobalStatsResponse(
        activeProjects=active_projects_count,
        totalTeamMembers=total_members,
        completedOnboarding=completed,
        inProgress=in_progress,
        blockedMembers=blocked_members,
        memberGrowthThisWeek=0  # Placeholder
    )

@router.get("/projects/summary", response_model=List[ProjectSummary])
def get_projects_summary(db: Session = Depends(get_db)):
    active_projects = db.query(Project).filter(Project.status == 'ACTIVE').all()
    
    summary_list = []
    for p in active_projects:
        # Count assignments for this project
        total = db.query(ProjectAssignment).filter(ProjectAssignment.project_id == p.id).count()
        completed = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == p.id,
            ProjectAssignment.status == 'COMPLETED'
        ).count()
        
        completion_pct = 0
        if total > 0:
            completion_pct = int((completed / total) * 100)
            
        summary_list.append(ProjectSummary(
            id=str(p.id),
            name=p.name,
            clientName=p.client_name,
            location=p.location,
            flags=ProjectFlags(isODRISA=bool(p.is_odrisa), isDOD=bool(p.is_dod)),
            totalMembers=total,
            completedMembers=completed,
            completionPercentage=completion_pct
        ))
        
    return summary_list

@router.get("/projects/{project_id}/members", response_model=List[TeamMemberDetail])
def get_project_members(project_id: str, db: Session = Depends(get_db)):
    # Get assignments for this project
    assignments = db.query(ProjectAssignment).filter(
        ProjectAssignment.project_id == project_id
    ).all()
    
    result = []
    for a in assignments:
        # Get team member info
        tm = a.team_member
        if not tm:
            continue
        
        # Get task stats
        task_query = db.query(
            Task.category,
            TaskInstance.status,
            func.count(TaskInstance.id)
        ).join(TaskInstance, Task.id == TaskInstance.task_id)\
         .filter(TaskInstance.assignment_id == a.id)\
         .group_by(Task.category, TaskInstance.status)\
         .all()
         
        # Initialize stats container
        stats = {
            'forms': {'completed': 0, 'total': 0},
            'docs': {'completed': 0, 'total': 0},
            'compliance': {'completed': 0, 'total': 0},
            'training': {'completed': 0, 'total': 0}
        }
        
        # Mapping DB category to Frontend category keys
        cat_map = {
            'FORMS': 'forms',
            'DOCUMENTS': 'docs',
            'CERTIFICATIONS': 'compliance', 
            'COMPLIANCE': 'compliance',
            'TRAININGS': 'training'
        }
        
        for cat, status, count in task_query:
            key = cat_map.get(cat, 'forms')
            if key in stats:
                stats[key]['total'] += count
                if status == 'COMPLETED':
                    stats[key]['completed'] += count
        
        result.append(TeamMemberDetail(
            id=str(tm.id),
            firstName=tm.first_name,
            lastName=tm.last_name,
            ssn=None,  # Never expose SSN
            trade=a.trade,
            category=a.category,
            status=a.status,
            progressPercentage=int(a.progress_percentage) if a.progress_percentage else 0,
            assignedProcessorName=None,  # Could fetch via processor_id
            lastActivity=LastActivity(description="Updated profile", timeAgo="2h ago"),
            taskStats=TaskCategoryStats(
                forms=TaskStats(**stats['forms']),
                docs=TaskStats(**stats['docs']),
                compliance=TaskStats(**stats['compliance']),
                training=TaskStats(**stats['training'])
            )
        ))
        
    return result
