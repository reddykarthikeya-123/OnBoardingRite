-- =============================================
-- OnboardRite Database Schema (DDL)
-- PostgreSQL Database Schema Definition
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. or_clients TABLE
-- =============================================
CREATE TABLE or_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    industry VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_code ON or_clients(code);
CREATE INDEX idx_clients_active ON or_clients(is_active);

-- =============================================
-- 2. or_users TABLE (HR Staff, Processors, Admins)
-- =============================================
CREATE TABLE or_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL, -- ADMIN, PROJECT_MANAGER, PROCESSOR, VIEWER
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON or_users(email);
CREATE INDEX idx_users_role ON or_users(role);
CREATE INDEX idx_users_active ON or_users(is_active);

-- =============================================
-- 3. ELIGIBILITY CRITERIA TABLE
-- =============================================
CREATE TABLE or_eligibility_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    root_group_logic VARCHAR(10) DEFAULT 'AND', -- AND, OR
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eligibility_active ON or_eligibility_criteria(is_active);

-- =============================================
-- 4. ELIGIBILITY RULES TABLE
-- =============================================
CREATE TABLE or_eligibility_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria_id UUID REFERENCES or_eligibility_criteria(id) ON DELETE CASCADE,
    parent_group_id UUID REFERENCES or_eligibility_rules(id) ON DELETE CASCADE,

    rule_type VARCHAR(50) NOT NULL, -- FIELD_RULE, SQL_RULE, GROUP
    group_logic VARCHAR(10), -- AND, OR (for GROUP type)

    -- For FIELD_RULE type
    field_category VARCHAR(50), -- PPM_PROJECT, EMPLOYEE_CANDIDATE, ASSIGNMENT, CUSTOM_SQL
    field_name VARCHAR(100),
    operator VARCHAR(50), -- equals, not_equals, contains, greater_than, less_than, in, not_in
    value TEXT,

    -- For SQL_RULE type
    sql_query TEXT,

    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eligibility_rules_criteria ON or_eligibility_rules(criteria_id);
CREATE INDEX idx_eligibility_rules_parent ON or_eligibility_rules(parent_group_id);
CREATE INDEX idx_eligibility_rules_type ON or_eligibility_rules(rule_type);

-- =============================================
-- 5. CHECKLIST TEMPLATES TABLE
-- =============================================
CREATE TABLE or_checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES or_clients(id),
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    eligibility_criteria_id UUID REFERENCES or_eligibility_criteria(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES or_users(id)
);

CREATE INDEX idx_templates_client ON or_checklist_templates(client_id);
CREATE INDEX idx_templates_active ON or_checklist_templates(is_active);
CREATE INDEX idx_templates_eligibility ON or_checklist_templates(eligibility_criteria_id);

