# Form Data Storage - Detailed Examples

## Overview

This document provides detailed, realistic examples of how form definitions and user submissions are stored in the database.

---

## Part 1: Task Definition (Form Structure)

### Table: `or_tasks`

When an admin creates a Custom Form task, the form structure is stored in the `configuration` column.

#### Example 1: Emergency Contact Form

**Task Row:**
```
id              : c7e8d9a0-1234-5678-abcd-ef0123456789
name            : Emergency Contact Information
task_type       : CUSTOM_FORM
category        : personal_info
description     : Collect emergency contact details
is_required     : true
instructions    : Please provide your emergency contact information
```

**Configuration Column (JSONB):**
```json
{
  "formFields": [
    {
      "name": "contactName",
      "label": "Emergency Contact Full Name",
      "type": "text",
      "required": true,
      "placeholder": "Enter full name"
    },
    {
      "name": "contactPhone",
      "label": "Phone Number",
      "type": "phone",
      "required": true,
      "placeholder": "(555) 000-0000"
    },
    {
      "name": "contactEmail",
      "label": "Email Address",
      "type": "email",
      "required": false,
      "placeholder": "contact@email.com"
    },
    {
      "name": "relationship",
      "label": "Relationship to You",
      "type": "select",
      "required": true,
      "options": ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"]
    },
    {
      "name": "isAlternate",
      "label": "This is an alternate contact",
      "type": "checkbox",
      "required": false
    },
    {
      "name": "notes",
      "label": "Additional Notes",
      "type": "textarea",
      "required": false,
      "placeholder": "Any special instructions..."
    }
  ]
}
```

---

#### Example 2: Banking Information Form

**Task Row:**
```
id              : a1b2c3d4-5678-90ab-cdef-123456789abc
name            : Direct Deposit Setup
task_type       : CUSTOM_FORM
category        : financial
description     : Set up direct deposit for payroll
is_required     : true
```

**Configuration Column (JSONB):**
```json
{
  "formFields": [
    {
      "name": "bankName",
      "label": "Bank Name",
      "type": "text",
      "required": true
    },
    {
      "name": "accountType",
      "label": "Account Type",
      "type": "select",
      "required": true,
      "options": ["Checking", "Savings"]
    },
    {
      "name": "routingNumber",
      "label": "Routing Number",
      "type": "text",
      "required": true,
      "validation": {
        "pattern": "^[0-9]{9}$",
        "message": "Must be 9 digits"
      }
    },
    {
      "name": "accountNumber",
      "label": "Account Number",
      "type": "text",
      "required": true
    },
    {
      "name": "depositPercentage",
      "label": "Percentage to Deposit",
      "type": "number",
      "required": true,
      "min": 1,
      "max": 100
    }
  ]
}
```

---

## Part 2: Task Instance (Before Submission)

### Table: `or_task_instances`

When a candidate is assigned to a project, task instances are created.

**Initial State (Pending):**
```
id              : f1e2d3c4-b5a6-7890-abcd-1234567890ab
task_id         : c7e8d9a0-1234-5678-abcd-ef0123456789  (Emergency Contact Form)
assignment_id   : 98765432-1234-5678-abcd-ef0123456789
status          : PENDING
result          : NULL
started_at      : NULL
completed_at    : NULL
waived          : false
waived_reason   : NULL
created_at      : 2026-01-09 10:00:00
```

---

## Part 3: User Submission (API Call)

### Candidate Submits Form

**API Endpoint:**
```
POST /api/v1/candidate/tasks/98765432-1234-5678-abcd-ef0123456789/f1e2d3c4-b5a6-7890-abcd-1234567890ab/submit
```

**Request Body:**
```json
{
  "formData": {
    "contactName": "Sarah Johnson",
    "contactPhone": "(555) 987-6543",
    "contactEmail": "sarah.johnson@email.com",
    "relationship": "Spouse",
    "isAlternate": false,
    "notes": "Best to call after 5pm"
  }
}
```

---

## Part 4: Task Instance (After Submission)

**Updated State (Completed):**
```
id              : f1e2d3c4-b5a6-7890-abcd-1234567890ab
task_id         : c7e8d9a0-1234-5678-abcd-ef0123456789
assignment_id   : 98765432-1234-5678-abcd-ef0123456789
status          : COMPLETED
started_at      : 2026-01-09 11:30:00
completed_at    : 2026-01-09 11:35:22
waived          : false
```

