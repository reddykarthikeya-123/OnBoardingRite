"""
Admin Management Routes
Handles admin profile updates, password changes, and admin user creation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
import hashlib

from app.core.database import get_db
from app.models.models import User

router = APIRouter()


# =============================================
# PYDANTIC SCHEMAS
# =============================================

class UpdateProfileRequest(BaseModel):
    firstName: str
    lastName: str


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str


class CreateAdminRequest(BaseModel):
    email: EmailStr
    firstName: str
    lastName: str
    password: str


class AdminUserResponse(BaseModel):
    id: str
    email: str
    firstName: str
    lastName: str
    role: str
    isActive: bool
    createdAt: Optional[str]


# =============================================
# HELPER FUNCTIONS
# =============================================

def hash_password(password: str) -> str:
    """Simple password hashing using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash


def get_user_from_token(token: str, db: Session) -> Optional[User]:
    """Get user from JWT token"""
    import jwt
    from app.core.config import settings
    JWT_SECRET = settings.JWT_SECRET
    JWT_ALGORITHM = "HS256"
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except jwt.ExpiredSignatureError:
        print("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None
    except Exception as e:
        print(f"Token error: {e}")
        return None


def is_admin(user: User) -> bool:
    """Check if user is an admin (case-insensitive)"""
    if not user or not user.role:
        return False
    return user.role.lower() == "admin"


# =============================================
# GET CURRENT ADMIN PROFILE
# =============================================

@router.get("/profile")
async def get_admin_profile(token: str, db: Session = Depends(get_db)):
    """Get current admin's profile"""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "id": str(user.id),
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role,
        "isActive": user.is_active
    }


# =============================================
# UPDATE ADMIN PROFILE
# =============================================

@router.put("/profile")
async def update_admin_profile(
    token: str,
    data: UpdateProfileRequest,
    db: Session = Depends(get_db)
):
    """Update current admin's profile (name only)"""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    user.first_name = data.firstName
    user.last_name = data.lastName
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "message": "Profile updated successfully",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role
        }
    }


# =============================================
# CHANGE PASSWORD
# =============================================

@router.put("/password")
async def change_admin_password(
    token: str,
    data: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    """Change current admin's password"""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Verify current password
    if not verify_password(data.currentPassword, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if data.newPassword != data.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    if len(data.newPassword) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Update password
    user.password_hash = hash_password(data.newPassword)
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Password changed successfully"
    }


# =============================================
# LIST ALL ADMIN USERS
# =============================================

@router.get("/users")
async def list_admin_users(token: str, db: Session = Depends(get_db)):
    """List all admin users"""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    admins = db.query(User).filter(User.role == "admin").all()
    
    return [
        {
            "id": str(admin.id),
            "email": admin.email,
            "firstName": admin.first_name,
            "lastName": admin.last_name,
            "role": admin.role,
            "isActive": admin.is_active,
            "createdAt": admin.created_at.isoformat() if admin.created_at else None
        }
        for admin in admins
    ]


# =============================================
# CREATE NEW ADMIN USER
# =============================================

@router.post("/users")
async def create_admin_user(
    token: str,
    data: CreateAdminRequest,
    db: Session = Depends(get_db)
):
    """Create a new admin user"""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password
    if len(data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Create new admin
    new_admin = User(
        email=data.email,
        first_name=data.firstName,
        last_name=data.lastName,
        password_hash=hash_password(data.password),
        role="admin",
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    return {
        "success": True,
        "message": "Admin user created successfully",
        "user": {
            "id": str(new_admin.id),
            "email": new_admin.email,
            "firstName": new_admin.first_name,
            "lastName": new_admin.last_name,
            "role": new_admin.role,
            "isActive": new_admin.is_active
        }
    }


# =============================================
# DELETE ADMIN USER
# =============================================

@router.delete("/users/{user_id}")
async def delete_admin_user(
    user_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    """Delete an admin user"""
    current_user = get_user_from_token(token, db)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Prevent self-deletion
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Find user to delete
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user_to_delete)
    db.commit()
    
    return {
        "success": True,
        "message": "Admin user deleted successfully"
    }
