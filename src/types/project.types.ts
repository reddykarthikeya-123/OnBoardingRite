import type { TaskGroup } from './task.types';

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface ProjectFlags {
    isDOD: boolean;
    isODRISA: boolean;
}

export interface ProjectContact {
    name: string;
    email: string;
    phone: string;
    role: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    clientId: string;
    clientName: string;
    status: ProjectStatus;

    // Project Details
    location: string;
    startDate: string;
    endDate?: string;

    // Team
    projectManager?: ProjectContact;
    safetyLead?: ProjectContact;
    siteContact?: ProjectContact;

    // Configuration
    flags: ProjectFlags;
    templateId: string;
    templateName: string;

    // Checklist (cloned from template)
    taskGroups: TaskGroup[];
    eligibilityCriteriaId?: string; // Reference to EligibilityCriteria

    // Stats
    totalTeamMembers: number;
    completedOnboarding: number;
    inProgress: number;

    createdAt: string;
    updatedAt: string;
}

export interface CreateProjectDTO {
    name: string;
    description: string;
    clientId: string;
    location: string;
    startDate: string;
    endDate?: string;
    projectManager?: ProjectContact;
    safetyLead?: ProjectContact;
    siteContact?: ProjectContact;
    flags: ProjectFlags;
    templateId: string;
}

export interface UpdateProjectDTO {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    location?: string;
    startDate?: string;
    endDate?: string;
    projectManager?: ProjectContact;
    safetyLead?: ProjectContact;
    siteContact?: ProjectContact;
    flags?: ProjectFlags;
    taskGroups?: TaskGroup[];
}
