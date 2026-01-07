// API Service Layer - Connects frontend to backend
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Generic fetch helper
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Handle empty responses (e.g., from DELETE requests)
    const text = await response.text();
    if (!text) {
        return {} as T;
    }

    return JSON.parse(text);
}

// Dashboard API
export const dashboardApi = {
    getGlobalStats: () => fetchApi<{
        activeProjects: number;
        totalTeamMembers: number;
        completedOnboarding: number;
        inProgress: number;
        blockedMembers: number;
        memberGrowthThisWeek: number;
    }>('/dashboard/stats/global'),

    getProjectsSummary: () => fetchApi<{
        active: number;
        completed: number;
        draft: number;
        onHold: number;
    }>('/dashboard/projects/summary'),

    getRecentActivity: (limit = 10) => fetchApi<Array<{
        id: string;
        type: string;
        message: string;
        timestamp: string;
        projectId: string;
        projectName: string;
    }>>(`/dashboard/activity/recent?limit=${limit}`),
};

// Projects API
export const projectsApi = {
    list: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.status) query.append('status', params.status);
        if (params?.search) query.append('search', params.search);
        if (params?.page) query.append('page', String(params.page));
        if (params?.limit) query.append('limit', String(params.limit));
        return fetchApi<{
            items: Array<any>;
            total: number;
            page: number;
            limit: number;
        }>(`/projects/?${query.toString()}`);
    },

    get: (id: string) => fetchApi<any>(`/projects/${id}`),

    create: (data: any) => fetchApi<any>('/projects/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getChecklist: (projectId: string) => fetchApi<any[]>(`/projects/${projectId}/checklist`),

    getRequisitions: (projectId: string) => fetchApi<any[]>(`/projects/${projectId}/requisitions`),

    getMembers: (projectId: string) => fetchApi<Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        trade: string;
        category: string;
        status: string;
        progressPercentage: number;
        totalTasks: number;
        completedTasks: number;
        assignedAt: string;
        taskInstances: Array<{
            taskId: string;
            status: string;
            startedAt: string | null;
            completedAt: string | null;
        }>;
    }>>(`/projects/${projectId}/members`),

    update: (id: string, data: any) => fetchApi<any>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id: string) => fetchApi<{ message: string }>(`/projects/${id}`, {
        method: 'DELETE',
    }),
};

// Eligibility Rules API
export const eligibilityApi = {
    list: (search?: string) => {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        return fetchApi<Array<{
            id: string;
            name: string;
            description: string;
            isActive: boolean;
            ruleCount: number;
            createdAt: string;
            updatedAt: string;
        }>>(`/eligibility-rules/${query}`);
    },

    get: (id: string) => fetchApi<any>(`/eligibility-rules/${id}`),

    create: (data: any) => fetchApi<any>('/eligibility-rules/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id: string, data: any) => fetchApi<any>(`/eligibility-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id: string) => fetchApi<{ success: boolean }>(`/eligibility-rules/${id}`, {
        method: 'DELETE',
    }),
};

// Templates API
export const templatesApi = {
    list: (search?: string) => {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        return fetchApi<any[]>(`/templates/${query}`);
    },

    get: (id: string) => fetchApi<any>(`/templates/${id}`),

    create: (data: any) => fetchApi<any>('/templates/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id: string, data: any) => fetchApi<any>(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id: string) => fetchApi<{ success: boolean }>(`/templates/${id}`, {
        method: 'DELETE',
    }),

    clone: (id: string) => fetchApi<any>(`/templates/${id}/clone`, {
        method: 'POST',
    }),

    // Groups
    addGroup: (templateId: string, data: any) => fetchApi<any>(`/templates/${templateId}/groups`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    deleteGroup: (templateId: string, groupId: string) => fetchApi<any>(`/templates/${templateId}/groups/${groupId}`, {
        method: 'DELETE',
    }),

    reorderGroups: (templateId: string, groupOrder: string[]) => fetchApi<any>(`/templates/${templateId}/groups/reorder`, {
        method: 'POST',
        body: JSON.stringify({ groupOrder }),
    }),

    // Tasks within Groups
    addTaskToGroup: (templateId: string, groupId: string, data: any) => fetchApi<any>(`/templates/${templateId}/groups/${groupId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    deleteTaskFromGroup: (templateId: string, groupId: string, taskId: string) => fetchApi<any>(`/templates/${templateId}/groups/${groupId}/tasks/${taskId}`, {
        method: 'DELETE',
    }),

    reorderTasks: (templateId: string, groupId: string, taskOrder: string[]) => fetchApi<any>(`/templates/${templateId}/groups/${groupId}/tasks/reorder`, {
        method: 'POST',
        body: JSON.stringify({ taskOrder }),
    }),
};

// Tasks API (Library)
export const tasksApi = {
    list: (params?: { search?: string; type?: string; category?: string }) => {
        const query = new URLSearchParams();
        if (params?.search) query.append('search', params.search);
        if (params?.type) query.append('type', params.type);
        if (params?.category) query.append('category', params.category);
        return fetchApi<any[]>(`/tasks/?${query.toString()}`);
    },

    get: (id: string) => fetchApi<any>(`/tasks/${id}`),

    create: (data: any) => fetchApi<any>('/tasks/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id: string, data: any) => fetchApi<any>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id: string) => fetchApi<{ success: boolean }>(`/tasks/${id}`, {
        method: 'DELETE',
    }),
};

// Team Members API
export const teamMembersApi = {
    list: (params?: { search?: string }) => {
        const query = params?.search ? `?search=${encodeURIComponent(params.search)}` : '';
        return fetchApi<Array<{
            id: string;
            employeeId: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            city: string;
            state: string;
            createdAt: string;
        }>>(`/team-members/${query}`);
    },

    get: (id: string) => fetchApi<any>(`/team-members/${id}`),

    create: (data: any) => fetchApi<any>('/team-members/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id: string, data: any) => fetchApi<any>(`/team-members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id: string) => fetchApi<{ message: string }>(`/team-members/${id}`, {
        method: 'DELETE',
    }),
};

export { API_BASE_URL };