-- =============================================
-- 6. TASK GROUPS TABLE
-- =============================================
CREATE TABLE or_task_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES or_checklist_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- DOCUMENTS, FORMS, CERTIFICATIONS, TRAININGS, COMPLIANCE, INTEGRATION
    display_order INT NOT NULL,
    eligibility_criteria_id UUID REFERENCES or_eligibility_criteria(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_groups_template ON or_task_groups(template_id);
CREATE INDEX idx_task_groups_order ON or_task_groups(template_id, display_order);
CREATE INDEX idx_task_groups_category ON or_task_groups(category);

-- =============================================
-- 7. or_tasks TABLE
-- =============================================
CREATE TABLE or_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_group_id UUID REFERENCES or_task_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- CUSTOM_FORM, DOCUMENT_UPLOAD, REST_API, REDIRECT
    category VARCHAR(100), -- DOCUMENTS, FORMS, CERTIFICATIONS, TRAININGS, COMPLIANCE, INTEGRATION
    is_required BOOLEAN DEFAULT TRUE,
    display_order INT NOT NULL,
    configuration JSONB, -- Flexible config for different task types
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_group ON or_tasks(task_group_id);
CREATE INDEX idx_tasks_type ON or_tasks(type);
CREATE INDEX idx_tasks_category ON or_tasks(category);
CREATE INDEX idx_tasks_order ON or_tasks(task_group_id, display_order);
CREATE INDEX idx_tasks_config ON or_tasks USING GIN (configuration);

-- =============================================
-- 8. TEAM MEMBERS TABLE
-- =============================================
CREATE TABLE or_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    ssn_encrypted TEXT, -- Store encrypted
    date_of_birth DATE,

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',

    -- Authentication
    password_hash TEXT,
    is_first_login BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_team_members_email ON or_team_members(email);
CREATE INDEX idx_team_members_employee ON or_team_members(employee_id);
CREATE INDEX idx_team_members_name ON or_team_members(last_name, first_name);

-- =============================================
-- 9. PPM or_projects TABLE
-- =============================================
CREATE TABLE or_ppm_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    sync_status VARCHAR(50), -- PENDING, SYNCED, FAILED
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ppm_projects_external ON or_ppm_projects(external_id);
CREATE INDEX idx_ppm_projects_status ON or_ppm_projects(sync_status);

-- =============================================
-- 10. or_requisitions TABLE
-- =============================================
CREATE TABLE or_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ppm_project_id UUID REFERENCES or_ppm_projects(id) ON DELETE CASCADE,
    external_id VARCHAR(100) UNIQUE,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(50), -- DRAFT, ACTIVE, FILLED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requisitions_ppm ON or_requisitions(ppm_project_id);
CREATE INDEX idx_requisitions_status ON or_requisitions(status);

-- =============================================
-- 11. REQUISITION LINE ITEMS TABLE
-- =============================================
CREATE TABLE or_requisition_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID REFERENCES or_requisitions(id) ON DELETE CASCADE,
    trade VARCHAR(100),
    quantity INT,
    filled_quantity INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_req_line_items_req ON or_requisition_line_items(requisition_id);
CREATE INDEX idx_req_line_items_trade ON or_requisition_line_items(trade);

-- =============================================
-- 12. or_projects TABLE
-- =============================================
CREATE TABLE or_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES or_clients(id),
    client_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    template_id UUID REFERENCES or_checklist_templates(id),
    is_dod BOOLEAN DEFAULT FALSE,
    is_odrisa BOOLEAN DEFAULT FALSE,
    ppm_project_id UUID REFERENCES or_ppm_projects(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES or_users(id)
);

CREATE INDEX idx_projects_status ON or_projects(status);
CREATE INDEX idx_projects_client ON or_projects(client_id);
CREATE INDEX idx_projects_dates ON or_projects(start_date, end_date);
CREATE INDEX idx_projects_template ON or_projects(template_id);
CREATE INDEX idx_projects_ppm ON or_projects(ppm_project_id);
CREATE INDEX idx_projects_flags ON or_projects(is_dod, is_odrisa);

-- =============================================
-- 13. PROJECT CONTACTS TABLE
-- =============================================
CREATE TABLE or_project_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES or_projects(id) ON DELETE CASCADE,
    contact_type VARCHAR(50) NOT NULL, -- PM, SAFETY_LEAD, SITE_CONTACT
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_contacts_project ON or_project_contacts(project_id);
CREATE INDEX idx_project_contacts_type ON or_project_contacts(contact_type);

-- =============================================
-- 14. PROJECT ASSIGNMENTS TABLE (Many-to-Many)
-- =============================================
CREATE TABLE or_project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES or_projects(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES or_team_members(id) ON DELETE CASCADE,

    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, BLOCKED
    category VARCHAR(50), -- NEW_HIRE, REHIRE, ACTIVE_TRANSFER
    trade VARCHAR(100), -- Welder, Pipefitter, Electrician, Carpenter, etc.

    processor_id UUID REFERENCES or_users(id), -- Assigned processor

    total_tasks INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_id, team_member_id)
);

CREATE INDEX idx_assignments_project ON or_project_assignments(project_id);
CREATE INDEX idx_assignments_member ON or_project_assignments(team_member_id);
CREATE INDEX idx_assignments_status ON or_project_assignments(status);
CREATE INDEX idx_assignments_processor ON or_project_assignments(processor_id);
CREATE INDEX idx_assignments_trade ON or_project_assignments(trade);
CREATE INDEX idx_assignments_category ON or_project_assignments(category);

-- =============================================
-- 15. TASK INSTANCES TABLE
-- =============================================
CREATE TABLE or_task_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES or_tasks(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES or_project_assignments(id) ON DELETE CASCADE,

    status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    -- NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED, WAIVED

    result JSONB, -- Captured form data, API responses, uploaded file info, etc.

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,

    -- Waiver tracking
    is_waived BOOLEAN DEFAULT FALSE,
    waived_reason TEXT,
    waived_by UUID REFERENCES or_users(id),
    waived_at TIMESTAMP,
    waived_until TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(task_id, assignment_id)
);

CREATE INDEX idx_task_instances_task ON or_task_instances(task_id);
CREATE INDEX idx_task_instances_assignment ON or_task_instances(assignment_id);
CREATE INDEX idx_task_instances_status ON or_task_instances(status);
CREATE INDEX idx_task_instances_due ON or_task_instances(due_date);
CREATE INDEX idx_task_instances_result ON or_task_instances USING GIN (result);
CREATE INDEX idx_task_instances_waived ON or_task_instances(is_waived);

