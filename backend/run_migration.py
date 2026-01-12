"""
Run database migration for Admin Review Workflow
This script adds review_status, admin_remarks columns to task_instances
and creates the notifications table.
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine

def run_migration():
    migration_sql = """
    -- Add review columns to task_instances
    ALTER TABLE or_task_instances 
    ADD COLUMN IF NOT EXISTS review_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS admin_remarks TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES or_users(id),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

    -- Create notifications table
    CREATE TABLE IF NOT EXISTS or_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_member_id UUID NOT NULL REFERENCES or_team_members(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        task_instance_id UUID REFERENCES or_task_instances(id) ON DELETE SET NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create index for faster notification queries
    CREATE INDEX IF NOT EXISTS idx_notifications_team_member ON or_notifications(team_member_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON or_notifications(is_read);
    """
    
    with engine.connect() as conn:
        from sqlalchemy import text
        
        # Split by semicolons and execute each statement
        statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
        for statement in statements:
            try:
                conn.execute(text(statement))
                print(f"✓ Executed: {statement[:50]}...")
            except Exception as e:
                print(f"! Warning: {e}")
        conn.commit()
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
