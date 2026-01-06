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

    return response.json();
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

export { API_BASE_URL };
