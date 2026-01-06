import { useState, useEffect, useRef } from 'react';
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
    Undo2,
    X
} from 'lucide-react';
import { Card, CardBody, Button, Badge, EmptyState, Modal } from '../../../components/ui';
import { mockTasks } from '../../../data';
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

// Toast notification for undo
interface ToastNotification {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'danger';
    undoAction?: () => void;
}

export function TaskLibraryPage() {
    // Task state (converted from static mockTasks)
    const [tasks, setTasks] = useState<Task[]>(() => [...mockTasks]);

    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<TaskType | 'ALL'>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'ALL'>('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Edit modal state - now uses the same type-specific modals
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Toast notifications
    const [toasts, setToasts] = useState<ToastNotification[]>([]);

    // Ref to store deleted task for undo (avoids stale closure)
    const deletedTaskRef = useRef<{ task: Task; index: number } | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        if (activeDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [activeDropdown]);

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase());
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
    const showToast = (message: string, type: ToastNotification['type'] = 'success', undoAction?: () => void) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type, undoAction }]);
        // Auto-dismiss after 8 seconds (longer for undo)
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, undoAction ? 8000 : 4000);
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Generate a unique ID
    const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // CREATE: Add new task from modal data
    const handleCreateTask = (type: TaskType, data: any) => {
        const now = new Date().toISOString();
        const newTask: Task = {
            id: generateId(),
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
                    formFields: data.fields || []
                }),
                ...(type === 'DOCUMENT_UPLOAD' && {
                    documentTypeName: data.documentTypeName,
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
            },
            createdAt: now,
            updatedAt: now
        };

        setTasks(prev => [newTask, ...prev]);
        setShowCreateModal(false);
        setSelectedTaskType(null);
        showToast(`Task "${newTask.name}" created successfully`);
    };

    // EDIT: Open edit modal with type-specific modal
    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setShowEditModal(true);
        setActiveDropdown(null);
    };

    // EDIT: Save changes from type-specific modal
    const handleSaveEdit = (type: TaskType, data: any) => {
        if (!editingTask) return;

        const now = new Date().toISOString();
        setTasks(prev => prev.map(t =>
            t.id === editingTask.id
                ? {
                    ...t,
                    name: data.name,
                    description: data.description,
                    required: data.required,
                    category: data.category,
                    estimatedTime: data.estimatedTime,
                    configuration: {
                        ...t.configuration,
                        instructions: data.instructions,
                        ...(type === 'CUSTOM_FORM' && {
                            formFields: data.formFields
                        }),
                        ...(type === 'DOCUMENT_UPLOAD' && {
                            documentTypeName: data.documentTypeName,
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
                    },
                    updatedAt: now
                }
                : t
        ));

        showToast(`Task "${data.name}" updated`);
        setEditingTask(null);
        setShowEditModal(false);
    };

    // DUPLICATE: Clone a task
    const handleDuplicateTask = (task: Task) => {
        const now = new Date().toISOString();
        const duplicatedTask: Task = {
            ...task,
            id: generateId(),
            name: `${task.name} (Copy)`,
            createdAt: now,
            updatedAt: now
        };

        setTasks(prev => [duplicatedTask, ...prev]);
        setActiveDropdown(null);
        showToast(`Task duplicated as "${duplicatedTask.name}"`);
    };

    // DELETE: Remove task with undo using ref for stable reference
    const handleDeleteTask = (task: Task) => {
        const taskIndex = tasks.findIndex(t => t.id === task.id);

        // Store in ref for undo
        deletedTaskRef.current = { task, index: taskIndex };

        // Remove from list
        setTasks(prev => prev.filter(t => t.id !== task.id));
        setActiveDropdown(null);

        // Show toast with undo option
        showToast(
            `Task "${task.name}" deleted`,
            'info',
            () => {
                // Undo: restore the task at its original position
                if (deletedTaskRef.current) {
                    const { task: deletedTask, index } = deletedTaskRef.current;
                    setTasks(prev => {
                        const newTasks = [...prev];
                        newTasks.splice(Math.min(index, newTasks.length), 0, deletedTask);
                        return newTasks;
                    });
                    deletedTaskRef.current = null;
                    showToast(`Task "${deletedTask.name}" restored`);
                }
            }
        );
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

    return (
        <div className="page-enter">
            {/* Toast Notifications */}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast toast-${toast.type}`}>
                            <div className="toast-content">
                                <span className="toast-message">{toast.message}</span>
                                {toast.undoAction && (
                                    <button
                                        className="toast-undo"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toast.undoAction?.();
                                            dismissToast(toast.id);
                                        }}
                                    >
                                        <Undo2 size={12} />
                                        Undo
                                    </button>
                                )}
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
                <div className="task-grid">
                    {filteredTasks.map((task) => {
                        const typeConfig = taskTypeConfig[task.type];

                        return (
                            <Card key={task.id} className="task-card">
                                <CardBody>
                                    <div className="task-card-header mb-3">
                                        <div className={`task-card-type ${typeConfig.color}`}>
                                            {typeConfig.icon}
                                            {typeConfig.label}
                                        </div>
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

                                    <h3 className="task-card-title">{task.name}</h3>
                                    <p className="task-card-description mb-4">{task.description}</p>

                                    <div className="flex items-center gap-2 flex-wrap mb-4">
                                        <Badge variant={categoryColors[task.category] as any}>
                                            {task.category}
                                        </Badge>
                                        {task.required && (
                                            <Badge variant="danger">Required</Badge>
                                        )}
                                    </div>

                                    {task.configuration.estimatedTime && (
                                        <div className="flex items-center gap-2 text-xs text-muted">
                                            <Clock size={12} />
                                            <span>~{task.configuration.estimatedTime} min</span>
                                        </div>
                                    )}
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
        </div>
    );
}
