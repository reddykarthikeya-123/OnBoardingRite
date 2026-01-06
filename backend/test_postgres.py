import sys
sys.path.insert(0, '.')

from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.models.models import Project, ProjectAssignment

print(f"DATABASE_URL: {settings.DATABASE_URL}")

try:
    with engine.connect() as conn:
        result = conn.execute("SELECT 1")
        print(f"Connection test: {result.fetchone()}")
except Exception as e:
    print(f"Connection error: {e}")

try:
    db = SessionLocal()
    projects = db.query(Project).limit(5).all()
    print(f"Projects found: {len(projects)}")
    for p in projects:
        print(f"  - {p.name} (status: {p.status})")
    db.close()
except Exception as e:
    print(f"Query error: {e}")
    import traceback
    traceback.print_exc()
