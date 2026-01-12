import os
import sys
# Add current dir to path to find app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def init_db():
    print(f"Connecting to {settings.POSTGRES_HOST}...")
    print(f"URL: {settings.DATABASE_URL.replace(settings.POSTGRES_PASSWORD, '******')}")
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        # Path to schema_ddl.sql (in root, one level up from backend)
        # script is in backend/
        schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "schema_ddl.sql")
        
        print(f"Reading schema from {schema_path}...")
        with open(schema_path, "r") as f:
            sql_script = f.read()

        print("Executing schema script...")
        # Use raw connection for multi-statement execution
        conn = engine.raw_connection()
        try:
            cursor = conn.cursor()
            
            # Prepend DROP statements to ensure clean state
            print("Dropping existing tables...")
            drop_stmt = """
            DROP TABLE IF EXISTS 
                or_notifications, or_communications, or_documents, or_task_comments, 
                or_task_instances, or_project_assignments, or_project_contacts, 
                or_projects, or_requisition_line_items, or_requisitions, 
                or_ppm_projects, or_team_members, or_tasks, or_task_groups, 
                or_checklist_templates, or_eligibility_rules, or_eligibility_criteria, 
                or_users, or_clients 
            CASCADE;
            """
            cursor.execute(drop_stmt)
            conn.commit() # Commit the drop
            print("✅ Existing tables dropped.")
            
            print("Creating schema...")
            cursor.execute(sql_script)
            conn.commit()
            cursor.close()
            conn.close()
            print("✅ Schema initialized successfully!")
        except Exception as e:
            conn.rollback()
            raise e
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_db()
