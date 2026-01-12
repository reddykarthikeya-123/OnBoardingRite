import json
from sqlalchemy import (
    Column, String, Integer, Date, DateTime, Boolean, 
    Text, ForeignKey, TIMESTAMP, Numeric
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

# Shared JSON parsing helper
def parse_json_field(field_value):
    if not field_value:
        return {}
    if isinstance(field_value, dict):
        return field_value
    try:
        return json.loads(str(field_value))
    except (json.JSONDecodeError, TypeError):
        return {}

class Client(Base):
    __tablename__ = "or_clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True)
    industry = Column(String(100))
    contact_email = Column(String(255))
    contact_phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

class User(Base):
    __tablename__ = "or_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

class EligibilityCriteria(Base):
    __tablename__ = "or_eligibility_criteria"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    root_group_logic = Column(String(10), default='AND')
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    
    rules = relationship("EligibilityRule", back_populates="criteria", cascade="all, delete-orphan", foreign_keys="EligibilityRule.criteria_id")

class EligibilityRule(Base):
    __tablename__ = "or_eligibility_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    criteria_id = Column(UUID(as_uuid=True), ForeignKey("or_eligibility_criteria.id"))
    parent_group_id = Column(UUID(as_uuid=True), ForeignKey("or_eligibility_rules.id"))
    rule_type = Column(String(50), nullable=False)
    group_logic = Column(String(10))
    field_category = Column(String(50))
    field_name = Column(String(100))
    operator = Column(String(50))
    value = Column(Text)
    sql_query = Column(Text)
    display_order = Column(Integer, default=0)
    created_at = Column(TIMESTAMP)
    
    criteria = relationship("EligibilityCriteria", back_populates="rules", foreign_keys=[criteria_id])
    parent_group = relationship("EligibilityRule", remote_side=[id], backref="child_rules")


class ChecklistTemplate(Base):
    __tablename__ = "or_checklist_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    client_id = Column(UUID(as_uuid=True), ForeignKey("or_clients.id"))
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    eligibility_criteria_id = Column(UUID(as_uuid=True))
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    created_by = Column(UUID(as_uuid=True), ForeignKey("or_users.id"))
    
    task_groups = relationship("TaskGroup", back_populates="template")

class TaskGroup(Base):
    __tablename__ = "or_task_groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("or_checklist_templates.id"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    display_order = Column(Integer, nullable=False)
    eligibility_criteria_id = Column(UUID(as_uuid=True))
    created_at = Column(TIMESTAMP)
    
    template = relationship("ChecklistTemplate", back_populates="task_groups")
    tasks = relationship("Task", back_populates="task_group")

class Task(Base):
    __tablename__ = "or_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_group_id = Column(UUID(as_uuid=True), ForeignKey("or_task_groups.id"))
    source_task_id = Column(UUID(as_uuid=True), ForeignKey("or_tasks.id"), nullable=True)  # Reference to library task
    name = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)
    category = Column(String(100))
    is_required = Column(Boolean, default=True)
    display_order = Column(Integer, nullable=False)
    configuration = Column(JSONB)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    
    task_group = relationship("TaskGroup", back_populates="tasks")
    task_instances = relationship("TaskInstance", back_populates="task")
    source_task = relationship("Task", remote_side=[id], foreign_keys=[source_task_id])  # Self-referential

class TeamMember(Base):
    __tablename__ = "or_team_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(String(50), unique=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20))
    ssn_encrypted = Column(Text)
    date_of_birth = Column(Date)
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    country = Column(String(100), default='USA')
    
    # Authentication fields
    password_hash = Column(Text)
    is_first_login = Column(Boolean, default=True)
    last_login = Column(TIMESTAMP)
    
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    
    assignments = relationship("ProjectAssignment", back_populates="team_member", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "or_projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    client_id = Column(UUID(as_uuid=True), ForeignKey("or_clients.id"))
    client_name = Column(String(255))
    status = Column(String(50), nullable=False, default='DRAFT')
    location = Column(String(255))
    start_date = Column(Date)
    end_date = Column(Date)
    template_id = Column(UUID(as_uuid=True), ForeignKey("or_checklist_templates.id"))
    is_dod = Column(Boolean, default=False)
    is_odrisa = Column(Boolean, default=False)
    ppm_project_id = Column(UUID(as_uuid=True))
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    created_by = Column(UUID(as_uuid=True), ForeignKey("or_users.id"))
    
    assignments = relationship("ProjectAssignment", back_populates="project", cascade="all, delete-orphan")
    contacts = relationship("ProjectContact", back_populates="project", cascade="all, delete-orphan")

    @property
    def flags(self):
        return {
            "isDOD": bool(self.is_dod),
            "isODRISA": bool(self.is_odrisa)
        }

class ProjectContact(Base):
    __tablename__ = "or_project_contacts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("or_projects.id"))
    contact_type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    created_at = Column(TIMESTAMP)
    
    project = relationship("Project", back_populates="contacts")

class ProjectAssignment(Base):
    __tablename__ = "or_project_assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("or_projects.id"))
    team_member_id = Column(UUID(as_uuid=True), ForeignKey("or_team_members.id"))
    status = Column(String(50), nullable=False, default='PENDING')
    category = Column(String(50))
    trade = Column(String(100))
    processor_id = Column(UUID(as_uuid=True), ForeignKey("or_users.id"))
    total_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)
    progress_percentage = Column(Numeric(5,2), default=0.00)
    assigned_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    
    project = relationship("Project", back_populates="assignments")
    team_member = relationship("TeamMember", back_populates="assignments")
    task_instances = relationship("TaskInstance", back_populates="assignment", cascade="all, delete-orphan")

