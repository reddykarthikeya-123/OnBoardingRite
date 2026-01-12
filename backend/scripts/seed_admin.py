"""
Seed script to create a test admin user
Run this after setting up the database
"""
import hashlib
import sys
import os

# Add the backend directory to path (parent of scripts/)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models.models import User, Base

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_admin():
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        email = "admin@rite.com"
        password = "admin123"
        
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Admin user {email} already exists!")
            return
        
        # Create admin user
        admin = User(
            email=email,
            password_hash=hash_password(password),
            first_name="Admin",
            last_name="User",
            role="ADMIN",
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print("")
        print("Use these credentials to log in as admin.")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
