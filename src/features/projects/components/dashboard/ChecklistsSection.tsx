import { useState, useMemo } from 'react';
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Pencil,
    FileText,
    Upload,
    Zap,
    ExternalLink,
    Filter
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button, Card, CardBody, Badge, useToast } from '../../../../components/ui';
import { mockTemplates, mockTasks, getEligibilityCriteriaById } from '../../../../data';
import type { TaskGroup, Task, TaskType, EligibilityCriteria } from '../../../../types';
import { EligibilityCriteriaBadge, EligibilityCriteriaModal } from '../../../eligibility/components';
import { TaskGroupModal, AddTaskToGroupModal } from '../../../templates/components';
import {
    CreateCustomFormModal,
    CreateDocumentUploadModal,
    CreateRestApiModal,
    CreateRedirectModal
} from '../../../tasks/components';

const taskTypeConfig: Record<TaskType, { icon: React.ReactNode; color: string; label: string }> = {
    CUSTOM_FORM: { icon: <FileText size={14} />, color: 'primary', label: 'Form' },
    DOCUMENT_UPLOAD: { icon: <Upload size={14} />, color: 'secondary', label: 'Document' },
    REST_API: { icon: <Zap size={14} />, color: 'accent', label: 'API' },
    REDIRECT: { icon: <ExternalLink size={14} />, color: 'neutral', label: 'Redirect' },
};

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function ChecklistsSection() {
    const { showToast } = useToast();

    // For demo, use first template's task groups
    const [taskGroups, setTaskGroups] = useState<TaskGroup[]>(
        () => mockTemplates[0].taskGroups.map(g => ({ ...g, tasks: [...g.tasks] }))
    );

    // Local tasks storage - stores full task objects (clones from library or new local tasks)
    const [localTasks, setLocalTasks] = useState<Record<string, Task>>({});

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(mockTemplates[0].taskGroups.map(g => g.id))
    );

    // Task Group Modal state
    const [showTaskGroupModal, setShowTaskGroupModal] = useState(false);
    const [taskGroupModalMode, setTaskGroupModalMode] = useState<'create' | 'edit'>('create');
    const [editingTaskGroup, setEditingTaskGroup] = useState<TaskGroup | null>(null);

    // Add Task Modal state
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [selectedGroupForTask, setSelectedGroupForTask] = useState<string | null>(null);

    // Task Edit Modal state - uses type-specific modals
    const [showTaskEditModal, setShowTaskEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Eligibility criteria state
    const [showEligibilityModal, setShowEligibilityModal] = useState(false);
    const [eligibilityContext, setEligibilityContext] = useState<'TEMPLATE' | 'TASK_GROUP' | 'TASK'>('TASK_GROUP');
    const [eligibilityEntityId, setEligibilityEntityId] = useState<string | null>(null);
    const [eligibilityEntityName, setEligibilityEntityName] = useState<string>('');

    // Group-level eligibility state
    const [groupEligibility, setGroupEligibility] = useState<Record<string, EligibilityCriteria | undefined>>(() => {
        const initial: Record<string, EligibilityCriteria | undefined> = {};
        mockTemplates[0].taskGroups.forEach(g => {
            if (g.eligibilityCriteriaId) {
                initial[g.id] = getEligibilityCriteriaById(g.eligibilityCriteriaId);
            }
        });
        return initial;
    });

    // Task-level eligibility state
    const [taskEligibility, setTaskEligibility] = useState<Record<string, EligibilityCriteria | undefined>>({});

    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    const getTaskDetails = (taskId: string): Task | undefined => {
        // First check local tasks (includes cloned library tasks and new local tasks)
        if (localTasks[taskId]) {
            return localTasks[taskId];
        }
        // Fall back to library for backward compatibility with existing template data
        return mockTasks.find(t => t.id === taskId);
    };

    // ==================== TASK GROUP CRUD ====================

    const openAddTaskGroupModal = () => {
        setTaskGroupModalMode('create');
        setEditingTaskGroup(null);
        setShowTaskGroupModal(true);
    };

    const openEditTaskGroupModal = (group: TaskGroup) => {
        setTaskGroupModalMode('edit');
        setEditingTaskGroup(group);
        setShowTaskGroupModal(true);
    };

    const handleSaveTaskGroup = (groupData: Omit<TaskGroup, 'id' | 'order' | 'tasks'> & { id?: string }) => {
        if (taskGroupModalMode === 'create') {
            // Create new group
            const newGroup: TaskGroup = {
                id: `tg-${generateId()}`,
                name: groupData.name,
                description: groupData.description,
                category: groupData.category,
                order: taskGroups.length + 1,
                tasks: [],
            };
            setTaskGroups(prev => [...prev, newGroup]);
            setExpandedGroups(prev => new Set([...prev, newGroup.id]));
            showToast({
                type: 'success',
                message: `Task group "${groupData.name}" created`,
            });
        } else if (groupData.id) {
            // Update existing group
            setTaskGroups(prev => prev.map(g =>
                g.id === groupData.id
                    ? { ...g, name: groupData.name, description: groupData.description, category: groupData.category }
                    : g
            ));
            showToast({
                type: 'success',
                message: `Task group "${groupData.name}" updated`,
            });
        }
    };

    const handleDeleteTaskGroup = (group: TaskGroup, e: React.MouseEvent) => {
        e.stopPropagation();

        const groupIndex = taskGroups.findIndex(g => g.id === group.id);
        const deletedGroup = { ...group };

        // Remove the group
        setTaskGroups(prev => prev.filter(g => g.id !== group.id));

        // Show toast with undo
        showToast({
            type: 'info',
            message: `Task group "${group.name}" deleted`,
            duration: 6000,
            undoAction: () => {
                // Restore the group at its original position
                setTaskGroups(prev => {
                    const newGroups = [...prev];
                    newGroups.splice(groupIndex, 0, deletedGroup);
                    return newGroups;
                });
            },
        });
    };

    // ==================== TASK CRUD ====================

    const openAddTaskModal = (groupId: string) => {
        setSelectedGroupForTask(groupId);
        setShowAddTaskModal(true);
    };

    // Handle adding tasks from library (clones them to local storage)
    const handleAddFromLibrary = (tasks: Task[]) => {
        if (!selectedGroupForTask) return;

        // Add tasks to local storage
        const newLocalTasks = { ...localTasks };
        tasks.forEach(task => {
            newLocalTasks[task.id] = task;
        });
        setLocalTasks(newLocalTasks);

        // Add task IDs to the group
        setTaskGroups(prev => prev.map(g => {
            if (g.id === selectedGroupForTask) {
                return { ...g, tasks: [...g.tasks, ...tasks.map(t => t.id)] };
            }
            return g;
        }));

        showToast({
            type: 'success',
            message: `${tasks.length} task(s) added to group`,
        });
    };

    // Handle creating a new local task
    const handleCreateLocalTask = (task: Task, pushToLibrary: boolean) => {
        if (!selectedGroupForTask) return;

        // Add task to local storage
        setLocalTasks(prev => ({
            ...prev,
            [task.id]: task
        }));

        // Add task ID to the group
        setTaskGroups(prev => prev.map(g => {
            if (g.id === selectedGroupForTask) {
                return { ...g, tasks: [...g.tasks, task.id] };
            }
            return g;
        }));

        if (pushToLibrary) {
            // In a real app, this would call an API
            showToast({
                type: 'success',
                message: `Task "${task.name}" created and added to library`,
            });
        } else {
            showToast({
                type: 'success',
                message: `Task "${task.name}" created`,
            });
        }
    };

    const openEditTaskModal = (taskId: string) => {
        const task = getTaskDetails(taskId);
        if (task) {
            // Ensure task is in local storage before editing
            if (!localTasks[taskId]) {
                // Clone from library to local storage
                setLocalTasks(prev => ({
                    ...prev,
                    [taskId]: { ...task }
                }));
            }
            setEditingTask(task);
            setShowTaskEditModal(true);
        }
    };

    // Handle saving task edits (type-specific modal callback)
    const handleSaveTaskEdit = (type: TaskType, data: any) => {
        if (!editingTask) return;

        const updatedTask: Task = {
            ...editingTask,
            name: data.name,
            description: data.description || '',
            category: data.category || editingTask.category,
            required: data.required || false,
            configuration: {
                ...editingTask.configuration,
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
            updatedAt: new Date().toISOString()
        };

        setLocalTasks(prev => ({
            ...prev,
            [editingTask.id]: updatedTask
        }));

        setEditingTask(null);
        setShowTaskEditModal(false);

        showToast({
            type: 'success',
            message: 'Task updated',
        });
    };

    const handleDeleteTask = (groupId: string, taskId: string, taskName: string) => {
        const group = taskGroups.find(g => g.id === groupId);
        if (!group) return;

        const taskIndex = group.tasks.indexOf(taskId);

        // Remove the task from the group
        setTaskGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                return { ...g, tasks: g.tasks.filter(t => t !== taskId) };
            }
            return g;
        }));

        // Show toast with undo
        showToast({
            type: 'info',
            message: `Task "${taskName}" removed from group`,
            duration: 6000,
            undoAction: () => {
                // Restore the task at its original position
                setTaskGroups(prev => prev.map(g => {
                    if (g.id === groupId) {
                        const newTasks = [...g.tasks];
                        newTasks.splice(taskIndex, 0, taskId);
                        return { ...g, tasks: newTasks };
                    }
                    return g;
                }));
            },
        });
    };

    // ==================== DRAG AND DROP ====================

    const handleDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;

        // Dropped outside a valid area
        if (!destination) return;

        // No movement
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        if (type === 'GROUP') {
            // Reorder task groups
            const newGroups = Array.from(taskGroups);
            const [removed] = newGroups.splice(source.index, 1);
            newGroups.splice(destination.index, 0, removed);

            // Update order numbers
            const updatedGroups = newGroups.map((g, i) => ({ ...g, order: i + 1 }));
            setTaskGroups(updatedGroups);
        } else if (type === 'TASK') {
            // Reorder tasks (within or between groups)
            const sourceGroupId = source.droppableId.replace('tasks-', '');
            const destGroupId = destination.droppableId.replace('tasks-', '');

            if (sourceGroupId === destGroupId) {
                // Reorder within the same group
                setTaskGroups(prev => prev.map(g => {
                    if (g.id === sourceGroupId) {
                        const newTasks = Array.from(g.tasks);
                        const [removed] = newTasks.splice(source.index, 1);
                        newTasks.splice(destination.index, 0, removed);
                        return { ...g, tasks: newTasks };
                    }
                    return g;
                }));
            } else {
                // Move between groups
                const sourceGroup = taskGroups.find(g => g.id === sourceGroupId);
                if (!sourceGroup) return;

                const taskId = sourceGroup.tasks[source.index];

                setTaskGroups(prev => prev.map(g => {
                    if (g.id === sourceGroupId) {
                        // Remove from source
                        return { ...g, tasks: g.tasks.filter((_, i) => i !== source.index) };
                    }
                    if (g.id === destGroupId) {
                        // Add to destination
                        const newTasks = Array.from(g.tasks);
                        newTasks.splice(destination.index, 0, taskId);
                        return { ...g, tasks: newTasks };
                    }
                    return g;
                }));
            }
        }
    };

    // ==================== ELIGIBILITY ====================

    // Open eligibility modal for a task group
    const openGroupEligibility = (group: TaskGroup) => {
        setEligibilityContext('TASK_GROUP');
        setEligibilityEntityId(group.id);
        setEligibilityEntityName(group.name);
        setShowEligibilityModal(true);
    };

    // Open eligibility modal for a task
    const openTaskEligibility = (taskId: string, taskName: string) => {
        setEligibilityContext('TASK');
        setEligibilityEntityId(taskId);
        setEligibilityEntityName(taskName);
        setShowEligibilityModal(true);
    };

    // Handle eligibility save
    const handleEligibilitySave = (criteria: EligibilityCriteria) => {
        if (eligibilityContext === 'TASK_GROUP' && eligibilityEntityId) {
            setGroupEligibility(prev => ({ ...prev, [eligibilityEntityId]: criteria }));
        } else if (eligibilityContext === 'TASK' && eligibilityEntityId) {
            setTaskEligibility(prev => ({ ...prev, [eligibilityEntityId]: criteria }));
        }
    };

    // Handle eligibility remove with toast + undo
    const handleEligibilityRemove = () => {
        // Store the current criteria before removing (for undo)
        const previousCriteria = getCurrentEligibility();
        const context = eligibilityContext;
        const entityId = eligibilityEntityId;

        // Perform the removal
        if (context === 'TASK_GROUP' && entityId) {
            setGroupEligibility(prev => {
                const updated = { ...prev };
                delete updated[entityId];
                return updated;
            });
        } else if (context === 'TASK' && entityId) {
            setTaskEligibility(prev => {
                const updated = { ...prev };
                delete updated[entityId];
                return updated;
            });
        }

        // Show toast with undo option
        showToast({
            type: 'info',
            message: 'Eligibility criteria removed',
            duration: 6000,
            undoAction: () => {
                // Restore the criteria
                if (previousCriteria) {
                    if (context === 'TASK_GROUP' && entityId) {
                        setGroupEligibility(prev => ({ ...prev, [entityId]: previousCriteria }));
                    } else if (context === 'TASK' && entityId) {
                        setTaskEligibility(prev => ({ ...prev, [entityId]: previousCriteria }));
                    }
                }
            },
        });
    };

    // Get current eligibility criteria for modal
    const getCurrentEligibility = () => {
        if (eligibilityContext === 'TASK_GROUP' && eligibilityEntityId) {
            return groupEligibility[eligibilityEntityId];
        } else if (eligibilityContext === 'TASK' && eligibilityEntityId) {
            return taskEligibility[eligibilityEntityId];
        }
        return undefined;
    };

    // Helper to get edit data for type-specific modal
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
                    authentication: config.authentication || { type: 'NONE' }
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

    // Get tasks already in the selected group (for modal to show "already added" badge)
    const tasksInSelectedGroup = useMemo(() => {
        if (!selectedGroupForTask) return new Set<string>();
        const group = taskGroups.find(g => g.id === selectedGroupForTask);
        return new Set(group?.tasks || []);
    }, [selectedGroupForTask, taskGroups]);

    return (
        <div className="checklists-section">
            <div className="section-header">
                <h2 className="section-title">Project Checklist</h2>
                <Button variant="primary" size="sm" onClick={openAddTaskGroupModal}>
                    <Plus size={14} />
                    Add Task Group
                </Button>
            </div>

            <p className="text-sm text-secondary mb-4">
                Configure the task groups and tasks for this onboarding project. Changes will apply to all new members.
            </p>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="task-groups" type="GROUP">
                    {(provided) => (
                        <div
                            className="flex flex-col gap-3"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {taskGroups.map((group: TaskGroup, groupIndex: number) => (
                                <Draggable key={group.id} draggableId={group.id} index={groupIndex}>
                                    {(provided, snapshot) => (
                                        <Card
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={snapshot.isDragging ? 'card-elevated' : ''}
                                        >
                                            <div
                                                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                                                onClick={() => toggleGroup(group.id)}
                                            >
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className="cursor-grab text-muted hover:text-primary transition-colors"
                                                >
                                                    <GripVertical size={18} />
                                                </div>
                                                <button className="p-1">
                                                    {expandedGroups.has(group.id) ? (
                                                        <ChevronDown size={18} />
                                                    ) : (
                                                        <ChevronRight size={18} />
                                                    )}
                                                </button>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold">{group.name}</span>
                                                        <Badge variant="secondary">{group.category}</Badge>
                                                        <span className="text-sm text-muted">{group.tasks.length} tasks</span>
                                                    </div>
                                                    {group.description && (
                                                        <p className="text-sm text-secondary mt-1">{group.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <EligibilityCriteriaBadge
                                                        criteria={groupEligibility[group.id]}
                                                        onClick={(e) => { e?.stopPropagation(); openGroupEligibility(group); }}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="btn-icon"
                                                        onClick={(e) => { e.stopPropagation(); openEditTaskGroupModal(group); }}
                                                    >
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="btn-icon"
                                                        onClick={(e) => handleDeleteTaskGroup(group, e)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>

                                            {expandedGroups.has(group.id) && (
                                                <div className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                                                    <Droppable droppableId={`tasks-${group.id}`} type="TASK">
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className={`p-2 min-h-[60px] ${snapshot.isDraggingOver ? 'bg-primary-50' : ''}`}
                                                            >
                                                                {group.tasks.length === 0 ? (
                                                                    <div className="p-4 text-center text-muted">
                                                                        <p className="mb-3">No tasks in this group</p>
                                                                        <Button
                                                                            variant="secondary"
                                                                            size="sm"
                                                                            leftIcon={<Plus size={14} />}
                                                                            onClick={() => openAddTaskModal(group.id)}
                                                                        >
                                                                            Add Task
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {group.tasks.map((taskId, taskIndex) => {
                                                                            const task = getTaskDetails(taskId);
                                                                            if (!task) return null;
                                                                            const typeConfig = taskTypeConfig[task.type];

                                                                            return (
                                                                                <Draggable key={taskId} draggableId={taskId} index={taskIndex}>
                                                                                    {(provided, snapshot) => (
                                                                                        <div
                                                                                            ref={provided.innerRef}
                                                                                            {...provided.draggableProps}
                                                                                            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors ${snapshot.isDragging ? 'bg-white shadow-lg' : ''}`}
                                                                                        >
                                                                                            <div
                                                                                                {...provided.dragHandleProps}
                                                                                                className="cursor-grab text-muted hover:text-primary transition-colors"
                                                                                            >
                                                                                                <GripVertical size={14} />
                                                                                            </div>
                                                                                            <span className="text-xs text-muted w-6">{taskIndex + 1}.</span>
                                                                                            <div className={`task-card-type ${typeConfig.color}`}>
                                                                                                {typeConfig.icon}
                                                                                                {typeConfig.label}
                                                                                            </div>
                                                                                            <div className="flex-1">
                                                                                                <div className="font-medium text-sm">{task.name}</div>
                                                                                                <div className="text-xs text-muted">{task.description}</div>
                                                                                            </div>
                                                                                            {task.required && (
                                                                                                <Badge variant="danger" className="text-xs">Required</Badge>
                                                                                            )}
                                                                                            <button
                                                                                                type="button"
                                                                                                className={`task-eligibility-icon ${taskEligibility[taskId] ? 'has-eligibility' : ''}`}
                                                                                                onClick={() => openTaskEligibility(taskId, task.name)}
                                                                                                title={taskEligibility[taskId] ? `Eligibility: ${taskEligibility[taskId]?.name}` : 'Add eligibility criteria'}
                                                                                            >
                                                                                                <Filter size={14} />
                                                                                            </button>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="btn-icon"
                                                                                                onClick={() => openEditTaskModal(taskId)}
                                                                                            >
                                                                                                <Pencil size={14} />
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="btn-icon"
                                                                                                onClick={() => handleDeleteTask(group.id, taskId, task.name)}
                                                                                            >
                                                                                                <Trash2 size={14} />
                                                                                            </Button>
                                                                                        </div>
                                                                                    )}
                                                                                </Draggable>
                                                                            );
                                                                        })}
                                                                        {provided.placeholder}
                                                                        <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                leftIcon={<Plus size={14} />}
                                                                                onClick={() => openAddTaskModal(group.id)}
                                                                            >
                                                                                Add Task
                                                                            </Button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {group.tasks.length === 0 && provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </div>
                                            )}
                                        </Card>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {taskGroups.length === 0 && (
                <Card className="empty-state-card">
                    <CardBody>
                        <div className="empty-state">
                            <h3>No Task Groups</h3>
                            <p>Create task groups to organize your onboarding checklist.</p>
                            <Button variant="primary" onClick={openAddTaskGroupModal}>
                                <Plus size={16} />
                                Add First Task Group
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Add Task Modal */}
            {selectedGroupForTask && (
                <AddTaskToGroupModal
                    isOpen={showAddTaskModal}
                    onClose={() => { setShowAddTaskModal(false); setSelectedGroupForTask(null); }}
                    onAddFromLibrary={handleAddFromLibrary}
                    onCreateLocalTask={handleCreateLocalTask}
                    existingTaskIds={tasksInSelectedGroup}
                    groupName={taskGroups.find(g => g.id === selectedGroupForTask)?.name || ''}
                />
            )}

            {/* Task Group Modal */}
            <TaskGroupModal
                isOpen={showTaskGroupModal}
                onClose={() => setShowTaskGroupModal(false)}
                onSave={handleSaveTaskGroup}
                group={editingTaskGroup}
                mode={taskGroupModalMode}
            />

            {/* Task Edit Modals - Type-specific */}
            {editingTask && (
                <>
                    <CreateCustomFormModal
                        isOpen={showTaskEditModal && editingTask.type === 'CUSTOM_FORM'}
                        onClose={() => { setEditingTask(null); setShowTaskEditModal(false); }}
                        onSave={(data) => handleSaveTaskEdit('CUSTOM_FORM', data)}
                        initialData={getEditData(editingTask) as any}
                        editMode={true}
                    />
                    <CreateDocumentUploadModal
                        isOpen={showTaskEditModal && editingTask.type === 'DOCUMENT_UPLOAD'}
                        onClose={() => { setEditingTask(null); setShowTaskEditModal(false); }}
                        onSave={(data) => handleSaveTaskEdit('DOCUMENT_UPLOAD', data)}
                        initialData={getEditData(editingTask) as any}
                        editMode={true}
                    />
                    <CreateRestApiModal
                        isOpen={showTaskEditModal && editingTask.type === 'REST_API'}
                        onClose={() => { setEditingTask(null); setShowTaskEditModal(false); }}
                        onSave={(data) => handleSaveTaskEdit('REST_API', data)}
                        initialData={getEditData(editingTask) as any}
                        editMode={true}
                    />
                    <CreateRedirectModal
                        isOpen={showTaskEditModal && editingTask.type === 'REDIRECT'}
                        onClose={() => { setEditingTask(null); setShowTaskEditModal(false); }}
                        onSave={(data) => handleSaveTaskEdit('REDIRECT', data)}
                        initialData={getEditData(editingTask) as any}
                        editMode={true}
                    />
                </>
            )}

            {/* Eligibility Criteria Modal */}
            <EligibilityCriteriaModal
                isOpen={showEligibilityModal}
                onClose={() => setShowEligibilityModal(false)}
                onSave={handleEligibilitySave}
                onRemove={handleEligibilityRemove}
                criteria={getCurrentEligibility()}
                context={eligibilityContext}
                entityName={eligibilityEntityName}
            />
        </div>
    );
}
