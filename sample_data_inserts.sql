-- =============================================
-- OnboardRite Database Sample Data Insert Scripts
-- =============================================

-- Clean existing data (in reverse order of dependencies)
TRUNCATE TABLE or_task_comments CASCADE;
TRUNCATE TABLE or_task_instances CASCADE;
TRUNCATE TABLE or_communications CASCADE;
TRUNCATE TABLE or_project_assignments CASCADE;
TRUNCATE TABLE or_project_contacts CASCADE;
TRUNCATE TABLE or_requisition_line_items CASCADE;
TRUNCATE TABLE or_requisitions CASCADE;
TRUNCATE TABLE or_ppm_projects CASCADE;
TRUNCATE TABLE or_projects CASCADE;
TRUNCATE TABLE or_team_members CASCADE;
TRUNCATE TABLE or_tasks CASCADE;
TRUNCATE TABLE or_task_groups CASCADE;
TRUNCATE TABLE or_eligibility_rules CASCADE;
TRUNCATE TABLE or_eligibility_criteria CASCADE;
TRUNCATE TABLE or_checklist_templates CASCADE;
TRUNCATE TABLE or_users CASCADE;
TRUNCATE TABLE or_clients CASCADE;

-- =============================================
-- 1. or_clients
-- =============================================
INSERT INTO or_clients (id, name, code, industry, contact_email, contact_phone, is_active, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Acme Construction Corp', 'ACME', 'Construction', 'contact@acmeconstruction.com', '555-0100', TRUE, CURRENT_TIMESTAMP),
('22222222-2222-2222-2222-222222222222', 'BuildRight Industries', 'BRI', 'Industrial Construction', 'info@buildright.com', '555-0200', TRUE, CURRENT_TIMESTAMP),
('33333333-3333-3333-3333-333333333333', 'TechFab Solutions', 'TECHFAB', 'Manufacturing', 'hello@techfab.com', '555-0300', TRUE, CURRENT_TIMESTAMP);

-- =============================================
-- 2. or_users (HR Staff, Processors, Admins)
-- =============================================
INSERT INTO or_users (id, email, password_hash, first_name, last_name, role, is_active, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@onboardrite.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Sarah', 'Johnson', 'ADMIN', TRUE, CURRENT_TIMESTAMP),
('a0000000-0000-0000-0000-000000000002', 'pm.jones@onboardrite.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Michael', 'Jones', 'PROJECT_MANAGER', TRUE, CURRENT_TIMESTAMP),
('a0000000-0000-0000-0000-000000000003', 'processor.smith@onboardrite.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Emily', 'Smith', 'PROCESSOR', TRUE, CURRENT_TIMESTAMP),
('a0000000-0000-0000-0000-000000000004', 'processor.davis@onboardrite.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'James', 'Davis', 'PROCESSOR', TRUE, CURRENT_TIMESTAMP),
('a0000000-0000-0000-0000-000000000005', 'processor.williams@onboardrite.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Jennifer', 'Williams', 'PROCESSOR', TRUE, CURRENT_TIMESTAMP),
('a0000000-0000-0000-0000-000000000006', 'viewer.brown@onboardrite.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Robert', 'Brown', 'VIEWER', TRUE, CURRENT_TIMESTAMP);

-- =============================================
-- 3. ELIGIBILITY CRITERIA
-- =============================================
INSERT INTO or_eligibility_criteria (id, name, description, is_active, root_group_logic, created_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'DOD Project Requirements', 'Eligibility rules for Department of Defense or_projects', TRUE, 'AND', CURRENT_TIMESTAMP),
('e2222222-2222-2222-2222-222222222222', 'ODRISA Compliance', 'ODRISA-specific compliance requirements', TRUE, 'AND', CURRENT_TIMESTAMP),
('e3333333-3333-3333-3333-333333333333', 'Welding Certification Required', 'Required for welding positions', TRUE, 'OR', CURRENT_TIMESTAMP),
('e4444444-4444-4444-4444-444444444444', 'New Hire Only', 'or_tasks only for new hires', TRUE, 'AND', CURRENT_TIMESTAMP);

-- =============================================
-- 4. ELIGIBILITY RULES
-- =============================================
-- DOD Project Requirements (e1111111...)
INSERT INTO or_eligibility_rules (id, criteria_id, parent_group_id, rule_type, group_logic, field_category, field_name, operator, value, display_order, created_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', NULL, 'FIELD_RULE', NULL, 'PPM_PROJECT', 'isDOD', 'equals', 'true', 1, CURRENT_TIMESTAMP),
('a1111111-1111-1111-1111-111111111112', 'e1111111-1111-1111-1111-111111111111', NULL, 'FIELD_RULE', NULL, 'EMPLOYEE_CANDIDATE', 'citizenship', 'equals', 'US Citizen', 2, CURRENT_TIMESTAMP);

-- ODRISA Compliance (e2222222...)
INSERT INTO or_eligibility_rules (id, criteria_id, parent_group_id, rule_type, group_logic, field_category, field_name, operator, value, display_order, created_at) VALUES
('a2222222-2222-2222-2222-222222222221', 'e2222222-2222-2222-2222-222222222222', NULL, 'FIELD_RULE', NULL, 'PPM_PROJECT', 'isODRISA', 'equals', 'true', 1, CURRENT_TIMESTAMP);

-- Welding Certification Required (e3333333...) - OR logic
INSERT INTO or_eligibility_rules (id, criteria_id, parent_group_id, rule_type, group_logic, field_category, field_name, operator, value, display_order, created_at) VALUES
('a3333333-3333-3333-3333-333333333331', 'e3333333-3333-3333-3333-333333333333', NULL, 'FIELD_RULE', NULL, 'ASSIGNMENT', 'trade', 'equals', 'Welder', 1, CURRENT_TIMESTAMP),
('a3333333-3333-3333-3333-333333333332', 'e3333333-3333-3333-3333-333333333333', NULL, 'FIELD_RULE', NULL, 'ASSIGNMENT', 'trade', 'equals', 'Pipefitter/Welder', 2, CURRENT_TIMESTAMP);

-- New Hire Only (e4444444...)
INSERT INTO or_eligibility_rules (id, criteria_id, parent_group_id, rule_type, group_logic, field_category, field_name, operator, value, display_order, created_at) VALUES
('a4444444-4444-4444-4444-444444444441', 'e4444444-4444-4444-4444-444444444444', NULL, 'FIELD_RULE', NULL, 'ASSIGNMENT', 'category', 'equals', 'NEW_HIRE', 1, CURRENT_TIMESTAMP);

-- =============================================
-- 5. CHECKLIST TEMPLATES
-- =============================================
INSERT INTO or_checklist_templates (id, name, description, client_id, version, is_active, eligibility_criteria_id, created_at, created_by) VALUES
('c1111111-1111-1111-1111-111111111111', 'Standard Construction Onboarding', 'Standard onboarding checklist for construction or_projects', '11111111-1111-1111-1111-111111111111', 1, TRUE, NULL, CURRENT_TIMESTAMP, 'a0000000-0000-0000-0000-000000000001'),
('c2222222-2222-2222-2222-222222222222', 'DOD Secure Project Onboarding', 'Enhanced onboarding for DOD-classified or_projects', '11111111-1111-1111-1111-111111111111', 1, TRUE, 'e1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP, 'a0000000-0000-0000-0000-000000000001'),
('c3333333-3333-3333-3333-333333333333', 'ODRISA Compliance Onboarding', 'Onboarding with ODRISA compliance requirements', '22222222-2222-2222-2222-222222222222', 1, TRUE, 'e2222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP, 'a0000000-0000-0000-0000-000000000001');

-- =============================================
-- 6. TASK GROUPS
-- =============================================
INSERT INTO or_task_groups (id, template_id, name, description, category, display_order, eligibility_criteria_id, created_at) VALUES
-- Standard Construction Onboarding (t1111111...)
('b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Personal Information', 'Basic personal and contact information', 'DOCUMENTS', 1, NULL, CURRENT_TIMESTAMP),
('b1111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111111', 'Employment Documents', 'Required employment documentation', 'DOCUMENTS', 2, NULL, CURRENT_TIMESTAMP),
('b1111111-1111-1111-1111-111111111113', 'c1111111-1111-1111-1111-111111111111', 'Safety Training', 'Mandatory safety certifications and training', 'TRAININGS', 3, NULL, CURRENT_TIMESTAMP),
('b1111111-1111-1111-1111-111111111114', 'c1111111-1111-1111-1111-111111111111', 'Trade Certifications', 'Trade-specific certifications', 'CERTIFICATIONS', 4, 'e3333333-3333-3333-3333-333333333333', CURRENT_TIMESTAMP),
('b1111111-1111-1111-1111-111111111115', 'c1111111-1111-1111-1111-111111111111', 'System Integrations', 'Third-party system checks', 'INTEGRATION', 5, NULL, CURRENT_TIMESTAMP),

-- DOD Secure Project Onboarding (t2222222...)
('b2222222-2222-2222-2222-222222222221', 'c2222222-2222-2222-2222-222222222222', 'Security Clearance', 'DOD security clearance documentation', 'COMPLIANCE', 1, 'e1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP),
('b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Background Check', 'Enhanced background verification', 'COMPLIANCE', 2, NULL, CURRENT_TIMESTAMP),

-- ODRISA Compliance Onboarding (t3333333...)
('b3333333-3333-3333-3333-333333333331', 'c3333333-3333-3333-3333-333333333333', 'Drug & Alcohol Screening', 'ODRISA-compliant screening', 'COMPLIANCE', 1, NULL, CURRENT_TIMESTAMP);

-- =============================================
-- 7. or_tasks
-- =============================================
-- Personal Information Group (g1111111...1111)
INSERT INTO or_tasks (id, task_group_id, name, description, type, category, is_required, display_order, configuration, created_at) VALUES
('aa111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Emergency Contact Form', 'Provide emergency contact information', 'CUSTOM_FORM', 'FORMS', TRUE, 1,
'{"fields": [
  {"id": "contact_name", "label": "Contact Name", "type": "text", "required": true, "validation": {"minLength": 2, "maxLength": 100}},
  {"id": "relationship", "label": "Relationship", "type": "select", "required": true, "options": ["Spouse", "Parent", "Sibling", "Friend", "Other"]},
  {"id": "contact_phone", "label": "Phone Number", "type": "tel", "required": true, "validation": {"pattern": "^\\d{3}-\\d{3}-\\d{4}$"}},
  {"id": "contact_email", "label": "Email", "type": "email", "required": false}
]}'::jsonb, CURRENT_TIMESTAMP),

('aa111111-1111-1111-1111-111111111112', 'b1111111-1111-1111-1111-111111111111', 'Address Verification', 'Confirm current residential address', 'CUSTOM_FORM', 'FORMS', TRUE, 2,
'{"fields": [
  {"id": "address_line1", "label": "Street Address", "type": "text", "required": true},
  {"id": "city", "label": "City", "type": "text", "required": true},
  {"id": "state", "label": "State", "type": "select", "required": true, "options": ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"]},
  {"id": "zip_code", "label": "ZIP Code", "type": "text", "required": true, "validation": {"pattern": "^\\d{5}(-\\d{4})?$"}}
]}'::jsonb, CURRENT_TIMESTAMP);

-- Employment Documents Group (g1111111...1112)
INSERT INTO or_tasks (id, task_group_id, name, description, type, category, is_required, display_order, configuration, created_at) VALUES
('aa111111-1111-1111-1111-111111111121', 'b1111111-1111-1111-1111-111111111112', 'Upload I-9 Documents', 'Upload valid I-9 identification documents', 'DOCUMENT_UPLOAD', 'DOCUMENTS', TRUE, 1,
'{"acceptedFileTypes": [".pdf", ".jpg", ".jpeg", ".png"],
  "maxFileSize": 10485760,
  "maxFiles": 3,
  "instructions": "Please upload clear copies of your identification documents (e.g., Passport, Driver License + Social Security Card, or Birth Certificate + Driver License)",
  "validationRules": {"minFiles": 1}
}'::jsonb, CURRENT_TIMESTAMP),

('aa111111-1111-1111-1111-111111111122', 'b1111111-1111-1111-1111-111111111112', 'W-4 Tax Form', 'Complete and submit W-4 form', 'DOCUMENT_UPLOAD', 'DOCUMENTS', TRUE, 2,
'{"acceptedFileTypes": [".pdf"],
  "maxFileSize": 5242880,
  "maxFiles": 1,
  "instructions": "Download, complete, sign, and upload your W-4 form",
  "downloadUrl": "https://www.irs.gov/pub/irs-pdf/fw4.pdf"
}'::jsonb, CURRENT_TIMESTAMP),

('aa111111-1111-1111-1111-111111111123', 'b1111111-1111-1111-1111-111111111112', 'Direct Deposit Form', 'Set up direct deposit for payroll', 'CUSTOM_FORM', 'FORMS', FALSE, 3,
'{"fields": [
  {"id": "bank_name", "label": "Bank Name", "type": "text", "required": true},
  {"id": "account_type", "label": "Account Type", "type": "radio", "required": true, "options": ["Checking", "Savings"]},
  {"id": "routing_number", "label": "Routing Number", "type": "text", "required": true, "validation": {"pattern": "^\\d{9}$"}},
  {"id": "account_number", "label": "Account Number", "type": "text", "required": true, "validation": {"minLength": 4, "maxLength": 17}},
  {"id": "confirm_account", "label": "Confirm Account Number", "type": "text", "required": true}
]}'::jsonb, CURRENT_TIMESTAMP);

-- Safety Training Group (g1111111...1113)
INSERT INTO or_tasks (id, task_group_id, name, description, type, category, is_required, display_order, configuration, created_at) VALUES
('aa111111-1111-1111-1111-111111111131', 'b1111111-1111-1111-1111-111111111113', 'OSHA 10 Certification', 'Complete OSHA 10-hour safety training', 'REDIRECT', 'TRAININGS', TRUE, 1,
'{"redirectUrl": "https://www.osha.gov/training",
  "returnUrl": "https://onboardrite.com/or_tasks/complete",
  "instructions": "Click to access OSHA training portal. Upon completion, your certificate will be automatically verified.",
  "openInNewTab": true
}'::jsonb, CURRENT_TIMESTAMP),

('aa111111-1111-1111-1111-111111111132', 'b1111111-1111-1111-1111-111111111113', 'Site Safety Orientation', 'Watch site-specific safety orientation video', 'REDIRECT', 'TRAININGS', TRUE, 2,
'{"redirectUrl": "https://training.acmeconstruction.com/safety-orientation",
  "instructions": "Complete the 45-minute safety orientation video and quiz",
  "estimatedDuration": 45
}'::jsonb, CURRENT_TIMESTAMP),

('aa111111-1111-1111-1111-111111111133', 'b1111111-1111-1111-1111-111111111113', 'Upload Safety Certifications', 'Upload existing safety certifications', 'DOCUMENT_UPLOAD', 'CERTIFICATIONS', FALSE, 3,
'{"acceptedFileTypes": [".pdf", ".jpg", ".jpeg", ".png"],
  "maxFileSize": 10485760,
  "maxFiles": 5,
  "instructions": "Upload any additional safety certifications (e.g., First Aid, CPR, Fall Protection)"
}'::jsonb, CURRENT_TIMESTAMP);

-- Trade Certifications Group (g1111111...1114)
INSERT INTO or_tasks (id, task_group_id, name, description, type, category, is_required, display_order, configuration, created_at) VALUES
('aa111111-1111-1111-1111-111111111141', 'b1111111-1111-1111-1111-111111111114', 'Welding Certification Upload', 'Upload current welding certifications', 'DOCUMENT_UPLOAD', 'CERTIFICATIONS', TRUE, 1,
'{"acceptedFileTypes": [".pdf", ".jpg", ".jpeg", ".png"],
  "maxFileSize": 10485760,
  "maxFiles": 10,
  "instructions": "Upload all valid welding certifications (AWS, ASME, etc.)",
  "validationRules": {"minFiles": 1}
}'::jsonb, CURRENT_TIMESTAMP),

('aa111111-1111-1111-1111-111111111142', 'b1111111-1111-1111-1111-111111111114', 'Trade Skills Assessment', 'Complete online skills assessment', 'CUSTOM_FORM', 'FORMS', TRUE, 2,
'{"fields": [
  {"id": "years_experience", "label": "Years of Experience", "type": "number", "required": true, "validation": {"min": 0, "max": 50}},
  {"id": "primary_skills", "label": "Primary Skills", "type": "checkbox", "required": true, "options": ["TIG Welding", "MIG Welding", "Stick Welding", "Flux-Core", "Pipe Welding", "Structural Welding"]},
  {"id": "certifications_held", "label": "Certifications Held", "type": "textarea", "required": false},
  {"id": "special_projects", "label": "Notable or_projects", "type": "textarea", "required": false}
]}'::jsonb, CURRENT_TIMESTAMP);

-- System Integrations Group (g1111111...1115)
INSERT INTO or_tasks (id, task_group_id, name, description, type, category, is_required, display_order, configuration, created_at) VALUES
('aa111111-1111-1111-1111-111111111151', 'b1111111-1111-1111-1111-111111111115', 'Background Check API', 'Automated background check verification', 'REST_API', 'INTEGRATION', TRUE, 1,
'{"apiEndpoint": "https://api.backgroundcheck.com/v1/verify",
  "method": "POST",
  "authentication": {
    "type": "API_KEY",
    "headerName": "X-API-Key",
    "apiKey": "{{BACKGROUND_CHECK_API_KEY}}"
  },
  "requestBody": {
    "firstName": "{{firstName}}",
    "lastName": "{{lastName}}",
    "ssn": "{{ssn}}",
    "dob": "{{dateOfBirth}}"
  },
  "successCriteria": {
    "statusCode": 200,
    "jsonPath": "$.status",
    "expectedValue": "CLEAR"
  },
  "statusTracking": {
    "enabled": true,
    "statusEndpoint": "https://api.backgroundcheck.com/v1/status/{{checkId}}",
    "pollingInterval": 300
  }
}'::jsonb, CURRENT_TIMESTAMP),

('aa111111-1111-1111-1111-111111111152', 'b1111111-1111-1111-1111-111111111115', 'Drug Screening Verification', 'Third-party drug screening verification', 'REST_API', 'INTEGRATION', TRUE, 2,
'{"apiEndpoint": "https://api.drugscreening.com/v2/verify",
  "method": "POST",
  "authentication": {
    "type": "BEARER_TOKEN",
    "token": "{{DRUG_SCREENING_TOKEN}}"
  },
  "requestBody": {
    "candidateId": "{{employeeId}}",
    "testType": "5-PANEL",
    "location": "{{projectLocation}}"
  },
  "successCriteria": {
    "statusCode": 200,
    "jsonPath": "$.result",
    "expectedValue": "NEGATIVE"
  }
}'::jsonb, CURRENT_TIMESTAMP);

-- Security Clearance Group (g2222222...2221) - DOD or_projects
INSERT INTO or_tasks (id, task_group_id, name, description, type, category, is_required, display_order, configuration, created_at) VALUES
('aa222222-2222-2222-2222-222222222211', 'b2222222-2222-2222-2222-222222222221', 'SF-86 Security Clearance Form', 'Complete Standard Form 86 for security clearance', 'DOCUMENT_UPLOAD', 'COMPLIANCE', TRUE, 1,
'{"acceptedFileTypes": [".pdf"],
  "maxFileSize": 20971520,
  "maxFiles": 1,
  "instructions": "Upload completed and signed SF-86 form. This form is required for all DOD project personnel.",
  "validationRules": {"minFiles": 1}
}'::jsonb, CURRENT_TIMESTAMP),

('aa222222-2222-2222-2222-222222222212', 'b2222222-2222-2222-2222-222222222221', 'Citizenship Verification', 'Verify U.S. citizenship status', 'CUSTOM_FORM', 'COMPLIANCE', TRUE, 2,
'{"fields": [
  {"id": "citizenship_status", "label": "Citizenship Status", "type": "radio", "required": true, "options": ["U.S. Citizen", "U.S. National", "Permanent Resident"]},
  {"id": "birth_country", "label": "Country of Birth", "type": "text", "required": true},
  {"id": "passport_number", "label": "U.S. Passport Number", "type": "text", "required": false},
  {"id": "naturalization_cert", "label": "Naturalization Certificate Number", "type": "text", "required": false}
]}'::jsonb, CURRENT_TIMESTAMP);

-- Background Check Group (g2222222...2222)
INSERT INTO or_tasks (id, task_group_id, name, description, type, category, is_required, display_order, configuration, created_at) VALUES
('aa222222-2222-2222-2222-222222222221', 'b2222222-2222-2222-2222-222222222222', 'Enhanced Background Check', 'DOD-level background investigation', 'REST_API', 'COMPLIANCE', TRUE, 1,
'{"apiEndpoint": "https://api.dodbackground.gov/v1/initiate",
  "method": "POST",
  "authentication": {
    "type": "OAUTH2",
    "tokenEndpoint": "https://auth.dodbackground.gov/oauth/token",
    "clientId": "{{DOD_CLIENT_ID}}",
    "clientSecret": "{{DOD_CLIENT_SECRET}}"
  },
  "requestBody": {
    "firstName": "{{firstName}}",
    "lastName": "{{lastName}}",
    "ssn": "{{ssn}}",
    "clearanceLevel": "SECRET",
    "investigationType": "TIER_3"
  },
  "statusTracking": {
    "enabled": true,
    "statusEndpoint": "https://api.dodbackground.gov/v1/status/{{investigationId}}",
    "pollingInterval": 86400
  }
}'::jsonb, CURRENT_TIMESTAMP);

-- Drug & Alcohol Screening Group (g3333333...3331) - ODRISA
INSERT INTO or_tasks (id, task_group_id, name, description, type, category, is_required, display_order, configuration, created_at) VALUES
('aa333333-3333-3333-3333-333333333311', 'b3333333-3333-3333-3333-333333333331', 'ODRISA Drug Test', 'Complete ODRISA-compliant drug screening', 'REDIRECT', 'COMPLIANCE', TRUE, 1,
'{"redirectUrl": "https://odrisa.testing.com/schedule",
  "instructions": "Schedule and complete your ODRISA drug screening at an approved facility",
  "openInNewTab": true
}'::jsonb, CURRENT_TIMESTAMP);

-- =============================================
-- 8. TEAM MEMBERS
-- =============================================
INSERT INTO or_team_members (id, employee_id, first_name, last_name, email, phone, ssn_encrypted, date_of_birth, address_line1, city, state, zip_code, country, created_at) VALUES
('d0000001-0001-0001-0001-000000000001', 'EMP001', 'John', 'Anderson', 'john.anderson@email.com', '555-1001', 'ENCRYPTED_SSN_001', '1985-03-15', '123 Main St', 'Houston', 'TX', '77001', 'USA', CURRENT_TIMESTAMP),
('d0000001-0001-0001-0001-000000000002', 'EMP002', 'Maria', 'Garcia', 'maria.garcia@email.com', '555-1002', 'ENCRYPTED_SSN_002', '1990-07-22', '456 Oak Ave', 'Houston', 'TX', '77002', 'USA', CURRENT_TIMESTAMP),
('d0000001-0001-0001-0001-000000000003', 'EMP003', 'David', 'Thompson', 'david.thompson@email.com', '555-1003', 'ENCRYPTED_SSN_003', '1988-11-30', '789 Pine Rd', 'Pasadena', 'TX', '77501', 'USA', CURRENT_TIMESTAMP),
('d0000001-0001-0001-0001-000000000004', 'EMP004', 'Lisa', 'Martinez', 'lisa.martinez@email.com', '555-1004', 'ENCRYPTED_SSN_004', '1992-05-18', '321 Elm St', 'Baytown', 'TX', '77520', 'USA', CURRENT_TIMESTAMP),
('d0000001-0001-0001-0001-000000000005', 'EMP005', 'Robert', 'Wilson', 'robert.wilson@email.com', '555-1005', 'ENCRYPTED_SSN_005', '1983-09-08', '654 Maple Dr', 'Houston', 'TX', '77003', 'USA', CURRENT_TIMESTAMP),
('d0000001-0001-0001-0001-000000000006', 'EMP006', 'Jennifer', 'Lee', 'jennifer.lee@email.com', '555-1006', 'ENCRYPTED_SSN_006', '1995-01-25', '987 Cedar Ln', 'Houston', 'TX', '77004', 'USA', CURRENT_TIMESTAMP),
('d0000001-0001-0001-0001-000000000007', 'EMP007', 'Michael', 'Taylor', 'michael.taylor@email.com', '555-1007', 'ENCRYPTED_SSN_007', '1987-12-12', '147 Birch Ct', 'League City', 'TX', '77573', 'USA', CURRENT_TIMESTAMP),
('d0000001-0001-0001-0001-000000000008', 'EMP008', 'Sarah', 'Brown', 'sarah.brown@email.com', '555-1008', 'ENCRYPTED_SSN_008', '1991-04-03', '258 Spruce Way', 'Houston', 'TX', '77005', 'USA', CURRENT_TIMESTAMP),
('d0000001-0001-0001-0001-000000000009', 'EMP009', 'James', 'Rodriguez', 'james.rodriguez@email.com', '555-1009', 'ENCRYPTED_SSN_009', '1989-08-20', '369 Willow Blvd', 'Pearland', 'TX', '77581', 'USA', CURRENT_TIMESTAMP),
('d0000001-0001-0001-0001-000000000010', 'EMP010', 'Amanda', 'White', 'amanda.white@email.com', '555-1010', 'ENCRYPTED_SSN_010', '1993-06-14', '741 Ash Ave', 'Houston', 'TX', '77006', 'USA', CURRENT_TIMESTAMP);

-- =============================================
-- 9. PPM or_projects
-- =============================================
INSERT INTO or_ppm_projects (id, external_id, name, description, start_date, end_date, sync_status, last_synced_at, created_at) VALUES
('f1111111-aaaa-aaaa-aaaa-111111111111', 'PPM-2024-001', 'Gulf Coast Refinery Expansion', 'Major refinery expansion project on the Gulf Coast', '2024-01-15', '2025-12-31', 'SYNCED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f2222222-bbbb-bbbb-bbbb-222222222222', 'PPM-2024-002', 'DOD Military Base Construction', 'Secure construction project for military installation', '2024-03-01', '2026-06-30', 'SYNCED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- 10. or_requisitions
-- =============================================
INSERT INTO or_requisitions (id, ppm_project_id, external_id, title, description, status, created_at) VALUES
('ae011111-1111-1111-1111-111111111111', 'f1111111-aaaa-aaaa-aaaa-111111111111', 'REQ-001-2024', 'Skilled Welders - Phase 1', 'Need 50 certified welders for initial phase', 'ACTIVE', CURRENT_TIMESTAMP),
('ae022222-2222-2222-2222-222222222222', 'f2222222-bbbb-bbbb-bbbb-222222222222', 'REQ-002-2024', 'General Construction Crew', 'Multi-trade workers for base construction', 'ACTIVE', CURRENT_TIMESTAMP);

-- =============================================
-- 11. REQUISITION LINE ITEMS
-- =============================================
INSERT INTO or_requisition_line_items (id, requisition_id, trade, quantity, start_date, end_date, created_at) VALUES
('be011111-1111-1111-1111-111111111111', 'ae011111-1111-1111-1111-111111111111', 'Welder', 30, '2024-02-01', '2025-08-31', CURRENT_TIMESTAMP),
('be011111-1111-1111-1111-111111111112', 'ae011111-1111-1111-1111-111111111111', 'Pipefitter', 15, '2024-02-01', '2025-08-31', CURRENT_TIMESTAMP),
('be011111-1111-1111-1111-111111111113', 'ae011111-1111-1111-1111-111111111111', 'Electrician', 5, '2024-03-01', '2025-08-31', CURRENT_TIMESTAMP),
('be022222-2222-2222-2222-222222222221', 'ae022222-2222-2222-2222-222222222222', 'Carpenter', 20, '2024-04-01', '2026-05-31', CURRENT_TIMESTAMP),
('be022222-2222-2222-2222-222222222222', 'ae022222-2222-2222-2222-222222222222', 'Laborer', 25, '2024-04-01', '2026-05-31', CURRENT_TIMESTAMP);

-- =============================================
-- 12. or_projects
-- =============================================
INSERT INTO or_projects (id, name, description, client_id, client_name, status, location, start_date, end_date, template_id, is_dod, is_odrisa, ppm_project_id, created_at, created_by) VALUES
('ce001111-1111-1111-1111-111111111111', 'Gulf Coast Refinery Expansion - Phase 1', 'First phase of major refinery expansion project', '11111111-1111-1111-1111-111111111111', 'Acme Construction Corp', 'ACTIVE', 'Houston, TX', '2024-02-01', '2025-08-31', 'c1111111-1111-1111-1111-111111111111', FALSE, TRUE, 'f1111111-aaaa-aaaa-aaaa-111111111111', CURRENT_TIMESTAMP, 'a0000000-0000-0000-0000-000000000001'),
('ce002222-2222-2222-2222-222222222222', 'Fort Liberty Construction Project', 'Military base infrastructure construction', '11111111-1111-1111-1111-111111111111', 'Acme Construction Corp', 'ACTIVE', 'Fort Liberty, NC', '2024-04-01', '2026-05-31', 'c2222222-2222-2222-2222-222222222222', TRUE, FALSE, 'f2222222-bbbb-bbbb-bbbb-222222222222', CURRENT_TIMESTAMP, 'a0000000-0000-0000-0000-000000000001'),
('ce003333-3333-3333-3333-333333333333', 'TechFab Manufacturing Plant', 'New manufacturing facility construction', '33333333-3333-3333-3333-333333333333', 'TechFab Solutions', 'DRAFT', 'Austin, TX', '2024-06-01', '2025-12-31', 'c3333333-3333-3333-3333-333333333333', FALSE, TRUE, NULL, CURRENT_TIMESTAMP, 'a0000000-0000-0000-0000-000000000002');

-- =============================================
-- 13. PROJECT CONTACTS
-- =============================================
INSERT INTO or_project_contacts (id, project_id, contact_type, name, email, phone, created_at) VALUES
-- Gulf Coast Refinery Project
('ff111111-1111-1111-1111-111111111111', 'ce001111-1111-1111-1111-111111111111', 'PM', 'Tom Henderson', 'tom.henderson@acme.com', '555-2001', CURRENT_TIMESTAMP),
('ff111111-1111-1111-1111-111111111112', 'ce001111-1111-1111-1111-111111111111', 'SAFETY_LEAD', 'Karen Mitchell', 'karen.mitchell@acme.com', '555-2002', CURRENT_TIMESTAMP),
('ff111111-1111-1111-1111-111111111113', 'ce001111-1111-1111-1111-111111111111', 'SITE_CONTACT', 'Brian Cooper', 'brian.cooper@acme.com', '555-2003', CURRENT_TIMESTAMP),

-- Fort Liberty Project
('ff222222-2222-2222-2222-222222222221', 'ce002222-2222-2222-2222-222222222222', 'PM', 'Colonel Sarah Johnson', 'sarah.johnson@army.mil', '555-3001', CURRENT_TIMESTAMP),
('ff222222-2222-2222-2222-222222222222', 'ce002222-2222-2222-2222-222222222222', 'SAFETY_LEAD', 'Mark Stevens', 'mark.stevens@acme.com', '555-3002', CURRENT_TIMESTAMP),
('ff222222-2222-2222-2222-222222222223', 'ce002222-2222-2222-2222-222222222222', 'SITE_CONTACT', 'Lt. David Parks', 'david.parks@army.mil', '555-3003', CURRENT_TIMESTAMP),

-- TechFab Project
('ff333333-3333-3333-3333-333333333331', 'ce003333-3333-3333-3333-333333333333', 'PM', 'Angela Torres', 'angela.torres@techfab.com', '555-4001', CURRENT_TIMESTAMP);

-- =============================================
-- 14. PROJECT ASSIGNMENTS
-- =============================================
INSERT INTO or_project_assignments (id, project_id, team_member_id, status, category, trade, processor_id, total_tasks, completed_tasks, progress_percentage, assigned_at, completed_at) VALUES
-- Gulf Coast Refinery Project Assignments
('dd111111-1111-1111-1111-111111111111', 'ce001111-1111-1111-1111-111111111111', 'd0000001-0001-0001-0001-000000000001', 'IN_PROGRESS', 'NEW_HIRE', 'Welder', 'a0000000-0000-0000-0000-000000000003', 11, 8, 72.73, '2024-01-15 10:00:00', NULL),
('dd111111-1111-1111-1111-111111111112', 'ce001111-1111-1111-1111-111111111111', 'd0000001-0001-0001-0001-000000000002', 'COMPLETED', 'REHIRE', 'Pipefitter', 'a0000000-0000-0000-0000-000000000003', 10, 10, 100.00, '2024-01-15 10:00:00', '2024-01-25 16:30:00'),
('dd111111-1111-1111-1111-111111111113', 'ce001111-1111-1111-1111-111111111111', 'd0000001-0001-0001-0001-000000000003', 'IN_PROGRESS', 'NEW_HIRE', 'Welder', 'a0000000-0000-0000-0000-000000000004', 11, 5, 45.45, '2024-01-16 09:00:00', NULL),
('dd111111-1111-1111-1111-111111111114', 'ce001111-1111-1111-1111-111111111111', 'd0000001-0001-0001-0001-000000000004', 'PENDING', 'NEW_HIRE', 'Electrician', 'a0000000-0000-0000-0000-000000000004', 10, 0, 0.00, '2024-01-17 14:00:00', NULL),
('dd111111-1111-1111-1111-111111111115', 'ce001111-1111-1111-1111-111111111111', 'd0000001-0001-0001-0001-000000000005', 'BLOCKED', 'ACTIVE_TRANSFER', 'Welder', 'a0000000-0000-0000-0000-000000000005', 11, 9, 81.82, '2024-01-18 11:00:00', NULL),

-- Fort Liberty DOD Project Assignments
('dd222222-2222-2222-2222-222222222221', 'ce002222-2222-2222-2222-222222222222', 'd0000001-0001-0001-0001-000000000006', 'IN_PROGRESS', 'NEW_HIRE', 'Carpenter', 'a0000000-0000-0000-0000-000000000003', 13, 6, 46.15, '2024-03-15 08:00:00', NULL),
('dd222222-2222-2222-2222-222222222222', 'ce002222-2222-2222-2222-222222222222', 'd0000001-0001-0001-0001-000000000007', 'IN_PROGRESS', 'NEW_HIRE', 'Laborer', 'a0000000-0000-0000-0000-000000000004', 12, 4, 33.33, '2024-03-16 08:00:00', NULL),
('dd222222-2222-2222-2222-222222222223', 'ce002222-2222-2222-2222-222222222222', 'd0000001-0001-0001-0001-000000000008', 'PENDING', 'NEW_HIRE', 'Carpenter', 'a0000000-0000-0000-0000-000000000005', 13, 0, 0.00, '2024-03-17 08:00:00', NULL),

-- TechFab Project (Draft - no assignments yet)
('dd333333-3333-3333-3333-333333333331', 'ce003333-3333-3333-3333-333333333333', 'd0000001-0001-0001-0001-000000000009', 'PENDING', 'NEW_HIRE', 'Electrician', 'a0000000-0000-0000-0000-000000000003', 11, 0, 0.00, '2024-05-01 09:00:00', NULL),
('dd333333-3333-3333-3333-333333333332', 'ce003333-3333-3333-3333-333333333333', 'd0000001-0001-0001-0001-000000000010', 'PENDING', 'NEW_HIRE', 'Welder', 'a0000000-0000-0000-0000-000000000004', 12, 0, 0.00, '2024-05-01 09:00:00', NULL);

-- =============================================
-- 15. TASK INSTANCES
-- =============================================
-- John Anderson (pa111111...1111) - IN_PROGRESS, Welder - 8/11 completed
INSERT INTO or_task_instances (id, task_id, assignment_id, status, result, started_at, completed_at, due_date, is_waived, created_at) VALUES
('bb111111-1111-1111-1111-111111111111', 'aa111111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111111', 'COMPLETED', '{"contact_name": "Susan Anderson", "relationship": "Spouse", "contact_phone": "555-9001", "contact_email": "susan.anderson@email.com"}'::jsonb, '2024-01-15 10:30:00', '2024-01-15 11:00:00', '2024-01-20', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111112', 'aa111111-1111-1111-1111-111111111112', 'dd111111-1111-1111-1111-111111111111', 'COMPLETED', '{"address_line1": "123 Main St", "city": "Houston", "state": "TX", "zip_code": "77001"}'::jsonb, '2024-01-15 11:05:00', '2024-01-15 11:15:00', '2024-01-20', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111121', 'aa111111-1111-1111-1111-111111111121', 'dd111111-1111-1111-1111-111111111111', 'COMPLETED', '{"uploadedFiles": ["i9-passport.pdf", "i9-drivers-license.pdf"]}'::jsonb, '2024-01-16 09:00:00', '2024-01-16 10:30:00', '2024-01-22', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111122', 'aa111111-1111-1111-1111-111111111122', 'dd111111-1111-1111-1111-111111111111', 'COMPLETED', '{"uploadedFiles": ["w4-form-anderson.pdf"]}'::jsonb, '2024-01-16 11:00:00', '2024-01-16 11:20:00', '2024-01-22', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111123', 'aa111111-1111-1111-1111-111111111123', 'dd111111-1111-1111-1111-111111111111', 'COMPLETED', '{"bank_name": "First National Bank", "account_type": "Checking", "routing_number": "123456789", "account_number": "9876543210"}'::jsonb, '2024-01-17 13:00:00', '2024-01-17 13:30:00', '2024-01-24', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111131', 'aa111111-1111-1111-1111-111111111131', 'dd111111-1111-1111-1111-111111111111', 'COMPLETED', '{"certificateNumber": "OSHA10-2024-12345", "completedDate": "2024-01-18"}'::jsonb, '2024-01-17 14:00:00', '2024-01-18 16:00:00', '2024-01-27', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111132', 'aa111111-1111-1111-1111-111111111132', 'dd111111-1111-1111-1111-111111111111', 'COMPLETED', '{"completedDate": "2024-01-19", "quizScore": 95}'::jsonb, '2024-01-19 09:00:00', '2024-01-19 10:30:00', '2024-01-27', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111133', 'aa111111-1111-1111-1111-111111111133', 'dd111111-1111-1111-1111-111111111111', 'COMPLETED', '{"uploadedFiles": ["first-aid-cert.pdf", "cpr-cert.pdf"]}'::jsonb, '2024-01-19 11:00:00', '2024-01-19 11:15:00', '2024-01-27', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111141', 'aa111111-1111-1111-1111-111111111141', 'dd111111-1111-1111-1111-111111111111', 'IN_PROGRESS', NULL, '2024-01-20 08:00:00', NULL, '2024-01-30', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111142', 'aa111111-1111-1111-1111-111111111142', 'dd111111-1111-1111-1111-111111111111', 'NOT_STARTED', NULL, NULL, NULL, '2024-01-30', FALSE, '2024-01-15 10:00:00'),
('bb111111-1111-1111-1111-111111111151', 'aa111111-1111-1111-1111-111111111151', 'dd111111-1111-1111-1111-111111111111', 'NOT_STARTED', NULL, NULL, NULL, '2024-02-05', FALSE, '2024-01-15 10:00:00');

-- Maria Garcia (pa111111...1112) - COMPLETED, Pipefitter - 10/10 completed
INSERT INTO or_task_instances (id, task_id, assignment_id, status, result, started_at, completed_at, due_date, created_at) VALUES
('bb111111-2222-2222-2222-222222222211', 'aa111111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"contact_name": "Carlos Garcia", "relationship": "Spouse", "contact_phone": "555-9002"}'::jsonb, '2024-01-15 10:30:00', '2024-01-15 11:00:00', '2024-01-20', '2024-01-15 10:00:00'),
('bb111111-2222-2222-2222-222222222212', 'aa111111-1111-1111-1111-111111111112', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"address_line1": "456 Oak Ave", "city": "Houston", "state": "TX", "zip_code": "77002"}'::jsonb, '2024-01-15 11:05:00', '2024-01-15 11:15:00', '2024-01-20', '2024-01-15 10:00:00'),
('bb111111-2222-2222-2222-222222222221', 'aa111111-1111-1111-1111-111111111121', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"uploadedFiles": ["i9-documents.pdf"]}'::jsonb, '2024-01-16 09:00:00', '2024-01-16 10:00:00', '2024-01-22', '2024-01-15 10:00:00'),
('bb111111-2222-2222-2222-222222222222', 'aa111111-1111-1111-1111-111111111122', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"uploadedFiles": ["w4-garcia.pdf"]}'::jsonb, '2024-01-16 11:00:00', '2024-01-16 11:15:00', '2024-01-22', '2024-01-15 10:00:00'),
('bb111111-2222-2222-2222-222222222223', 'aa111111-1111-1111-1111-111111111123', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"bank_name": "Chase Bank", "account_type": "Checking", "routing_number": "987654321", "account_number": "1234567890"}'::jsonb, '2024-01-17 10:00:00', '2024-01-17 10:30:00', '2024-01-24', '2024-01-15 10:00:00'),
('bb111111-2222-2222-2222-222222222231', 'aa111111-1111-1111-1111-111111111131', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"certificateNumber": "OSHA10-2024-12346"}'::jsonb, '2024-01-18 09:00:00', '2024-01-19 15:00:00', '2024-01-27', '2024-01-15 10:00:00'),
('bb111111-2222-2222-2222-222222222232', 'aa111111-1111-1111-1111-111111111132', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"completedDate": "2024-01-20", "quizScore": 88}'::jsonb, '2024-01-20 09:00:00', '2024-01-20 10:00:00', '2024-01-27', '2024-01-15 10:00:00'),
('bb111111-2222-2222-2222-222222222233', 'aa111111-1111-1111-1111-111111111133', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"uploadedFiles": []}'::jsonb, '2024-01-20 11:00:00', '2024-01-20 11:05:00', '2024-01-27', '2024-01-15 10:00:00'),
('bb111111-2222-2222-2222-222222222251', 'aa111111-1111-1111-1111-111111111151', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"checkId": "BGC-2024-001", "status": "CLEAR"}'::jsonb, '2024-01-21 08:00:00', '2024-01-23 10:00:00', '2024-02-05', '2024-01-15 10:00:00'),
('bb111111-2222-2222-2222-222222222252', 'aa111111-1111-1111-1111-111111111152', 'dd111111-1111-1111-1111-111111111112', 'COMPLETED', '{"testId": "DRUG-2024-001", "result": "NEGATIVE"}'::jsonb, '2024-01-24 08:00:00', '2024-01-25 14:00:00', '2024-02-05', '2024-01-15 10:00:00');

-- David Thompson (pa111111...1113) - IN_PROGRESS, Welder - 5/11 completed
INSERT INTO or_task_instances (id, task_id, assignment_id, status, result, started_at, completed_at, due_date, created_at) VALUES
('bb111111-3333-3333-3333-333333333311', 'aa111111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111113', 'COMPLETED', '{"contact_name": "Mary Thompson", "relationship": "Spouse", "contact_phone": "555-9003"}'::jsonb, '2024-01-16 09:30:00', '2024-01-16 10:00:00', '2024-01-21', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333312', 'aa111111-1111-1111-1111-111111111112', 'dd111111-1111-1111-1111-111111111113', 'COMPLETED', '{"address_line1": "789 Pine Rd", "city": "Pasadena", "state": "TX", "zip_code": "77501"}'::jsonb, '2024-01-16 10:05:00', '2024-01-16 10:15:00', '2024-01-21', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333321', 'aa111111-1111-1111-1111-111111111121', 'dd111111-1111-1111-1111-111111111113', 'COMPLETED', '{"uploadedFiles": ["id-docs.pdf"]}'::jsonb, '2024-01-17 09:00:00', '2024-01-17 10:00:00', '2024-01-23', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333322', 'aa111111-1111-1111-1111-111111111122', 'dd111111-1111-1111-1111-111111111113', 'COMPLETED', '{"uploadedFiles": ["w4-thompson.pdf"]}'::jsonb, '2024-01-17 11:00:00', '2024-01-17 11:20:00', '2024-01-23', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333323', 'aa111111-1111-1111-1111-111111111123', 'dd111111-1111-1111-1111-111111111113', 'IN_PROGRESS', NULL, '2024-01-18 09:00:00', NULL, '2024-01-25', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333331', 'aa111111-1111-1111-1111-111111111131', 'dd111111-1111-1111-1111-111111111113', 'NOT_STARTED', NULL, NULL, NULL, '2024-01-28', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333332', 'aa111111-1111-1111-1111-111111111132', 'dd111111-1111-1111-1111-111111111113', 'NOT_STARTED', NULL, NULL, NULL, '2024-01-28', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333333', 'aa111111-1111-1111-1111-111111111133', 'dd111111-1111-1111-1111-111111111113', 'NOT_STARTED', NULL, NULL, NULL, '2024-01-28', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333341', 'aa111111-1111-1111-1111-111111111141', 'dd111111-1111-1111-1111-111111111113', 'NOT_STARTED', NULL, NULL, NULL, '2024-01-31', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333342', 'aa111111-1111-1111-1111-111111111142', 'dd111111-1111-1111-1111-111111111113', 'NOT_STARTED', NULL, NULL, NULL, '2024-01-31', '2024-01-16 09:00:00'),
('bb111111-3333-3333-3333-333333333351', 'aa111111-1111-1111-1111-111111111151', 'dd111111-1111-1111-1111-111111111113', 'NOT_STARTED', NULL, NULL, NULL, '2024-02-06', '2024-01-16 09:00:00');

-- Robert Wilson (pa111111...1115) - BLOCKED, Welder - 9/11 completed, background check failed
INSERT INTO or_task_instances (id, task_id, assignment_id, status, result, started_at, completed_at, due_date, created_at) VALUES
('bb111111-5555-5555-5555-555555555511', 'aa111111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"contact_name": "Linda Wilson", "relationship": "Spouse", "contact_phone": "555-9005"}'::jsonb, '2024-01-18 11:30:00', '2024-01-18 12:00:00', '2024-01-23', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555512', 'aa111111-1111-1111-1111-111111111112', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"address_line1": "654 Maple Dr", "city": "Houston", "state": "TX", "zip_code": "77003"}'::jsonb, '2024-01-18 12:05:00', '2024-01-18 12:15:00', '2024-01-23', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555521', 'aa111111-1111-1111-1111-111111111121', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"uploadedFiles": ["wilson-id.pdf"]}'::jsonb, '2024-01-19 09:00:00', '2024-01-19 10:00:00', '2024-01-25', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555522', 'aa111111-1111-1111-1111-111111111122', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"uploadedFiles": ["w4-wilson.pdf"]}'::jsonb, '2024-01-19 11:00:00', '2024-01-19 11:20:00', '2024-01-25', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555523', 'aa111111-1111-1111-1111-111111111123', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"bank_name": "Wells Fargo", "account_type": "Checking", "routing_number": "111222333", "account_number": "4445556666"}'::jsonb, '2024-01-20 10:00:00', '2024-01-20 10:30:00', '2024-01-27', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555531', 'aa111111-1111-1111-1111-111111111131', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"certificateNumber": "OSHA10-2024-12347"}'::jsonb, '2024-01-21 09:00:00', '2024-01-22 15:00:00', '2024-01-30', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555532', 'aa111111-1111-1111-1111-111111111132', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"completedDate": "2024-01-23", "quizScore": 92}'::jsonb, '2024-01-23 09:00:00', '2024-01-23 10:00:00', '2024-01-30', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555533', 'aa111111-1111-1111-1111-111111111133', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"uploadedFiles": ["first-aid.pdf"]}'::jsonb, '2024-01-23 11:00:00', '2024-01-23 11:10:00', '2024-01-30', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555541', 'aa111111-1111-1111-1111-111111111141', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"uploadedFiles": ["aws-weld-cert.pdf", "asme-cert.pdf"]}'::jsonb, '2024-01-24 08:00:00', '2024-01-24 09:00:00', '2024-02-03', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555542', 'aa111111-1111-1111-1111-111111111142', 'dd111111-1111-1111-1111-111111111115', 'COMPLETED', '{"years_experience": 12, "primary_skills": ["TIG Welding", "Stick Welding", "Pipe Welding"]}'::jsonb, '2024-01-24 10:00:00', '2024-01-24 11:00:00', '2024-02-03', '2024-01-18 11:00:00'),
('bb111111-5555-5555-5555-555555555551', 'aa111111-1111-1111-1111-111111111151', 'dd111111-1111-1111-1111-111111111115', 'BLOCKED', '{"checkId": "BGC-2024-005", "status": "REVIEW_REQUIRED", "notes": "Additional verification needed for employment history gap 2018-2019"}'::jsonb, '2024-01-25 08:00:00', NULL, '2024-02-08', '2024-01-18 11:00:00');

-- DOD Project - Jennifer Lee (pa222222...2221) - IN_PROGRESS, Carpenter - 6/13 completed
INSERT INTO or_task_instances (id, task_id, assignment_id, status, result, started_at, completed_at, due_date, created_at) VALUES
('bb222222-6666-6666-6666-666666666611', 'aa111111-1111-1111-1111-111111111111', 'dd222222-2222-2222-2222-222222222221', 'COMPLETED', '{"contact_name": "Robert Lee", "relationship": "Parent", "contact_phone": "555-9006"}'::jsonb, '2024-03-15 08:30:00', '2024-03-15 09:00:00', '2024-03-20', '2024-03-15 08:00:00'),
('bb222222-6666-6666-6666-666666666612', 'aa111111-1111-1111-1111-111111111112', 'dd222222-2222-2222-2222-222222222221', 'COMPLETED', '{"address_line1": "987 Cedar Ln", "city": "Houston", "state": "TX", "zip_code": "77004"}'::jsonb, '2024-03-15 09:05:00', '2024-03-15 09:15:00', '2024-03-20', '2024-03-15 08:00:00'),
('bb222222-6666-6666-6666-666666666621', 'aa111111-1111-1111-1111-111111111121', 'dd222222-2222-2222-2222-222222222221', 'COMPLETED', '{"uploadedFiles": ["lee-passport.pdf"]}'::jsonb, '2024-03-16 09:00:00', '2024-03-16 10:00:00', '2024-03-22', '2024-03-15 08:00:00'),
('bb222222-6666-6666-6666-666666666622', 'aa111111-1111-1111-1111-111111111122', 'dd222222-2222-2222-2222-222222222221', 'COMPLETED', '{"uploadedFiles": ["w4-lee.pdf"]}'::jsonb, '2024-03-16 11:00:00', '2024-03-16 11:15:00', '2024-03-22', '2024-03-15 08:00:00'),
('bb222222-6666-6666-6666-666666666711', 'aa222222-2222-2222-2222-222222222211', 'dd222222-2222-2222-2222-222222222221', 'COMPLETED', '{"uploadedFiles": ["sf86-lee.pdf"]}'::jsonb, '2024-03-17 09:00:00', '2024-03-17 11:00:00', '2024-03-24', '2024-03-15 08:00:00'),
('bb222222-6666-6666-6666-666666666712', 'aa222222-2222-2222-2222-222222222212', 'dd222222-2222-2222-2222-222222222221', 'IN_PROGRESS', NULL, '2024-03-18 09:00:00', NULL, '2024-03-24', '2024-03-15 08:00:00'),
('bb222222-6666-6666-6666-666666666721', 'aa222222-2222-2222-2222-222222222221', 'dd222222-2222-2222-2222-222222222221', 'NOT_STARTED', NULL, NULL, NULL, '2024-04-15', '2024-03-15 08:00:00');

-- =============================================
-- 16. TASK COMMENTS
-- =============================================
INSERT INTO or_task_comments (id, task_instance_id, author_id, author_name, author_role, comment, is_internal, created_at) VALUES
-- John Anderson - Welding Cert Upload (IN_PROGRESS)
('cc111111-1111-1111-1111-111111111111', 'bb111111-1111-1111-1111-111111111141', 'a0000000-0000-0000-0000-000000000003', 'Emily Smith', 'PROCESSOR', 'Please upload AWS D1.1 certification for structural welding. This is required for your assigned or_tasks.', FALSE, '2024-01-20 09:00:00'),
('cc111111-1111-1111-1111-111111111112', 'bb111111-1111-1111-1111-111111111141', NULL, 'John Anderson', 'CANDIDATE', 'I have the certification but need to request a copy from my previous employer. Should arrive by end of week.', FALSE, '2024-01-20 14:30:00'),
('cc111111-1111-1111-1111-111111111113', 'bb111111-1111-1111-1111-111111111141', 'a0000000-0000-0000-0000-000000000003', 'Emily Smith', 'PROCESSOR', 'Sounds good. Please upload as soon as you receive it. Let me know if you need any assistance.', FALSE, '2024-01-20 15:00:00'),

-- Robert Wilson - Background Check (BLOCKED)
('cc111111-5555-5555-5555-555555555551', 'bb111111-5555-5555-5555-555555555551', 'a0000000-0000-0000-0000-000000000005', 'Jennifer Williams', 'PROCESSOR', 'Internal note: Background check flagged employment gap 2018-2019. Awaiting candidate response.', TRUE, '2024-01-26 10:00:00'),
('cc111111-5555-5555-5555-555555555552', 'bb111111-5555-5555-5555-555555555551', 'a0000000-0000-0000-0000-000000000005', 'Jennifer Williams', 'PROCESSOR', 'Hi Robert, we need additional information about your employment history from 2018-2019. Can you provide documentation or references for this period?', FALSE, '2024-01-26 10:05:00'),
('cc111111-5555-5555-5555-555555555553', 'bb111111-5555-5555-5555-555555555551', NULL, 'Robert Wilson', 'CANDIDATE', 'During that time I was working on a contract project overseas in Dubai. I can provide the contract and contact information for the site supervisor.', FALSE, '2024-01-26 16:20:00'),
('cc111111-5555-5555-5555-555555555554', 'bb111111-5555-5555-5555-555555555551', 'a0000000-0000-0000-0000-000000000005', 'Jennifer Williams', 'PROCESSOR', 'Perfect! Please upload the contract and provide the supervisor contact details. That should resolve the background check hold.', FALSE, '2024-01-27 09:00:00'),

-- David Thompson - Direct Deposit (IN_PROGRESS)
('cc111111-3333-3333-3333-333333333323', 'bb111111-3333-3333-3333-333333333323', 'a0000000-0000-0000-0000-000000000004', 'James Davis', 'PROCESSOR', 'Reminder: Please complete your direct deposit form to ensure timely payment processing.', FALSE, '2024-01-19 11:00:00'),

-- Jennifer Lee - Citizenship Verification (IN_PROGRESS)
('cc222222-6666-6666-6666-666666666712', 'bb222222-6666-6666-6666-666666666712', 'a0000000-0000-0000-0000-000000000003', 'Emily Smith', 'PROCESSOR', 'For DOD or_projects, we need your passport number or naturalization certificate number. Please complete all required fields.', FALSE, '2024-03-18 10:00:00');

-- =============================================
-- 17. or_communications
-- =============================================
INSERT INTO or_communications (id, project_id, team_member_id, type, direction, subject, message, sent_by, sent_at, delivered_at, read_at, status) VALUES
-- Mass communication to all team members on Gulf Coast project
('de011111-1111-1111-1111-111111111111', 'ce001111-1111-1111-1111-111111111111', NULL, 'EMAIL', 'OUTBOUND', 'Welcome to Gulf Coast Refinery Expansion Project',
'Dear Team Members,

Welcome to the Gulf Coast Refinery Expansion Project! We are excited to have you join our team.

Please complete your onboarding or_tasks by January 31st to ensure you are ready for the project start date of February 1st, 2024.

If you have any questions, please contact your assigned processor or reach out to our project manager, Tom Henderson.

Best regards,
Acme Construction HR Team',
'a0000000-0000-0000-0000-000000000001', '2024-01-15 08:00:00', '2024-01-15 08:05:00', NULL, 'DELIVERED'),

-- Individual reminder to John Anderson
('de011111-2222-2222-2222-222222222222', 'ce001111-1111-1111-1111-111111111111', 'd0000001-0001-0001-0001-000000000001', 'EMAIL', 'OUTBOUND', 'Reminder: Welding Certification Required',
'Hi John,

I noticed you haven''t uploaded your welding certification yet. This is a required task for your position.

Please upload your AWS D1.1 certification by January 25th. If you need assistance or have any questions, feel free to reach out.

Thanks,
Emily Smith
Onboarding Processor',
'a0000000-0000-0000-0000-000000000003', '2024-01-21 10:00:00', '2024-01-21 10:02:00', '2024-01-21 14:30:00', 'READ'),

-- SMS reminder to David Thompson
('de011111-3333-3333-3333-333333333333', 'ce001111-1111-1111-1111-111111111111', 'd0000001-0001-0001-0001-000000000003', 'SMS', 'OUTBOUND', NULL,
'Hi David, this is James from Acme HR. Friendly reminder to complete your direct deposit form and remaining onboarding or_tasks. Thanks!',
'a0000000-0000-0000-0000-000000000004', '2024-01-19 09:00:00', '2024-01-19 09:00:30', '2024-01-19 09:05:00', 'READ'),

-- In-app chat between Robert Wilson and processor
('de011111-5555-5555-5555-555555555551', 'ce001111-1111-1111-1111-111111111111', 'd0000001-0001-0001-0001-000000000005', 'IN_APP_CHAT', 'INBOUND',NULL,
'Hi Jennifer, I uploaded the contract from my Dubai project. Let me know if you need anything else for the background check.',
NULL, '2024-01-27 16:00:00', '2024-01-27 16:00:01', '2024-01-27 16:05:00', 'READ'),

('de011111-5555-5555-5555-555555555552', 'ce001111-1111-1111-1111-111111111111', 'd0000001-0001-0001-0001-000000000005', 'IN_APP_CHAT', 'OUTBOUND', NULL,
'Thanks Robert! I received the documents. I''ll submit them to our background check provider and should have an update for you within 2-3 business days.',
'a0000000-0000-0000-0000-000000000005', '2024-01-27 16:30:00', '2024-01-27 16:30:01', '2024-01-27 16:35:00', 'READ'),

-- DOD Project welcome email
('de022222-1111-1111-1111-111111111111', 'ce002222-2222-2222-2222-222222222222', NULL, 'EMAIL', 'OUTBOUND', 'Fort Liberty Construction Project - Security Clearance Requirements',
'Dear Team Members,

Welcome to the Fort Liberty Construction Project. This is a Department of Defense project with enhanced security requirements.

Please note:
1. Security clearance processing will take 30-60 days
2. All personnel must be U.S. citizens
3. Enhanced background checks are mandatory
4. Complete your SF-86 form as soon as possible

Your cooperation is essential for project success.

Respectfully,
Colonel Sarah Johnson
Project Manager',
'a0000000-0000-0000-0000-000000000002', '2024-03-15 07:00:00', '2024-03-15 07:10:00', NULL, 'DELIVERED'),

-- Individual email to Jennifer Lee
('de022222-6666-6666-6666-666666666661', 'ce002222-2222-2222-2222-222222222222', 'd0000001-0001-0001-0001-000000000006', 'EMAIL', 'OUTBOUND', 'Action Required: Citizenship Verification',
'Hi Jennifer,

To proceed with your security clearance, we need you to complete the Citizenship Verification form and provide your U.S. passport number.

This is a critical requirement for all DOD project personnel. Please complete this by March 22nd.

If you have any questions about the process, please don''t hesitate to ask.

Best regards,
Emily Smith
Onboarding Processor',
'a0000000-0000-0000-0000-000000000003', '2024-03-18 11:00:00', '2024-03-18 11:02:00', '2024-03-18 13:15:00', 'READ');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify data insertion
SELECT 'or_clients' as table_name, COUNT(*) as record_count FROM or_clients
UNION ALL
SELECT 'or_users', COUNT(*) FROM or_users
UNION ALL
SELECT 'Checklist Templates', COUNT(*) FROM or_checklist_templates
UNION ALL
SELECT 'Task Groups', COUNT(*) FROM or_task_groups
UNION ALL
SELECT 'or_tasks', COUNT(*) FROM or_tasks
UNION ALL
SELECT 'Team Members', COUNT(*) FROM or_team_members
UNION ALL
SELECT 'or_projects', COUNT(*) FROM or_projects
UNION ALL
SELECT 'Project Assignments', COUNT(*) FROM or_project_assignments
UNION ALL
SELECT 'Task Instances', COUNT(*) FROM or_task_instances
UNION ALL
SELECT 'Task Comments', COUNT(*) FROM or_task_comments
UNION ALL
SELECT 'or_communications', COUNT(*) FROM or_communications;

-- Sample query: Get project dashboard statistics
SELECT
    p.name as project_name,
    p.status,
    COUNT(DISTINCT pa.id) as total_team_members,
    COUNT(DISTINCT CASE WHEN pa.status = 'COMPLETED' THEN pa.id END) as completed_onboarding,
    COUNT(DISTINCT CASE WHEN pa.status = 'IN_PROGRESS' THEN pa.id END) as in_progress,
    COUNT(DISTINCT CASE WHEN pa.status = 'BLOCKED' THEN pa.id END) as blocked,
    AVG(pa.progress_percentage) as avg_progress
FROM or_projects p
LEFT JOIN or_project_assignments pa ON p.id = pa.project_id
GROUP BY p.id, p.name, p.status
ORDER BY p.created_at DESC;

-- Sample query: Get team member task status
SELECT
    tm.first_name || ' ' || tm.last_name as team_member_name,
    p.name as project_name,
    pa.trade,
    pa.status as assignment_status,
    pa.completed_tasks || '/' || pa.total_tasks as tasks_completed,
    pa.progress_percentage,
    COUNT(CASE WHEN ti.status = 'BLOCKED' THEN 1 END) as blocked_tasks
FROM or_team_members tm
JOIN or_project_assignments pa ON tm.id = pa.team_member_id
JOIN or_projects p ON pa.project_id = p.id
LEFT JOIN or_task_instances ti ON pa.id = ti.assignment_id
GROUP BY tm.id, tm.first_name, tm.last_name, p.name, pa.trade, pa.status, pa.completed_tasks, pa.total_tasks, pa.progress_percentage
ORDER BY pa.progress_percentage ASC;
