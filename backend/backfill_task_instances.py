"""
Backfill script to create TaskInstances for existing ProjectAssignments
that were created before the auto-creation logic was added.
"""

from sqlalchemy import text
from datetime import datetime
import uuid

from app.core.database import SessionLocal

def backfill_task_instances():
    db = SessionLocal()
    
    try:
        # Get all project assignments with their template_id from project
        assignments_query = text("""
            SELECT pa.id as assignment_id, pa.project_id, p.template_id
            FROM or_project_assignments pa
            JOIN or_projects p ON pa.project_id = p.id
            WHERE p.template_id IS NOT NULL
        """)
        
        assignments = db.execute(assignments_query).fetchall()
        print(f"Found {len(assignments)} project assignments with templates")
        
        total_created = 0
        
        for assignment in assignments:
            assignment_id = assignment[0]
            template_id = assignment[2]
            
            # Check if this assignment already has task instances
            existing_count = db.execute(
                text("SELECT COUNT(*) FROM or_task_instances WHERE assignment_id = :aid"),
                {"aid": assignment_id}
            ).scalar()
            
            if existing_count > 0:
                print(f"  Assignment {str(assignment_id)[:8]}... already has {existing_count} instances, skipping")
                continue
            
            # Get all tasks from the template via task_groups
            # Templates -> Task Groups -> Tasks
            tasks_query = text("""
                SELECT t.id as task_id
                FROM or_tasks t
                JOIN or_task_groups tg ON t.task_group_id = tg.id
                WHERE tg.template_id = :tid
            """)
            template_tasks = db.execute(tasks_query, {"tid": template_id}).fetchall()
            
            if not template_tasks:
                print(f"  Assignment {str(assignment_id)[:8]}... - template has no tasks, skipping")
                continue
            
            # Create task instances for each task
            instances_created = 0
            for task in template_tasks:
                task_id = task[0]
                new_id = uuid.uuid4()
                
                db.execute(
                    text("""
                        INSERT INTO or_task_instances (id, task_id, assignment_id, status, is_waived, created_at)
                        VALUES (:id, :task_id, :assignment_id, 'PENDING', false, :created_at)
                    """),
                    {
                        "id": new_id,
                        "task_id": task_id,
                        "assignment_id": assignment_id,
                        "created_at": datetime.utcnow()
                    }
                )
                instances_created += 1
            
            print(f"  Assignment {str(assignment_id)[:8]}... - created {instances_created} task instances")
            total_created += instances_created
        
        db.commit()
        print(f"\n✅ Total task instances created: {total_created}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    backfill_task_instances()
