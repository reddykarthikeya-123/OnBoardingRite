import { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Library,
    PlusCircle,
    FileText,
    Upload,
    Zap,
    ExternalLink,
    Check,
    Loader2
} from 'lucide-react';
import { Modal, Button, Badge } from '../../../components/ui';
import {
    CreateCustomFormModal,
    CreateDocumentUploadModal,
    CreateRestApiModal,
    CreateRedirectModal
} from '../../tasks/components';
import { tasksApi } from '../../../services/api';
import type { Task, TaskType } from '../../../types';

interface AddTaskToGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddFromLibrary: (tasks: Task[]) => void;
    onCreateLocalTask: (task: Task, pushToLibrary: boolean) => void;
    existingTaskIds: Set<string>;
    groupName: string;
}

type Tab = 'library' | 'create';

const taskTypeConfig: Record<TaskType, { icon: React.ReactNode; color: string; label: string; description: string }> = {
    CUSTOM_FORM: {
        icon: <FileText size={16} />,
        color: 'primary',
        label: 'Custom Form',
        description: 'Create a form with custom fields for data collection'
    },
    DOCUMENT_UPLOAD: {
        icon: <Upload size={16} />,
        color: 'secondary',
        label: 'Document Upload',
        description: 'Request document uploads with validation'
    },
    REST_API: {
        icon: <Zap size={16} />,
        color: 'accent',
        label: 'REST API',
        description: 'Execute an API call to external systems'
    },
    REDIRECT: {
        icon: <ExternalLink size={16} />,
        color: 'neutral',
        label: 'Redirect',
        description: 'Redirect to an external URL or system'
    },
};

