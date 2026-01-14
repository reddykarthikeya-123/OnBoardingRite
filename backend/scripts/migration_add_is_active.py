"""
Database Migration: Add is_active column to team members
Run this script to add the is_active column and set existing members to active
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

def run_migration():
    print("=" * 50)
    print("  Migration: Add is_active to team_members")
    print("=" * 50)
    
    with engine.connect() as conn:
        # Check if column already exists
        check_sql = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'or_team_members' AND column_name = 'is_active'
        """)
        result = conn.execute(check_sql)
        exists = result.fetchone()
        
        if exists:
            print("✅ Column 'is_active' already exists")
        else:
            # Add the column
            print("📝 Adding 'is_active' column...")
            add_col_sql = text("""
                ALTER TABLE or_team_members 
                ADD COLUMN is_active BOOLEAN DEFAULT TRUE
            """)
            conn.execute(add_col_sql)
            conn.commit()
            print("✅ Column added")
        
        # Update existing records to true
        print("📝 Setting existing members to active...")
        update_sql = text("""
            UPDATE or_team_members 
            SET is_active = TRUE 
            WHERE is_active IS NULL
        """)
        result = conn.execute(update_sql)
        conn.commit()
        print(f"✅ Updated {result.rowcount} records")
        
    print("\n✅ Migration complete!")

if __name__ == "__main__":
    run_migration()