-- =============================================
-- 16. TASK COMMENTS TABLE
-- =============================================
CREATE TABLE or_task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_instance_id UUID REFERENCES or_task_instances(id) ON DELETE CASCADE,
    author_id UUID REFERENCES or_users(id),
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(50), -- PROCESSOR, ADMIN, CANDIDATE
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs. candidate-visible
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_instance ON or_task_comments(task_instance_id);
CREATE INDEX idx_comments_author ON or_task_comments(author_id);
CREATE INDEX idx_comments_created ON or_task_comments(created_at DESC);
CREATE INDEX idx_comments_internal ON or_task_comments(is_internal);

-- =============================================
-- 17. DOCUMENTS TABLE (File BLOB Storage)
-- =============================================
CREATE TABLE or_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_instance_id UUID REFERENCES or_task_instances(id) ON DELETE CASCADE,
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,        -- Stored filename (may be sanitized)
    original_filename VARCHAR(255) NOT NULL, -- Original uploaded filename
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,            -- Size in bytes (max ~5MB)
    file_data BYTEA NOT NULL,              -- The actual file binary data
    
    -- Document-specific metadata (for ID documents)
    document_side VARCHAR(20),             -- 'FRONT', 'BACK', or NULL
    document_number VARCHAR(100),          -- If capturesDocumentNumber enabled
    expiry_date DATE,                      -- If capturesExpiry enabled
    
    -- Tracking
    uploaded_by UUID REFERENCES or_team_members(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_task_instance ON or_documents(task_instance_id);
CREATE INDEX idx_documents_uploaded_by ON or_documents(uploaded_by);
CREATE INDEX idx_documents_mime_type ON or_documents(mime_type);
CREATE INDEX idx_documents_uploaded_at ON or_documents(uploaded_at DESC);

-- =============================================
-- 17. or_communications LOG TABLE
-- =============================================
CREATE TABLE or_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES or_projects(id),
    team_member_id UUID REFERENCES or_team_members(id),

    type VARCHAR(50) NOT NULL, -- EMAIL, SMS, IN_APP_CHAT
    direction VARCHAR(20), -- INBOUND, OUTBOUND

    subject VARCHAR(500),
    message TEXT NOT NULL,

    sent_by UUID REFERENCES or_users(id),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,

    status VARCHAR(50) DEFAULT 'SENT' -- SENT, DELIVERED, FAILED, READ
);

CREATE INDEX idx_communications_project ON or_communications(project_id);
CREATE INDEX idx_communications_member ON or_communications(team_member_id);
CREATE INDEX idx_communications_type ON or_communications(type);
CREATE INDEX idx_communications_date ON or_communications(sent_at DESC);
CREATE INDEX idx_communications_status ON or_communications(status);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Project Dashboard Summary View
CREATE OR REPLACE VIEW vw_project_dashboard AS
SELECT
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    p.location,
    p.start_date,
    p.end_date,
    c.name as client_name,
    ct.name as template_name,
    COUNT(DISTINCT pa.id) as total_team_members,
    COUNT(DISTINCT CASE WHEN pa.status = 'COMPLETED' THEN pa.id END) as completed_count,
    COUNT(DISTINCT CASE WHEN pa.status = 'IN_PROGRESS' THEN pa.id END) as in_progress_count,
    COUNT(DISTINCT CASE WHEN pa.status = 'BLOCKED' THEN pa.id END) as blocked_count,
    COUNT(DISTINCT CASE WHEN pa.status = 'PENDING' THEN pa.id END) as pending_count,
    COALESCE(AVG(pa.progress_percentage), 0) as avg_progress_percentage,
    MAX(pa.updated_at) as last_activity
FROM or_projects p
LEFT JOIN or_clients c ON p.client_id = c.id
LEFT JOIN or_checklist_templates ct ON p.template_id = ct.id
LEFT JOIN or_project_assignments pa ON p.id = pa.project_id
GROUP BY p.id, p.name, p.status, p.location, p.start_date, p.end_date, c.name, ct.name;

-- Team Member Task Details View
CREATE OR REPLACE VIEW vw_team_member_tasks AS
SELECT
    tm.id as team_member_id,
    tm.first_name || ' ' || tm.last_name as team_member_name,
    tm.email,
    tm.phone,
    p.id as project_id,
    p.name as project_name,
    pa.trade,
    pa.category,
    pa.status as assignment_status,
    pa.progress_percentage,
    pa.completed_tasks,
    pa.total_tasks,
    u.first_name || ' ' || u.last_name as processor_name,
    u.email as processor_email,
    ti.id as task_instance_id,
    t.name as task_name,
    t.type as task_type,
    t.category as task_category,
    ti.status as task_status,
    ti.due_date,
    ti.completed_at
FROM or_team_members tm
JOIN or_project_assignments pa ON tm.id = pa.team_member_id
JOIN or_projects p ON pa.project_id = p.id
LEFT JOIN or_users u ON pa.processor_id = u.id
LEFT JOIN or_task_instances ti ON pa.id = ti.assignment_id
LEFT JOIN or_tasks t ON ti.task_id = t.id;