**Result Column (JSONB) - User's Data:**
```json
{
  "submittedAt": "2026-01-09T11:35:22.123456Z",
  "submittedBy": "john.candidate@email.com",
  "formData": {
    "contactName": "Sarah Johnson",
    "contactPhone": "(555) 987-6543",
    "contactEmail": "sarah.johnson@email.com",
    "relationship": "Spouse",
    "isAlternate": false,
    "notes": "Best to call after 5pm"
  }
}
```

---

## Part 5: Fetching Data

### Get Single Task Instance with Submitted Data

**SQL Query:**
```sql
SELECT 
    ti.id,
    ti.status,
    ti.result,
    ti.completed_at,
    t.name AS task_name,
    tm.first_name,
    tm.last_name
FROM or_task_instances ti
JOIN or_tasks t ON ti.task_id = t.id
JOIN or_project_assignments pa ON ti.assignment_id = pa.id
JOIN or_team_members tm ON pa.team_member_id = tm.id
WHERE ti.id = 'f1e2d3c4-b5a6-7890-abcd-1234567890ab';
```

**Result:**
```
id            | f1e2d3c4-b5a6-7890-abcd-1234567890ab
status        | COMPLETED
result        | {"submittedAt": "2026-01-09T11:35:22...", "formData": {...}}
completed_at  | 2026-01-09 11:35:22
task_name     | Emergency Contact Information
first_name    | John
last_name     | Doe
```

---

### Get Specific Form Field Value

**PostgreSQL JSONB Query:**
```sql
-- Get the emergency contact name
SELECT result->'formData'->>'contactName' AS emergency_contact
FROM or_task_instances
WHERE id = 'f1e2d3c4-b5a6-7890-abcd-1234567890ab';

-- Result: "Sarah Johnson"
```

---

### Get All Completed Forms for a Project

**SQL Query:**
```sql
SELECT 
    tm.first_name || ' ' || tm.last_name AS candidate_name,
    t.name AS task_name,
    ti.result->'formData' AS submitted_data,
    ti.completed_at
FROM or_task_instances ti
JOIN or_tasks t ON ti.task_id = t.id
JOIN or_project_assignments pa ON ti.assignment_id = pa.id
JOIN or_team_members tm ON pa.team_member_id = tm.id
JOIN or_projects p ON pa.project_id = p.id
WHERE p.id = 'project-uuid-here'
  AND ti.status = 'COMPLETED'
  AND t.task_type = 'CUSTOM_FORM';
```

---

## Part 6: Field Types Reference

| Type | Renders As | Example Value in formData |
|------|------------|---------------------------|
| `text` | Text input | `"John Smith"` |
| `email` | Email input | `"john@email.com"` |
| `phone` | Phone input | `"(555) 123-4567"` |
| `number` | Number input | `42` |
| `date` | Date picker | `"2026-01-15"` |
| `select` | Dropdown | `"Option 1"` |
| `checkbox` | Checkbox | `true` or `false` |
| `textarea` | Multi-line text | `"Long text here..."` |
| `radio` | Radio buttons | `"Selected Option"` |

---

## Visual Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        or_tasks                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ id: c7e8...                                                 │ │
│  │ name: "Emergency Contact Form"                              │ │
│  │ task_type: "CUSTOM_FORM"                                    │ │
│  │ configuration: {                                            │ │
│  │   formFields: [                                             │ │
│  │     {name: "contactName", type: "text", ...},               │ │
│  │     {name: "contactPhone", type: "phone", ...},             │ │
│  │     {name: "relationship", type: "select", ...}             │ │
│  │   ]                                                         │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Template assigns task to project
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    or_task_instances                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ id: f1e2...                                                 │ │
│  │ task_id: c7e8... (points to above task)                     │ │
│  │ assignment_id: 9876... (points to candidate assignment)     │ │
│  │ status: "COMPLETED"                                         │ │
│  │ result: {                                                   │ │
│  │   submittedAt: "2026-01-09T11:35:22Z",                     │ │
│  │   formData: {                                               │ │
│  │     "contactName": "Sarah Johnson",                         │ │
│  │     "contactPhone": "(555) 987-6543",                       │ │
│  │     "relationship": "Spouse"                                │ │
│  │   }                                                         │ │
│  │ }                                                           │ │
│  │ completed_at: 2026-01-09 11:35:22                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Stage | Table | Key Column | What's Stored |
|-------|-------|------------|---------------|
| Form Definition | `or_tasks` | `configuration` | Field names, types, labels, validation |
| Instance Created | `or_task_instances` | `status` | `PENDING`, `result` is NULL |
| User Submits | `or_task_instances` | `result` | User's form data as JSON |
| Completed | `or_task_instances` | `status` | `COMPLETED` with timestamp |
