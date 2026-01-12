-- Migration: Add Admin Review Workflow Support
-- Date: 2026-01-12
-- Description: Adds review_status, admin_remarks columns to task_instances and creates notifications table

-- Add review columns to task_instances
ALTER TABLE or_task_instances 
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS admin_remarks TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES or_users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Create notifications table
CREATE TABLE IF NOT EXISTS or_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES or_team_members(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    task_instance_id UUID REFERENCES or_task_instances(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_team_member ON or_notifications(team_member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON or_notifications(is_read);