-- Task Completion Statistics View
CREATE OR REPLACE VIEW vw_task_statistics AS
SELECT
    t.id as task_id,
    t.name as task_name,
    t.type as task_type,
    t.category,
    tg.name as task_group_name,
    COUNT(ti.id) as total_instances,
    COUNT(CASE WHEN ti.status = 'COMPLETED' THEN 1 END) as completed_count,
    COUNT(CASE WHEN ti.status = 'IN_PROGRESS' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN ti.status = 'BLOCKED' THEN 1 END) as blocked_count,
    COUNT(CASE WHEN ti.status = 'NOT_STARTED' THEN 1 END) as not_started_count,
    COUNT(CASE WHEN ti.is_waived THEN 1 END) as waived_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (ti.completed_at - ti.started_at))/3600)::numeric, 2) as avg_completion_hours
FROM or_tasks t
JOIN or_task_groups tg ON t.task_group_id = tg.id
LEFT JOIN or_task_instances ti ON t.id = ti.task_id
GROUP BY t.id, t.name, t.type, t.category, tg.name;

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON or_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON or_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eligibility_criteria_updated_at BEFORE UPDATE ON or_eligibility_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON or_checklist_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON or_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON or_team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON or_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON or_project_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_instances_updated_at BEFORE UPDATE ON or_task_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ppm_projects_updated_at BEFORE UPDATE ON or_ppm_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requisitions_updated_at BEFORE UPDATE ON or_requisitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =============================================

-- Function to calculate assignment progress
CREATE OR REPLACE FUNCTION calculate_assignment_progress(assignment_uuid UUID)
RETURNS TABLE(total_tasks INT, completed_tasks INT, progress_percentage DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INT as total_tasks,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::INT as completed_tasks,
        CASE
            WHEN COUNT(*) = 0 THEN 0::DECIMAL
            ELSE ROUND((COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100), 2)
        END as progress_percentage
    FROM or_task_instances
    WHERE assignment_id = assignment_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update assignment progress when task instance status changes
CREATE OR REPLACE FUNCTION update_assignment_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_total INT;
    v_completed INT;
    v_percentage DECIMAL;
BEGIN
    SELECT total_tasks, completed_tasks, progress_percentage
    INTO v_total, v_completed, v_percentage
    FROM calculate_assignment_progress(COALESCE(NEW.assignment_id, OLD.assignment_id));

    UPDATE or_project_assignments
    SET
        total_tasks = v_total,
        completed_tasks = v_completed,
        progress_percentage = v_percentage,
        completed_at = CASE WHEN v_percentage = 100 THEN CURRENT_TIMESTAMP ELSE NULL END,
        status = CASE
            WHEN v_percentage = 100 THEN 'COMPLETED'
            WHEN v_percentage > 0 THEN 'IN_PROGRESS'
            ELSE 'PENDING'
        END
    WHERE id = COALESCE(NEW.assignment_id, OLD.assignment_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to or_task_instances
CREATE TRIGGER update_assignment_on_task_change
    AFTER INSERT OR UPDATE OR DELETE ON or_task_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_progress();

-- =============================================
-- COMMENTS ON TABLES
-- =============================================
COMMENT ON TABLE or_clients IS 'Client organizations that have onboarding or_projects';
COMMENT ON TABLE or_users IS 'System or_users including admins, project managers, and processors';
COMMENT ON TABLE or_eligibility_criteria IS 'Reusable eligibility rule sets for or_tasks and templates';
COMMENT ON TABLE or_eligibility_rules IS 'Individual rules within eligibility criteria, supports nested groups';
COMMENT ON TABLE or_checklist_templates IS 'Reusable onboarding checklist templates';
COMMENT ON TABLE or_task_groups IS 'Groups of related or_tasks within a template';
COMMENT ON TABLE or_tasks IS 'Individual task definitions with type-specific configurations';
COMMENT ON TABLE or_team_members IS 'Worker/employee master data';
COMMENT ON TABLE or_ppm_projects IS 'or_projects from external PPM systems';
COMMENT ON TABLE or_requisitions IS 'Hiring or_requisitions from PPM or_projects';
COMMENT ON TABLE or_requisition_line_items IS 'Specific role requirements within or_requisitions';
COMMENT ON TABLE or_projects IS 'Onboarding or_projects with assigned templates';
COMMENT ON TABLE or_project_contacts IS 'Key contacts for each project (PM, Safety Lead, etc.)';
COMMENT ON TABLE or_project_assignments IS 'Team member assignments to or_projects with progress tracking';
COMMENT ON TABLE or_task_instances IS 'Individual task assignments per team member with results';
COMMENT ON TABLE or_task_comments IS 'Comments and notes on task instances';
COMMENT ON TABLE or_communications IS 'Communication log for emails, SMS, and in-app messages';
