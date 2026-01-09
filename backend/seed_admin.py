"""
Seed script to create a test admin user
Run this after setting up the database
"""
import hashlib
import sys
import os

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.models import User, Base

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_admin():
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing = db.query(User).filter(User.email == "admin@onboardrite.com").first()
        if existing:
            print("Admin user already exists!")
            print(f"  Email: admin@onboardrite.com")
            return
        
        # Create admin user
        admin = User(
            email="admin@onboardrite.com",
            password_hash=hash_password("admin123"),
            first_name="Admin",
            last_name="User",
            role="ADMIN",
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print("  Email: admin@onboardrite.com")
        print("  Password: admin123")
        print("")
        print("Use these credentials to log in as admin.")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