// Helper to generate unique IDs
const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function AddTaskToGroupModal({
    isOpen,
    onClose,
    onAddFromLibrary,
    onCreateLocalTask,
    existingTaskIds,
    groupName
}: AddTaskToGroupModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('library');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

    // Create task flow
    const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
    const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
    const [pushToLibrary, setPushToLibrary] = useState(false);

    const resetState = () => {
        setActiveTab('library');
        setSearchQuery('');
        setSelectedTaskIds(new Set());
        setSelectedTaskType(null);
        setShowTaskTypeModal(false);
        setPushToLibrary(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const [libraryTasks, setLibraryTasks] = useState<Task[]>([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);

    // Load tasks from API when modal opens
    useEffect(() => {
        if (isOpen) {
            loadLibraryTasks();
        }
    }, [isOpen]);

    const loadLibraryTasks = async () => {
        try {
            setIsLoadingTasks(true);
            const data = await tasksApi.list();
            // Map API response to Task type
            const tasks = (Array.isArray(data) ? data : []).map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description || '',
                type: t.type as TaskType,
                category: t.category || 'FORMS',
                required: t.is_required || false,
                configuration: t.configuration || {},
                createdAt: t.created_at,
                updatedAt: t.updated_at
            }));
            setLibraryTasks(tasks);
        } catch (error) {
            console.error('Failed to load library tasks:', error);
        } finally {
            setIsLoadingTasks(false);
        }
    };

    // Filter library tasks
    const filteredTasks = useMemo(() => {
        return libraryTasks.filter(task =>
            task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, libraryTasks]);

    const toggleTaskSelection = (taskId: string) => {
        setSelectedTaskIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const handleAddFromLibrary = () => {
        // Clone selected tasks from library
        const selectedTasks = libraryTasks
            .filter(t => selectedTaskIds.has(t.id))
            .map(task => ({
                ...task
            }));

        onAddFromLibrary(selectedTasks);
        handleClose();
    };

    const handleSelectTaskType = (type: TaskType) => {
        setSelectedTaskType(type);
        setShowTaskTypeModal(true);
    };

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
                estimatedTime: data.estimatedTime,
                instructions: data.instructions,
                ...(type === 'CUSTOM_FORM' && { formFields: data.formFields }),
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
                }),
            },
            createdAt: now,
            updatedAt: now
        };

        onCreateLocalTask(newTask, pushToLibrary);
        handleClose();
    };

    // Render type-specific create modal
    const renderCreateModal = () => {
        if (!showTaskTypeModal || !selectedTaskType) return null;

        const commonProps = {
            isOpen: showTaskTypeModal,
            onClose: () => {
                setShowTaskTypeModal(false);
                setSelectedTaskType(null);
            }
        };

        switch (selectedTaskType) {
            case 'CUSTOM_FORM':
                return (
                    <CreateCustomFormModal
                        {...commonProps}
                        onSave={(data) => handleCreateTask('CUSTOM_FORM', data)}
                    />
                );
            case 'DOCUMENT_UPLOAD':
                return (
                    <CreateDocumentUploadModal
                        {...commonProps}
                        onSave={(data) => handleCreateTask('DOCUMENT_UPLOAD', data)}
                    />
                );
            case 'REST_API':
                return (
                    <CreateRestApiModal
                        {...commonProps}
                        onSave={(data) => handleCreateTask('REST_API', data)}
                    />
                );
            case 'REDIRECT':
                return (
                    <CreateRedirectModal
                        {...commonProps}
                        onSave={(data) => handleCreateTask('REDIRECT', data)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen && !showTaskTypeModal}
                onClose={handleClose}
                title={`Add Task to "${groupName}"`}
                size="lg"
                footer={
                    activeTab === 'library' ? (
                        <>
                            <Button variant="secondary" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddFromLibrary}
                                disabled={selectedTaskIds.size === 0}
                            >
                                Add {selectedTaskIds.size > 0 ? `${selectedTaskIds.size} ` : ''}Task{selectedTaskIds.size !== 1 ? 's' : ''}
                            </Button>
                        </>
                    ) : (
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                    )
                }
            >
                {/* Tabs */}
                <div className="add-task-tabs">
                    <button
                        className={`add-task-tab ${activeTab === 'library' ? 'active' : ''}`}
                        onClick={() => setActiveTab('library')}
                    >
                        <Library size={16} />
                        From Task Library
                    </button>
                    <button
                        className={`add-task-tab ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        <PlusCircle size={16} />
                        Create New Task
                    </button>
                </div>

                {/* Library Tab */}
                {activeTab === 'library' && (
                    <div className="add-task-library">
                        <div className="mb-4">
                            <div className="search-bar">
                                <Search size={18} className="search-bar-icon" />
                                <input
                                    type="text"
                                    className="input search-bar-input"
                                    placeholder="Search tasks in library..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="add-task-list">
                            {filteredTasks.map((task) => {
                                const typeConfig = taskTypeConfig[task.type];
                                const isInGroup = existingTaskIds.has(task.id);
                                const isSelected = selectedTaskIds.has(task.id);

                                return (
                                    <label
                                        key={task.id}
                                        className={`add-task-item ${isInGroup ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            disabled={isInGroup}
                                            onChange={() => toggleTaskSelection(task.id)}
                                        />
                                        <div className={`task-card-type ${typeConfig.color}`}>
                                            {typeConfig.icon}
                                            {typeConfig.label}
                                        </div>
                                        <div className="add-task-item-content">
                                            <div className="add-task-item-name">{task.name}</div>
                                            <div className="add-task-item-category">{task.category}</div>
                                        </div>
                                        {isInGroup && (
                                            <Badge variant="secondary" className="text-xs">Already added</Badge>
                                        )}
                                        {isSelected && !isInGroup && (
                                            <Check size={16} className="text-primary" />
                                        )}
                                    </label>
                                );
                            })}
                        </div>

                        <p className="text-xs text-muted mt-3">
                            Selected tasks will be copied to this template. Edits won't affect the library.
                        </p>
                    </div>
                )}

                {/* Create Tab */}
                {activeTab === 'create' && (
                    <div className="add-task-create">
                        <p className="text-secondary mb-4">
                            Select the type of task you want to create:
                        </p>

                        <div className="task-type-grid">
                            {(Object.entries(taskTypeConfig) as [TaskType, typeof taskTypeConfig[TaskType]][]).map(([type, config]) => (
                                <button
                                    key={type}
                                    className="task-type-card"
                                    onClick={() => handleSelectTaskType(type)}
                                >
                                    <div className={`task-card-type ${config.color}`}>
                                        {config.icon}
                                    </div>
                                    <div className="task-type-card-content">
                                        <span className="task-type-card-label">{config.label}</span>
                                        <span className="task-type-card-description">{config.description}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                            <label className="checkbox">
                                <input
                                    type="checkbox"
                                    checked={pushToLibrary}
                                    onChange={(e) => setPushToLibrary(e.target.checked)}
                                />
                                <span>Also save this task to the Task Library</span>
                            </label>
                            <p className="text-xs text-muted mt-1 ml-6">
                                Makes this task available for use in other templates
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Task Creation Modals */}
            {renderCreateModal()}
        </>
    );
}
