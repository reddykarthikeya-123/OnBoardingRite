// API Service Layer - Connects frontend to backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
        // Try to extract detailed error message from response body
        try {
            const errorData = await response.json();
            const detail = errorData.detail || `API Error: ${response.status} ${response.statusText}`;
            throw new Error(detail);
        } catch (parseError) {
            // If parsing fails, use default error message
            if (parseError instanceof Error && parseError.message !== `Unexpected token`) {
                throw parseError;
            }
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
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

    addMembers: async (projectId: string, memberTrades: Array<{ memberId: string, trade: string }>) => {
        // Call the existing API endpoint for each member with their specific trade
        const results = await Promise.all(
            memberTrades.map(({ memberId, trade }) =>
                fetchApi<{ success: boolean; assignmentId: string }>(`/projects/${projectId}/members`, {
                    method: 'POST',
                    body: JSON.stringify({
                        teamMemberId: memberId,
                        category: 'NEW_HIRE',
                        trade: trade
                    }),
                }).catch(err => ({ success: false, error: err }))
            )
        );
        const successCount = results.filter(r => r.success).length;
        return { success: true, added: successCount };
    },

    removeMember: (projectId: string, memberId: string) => fetchApi<{ success: boolean }>(`/projects/${projectId}/members/${memberId}`, {
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

// Candidate Portal API
export const candidateApi = {
    // Get dashboard summary for a candidate
    getDashboard: (assignmentId: string) => fetchApi<{
        candidateId: string;
        candidateName: string;
        projectName: string;
        projectId: string;
        trade: string | null;
        totalTasks: number;
        completedTasks: number;
        remainingTasks: number;
        progressPercent: number;
        daysUntilStart: number | null;
        startDate: string | null;
        categories: Array<{
            id: string;
            name: string;
            completed: number;
            total: number;
        }>;
        priorityTasks: Array<{
            id: string;
            taskId: string;
            name: string;
            type: string;
            dueIn: number | null;
            priority: string;
            status: string;
        }>;
    }>(`/candidate/dashboard/${assignmentId}`),

    // Get all tasks for assignment
    getTasks: (assignmentId: string, params?: { category?: string; status?: string }) => {
        const query = new URLSearchParams();
        if (params?.category) query.append('category', params.category);
        if (params?.status) query.append('status', params.status);
        const queryStr = query.toString();
        return fetchApi<{
            assignmentId: string;
            tasks: Array<{
                id: string;
                taskId: string;
                name: string;
                description: string | null;
                type: string;
                category: string | null;
                status: string;
                dueDate: string | null;
                isRequired: boolean;
                configuration: any;
                result: any;
                startedAt: string | null;
                completedAt: string | null;
            }>;
            totalCount: number;
            completedCount: number;
            pendingCount: number;
        }>(`/candidate/tasks/${assignmentId}${queryStr ? `?${queryStr}` : ''}`);
    },

    // Get single task detail with form fields
    getTaskDetail: (assignmentId: string, taskInstanceId: string) => fetchApi<{
        taskInstance: {
            id: string;
            status: string;
            result: any;
            startedAt: string | null;
            completedAt: string | null;
            dueDate: string | null;
        };
        task: {
            id: string;
            name: string;
            description: string | null;
            type: string;
            category: string | null;
            isRequired: boolean;
            configuration: any;
        };
        documents: Array<{
            id: string;
            filename: string;
            mimeType: string;
            fileSize: number;
            documentSide: string | null;
            uploadedAt: string | null;
        }>;
    }>(`/candidate/tasks/${assignmentId}/${taskInstanceId}`),

    // Submit form data
    submitForm: (assignmentId: string, taskInstanceId: string, formData: Record<string, any>) =>
        fetchApi<{ success: boolean; message: string; taskInstanceId: string; status: string }>(
            `/candidate/tasks/${assignmentId}/${taskInstanceId}/submit`,
            {
                method: 'POST',
                body: JSON.stringify({ formData }),
            }
        ),

    // Start a task
    startTask: (assignmentId: string, taskInstanceId: string) =>
        fetchApi<{ success: boolean; status: string; startedAt: string | null }>(
            `/candidate/tasks/${assignmentId}/${taskInstanceId}/start`,
            { method: 'POST' }
        ),

    // Get submitted tasks for profile
    getSubmittedTasks: (candidateId: string) => fetchApi<Array<{
        projectId: string;
        projectName: string;
        role: string | null;
        submissions: Array<{
            id: string;
            taskId: string;
            taskName: string;
            category: string | null;
            submittedAt: string | null;
            formData: Record<string, any> | null;
        }>;
    }>>(`/candidate/profile/submissions/${candidateId}`),

    // Get submitted tasks for a specific project
    getSubmittedTasksByProject: (candidateId: string, projectId: string) => fetchApi<Array<{
        id: string;
        taskId: string;
        taskName: string;
        category: string | null;
        submittedAt: string | null;
        formData: Record<string, any> | null;
    }>>(`/candidate/profile/submissions/${candidateId}/project/${projectId}`),
};

// Documents API - File upload and management
export const documentsApi = {
    // Upload a document file
    upload: async (
        file: File,
        taskInstanceId: string,
        metadata?: {
            documentSide?: string;
            documentNumber?: string;
            expiryDate?: string;
            uploadedBy?: string;
        }
    ): Promise<{
        success: boolean;
        document: {
            id: string;
            taskInstanceId: string;
            filename: string;
            originalFilename: string;
            mimeType: string;
            fileSize: number;
            documentSide?: string;
            documentNumber?: string;
            expiryDate?: string;
        };
        message: string;
    }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('task_instance_id', taskInstanceId);

        if (metadata?.documentSide) formData.append('document_side', metadata.documentSide);
        if (metadata?.documentNumber) formData.append('document_number', metadata.documentNumber);
        if (metadata?.expiryDate) formData.append('expiry_date', metadata.expiryDate);
        if (metadata?.uploadedBy) formData.append('uploaded_by', metadata.uploadedBy);

        const response = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header for FormData - browser will set it with boundary
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
        }

        return response.json();
    },

    // List documents for a task instance
    list: (taskInstanceId: string) => fetchApi<{
        documents: Array<{
            id: string;
            taskInstanceId: string;
            filename: string;
            originalFilename: string;
            mimeType: string;
            fileSize: number;
            documentSide?: string;
            documentNumber?: string;
            expiryDate?: string;
            uploadedAt: string;
        }>;
        total: number;
    }>(`/documents/task-instance/${taskInstanceId}`),

    // Get document view URL
    getUrl: (documentId: string) => `${API_BASE_URL}/documents/${documentId}`,

    // Get document download URL
    getDownloadUrl: (documentId: string) => `${API_BASE_URL}/documents/${documentId}/download`,

    // Delete a document
    delete: (documentId: string) => fetchApi<{ success: boolean; message: string }>(
        `/documents/${documentId}`,
        { method: 'DELETE' }
    ),
};

// Admin Management API
export const adminApi = {
    // Get current admin profile
    getProfile: (token: string) => fetchApi<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
    }>(`/admin/profile?token=${token}`),

    // Update profile
    updateProfile: (token: string, data: { firstName: string; lastName: string }) =>
        fetchApi<{ success: boolean; message: string; user: any }>(
            `/admin/profile?token=${token}`,
            { method: 'PUT', body: JSON.stringify(data) }
        ),

    // Change password
    changePassword: (token: string, data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
        fetchApi<{ success: boolean; message: string }>(
            `/admin/password?token=${token}`,
            { method: 'PUT', body: JSON.stringify(data) }
        ),

    // List all admin users
    listUsers: (token: string) => fetchApi<Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: string | null;
    }>>(`/admin/users?token=${token}`),

    // Create new admin user
    createUser: (token: string, data: { email: string; firstName: string; lastName: string; password: string }) =>
        fetchApi<{ success: boolean; message: string; user: any }>(
            `/admin/users?token=${token}`,
            { method: 'POST', body: JSON.stringify(data) }
        ),

    // Delete admin user
    deleteUser: (token: string, userId: string) =>
        fetchApi<{ success: boolean; message: string }>(
            `/admin/users/${userId}?token=${token}`,
            { method: 'DELETE' }
        ),
};

