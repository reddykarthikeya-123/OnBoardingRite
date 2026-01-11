"""Fix admin user with correct SHA256 hash"""
from app.core.database import SessionLocal
from app.models.models import User
from sqlalchemy import text
from datetime import datetime
import hashlib
import uuid

db = SessionLocal()

# Delete existing admin
db.execute(text("DELETE FROM or_users WHERE email = 'admin@rite.com'"))
db.commit()

# Create admin with SHA256 hash (matching auth.py's hash_password)
password_hash = hashlib.sha256('admin123'.encode()).hexdigest()

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

print('Admin recreated with SHA256 hash!')
print('  Email: admin@rite.com')
print('  Password: admin123')
db.close()
