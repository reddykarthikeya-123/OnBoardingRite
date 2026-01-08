import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, ChevronDown, ChevronRight, Plus, Save, Trash2,
    FileText, Upload, Link2, Settings, FolderKanban, AlertCircle,
    Users, Info, Shield, Clock, MapPin, Building, Loader2
} from 'lucide-react';
import { Button, Badge, Modal } from '../../../components/ui';
import { projectsApi, tasksApi } from '../../../services/api';
import type { Task, TaskGroup } from '../../../types';

// Inline client data for the select dropdown
const clientOptions = [
    { id: 'client-001', name: 'Acme Construction' },
    { id: 'client-002', name: 'BuildRight Industries' },
    { id: 'client-003', name: 'Global Contractors' }
];

type EditSection = 'details' | 'team' | 'compliance' | 'task';

interface TaskGroupWithTasks extends TaskGroup {
    taskObjects: Task[];
}

const getTaskTypeIcon = (type: string) => {
    switch (type) {
        case 'CUSTOM_FORM': return FileText;
        case 'DOCUMENT_UPLOAD': return Upload;
        case 'REDIRECT': return Link2;
        case 'REST_API': return Settings;
        default: return FileText;
    }
};

export function ProjectEditPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const [project, setProject] = useState<any>(null);
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [selectedSection, setSelectedSection] = useState<EditSection>('details');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Fetch project, checklist, and tasks on mount
    useEffect(() => {
        const loadData = async () => {
            if (!projectId) return;

            setLoading(true);
            setError(null);

            try {
                const [projectData, checklistData, tasksData] = await Promise.all([
                    projectsApi.get(projectId),
                    projectsApi.getChecklist(projectId),
                    tasksApi.list()
                ]);

                // Merge task groups from checklist into project data
                const projectWithChecklist = {
                    ...projectData,
                    taskGroups: checklistData || []
                };

                setProject(projectWithChecklist);
                setAllTasks(tasksData);

                // Expand all groups by default
                if (checklistData && checklistData.length > 0) {
                    setExpandedGroups(new Set(checklistData.map((g: any) => g.id)));
                }
            } catch (err) {
                console.error('Failed to load project:', err);
                setError('Failed to load project data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [projectId]);

    if (loading) {
        return (
            <div className="page-enter flex items-center justify-center py-16">
                <Loader2 className="animate-spin" size={32} />
                <span className="ml-3">Loading project...</span>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="page-enter text-center py-16">
                <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
                <p className="text-muted mb-4">{error || "The project you're looking for doesn't exist."}</p>
                <Button variant="primary" onClick={() => navigate('/projects')}>
                    Back to Projects
                </Button>
            </div>
        );
    }

    // Resolve task groups to include full task objects
    const taskGroupsWithTasks: TaskGroupWithTasks[] = (project.taskGroups || []).map((group: any) => ({
        ...group,
        taskObjects: (group.tasks || [])
            .map((task: any) => {
                // If task is already an object with name, use it directly
                if (typeof task === 'object' && task.name) {
                    return task;
                }
                // Otherwise, it's a task ID - look it up in allTasks
                return allTasks.find(t => t.id === task);
            })
            .filter(Boolean) as Task[]
    }));

    // Filter tasks based on search
    const filteredGroups = taskGroupsWithTasks.map(group => ({
        ...group,
        taskObjects: group.taskObjects.filter(task =>
            task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(group => group.taskObjects.length > 0 || searchQuery === '');

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleTaskClick = (taskId: string) => {
        setSelectedSection('task');
        setSelectedTaskId(taskId);
    };

    const selectedTask = selectedTaskId ? allTasks.find(t => t.id === selectedTaskId) ||
        taskGroupsWithTasks.flatMap(g => g.taskObjects).find(t => t.id === selectedTaskId) : null;
    const totalTasks = taskGroupsWithTasks.reduce((acc, g) => acc + g.taskObjects.length, 0);


    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteProject = async () => {
        try {
            setLoading(true);
            await projectsApi.delete(projectId!);
            navigate('/projects');
        } catch (err) {
            console.error('Failed to delete project:', err);
            alert('Failed to delete project. Please try again.');
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <div className="project-edit-layout">
            {/* Sidebar */}
            <aside className="project-edit-sidebar">
                <div className="project-edit-sidebar-header">
                    <div className="flex items-center gap-2 mb-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="btn-icon flex-shrink-0"
                            onClick={() => navigate(`/projects/${projectId}`)}
                        >
                            <ArrowLeft size={18} />
                        </Button>
                        <div className="flex-1">
                            <div className="font-semibold text-sm" style={{ wordBreak: 'break-word' }}>{project.name}</div>
                            <div className="text-xs text-muted">{project.clientName}</div>
                        </div>
                    </div>


                    <div className="project-edit-sidebar-search" style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <Search size={16} className="text-muted" />
                        </span>
                        <input
                            type="text"
                            className="input"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.25rem', fontSize: 'var(--font-size-sm)', width: '100%' }}
                        />
                    </div>
                </div>

                <div className="project-edit-sidebar-content">
                    {/* Configuration Sections */}
                    <div className="p-2 mb-1">
                        <span className="project-edit-sidebar-title">Configuration</span>
                    </div>

                    <div className="project-edit-section">
                        <button
                            className={`project-edit-task-item ${selectedSection === 'details' ? 'active' : ''}`}
                            onClick={() => { setSelectedSection('details'); setSelectedTaskId(null); }}
                        >
                            <FolderKanban size={18} />
                            <span className="project-edit-task-name">Project Details</span>
                        </button>
                        <button
                            className={`project-edit-task-item ${selectedSection === 'team' ? 'active' : ''}`}
                            onClick={() => { setSelectedSection('team'); setSelectedTaskId(null); }}
                        >
                            <Users size={18} />
                            <span className="project-edit-task-name">Team & Contacts</span>
                        </button>
                        <button
                            className={`project-edit-task-item ${selectedSection === 'compliance' ? 'active' : ''}`}
                            onClick={() => { setSelectedSection('compliance'); setSelectedTaskId(null); }}
                        >
                            <Shield size={18} />
                            <span className="project-edit-task-name">Compliance & Flags</span>
                        </button>
                    </div>

                    {/* Task Groups */}
                    <div className="p-2 mb-1 mt-4" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '12px' }}>
                        <div className="flex items-center justify-between">
                            <span className="project-edit-sidebar-title">Task Groups</span>
                            <span className="text-xs text-muted">{totalTasks} tasks</span>
                        </div>
                    </div>

                    {filteredGroups.map((group) => {
                        const isExpanded = expandedGroups.has(group.id);
                        const Icon = isExpanded ? ChevronDown : ChevronRight;

                        return (
                            <div key={group.id} className="project-edit-section">
                                <button
                                    className="project-edit-section-header"
                                    onClick={() => toggleGroup(group.id)}
                                >
                                    <span className="project-edit-section-title">
                                        <Icon size={16} />
                                        {group.name}
                                    </span>
                                    <span className="project-edit-section-count">
                                        {group.taskObjects.length}
                                    </span>
                                </button>

                                {isExpanded && (
                                    <div className="project-edit-task-list">
                                        {group.taskObjects.map((task) => {
                                            const TaskIcon = getTaskTypeIcon(task.type);
                                            const isActive = selectedSection === 'task' && selectedTaskId === task.id;

                                            return (
                                                <button
                                                    key={task.id}
                                                    className={`project-edit-task-item ${isActive ? 'active' : ''}`}
                                                    onClick={() => handleTaskClick(task.id)}
                                                >
                                                    <TaskIcon size={16} className="task-icon" />
                                                    <span className="project-edit-task-name">{task.name}</span>
                                                    {task.required && <AlertCircle size={14} style={{ color: 'var(--color-danger-500)' }} />}
                                                </button>
                                            );
                                        })}
                                        <button className="project-edit-task-item" style={{ color: 'var(--color-primary-600)' }}>
                                            <Plus size={16} />
                                            <span>Add Task</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add Group Button */}
                    <div className="p-3">
                        <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} className="w-full">
                            Add Task Group
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="project-edit-main">
                {/* PROJECT DETAILS SECTION */}
                {selectedSection === 'details' && (
                    <>
                        <header className="project-edit-main-header">
                            <div>
                                <h2 className="project-edit-main-title">Project Details</h2>
                                <p className="text-sm text-muted mt-1">Basic project information and schedule</p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" size="sm" leftIcon={<Trash2 size={14} />} onClick={handleDeleteClick}>
                                    Delete Project
                                </Button>
                                <Button variant="primary" size="sm" leftIcon={<Save size={14} />}>
                                    Save Changes
                                </Button>
                            </div>
                        </header>

                        <div className="project-edit-main-content">
                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <Info size={18} />
                                    <span>Basic Information</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Project Name *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        defaultValue={project.name}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        defaultValue={project.description}
                                        placeholder="Enter a description for this project..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Client *</label>
                                        <select className="input select" defaultValue={project.clientId}>
                                            {clientOptions.map(client => (
                                                <option key={client.id} value={client.id}>{client.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="input select" defaultValue={project.status}>
                                            <option value="ACTIVE">Active</option>
                                            <option value="PENDING">Pending</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="ON_HOLD">On Hold</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <MapPin size={18} />
                                    <span>Location & Schedule</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Location *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        defaultValue={project.location}
                                        placeholder="City, State"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Start Date *</label>
                                        <input
                                            type="date"
                                            className="input"
                                            defaultValue={project.startDate}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date</label>
                                        <input
                                            type="date"
                                            className="input"
                                            defaultValue={project.endDate}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <FileText size={18} />
                                    <span>Template</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Checklist Template</label>
                                    <div className="template-info-banner">
                                        <div className="template-info-banner-content">
                                            <span className="template-info-name">{project.templateName}</span>
                                            <span className="template-info-meta">
                                                {project.taskGroups.length} task groups • {totalTasks} tasks
                                            </span>
                                        </div>
                                        <Badge variant="secondary">Read Only</Badge>
                                    </div>
                                    <p className="text-xs text-muted mt-2">
                                        Template cannot be changed after project creation. Edit individual tasks in the sidebar.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* TEAM & CONTACTS SECTION */}
                {selectedSection === 'team' && (
                    <>
                        <header className="project-edit-main-header">
                            <div>
                                <h2 className="project-edit-main-title">Team & Contacts</h2>
                                <p className="text-sm text-muted mt-1">Project leadership and key contacts</p>
                            </div>
                            <Button variant="primary" size="sm" leftIcon={<Save size={14} />}>
                                Save Changes
                            </Button>
                        </header>

                        <div className="project-edit-main-content">
                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <Users size={18} />
                                    <span>Project Leadership</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Project Manager</label>
                                        <input
                                            type="text"
                                            className="input"
                                            defaultValue={project.projectManager?.name || ''}
                                            placeholder="Name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">PM Email</label>
                                        <input
                                            type="email"
                                            className="input"
                                            defaultValue={project.projectManager?.email || ''}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">PM Phone</label>
                                        <input
                                            type="tel"
                                            className="input"
                                            defaultValue={project.projectManager?.phone || ''}
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">PM Role</label>
                                        <input
                                            type="text"
                                            className="input"
                                            defaultValue={project.projectManager?.role || ''}
                                            placeholder="Project Manager"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <Shield size={18} />
                                    <span>Safety Lead</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Safety Lead Name</label>
                                        <input
                                            type="text"
                                            className="input"
                                            defaultValue={project.safetyLead?.name || ''}
                                            placeholder="Name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Safety Lead Email</label>
                                        <input
                                            type="email"
                                            className="input"
                                            defaultValue={project.safetyLead?.email || ''}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Safety Lead Phone</label>
                                        <input
                                            type="tel"
                                            className="input"
                                            defaultValue={project.safetyLead?.phone || ''}
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Safety Lead Role</label>
                                        <input
                                            type="text"
                                            className="input"
                                            defaultValue={project.safetyLead?.role || ''}
                                            placeholder="Safety Manager"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <Building size={18} />
                                    <span>Site Contact</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Site Contact Name</label>
                                        <input
                                            type="text"
                                            className="input"
                                            defaultValue={project.siteContact?.name || ''}
                                            placeholder="Name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Site Contact Email</label>
                                        <input
                                            type="email"
                                            className="input"
                                            defaultValue={project.siteContact?.email || ''}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Site Contact Phone</label>
                                        <input
                                            type="tel"
                                            className="input"
                                            defaultValue={project.siteContact?.phone || ''}
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Site Contact Role</label>
                                        <input
                                            type="text"
                                            className="input"
                                            defaultValue={project.siteContact?.role || ''}
                                            placeholder="Site Coordinator"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* COMPLIANCE SECTION */}
                {selectedSection === 'compliance' && (
                    <>
                        <header className="project-edit-main-header">
                            <div>
                                <h2 className="project-edit-main-title">Compliance & Flags</h2>
                                <p className="text-sm text-muted mt-1">Regulatory requirements and special project flags</p>
                            </div>
                            <Button variant="primary" size="sm" leftIcon={<Save size={14} />}>
                                Save Changes
                            </Button>
                        </header>

                        <div className="project-edit-main-content">
                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <Shield size={18} />
                                    <span>Project Flags</span>
                                </div>

                                <div className="compliance-flag-grid">
                                    <div className={`compliance-flag-card ${project.flags.isDOD ? 'active' : ''}`}>
                                        <div className="compliance-flag-header">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked={project.flags.isDOD}
                                                    className="compliance-checkbox"
                                                />
                                                <span className="compliance-flag-title">Department of Defense (DOD)</span>
                                            </label>
                                        </div>
                                        <p className="compliance-flag-description">
                                            Enable additional security clearance requirements and DOD-specific documentation for government contracts.
                                        </p>
                                    </div>

                                    <div className={`compliance-flag-card ${project.flags.isODRISA ? 'active' : ''}`}>
                                        <div className="compliance-flag-header">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked={project.flags.isODRISA}
                                                    className="compliance-checkbox"
                                                />
                                                <span className="compliance-flag-title">ODRISA Compliance</span>
                                            </label>
                                        </div>
                                        <p className="compliance-flag-description">
                                            Owner Drug & Alcohol testing requirements for petrochemical and refinery sites.
                                        </p>
                                    </div>

                                    <div className="compliance-flag-card">
                                        <div className="compliance-flag-header">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" className="compliance-checkbox" />
                                                <span className="compliance-flag-title">TWIC Required</span>
                                            </label>
                                        </div>
                                        <p className="compliance-flag-description">
                                            Transportation Worker Identification Credential required for site access.
                                        </p>
                                    </div>

                                    <div className="compliance-flag-card">
                                        <div className="compliance-flag-header">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" className="compliance-checkbox" />
                                                <span className="compliance-flag-title">Safety Council Training</span>
                                            </label>
                                        </div>
                                        <p className="compliance-flag-description">
                                            Require valid Safety Council certification for all workers.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <Clock size={18} />
                                    <span>Onboarding Settings</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Default Task Due Days</label>
                                        <input
                                            type="number"
                                            className="input"
                                            defaultValue={7}
                                            min={1}
                                            max={30}
                                        />
                                        <p className="text-xs text-muted mt-1">Days from assignment to complete tasks</p>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Auto-Reminder Days Before Due</label>
                                        <input
                                            type="number"
                                            className="input"
                                            defaultValue={2}
                                            min={1}
                                            max={7}
                                        />
                                        <p className="text-xs text-muted mt-1">Send reminder before task due date</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* TASK EDIT SECTION */}
                {selectedSection === 'task' && selectedTask && (
                    <>
                        <header className="project-edit-main-header">
                            <div>
                                <h2 className="project-edit-main-title">{selectedTask.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="primary">{selectedTask.type.replace('_', ' ')}</Badge>
                                    <Badge variant={selectedTask.required ? 'danger' : 'secondary'}>
                                        {selectedTask.required ? 'Required' : 'Optional'}
                                    </Badge>
                                    <Badge variant="secondary">{selectedTask.category}</Badge>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" size="sm" leftIcon={<Trash2 size={14} />}>
                                    Remove Task
                                </Button>
                                <Button variant="primary" size="sm" leftIcon={<Save size={14} />}>
                                    Save Changes
                                </Button>
                            </div>
                        </header>

                        <div className="project-edit-main-content">
                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <Info size={18} />
                                    <span>Task Details</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Task Name *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        defaultValue={selectedTask.name}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        defaultValue={selectedTask.description}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Task Type</label>
                                        <select className="input select" defaultValue={selectedTask.type}>
                                            <option value="CUSTOM_FORM">Custom Form</option>
                                            <option value="DOCUMENT_UPLOAD">Document Upload</option>
                                            <option value="REDIRECT">Redirect</option>
                                            <option value="REST_API">REST API</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select className="input select" defaultValue={selectedTask.category}>
                                            <option value="FORMS">Forms</option>
                                            <option value="DOCUMENTS">Documents</option>
                                            <option value="CERTIFICATIONS">Certifications</option>
                                            <option value="COMPLIANCE">Compliance</option>
                                            <option value="TRAININGS">Trainings</option>
                                            <option value="INTEGRATION">Integration</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Est. Time (min)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            defaultValue={selectedTask.configuration?.estimatedTime || 5}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            defaultChecked={selectedTask.required}
                                        />
                                        <span className="text-sm font-medium">Mark as Required</span>
                                    </label>
                                    <p className="text-xs text-muted mt-1">Required tasks must be completed before onboarding is finalized</p>
                                </div>
                            </div>

                            <div className="project-edit-form-card">
                                <div className="form-section-header">
                                    <Settings size={18} />
                                    <span>Task Configuration</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Instructions</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        defaultValue={selectedTask.configuration?.instructions || ''}
                                        placeholder="Enter instructions for the candidate..."
                                    />
                                </div>

                                {(selectedTask.type === 'REDIRECT') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Redirect URL</label>
                                            <input
                                                type="url"
                                                className="input"
                                                defaultValue={selectedTask.configuration?.redirectUrl || ''}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">External System Name</label>
                                            <input
                                                type="text"
                                                className="input"
                                                defaultValue={selectedTask.configuration?.externalSystemName || ''}
                                                placeholder="e.g., Oracle HCM"
                                            />
                                        </div>
                                    </div>
                                )}

                                {(selectedTask.type === 'DOCUMENT_UPLOAD') && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="form-label">Allowed File Types</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    defaultValue={selectedTask.configuration?.allowedFileTypes?.join(', ') || ''}
                                                    placeholder="jpg, png, pdf"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Max File Size (MB)</label>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    defaultValue={selectedTask.configuration?.maxFileSize || 10}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-6 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked={selectedTask.configuration?.requiresFrontBack}
                                                />
                                                <span className="text-sm">Requires Front & Back</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked={selectedTask.configuration?.capturesExpiry}
                                                />
                                                <span className="text-sm">Capture Expiry Date</span>
                                            </label>
                                        </div>
                                    </>
                                )}

                                {(selectedTask.type === 'REST_API') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">API Endpoint</label>
                                            <input
                                                type="text"
                                                className="input"
                                                defaultValue={selectedTask.configuration?.endpoint || ''}
                                                placeholder="/api/..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">HTTP Method</label>
                                            <select className="input select" defaultValue={selectedTask.configuration?.method || 'POST'}>
                                                <option value="GET">GET</option>
                                                <option value="POST">POST</option>
                                                <option value="PUT">PUT</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {selectedSection === 'task' && !selectedTask && (
                    <div className="project-edit-empty">
                        <FileText className="project-edit-empty-icon" />
                        <h3 className="text-lg font-medium mb-2">Select a Task</h3>
                        <p>Choose a task from the sidebar to view and edit its configuration</p>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Project"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDeleteProject}
                            leftIcon={<Trash2 size={16} />}
                        >
                            Delete Project
                        </Button>
                    </>
                }
            >
                <div className="p-2">
                    <p className="mb-2">Are you sure you want to delete <strong>{project.name}</strong>?</p>
                    <p className="text-sm text-muted">This action will permanently delete the project and all associated data. This cannot be undone.</p>
                </div>
            </Modal>
        </div>
    );
}
