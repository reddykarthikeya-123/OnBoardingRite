import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    FileText,
    Upload,
    Zap,
    ExternalLink,
    Clock,
    MoreVertical,
    Pencil,
    Copy,
    Trash2,
    X,
    Loader2
} from 'lucide-react';
import { Card, CardBody, Button, Badge, EmptyState, Modal, ConfirmDialog } from '../../../components/ui';
import { tasksApi } from '../../../services/api';
import type { Task, TaskType, TaskCategory } from '../../../types';
import {
    CreateCustomFormModal,
    CreateDocumentUploadModal,
    CreateRestApiModal,
    CreateRedirectModal
} from '../components';

const taskTypeConfig: Record<TaskType, { icon: React.ReactNode; color: string; label: string; description: string }> = {
    CUSTOM_FORM: {
        icon: <FileText size={16} />,
        color: 'primary',
        label: 'Custom Form',
        description: 'Capture structured data with configurable form fields'
    },
    DOCUMENT_UPLOAD: {
        icon: <Upload size={16} />,
        color: 'secondary',
        label: 'Document Upload',
        description: 'Upload documents with metadata capture and validation'
    },
    REST_API: {
        icon: <Zap size={16} />,
        color: 'accent',
        label: 'REST API',
        description: 'Integrate with external systems via API calls'
    },
    REDIRECT: {
        icon: <ExternalLink size={16} />,
        color: 'neutral',
        label: 'Redirect Task',
        description: 'Redirect to external systems for task completion'
    },
};

const categoryColors: Record<TaskCategory, string> = {
    DOCUMENTS: 'secondary',
    FORMS: 'primary',
    CERTIFICATIONS: 'warning',
    TRAININGS: 'accent',
    COMPLIANCE: 'danger',
    INTEGRATION: 'primary',
};

// Toast notification
interface ToastNotification {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'danger';
}

