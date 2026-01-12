"""
Script to clear all database tables and recreate admin user
"""
from app.core.database import SessionLocal
from app.models.models import User
from sqlalchemy import text
from datetime import datetime
import uuid
import hashlib

db = SessionLocal()

# Tables to clear in order (respecting foreign key constraints)
tables = [
    'or_documents',
    'or_task_comments', 
    'or_task_instances',
    'or_project_assignments',
    'or_project_contacts',
    'or_projects',
    'or_tasks',
    'or_task_groups',
    'or_checklist_templates',
    'or_team_members',
    'or_requisition_line_items',
    'or_requisitions',
    'or_ppm_projects',
    'or_eligibility_rules',
    'or_eligibility_criteria',
    'or_communications',
    'or_clients',
    'or_users'
]

print('Clearing all tables...')
for table in tables:
    try:
        db.execute(text(f'TRUNCATE TABLE {table} CASCADE'))
        print(f'  Cleared {table}')
    except Exception as e:
        print(f'  Error clearing {table}: {e}')

db.commit()
print('All tables cleared!')

# Create admin user
print('Creating admin user...')
password = 'admin123'
password_hash = hashlib.sha256(password.encode()).hexdigest()
admin = User(
    id=uuid.uuid4(),
    email='admin@rite.com',
    password_hash=password_hash,
    first_name='Admin',
    last_name='User',
    role='ADMIN',
    is_active=True,
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow()
)
db.add(admin)
db.commit()
print('Admin user created!')
print('  Email: admin@rite.com')
print('  Password: admin123')

db.close()
print('Done!')