// Task Instances API (Admin Review)
export const taskInstancesApi = {
    // Approve a task submission
    approve: (instanceId: string, reviewedBy: string) =>
        fetchApi<{ success: boolean; message: string; reviewStatus: string }>(
            `/task-instances/${instanceId}/approve?reviewed_by=${reviewedBy}`,
            { method: 'POST' }
        ),

    // Reject a task submission with remarks
    reject: (instanceId: string, remarks: string, reviewedBy: string) =>
        fetchApi<{ success: boolean; message: string; reviewStatus: string }>(
            `/task-instances/${instanceId}/reject`,
            {
                method: 'POST',
                body: JSON.stringify({ remarks, reviewedBy })
            }
        ),
};

// Notifications API (Candidate Alerts)
export const notificationsApi = {
    // List notifications for a team member
    list: (teamMemberId: string, unreadOnly = false) =>
        fetchApi<Array<{
            id: string;
            type: string;
            title: string;
            message: string | null;
            taskInstanceId: string | null;
            taskName: string | null;
            isRead: boolean;
            createdAt: string | null;
        }>>(`/notifications?team_member_id=${teamMemberId}&unread_only=${unreadOnly}`),

    // Get unread count
    getUnreadCount: (teamMemberId: string) =>
        fetchApi<{ unreadCount: number }>(`/notifications/count?team_member_id=${teamMemberId}`),

    // Mark a single notification as read
    markAsRead: (notificationId: string) =>
        fetchApi<{ success: boolean }>(`/notifications/${notificationId}/read`, { method: 'PATCH' }),

    // Mark all notifications as read
    markAllAsRead: (teamMemberId: string) =>
        fetchApi<{ success: boolean }>(`/notifications/mark-all-read?team_member_id=${teamMemberId}`, { method: 'PATCH' }),
};

export { API_BASE_URL };