export function TaskLibraryPage() {
    // Task state
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<TaskType | 'ALL'>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'ALL'>('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Edit modal state
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast notifications
    const [toasts, setToasts] = useState<ToastNotification[]>([]);

    useEffect(() => {
        loadTasks();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        if (activeDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [activeDropdown]);

    const loadTasks = async () => {
        try {
            setIsLoading(true);
            const data = await tasksApi.list();
            setTasks(data);
            setError('');
        } catch (err) {
            console.error('Failed to load tasks:', err);
            setError('Failed to load tasks. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const matchesType = typeFilter === 'ALL' || task.type === typeFilter;
        const matchesCategory = categoryFilter === 'ALL' || task.category === categoryFilter;
        return matchesSearch && matchesType && matchesCategory;
    });

    const tasksByType = {
        ALL: tasks.length,
        CUSTOM_FORM: tasks.filter(t => t.type === 'CUSTOM_FORM').length,
        DOCUMENT_UPLOAD: tasks.filter(t => t.type === 'DOCUMENT_UPLOAD').length,
        REST_API: tasks.filter(t => t.type === 'REST_API').length,
        REDIRECT: tasks.filter(t => t.type === 'REDIRECT').length,
    };

    // Helper to show toast
    const showToast = (message: string, type: ToastNotification['type'] = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // CREATE: Add new task
    const handleCreateTask = async (type: TaskType, data: any) => {
        try {
            const newTaskData = {
                name: data.name,
                description: data.description || '',
                type,
                category: data.category || 'FORMS',
                required: data.required || false,
                configuration: {
                    estimatedTime: data.estimatedTime || 15,
                    instructions: data.instructions || '',
                    // Type-specific config
                    ...(type === 'CUSTOM_FORM' && {
                        formFields: data.formFields || []
                    }),
                    ...(type === 'DOCUMENT_UPLOAD' && {
                        documentTypeName: data.documentTypeName,
                        documentTypePreset: data.documentTypePreset,
                        allowedFileTypes: data.allowedFileTypes,
                        maxFileSize: data.maxFileSize,
                        requiresFrontBack: data.requiresFrontBack,
                        requiresMultipleFiles: data.requiresMultipleFiles,
                        capturesExpiry: data.capturesExpiry,
                        capturesDocumentNumber: data.capturesDocumentNumber
                    }),
                    ...(type === 'REST_API' && {
                        endpoint: data.endpoint,
                        method: data.method,
                        baseUrl: data.baseUrl,
                        headers: data.headers,
                        requestBodyTemplate: data.requestBodyTemplate,
                        authentication: data.authentication
                    }),
                    ...(type === 'REDIRECT' && {
                        redirectUrl: data.redirectUrl,
                        externalSystemName: data.externalSystemName,
                        urlParameters: data.urlParameters,
                        openInNewTab: data.openInNewTab,
                        statusTracking: data.statusTracking
                    })
                }
            };

            await tasksApi.create(newTaskData);
            await loadTasks();
            setShowCreateModal(false);
            setSelectedTaskType(null);
            showToast(`Task "${data.name}" created successfully`);
        } catch (err: any) {
            console.error('Failed to create task:', err);
            // Try to extract detailed error message from API response
            const errorMessage = err?.message || 'Failed to create task';
            showToast(errorMessage, 'danger');
        }
    };

    // EDIT: Open edit modal with type-specific modal
    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setShowEditModal(true);
        setActiveDropdown(null);
    };

    // EDIT: Save changes from type-specific modal
    const handleSaveEdit = async (type: TaskType, data: any) => {
        if (!editingTask) return;

        try {
            const updateData = {
                name: data.name,
                description: data.description,
                required: data.required,
                category: data.category,
                configuration: {
                    ...editingTask.configuration,
                    estimatedTime: data.estimatedTime,
                    instructions: data.instructions,
                    ...(type === 'CUSTOM_FORM' && {
                        formFields: data.formFields
                    }),
                    ...(type === 'DOCUMENT_UPLOAD' && {
                        documentTypeName: data.documentTypeName,
                        documentTypePreset: data.documentTypePreset,
                        allowedFileTypes: data.allowedFileTypes,
                        maxFileSize: data.maxFileSize,
                        requiresFrontBack: data.requiresFrontBack,
                        requiresMultipleFiles: data.requiresMultipleFiles,
                        capturesExpiry: data.capturesExpiry,
                        capturesDocumentNumber: data.capturesDocumentNumber
                    }),
                    ...(type === 'REST_API' && {
                        endpoint: data.endpoint,
                        method: data.method,
                        baseUrl: data.baseUrl,
                        headers: data.headers,
                        requestBodyTemplate: data.requestBodyTemplate,
                        authentication: data.authentication
                    }),
                    ...(type === 'REDIRECT' && {
                        redirectUrl: data.redirectUrl,
                        externalSystemName: data.externalSystemName,
                        urlParameters: data.urlParameters,
                        openInNewTab: data.openInNewTab,
                        statusTracking: data.statusTracking
                    })
                }
            };

            await tasksApi.update(editingTask.id, updateData);
            await loadTasks();
            showToast(`Task "${data.name}" updated`);
            setEditingTask(null);
            setShowEditModal(false);
        } catch (err) {
            console.error('Failed to update task:', err);
            showToast('Failed to update task', 'danger');
        }
    };

    // DUPLICATE: Clone a task
    const handleDuplicateTask = async (task: Task) => {
        try {
            // Since we don't have a direct clone endpoint, we create a new one with same data
            const duplicateData = {
                name: `${task.name} (Copy)`,
                description: task.description,
                type: task.type,
                category: task.category,
                required: task.required,
                configuration: task.configuration
            };

            await tasksApi.create(duplicateData);
            await loadTasks();
            setActiveDropdown(null);
            showToast(`Task duplicated as "${duplicateData.name}"`);
        } catch (err) {
            console.error('Failed to duplicate task:', err);
            showToast('Failed to duplicate task', 'danger');
        }
    };

    // DELETE: Initiate delete
    const handleDeleteTask = (task: Task) => {
        setDeleteConfirm({ id: task.id, name: task.name });
        setActiveDropdown(null);
    };

    // DELETE: Confirm and execute
    const confirmDeleteTask = async () => {
        if (!deleteConfirm) return;

        setIsDeleting(true);
        try {
            await tasksApi.delete(deleteConfirm.id);
            await loadTasks();
            showToast(`Task "${deleteConfirm.name}" deleted`, 'success');
        } catch (err) {
            console.error('Failed to delete task:', err);
            showToast('Failed to delete task', 'danger');
        } finally {
            setIsDeleting(false);
            setDeleteConfirm(null);
        }
    };

    // Helper to convert task configuration to modal data format
    const getEditData = (task: Task) => {
        const config = task.configuration || {};
        const baseData = {
            name: task.name,
            description: task.description,
            category: task.category,
            estimatedTime: config.estimatedTime || 15,
            required: task.required,
            instructions: config.instructions || ''
        };

        switch (task.type) {
            case 'CUSTOM_FORM':
                return { ...baseData, formFields: config.formFields || [] };
            case 'DOCUMENT_UPLOAD':
                return {
                    ...baseData,
                    documentTypeName: config.documentTypeName || '',
                    documentTypePreset: config.documentTypePreset || 'custom',
                    allowedFileTypes: config.allowedFileTypes || ['image/jpeg', 'image/png', 'application/pdf'],
                    maxFileSize: config.maxFileSize || 10,
                    requiresFrontBack: config.requiresFrontBack || false,
                    requiresMultipleFiles: config.requiresMultipleFiles || false,
                    capturesExpiry: config.capturesExpiry || false,
                    capturesDocumentNumber: config.capturesDocumentNumber || false
                };
            case 'REST_API':
                return {
                    ...baseData,
                    endpoint: config.endpoint || '',
                    method: config.method || 'POST',
                    baseUrl: config.baseUrl || '',
                    headers: config.headers || [],
                    requestBodyTemplate: config.requestBodyTemplate || '',
                    authentication: config.authentication || { type: 'NONE' },
                    checkExisting: false,
                    pollForResults: false,
                    pollInterval: 30,
                    expectedStatusCodes: [200, 201],
                    retryPolicy: { maxRetries: 3, retryDelay: 5 }
                };
            case 'REDIRECT':
                return {
                    ...baseData,
                    redirectUrl: config.redirectUrl || '',
                    externalSystemName: config.externalSystemName || '',
                    urlParameters: config.urlParameters || [],
                    openInNewTab: config.openInNewTab !== false,
                    statusTracking: config.statusTracking || {
                        enabled: false,
                        pollingUrl: '',
                        pollingMethod: 'GET',
                        pollingHeaders: [],
                        pollingAuthentication: { type: 'NONE' },
                        pollingInterval: 60,
                        statusFieldPath: '',
                        statusMapping: []
                    }
                };
            default:
                return baseData;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] page-enter">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center page-enter">
                <p className="text-danger mb-4">{error}</p>
                <Button variant="secondary" onClick={loadTasks}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="page-enter">
            {/* Toast Notifications */}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast toast-${toast.type}`}>
                            <div className="toast-content">
                                <span className="toast-message">{toast.message}</span>
                            </div>
                            <button className="toast-close" onClick={() => dismissToast(toast.id)}>
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-top">
                    <div>
                        <h1 className="page-title">Task Library</h1>
                        <p className="page-description">Central repository of reusable task definitions</p>
                    </div>
                    <div className="page-actions">
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={16} />}
                            onClick={() => setShowCreateModal(true)}
                        >
                            Create Task
                        </Button>
                    </div>
                </div>
            </div>

            {/* Task Type Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {(Object.keys(taskTypeConfig) as TaskType[]).map((type) => {
                    const config = taskTypeConfig[type];
                    const count = tasksByType[type];
                    const isActive = typeFilter === type;

                    return (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(isActive ? 'ALL' : type)}
                            className={`card p-4 text-left transition-all cursor-pointer ${isActive ? 'card-elevated' : ''}`}
                            style={{
                                borderColor: isActive ? 'var(--color-primary-500)' : undefined,
                                background: isActive ? 'var(--color-primary-50)' : undefined
                            }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`task-card-type ${config.color}`}>
                                    {config.icon}
                                </div>
                                <span className="text-2xl font-bold">{count}</span>
                            </div>
                            <div className="font-medium text-sm mb-1">{config.label}</div>
                            <div className="text-xs text-muted">{config.description}</div>
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="search-bar" style={{ maxWidth: '300px' }}>
                    <Search size={18} className="search-bar-icon" />
                    <input
                        type="text"
                        className="input search-bar-input"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select
                    className="input select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | 'ALL')}
                    style={{ width: '180px' }}
                >
                    <option value="ALL">All Categories</option>
                    <option value="FORMS">Forms</option>
                    <option value="DOCUMENTS">Documents</option>
                    <option value="CERTIFICATIONS">Certifications</option>
                    <option value="TRAININGS">Trainings</option>
                    <option value="COMPLIANCE">Compliance</option>
                    <option value="INTEGRATION">Integration</option>
                </select>

                {(typeFilter !== 'ALL' || categoryFilter !== 'ALL') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setTypeFilter('ALL'); setCategoryFilter('ALL'); }}
                    >
                        Clear Filters
                    </Button>
                )}

                <span className="text-sm text-muted ml-auto">
                    {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Tasks Grid */}
            {filteredTasks.length === 0 ? (
                <EmptyState
                    icon={<FileText size={48} />}
                    title="No tasks found"
                    description="Try adjusting your search or filter criteria"
                />
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {filteredTasks.map((task) => {
                        const typeConfig = taskTypeConfig[task.type];

                        return (
                            <Card key={task.id} variant="interactive">
                                <CardBody className="p-0">
                                    <div className="flex">
                                        {/* Left: Large Icon Area (30%) */}
                                        <div
                                            className="flex items-center justify-center"
                                            style={{
                                                width: '30%',
                                                minHeight: '140px',
                                                background: typeConfig.color === 'primary' ? 'var(--color-primary-50)' :
                                                    typeConfig.color === 'secondary' ? 'var(--color-secondary-50)' :
                                                        typeConfig.color === 'accent' ? 'var(--color-accent-50)' :
                                                            'var(--color-neutral-100)',
                                                borderRight: '1px solid var(--color-border-light)'
                                            }}
                                        >
                                            <div style={{
                                                color: typeConfig.color === 'primary' ? 'var(--color-primary-600)' :
                                                    typeConfig.color === 'secondary' ? 'var(--color-secondary-600)' :
                                                        typeConfig.color === 'accent' ? 'var(--color-accent-600)' :
                                                            'var(--color-neutral-600)'
                                            }}>
                                                {task.type === 'CUSTOM_FORM' && <FileText size={40} />}
                                                {task.type === 'DOCUMENT_UPLOAD' && <Upload size={40} />}
                                                {task.type === 'REST_API' && <Zap size={40} />}
                                                {task.type === 'REDIRECT' && <ExternalLink size={40} />}
                                            </div>
                                        </div>

                                        {/* Right: Content Area (70%) */}
                                        <div style={{ width: '70%', padding: '16px' }}>
                                            {/* Header with type label and actions */}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-muted font-medium uppercase tracking-wide">
                                                    {typeConfig.label}
                                                </span>
                                                <div className="relative">
                                                    <button
                                                        className="btn btn-ghost btn-icon btn-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(activeDropdown === task.id ? null : task.id);
                                                        }}
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>
                                                    {activeDropdown === task.id && (
                                                        <div className="dropdown-menu" style={{ right: 0, left: 'auto' }}>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditTask(task);
                                                                }}
                                                            >
                                                                <Pencil size={14} />
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDuplicateTask(task);
                                                                }}
                                                            >
                                                                <Copy size={14} />
                                                                Duplicate
                                                            </button>
                                                            <div className="dropdown-divider" />
                                                            <button
                                                                className="dropdown-item dropdown-item-danger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteTask(task);
                                                                }}
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h3 className="font-semibold text-base mb-1">{task.name}</h3>

                                            {/* Description */}
                                            <p className="text-sm text-secondary line-clamp-2 mb-3">
                                                {task.description || 'No description'}
                                            </p>

                                            {/* Footer: Badges */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant={categoryColors[task.category] as any}>
                                                    {task.category}
                                                </Badge>
                                                {task.required && (
                                                    <Badge variant="danger">Required</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Edit Task Modals - Type-specific */}
            {editingTask && (
                <>
                    <CreateCustomFormModal
                        isOpen={showEditModal && editingTask.type === 'CUSTOM_FORM'}
                        onClose={() => { setEditingTask(null); setShowEditModal(false); }}
                        onSave={(data) => handleSaveEdit('CUSTOM_FORM', data)}
                        initialData={getEditData(editingTask) as any}
                        editMode={true}
                    />
                    <CreateDocumentUploadModal
                        isOpen={showEditModal && editingTask.type === 'DOCUMENT_UPLOAD'}
                        onClose={() => { setEditingTask(null); setShowEditModal(false); }}
                        onSave={(data) => handleSaveEdit('DOCUMENT_UPLOAD', data)}
                        initialData={getEditData(editingTask) as any}
                        editMode={true}
                    />
                    <CreateRestApiModal
                        isOpen={showEditModal && editingTask.type === 'REST_API'}
                        onClose={() => { setEditingTask(null); setShowEditModal(false); }}
                        onSave={(data) => handleSaveEdit('REST_API', data)}
                        initialData={getEditData(editingTask) as any}
                        editMode={true}
                    />
                    <CreateRedirectModal
                        isOpen={showEditModal && editingTask.type === 'REDIRECT'}
                        onClose={() => { setEditingTask(null); setShowEditModal(false); }}
                        onSave={(data) => handleSaveEdit('REDIRECT', data)}
                        initialData={getEditData(editingTask) as any}
                        editMode={true}
                    />
                </>
            )}

            {/* Task Type Selection Modal */}
            <Modal
                isOpen={showCreateModal && !selectedTaskType}
                onClose={() => { setShowCreateModal(false); setSelectedTaskType(null); }}
                title="Create New Task"
                size="lg"
            >
                <div>
                    <p className="text-secondary mb-6">Select the type of task you want to create:</p>
                    <div className="grid grid-cols-2 gap-4">
                        {(Object.entries(taskTypeConfig) as [TaskType, typeof taskTypeConfig[TaskType]][]).map(([type, config]) => (
                            <button
                                key={type}
                                onClick={() => setSelectedTaskType(type)}
                                className="p-4 border rounded-xl text-left hover:bg-neutral-50 hover:border-primary-300 transition-all"
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`task-card-type ${config.color}`}>
                                        {config.icon}
                                    </div>
                                    <span className="font-semibold">{config.label}</span>
                                </div>
                                <p className="text-sm text-secondary">{config.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Custom Form Task Modal - Create */}
            <CreateCustomFormModal
                isOpen={showCreateModal && selectedTaskType === 'CUSTOM_FORM'}
                onClose={() => { setShowCreateModal(false); setSelectedTaskType(null); }}
                onSave={(data) => handleCreateTask('CUSTOM_FORM', data)}
            />

            {/* Document Upload Task Modal - Create */}
            <CreateDocumentUploadModal
                isOpen={showCreateModal && selectedTaskType === 'DOCUMENT_UPLOAD'}
                onClose={() => { setShowCreateModal(false); setSelectedTaskType(null); }}
                onSave={(data) => handleCreateTask('DOCUMENT_UPLOAD', data)}
            />

            {/* REST API Task Modal - Create */}
            <CreateRestApiModal
                isOpen={showCreateModal && selectedTaskType === 'REST_API'}
                onClose={() => { setShowCreateModal(false); setSelectedTaskType(null); }}
                onSave={(data) => handleCreateTask('REST_API', data)}
            />

            {/* Redirect Task Modal - Create */}
            <CreateRedirectModal
                isOpen={showCreateModal && selectedTaskType === 'REDIRECT'}
                onClose={() => { setShowCreateModal(false); setSelectedTaskType(null); }}
                onSave={(data) => handleCreateTask('REDIRECT', data)}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => !isDeleting && setDeleteConfirm(null)}
                onConfirm={confirmDeleteTask}
                title="Delete Task"
                message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
                confirmText="Delete Task"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
