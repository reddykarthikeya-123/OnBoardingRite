import sys
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.models.models import Project, ProjectAssignment

try:
    db = SessionLocal()
    
    # Test each query individually
    print("1. Active Projects...")
    active = db.query(Project).filter(Project.status == 'ACTIVE').count()
    print(f"   Active projects: {active}")
    
    print("2. Total Assignments...")
    total = db.query(ProjectAssignment).count()
    print(f"   Total: {total}")
    
    print("3. Completed...")
    completed = db.query(ProjectAssignment).filter(ProjectAssignment.status == 'COMPLETED').count()
    print(f"   Completed: {completed}")
    
    print("4. In Progress...")
    in_progress = db.query(ProjectAssignment).filter(ProjectAssignment.status == 'IN_PROGRESS').count()
    print(f"   In Progress: {in_progress}")
    
    print("5. Blocked...")
    blocked = db.query(ProjectAssignment).filter(ProjectAssignment.status == 'BLOCKED').count()
    print(f"   Blocked: {blocked}")
    
    print("\nAll queries passed!")
    
    db.close()
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
