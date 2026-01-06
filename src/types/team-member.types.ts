import type { TaskInstance } from './task.types';

export type TeamMemberStatus =
    | 'SCHEDULED'
    | 'PROCESSING'
    | 'REFERRED_TO_SITE'
    | 'ARRIVED_TO_SITE'
    | 'ACTIVE'
    | 'INACTIVE';

export type TeamMemberCategory = 'NEW_HIRE' | 'REHIRE' | 'ACTIVE_TRANSFER';

export type Trade =
    | 'WELDER'
    | 'PIPEFITTER'
    | 'RIGGER'
    | 'ELECTRICIAN'
    | 'IRONWORKER'
    | 'CARPENTER'
    | 'MILLWRIGHT'
    | 'INSULATOR'
    | 'OPERATOR'
    | 'LABORER';

export interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;

    // Profile info
    ssn?: string; // Last 4 only for display
    dateOfBirth?: string;
    address?: Address;

    // Current assignment
    projectId?: string;
    projectName?: string;
    status: TeamMemberStatus;
    category: TeamMemberCategory;
    trade: Trade;

    // Processor assignment
    assignedProcessorId?: string;
    assignedProcessorName?: string;

    // Onboarding progress (computed)
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;

    // Task instances
    taskInstances?: TaskInstance[];

    createdAt: string;
    updatedAt: string;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface TeamMemberWithTasks extends TeamMember {
    taskInstances: TaskInstance[];
}

export interface CreateTeamMemberDTO {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    category: TeamMemberCategory;
    trade: Trade;
    projectId?: string;
}
