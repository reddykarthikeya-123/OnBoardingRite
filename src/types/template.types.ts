import type { TaskGroup } from './task.types';

export interface ChecklistTemplate {
    id: string;
    name: string;
    description: string;
    clientId?: string;
    clientName?: string;
    version: number;
    isActive: boolean;
    taskGroups: TaskGroup[];
    eligibilityCriteriaId?: string; // Reference to EligibilityCriteria
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface CreateTemplateDTO {
    name: string;
    description: string;
    clientId?: string;
    taskGroups?: TaskGroup[];
    eligibilityCriteriaId?: string;
}

export interface UpdateTemplateDTO {
    name?: string;
    description?: string;
    clientId?: string;
    taskGroups?: TaskGroup[];
    eligibilityCriteriaId?: string;
    isActive?: boolean;
}
