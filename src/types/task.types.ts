// Task Types
export type TaskType = 'CUSTOM_FORM' | 'DOCUMENT_UPLOAD' | 'REST_API' | 'REDIRECT';

export type TaskCategory =
    | 'DOCUMENTS'
    | 'FORMS'
    | 'CERTIFICATIONS'
    | 'TRAININGS'
    | 'COMPLIANCE'
    | 'INTEGRATION';

export type TaskStatus =
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'BLOCKED'
    | 'WAIVED';

export interface Task {
    id: string;
    name: string;
    description: string;
    type: TaskType;
    category: TaskCategory;
    required: boolean;
    configuration: TaskConfiguration;
    createdAt: string;
    updatedAt: string;
}

export interface TaskConfiguration {
    // Common configuration
    estimatedTime?: number; // in minutes
    instructions?: string;

    // Custom Form specific
    formFields?: FormField[];

    // Document Upload specific
    allowedFileTypes?: string[];
    maxFileSize?: number; // in MB
    requiresMultipleFiles?: boolean;
    requiresFrontBack?: boolean;
    capturesExpiry?: boolean;
    capturesDocumentNumber?: boolean;
    documentTypeName?: string;

    // REST API specific
    endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    baseUrl?: string;
    headers?: { key: string; value: string }[];
    requestBodyTemplate?: string;
    authentication?: AuthenticationConfig;
    checkExisting?: boolean;
    pollForResults?: boolean;
    pollInterval?: number; // in seconds
    expectedStatusCodes?: number[];
    retryPolicy?: {
        maxRetries: number;
        retryDelay: number;
    };

    // Redirect Task specific
    redirectUrl?: string;
    externalSystemName?: string;
    urlParameters?: { key: string; value: string }[];
    openInNewTab?: boolean;
    statusTracking?: StatusTrackingConfig;
}

export interface AuthenticationConfig {
    type: 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY' | 'OAUTH2';
    username?: string;
    password?: string;
    token?: string;
    apiKeyName?: string;
    apiKeyValue?: string;
    apiKeyLocation?: 'HEADER' | 'QUERY';
    oauth2Config?: {
        clientId: string;
        clientSecret: string;
        tokenUrl: string;
        scope?: string;
    };
}

export interface StatusTrackingConfig {
    enabled: boolean;
    pollingUrl?: string;
    pollingMethod?: 'GET' | 'POST';
    pollingHeaders?: { key: string; value: string }[];
    pollingAuthentication?: AuthenticationConfig;
    pollingInterval?: number; // in minutes
    statusFieldPath?: string; // JSON path to status field
    statusMapping?: { externalStatus: string; taskStatus: TaskStatus }[];
}

export interface FormField {
    id: string;
    name: string;
    label: string;
    type: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'EMAIL' | 'PHONE' | 'DATE' | 'SELECT' | 'MULTI_SELECT' | 'RADIO' | 'CHECKBOX' | 'FILE' | 'SIGNATURE' | 'EMBEDDED_PDF';
    required: boolean;
    placeholder?: string;
    helpText?: string;
    options?: { value: string; label: string }[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
    // For EMBEDDED_PDF type
    pdfConfig?: {
        url?: string;
        title?: string;
        requiresAcknowledgment?: boolean;
        acknowledgmentText?: string;
    };
}

// Task Group
export interface TaskGroup {
    id: string;
    name: string;
    description?: string;
    category: TaskCategory;
    order: number;
    tasks: Task[]; // Full Task objects
    eligibilityCriteriaId?: string; // Reference to EligibilityCriteria
}

// Note: EligibilityRule is now defined in eligibility.types.ts with comprehensive support
// for field rules, SQL rules, and nested groups

// Comment on a task instance
export interface TaskComment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorRole: 'HR_LEAD' | 'ADMIN' | 'PROCESSOR';
    isVisibleToMember: boolean;
    createdAt: string;
    updatedAt?: string;
}

// Comment on the overall checklist for a team member
export interface ChecklistComment {
    id: string;
    teamMemberId: string;
    projectId: string;
    text: string;
    authorId: string;
    authorName: string;
    authorRole: 'HR_LEAD' | 'ADMIN' | 'PROCESSOR';
    isVisibleToMember: boolean;
    createdAt: string;
    updatedAt?: string;
}

// Task Instance (for a specific team member)
export interface TaskInstance {
    id: string;
    taskId: string;
    teamMemberId: string;
    projectId: string;
    status: TaskStatus;
    assignedTo?: string;
    result?: Record<string, unknown>;
    notes?: string;
    comments?: TaskComment[];
    waivedUntil?: string;
    waivedBy?: string;
    waivedReason?: string;
    startedAt?: string;
    completedAt?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}