class TaskInstance(Base):
    __tablename__ = "or_task_instances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("or_tasks.id"))
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("or_project_assignments.id"))
    status = Column(String(50), nullable=False, default='NOT_STARTED')
    result = Column(JSONB)
    started_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    due_date = Column(TIMESTAMP)
    is_waived = Column(Boolean, default=False)
    waived_reason = Column(Text)
    waived_by = Column(UUID(as_uuid=True), ForeignKey("or_users.id"))
    waived_at = Column(TIMESTAMP)
    waived_until = Column(TIMESTAMP)
    
    # Admin review fields
    review_status = Column(String(50))  # PENDING_REVIEW, APPROVED, REJECTED
    admin_remarks = Column(Text)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("or_users.id"))
    reviewed_at = Column(TIMESTAMP)
    
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    
    task = relationship("Task", back_populates="task_instances")
    assignment = relationship("ProjectAssignment", back_populates="task_instances")
    documents = relationship("Document", back_populates="task_instance", cascade="all, delete-orphan")


class Requisition(Base):
    __tablename__ = "or_requisitions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ppm_project_id = Column(UUID(as_uuid=True), ForeignKey("or_ppm_projects.id"))
    external_id = Column(String(100), unique=True)
    title = Column(String(255))
    description = Column(Text)
    status = Column(String(50))
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    
    line_items = relationship("RequisitionLineItem", back_populates="requisition")


class RequisitionLineItem(Base):
    __tablename__ = "or_requisition_line_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("or_requisitions.id"))
    trade = Column(String(100))
    quantity = Column(Integer)
    filled_quantity = Column(Integer, default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    created_at = Column(TIMESTAMP)
    
    requisition = relationship("Requisition", back_populates="line_items")


class Communication(Base):
    __tablename__ = "or_communications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("or_projects.id"))
    team_member_id = Column(UUID(as_uuid=True), ForeignKey("or_team_members.id"))
    type = Column(String(50))  # EMAIL, SMS, IN_APP_CHAT
    direction = Column(String(20))  # INBOUND, OUTBOUND
    subject = Column(String(500))
    message = Column(Text)
    sent_by = Column(UUID(as_uuid=True), ForeignKey("or_users.id"))
    sent_at = Column(TIMESTAMP)
    delivered_at = Column(TIMESTAMP)
    read_at = Column(TIMESTAMP)
    status = Column(String(50), default='SENT')


class Document(Base):
    __tablename__ = "or_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_instance_id = Column(UUID(as_uuid=True), ForeignKey("or_task_instances.id"))
    
    # File metadata
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_data = Column(Text, nullable=False)  # BYTEA stored as binary
    
    # Document-specific metadata
    document_side = Column(String(20))
    document_number = Column(String(100))
    expiry_date = Column(Date)
    
    # Tracking
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("or_team_members.id"))
    uploaded_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP)
    
    task_instance = relationship("TaskInstance", back_populates="documents")
    uploader = relationship("TeamMember")


class Notification(Base):
    __tablename__ = "or_notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_member_id = Column(UUID(as_uuid=True), ForeignKey("or_team_members.id"), nullable=False)
    type = Column(String(50), nullable=False)  # TASK_REJECTED, TASK_APPROVED, SYSTEM
    title = Column(String(255), nullable=False)
    message = Column(Text)
    task_instance_id = Column(UUID(as_uuid=True), ForeignKey("or_task_instances.id"))
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP)
    
    team_member = relationship("TeamMember")
    task_instance = relationship("TaskInstance")

