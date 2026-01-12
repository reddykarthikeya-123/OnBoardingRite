"""
Authentication Routes
Handles login for admins and candidates, password setup, and token verification
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
import jwt

from app.core.database import get_db
from app.models.models import User, TeamMember, ProjectAssignment

router = APIRouter()

# JWT Configuration
JWT_SECRET = "onboardrite-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


# =============================================
# PYDANTIC SCHEMAS
# =============================================

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class CandidateLoginRequest(BaseModel):
    email: EmailStr
    password: str


class SetPasswordRequest(BaseModel):
    email: EmailStr
    newPassword: str
    confirmPassword: str


class LoginResponse(BaseModel):
    success: bool
    token: str
    user: dict
    role: str
    isFirstLogin: bool = False


class TokenVerifyResponse(BaseModel):
    valid: bool
    user: Optional[dict]
    role: Optional[str]


# =============================================
# HELPER FUNCTIONS
# =============================================

def hash_password(password: str) -> str:
    """Simple password hashing using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash


def create_jwt_token(user_id: str, role: str, email: str) -> str:
    """Create a JWT token"""
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# =============================================
# ADMIN LOGIN
# =============================================

@router.post("/admin/login", response_model=LoginResponse)
def admin_login(data: AdminLoginRequest, db: Session = Depends(get_db)):
    """Login for admin/HR users"""
    
    # Find user by email
    user = db.query(User).filter(
        User.email == data.email.lower(),
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create token
    token = create_jwt_token(str(user.id), user.role, user.email)
    
    return LoginResponse(
        success=True,
        token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role
        },
        role="admin",
        isFirstLogin=False
    )


# =============================================
# CANDIDATE LOGIN
# =============================================

@router.post("/candidate/login", response_model=LoginResponse)
def candidate_login(data: CandidateLoginRequest, db: Session = Depends(get_db)):
    """Login for candidates (team members)"""
    
    # Find team member by email
    member = db.query(TeamMember).filter(
        TeamMember.email == data.email.lower()
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if first login (no password set yet)
    if member.is_first_login or not member.password_hash:
        # For first login, we just verify the email exists
        # and redirect them to set password
        token = create_jwt_token(str(member.id), "candidate", member.email)
        
        return LoginResponse(
            success=True,
            token=token,
            user={
                "id": str(member.id),
                "email": member.email,
                "firstName": member.first_name,
                "lastName": member.last_name
            },
            role="candidate",
            isFirstLogin=True
        )
    
    # Verify password for returning users
    if not verify_password(data.password, member.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last login
    member.last_login = datetime.utcnow()
    db.commit()
    
    # Get assignment info
    assignment = db.query(ProjectAssignment).filter(
        ProjectAssignment.team_member_id == member.id
    ).first()
    
    # Create token
    token = create_jwt_token(str(member.id), "candidate", member.email)
    
    return LoginResponse(
        success=True,
        token=token,
        user={
            "id": str(member.id),
            "email": member.email,
            "firstName": member.first_name,
            "lastName": member.last_name,
            "assignmentId": str(assignment.id) if assignment else None
        },
        role="candidate",
        isFirstLogin=False
    )


# =============================================
# SET PASSWORD (First Login)
# =============================================

@router.post("/candidate/set-password")
def set_candidate_password(data: SetPasswordRequest, db: Session = Depends(get_db)):
    """Set password for first-time candidates"""
    
    if data.newPassword != data.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    if len(data.newPassword) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Find member
    member = db.query(TeamMember).filter(
        TeamMember.email == data.email.lower()
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Set password
    member.password_hash = hash_password(data.newPassword)
    member.is_first_login = False
    member.last_login = datetime.utcnow()
    db.commit()
    
    # Get assignment
    assignment = db.query(ProjectAssignment).filter(
        ProjectAssignment.team_member_id == member.id
    ).first()
    
    # Create new token
    token = create_jwt_token(str(member.id), "candidate", member.email)
    
    return {
        "success": True,
        "message": "Password set successfully",
        "token": token,
        "user": {
            "id": str(member.id),
            "email": member.email,
            "firstName": member.first_name,
            "lastName": member.last_name,
            "assignmentId": str(assignment.id) if assignment else None
        }
    }


# =============================================
# VERIFY TOKEN
# =============================================

@router.get("/me")
def get_current_user(token: str, db: Session = Depends(get_db)):
    """Verify token and return current user info"""
    
    payload = decode_jwt_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    role = payload.get("role")
    user_id = payload.get("sub")
    
    if role == "admin" or role in ["ADMIN", "PROJECT_MANAGER", "PROCESSOR", "VIEWER"]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "valid": True,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "role": user.role
            },
            "role": "admin"
        }
    else:
        member = db.query(TeamMember).filter(TeamMember.id == user_id).first()
        if not member:
            raise HTTPException(status_code=401, detail="User not found")
        
        assignment = db.query(ProjectAssignment).filter(
            ProjectAssignment.team_member_id == member.id
        ).first()
        
        return {
            "valid": True,
            "user": {
                "id": str(member.id),
                "email": member.email,
                "firstName": member.first_name,
                "lastName": member.last_name,
                "assignmentId": str(assignment.id) if assignment else None
            },
            "role": "candidate"
        }


# =============================================
# LOGOUT (optional - client-side token removal)
# =============================================

@router.post("/logout")
def logout():
    """Logout - client should clear token"""
    return {"success": True, "message": "Logged out successfully"}


# =============================================
# CHANGE PASSWORD (for returning candidates)
# =============================================

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str


@router.post("/candidate/change-password")
def change_candidate_password(data: ChangePasswordRequest, token: str, db: Session = Depends(get_db)):
    """Change password for logged-in candidates"""
    
    # Verify token
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    
    # Find member
    member = db.query(TeamMember).filter(TeamMember.id == user_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(data.currentPassword, member.password_hash):
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
    member.password_hash = hash_password(data.newPassword)
    db.commit()
    
    return {"success": True, "message": "Password changed successfully"}
