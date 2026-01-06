import { useState, useMemo } from 'react';
import {
    CheckCircle,
    Clock,
    AlertCircle,
    Circle,
    ArrowRight,
    Search,
    Filter,
    AlertTriangle,
    ChevronDown,
    Mail,
    MoreHorizontal,
    Phone,
    Send,
    MessageCircle,
    CheckSquare,
    Square,
    Minus
} from 'lucide-react';
import { Card, CardBody, Badge, Button, Progress } from '../../../../components/ui';
import { mockTeamMembers, mockTasks } from '../../../../data';
import { TeamMemberDrawer } from './TeamMemberDrawer';
import { TaskDetailModal } from '../modals/TaskDetailModal';
import type { TaskStatus, TeamMember, Task, TaskInstance, TaskComment } from '../../../../types';

interface OnboardingMatrixSectionProps {
    projectId?: string;
}

// Status icon component
const StatusIcon = ({ status, isOverdue }: { status: TaskStatus; isOverdue?: boolean }) => {
    const baseClasses = 'matrix-status-icon';

    const getStatusContent = () => {
        switch (status) {
            case 'COMPLETED':
                return (
                    <div className={`${baseClasses} completed`} title="Completed">
                        <CheckCircle size={14} />
                    </div>
                );
            case 'IN_PROGRESS':
                return (
                    <div className={`${baseClasses} in-progress ${isOverdue ? 'overdue' : ''}`} title={isOverdue ? "In Progress (Overdue)" : "In Progress"}>
                        <Clock size={14} />
                    </div>
                );
            case 'BLOCKED':
                return (
                    <div className={`${baseClasses} blocked`} title="Blocked">
                        <AlertCircle size={14} />
                    </div>
                );
            case 'WAIVED':
                return (
                    <div className={`${baseClasses} waived`} title="Waived">
                        <ArrowRight size={14} />
                    </div>
                );
            default:
                return (
                    <div className={`${baseClasses} not-started ${isOverdue ? 'overdue' : ''}`} title={isOverdue ? "Not Started (Overdue)" : "Not Started"}>
                        <Circle size={14} />
                    </div>
                );
        }
    };

    return getStatusContent();
};

// Mock last activity data
const LAST_ACTIVITIES = [
    'Completed W-4 form',
    'Uploaded driver license',
    'Started background check',
    'Viewed safety training video',
    'Signed I-9 form',
    'Updated personal info',
    'Completed drug screening consent',
    'Downloaded dispatch sheet'
];

const getRandomLastActivity = (memberId: string) => {
    const index = memberId.charCodeAt(memberId.length - 1) % LAST_ACTIVITIES.length;
    const hoursAgo = Math.floor(Math.random() * 48) + 1;
    return {
        description: LAST_ACTIVITIES[index],
        timeAgo: hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`
    };
};

// Generate mock onboarding data with task statuses
const generateOnboardingData = (members: TeamMember[], tasks: Task[]) => {
    return members.map(member => {
        const taskStatuses: Record<string, { status: TaskStatus; isOverdue: boolean; dueDate?: string; completedDate?: string }> = {};

        tasks.forEach((task, index) => {
            const instance = member.taskInstances?.find(ti => ti.taskId === task.id);
            const status: TaskStatus = instance?.status ||
                (index < member.completedTasks ? 'COMPLETED' :
                    index === member.completedTasks ? 'IN_PROGRESS' : 'NOT_STARTED');

            const isOverdue = status !== 'COMPLETED' && status !== 'WAIVED' && Math.random() < 0.2;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (isOverdue ? -3 : 7));

            taskStatuses[task.id] = {
                status,
                isOverdue,
                dueDate: dueDate.toISOString(),
                completedDate: status === 'COMPLETED' ? new Date().toISOString() : undefined
            };
        });

        return {
            member,
            taskStatuses,
            overdueCount: Object.values(taskStatuses).filter(t => t.isOverdue).length
        };
    });
};

// Communication action button component
const ActionButton = ({ icon, label, variant = 'default', onClick }: {
    icon: React.ReactNode;
    label: string;
    variant?: 'default' | 'primary' | 'success' | 'warning';
    onClick?: () => void;
}) => (
    <button
        className={`action-icon-btn ${variant}`}
        title={label}
        onClick={(e) => {
            e.stopPropagation();
            onClick?.();
        }}
    >
        {icon}
    </button>
);

// Actions dropdown component
const ActionsDropdown = ({ memberId }: { memberId: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        { label: 'View Profile', action: () => console.log('View profile', memberId) },
        { label: 'Edit Details', action: () => console.log('Edit', memberId) },
        { label: 'Reassign Processor', action: () => console.log('Reassign', memberId) },
        { label: 'View Task History', action: () => console.log('History', memberId) },
        { label: 'Export Data', action: () => console.log('Export', memberId) },
        { label: 'Remove from Project', action: () => console.log('Remove', memberId), danger: true }
    ];

    return (
        <div className="actions-dropdown-wrapper">
            <button
                className="action-icon-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                <MoreHorizontal size={16} />
            </button>
            {isOpen && (
                <>
                    <div className="actions-dropdown-backdrop" onClick={() => setIsOpen(false)} />
                    <div className="actions-dropdown-menu">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                className={`actions-dropdown-item ${action.danger ? 'danger' : ''}`}
                                onClick={() => {
                                    action.action();
                                    setIsOpen(false);
                                }}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export function OnboardingMatrixSection({ projectId }: OnboardingMatrixSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [activeView, setActiveView] = useState<'detailed' | 'matrix'>('detailed');
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

    // Drawer and modal state
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedTaskInstance, setSelectedTaskInstance] = useState<TaskInstance | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskInstanceUpdates, setTaskInstanceUpdates] = useState<Record<string, TaskStatus>>({});

    // Get members for the project (or demo data if no match)
    const members = useMemo(() => {
        let filtered = projectId
            ? mockTeamMembers.filter(m => m.projectId === projectId)
            : [];

        if (filtered.length === 0) {
            filtered = mockTeamMembers.filter(m => m.projectId === 'project-001');
        }

        return filtered;
    }, [projectId]);

    // Get tasks (use a subset for the matrix)
    const tasks = useMemo(() => {
        return mockTasks.slice(0, 10);
    }, []);

    // Generate onboarding data with task statuses
    const onboardingData = useMemo(() => {
        return generateOnboardingData(members, tasks);
    }, [members, tasks]);

    // Filter data based on search and status
    const filteredData = useMemo(() => {
        return onboardingData.filter(item => {
            const matchesSearch = searchQuery === '' ||
                `${item.member.firstName} ${item.member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.member.trade.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'overdue' && item.overdueCount > 0) ||
                (statusFilter === 'completed' && item.member.progressPercentage === 100) ||
                (statusFilter === 'in-progress' && item.member.progressPercentage > 0 && item.member.progressPercentage < 100) ||
                (statusFilter === 'not-started' && item.member.progressPercentage === 0);

            return matchesSearch && matchesStatus;
        });
    }, [onboardingData, searchQuery, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        const total = onboardingData.length;
        const completed = onboardingData.filter(d => d.member.progressPercentage === 100).length;
        const withOverdue = onboardingData.filter(d => d.overdueCount > 0).length;
        return { total, completed, withOverdue };
    }, [onboardingData]);

    const getTradeColor = (trade: string) => {
        const colors: Record<string, string> = {
            'WELDER': 'primary',
            'PIPEFITTER': 'secondary',
            'RIGGER': 'warning',
            'ELECTRICIAN': 'danger',
            'IRONWORKER': 'success',
            'CARPENTER': 'primary',
            'MILLWRIGHT': 'secondary',
            'INSULATOR': 'warning',
            'OPERATOR': 'success',
            'LABORER': 'default'
        };
        return colors[trade] || 'default';
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'COMPLETED': return 'success';
            case 'REFERRED_TO_SITE': return 'primary';
            case 'ARRIVED_TO_SITE': return 'success';
            case 'IN_PROGRESS': return 'warning';
            case 'ONBOARDING_INITIATED': return 'warning';
            default: return 'secondary';
        }
    };

    // Calculate task category completions for a member
    const getTaskCategoryStats = (member: TeamMember) => {
        const formsTasks = member.taskInstances?.filter(t =>
            ['task-001', 'task-002', 'task-003', 'task-004', 'task-005'].includes(t.taskId)
        ) || [];
        const formsCompleted = formsTasks.filter(t => t.status === 'COMPLETED').length;

        const docsTasks = member.taskInstances?.filter(t =>
            ['task-010', 'task-011', 'task-012', 'task-013'].includes(t.taskId)
        ) || [];
        const docsCompleted = docsTasks.filter(t => t.status === 'COMPLETED').length;

        const complianceTasks = member.taskInstances?.filter(t =>
            ['task-020', 'task-021', 'task-022'].includes(t.taskId)
        ) || [];
        const complianceCompleted = complianceTasks.filter(t => t.status === 'COMPLETED').length;

        const trainingTasks = member.taskInstances?.filter(t =>
            ['task-030', 'task-031', 'task-032', 'task-033'].includes(t.taskId)
        ) || [];
        const trainingCompleted = trainingTasks.filter(t => t.status === 'COMPLETED').length;

        return {
            forms: { completed: formsCompleted, total: formsTasks.length },
            docs: { completed: docsCompleted, total: docsTasks.length },
            compliance: { completed: complianceCompleted, total: complianceTasks.length },
            training: { completed: trainingCompleted, total: trainingTasks.length }
        };
    };

    const handleSendReminder = (memberId: string, type: 'email' | 'sms' | 'both') => {
        console.log(`Sending ${type} reminder to ${memberId}`);
        // In real app, would call API
    };

    const handleContact = (memberId: string, type: 'email' | 'phone') => {
        console.log(`Contacting ${memberId} via ${type}`);
    };

    const handleChat = (memberId: string) => {
        console.log(`Opening chat with ${memberId}`);
        // Navigate to chat with this member
    };

    // Selection handlers
    const toggleMemberSelection = (memberId: string) => {
        setSelectedMembers(prev => {
            const next = new Set(prev);
            if (next.has(memberId)) {
                next.delete(memberId);
            } else {
                next.add(memberId);
            }
            return next;
        });
    };

    const selectAllMembers = () => {
        if (selectedMembers.size === filteredData.length) {
            setSelectedMembers(new Set());
        } else {
            setSelectedMembers(new Set(filteredData.map(d => d.member.id)));
        }
    };

    const handleMassCommunication = (type: 'email' | 'sms', recipients: 'selected' | 'all') => {
        const targetMembers = recipients === 'all'
            ? filteredData.map(d => d.member)
            : filteredData.filter(d => selectedMembers.has(d.member.id)).map(d => d.member);
        console.log(`Sending ${type} to ${targetMembers.length} members:`, targetMembers.map(m => m.email));
        alert(`${type.toUpperCase()} will be sent to ${targetMembers.length} team member(s)`);
    };

    // Drawer handlers
    const handleOpenDrawer = (member: TeamMember) => {
        setSelectedMember(member);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedMember(null);
    };

    // Task modal handlers
    const handleOpenTaskModal = (taskInstance: TaskInstance, task: Task) => {
        setSelectedTaskInstance(taskInstance);
        setSelectedTask(task);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setIsTaskModalOpen(false);
        setSelectedTaskInstance(null);
        setSelectedTask(null);
    };

    const handleUpdateTaskStatus = (instanceId: string, newStatus: TaskStatus) => {
        setTaskInstanceUpdates(prev => ({ ...prev, [instanceId]: newStatus }));
        // In a real app, would call API here
        console.log(`Updated task ${instanceId} to status ${newStatus}`);
    };

    const handleAddTaskComment = (instanceId: string, comment: TaskComment) => {
        // In a real app, would call API here
        console.log(`Added comment to task ${instanceId}:`, comment);
    };

    const isAllSelected = selectedMembers.size === filteredData.length && filteredData.length > 0;
    const isSomeSelected = selectedMembers.size > 0 && selectedMembers.size < filteredData.length;


    return (
        <div className="onboarding-matrix-section">
            {/* Section Header */}
            <div className="matrix-section-header">
                <div className="matrix-header-content">
                    <h2>Onboarding Dashboard</h2>
                    <p>Track task completion status and communicate with team members.</p>
                </div>
                <div className="matrix-view-toggle">
                    <button
                        className={`view-toggle-btn ${activeView === 'detailed' ? 'active' : ''}`}
                        onClick={() => setActiveView('detailed')}
                    >
                        Detailed View
                    </button>
                    <button
                        className={`view-toggle-btn ${activeView === 'matrix' ? 'active' : ''}`}
                        onClick={() => setActiveView('matrix')}
                    >
                        Matrix View
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="matrix-stats-bar">
                <div className="matrix-stat">
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total Members</span>
                </div>
                <div className="matrix-stat">
                    <span className="stat-value success">{stats.completed}</span>
                    <span className="stat-label">Completed</span>
                </div>
                <div className="matrix-stat">
                    <span className="stat-value warning">{stats.withOverdue}</span>
                    <span className="stat-label">With Overdue Tasks</span>
                </div>
            </div>

            {/* Legend - Only show in Matrix view */}
            {activeView === 'matrix' && (
                <Card className="matrix-legend-card">
                    <CardBody>
                        <div className="matrix-legend">
                            <span className="legend-title">Status Legend:</span>
                            <div className="legend-items">
                                <div className="legend-item">
                                    <div className="matrix-status-icon completed"><CheckCircle size={14} /></div>
                                    <span>Completed</span>
                                </div>
                                <div className="legend-item">
                                    <div className="matrix-status-icon in-progress"><Clock size={14} /></div>
                                    <span>In Progress</span>
                                </div>
                                <div className="legend-item">
                                    <div className="matrix-status-icon not-started"><Circle size={14} /></div>
                                    <span>Not Started</span>
                                </div>
                                <div className="legend-item">
                                    <div className="matrix-status-icon blocked"><AlertCircle size={14} /></div>
                                    <span>Blocked</span>
                                </div>
                                <div className="legend-item">
                                    <div className="matrix-status-icon waived"><ArrowRight size={14} /></div>
                                    <span>Waived</span>
                                </div>
                                <div className="legend-item overdue-legend">
                                    <div className="matrix-status-icon not-started overdue"><AlertTriangle size={14} /></div>
                                    <span>Overdue</span>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Filters */}
            <div className="matrix-toolbar">
                <div className="matrix-search">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name or trade..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Filter size={14} />}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    Filters
                    <ChevronDown size={14} className={`filter-chevron ${showFilters ? 'open' : ''}`} />
                </Button>
            </div>

            {showFilters && (
                <div className="matrix-filters">
                    <div className="filter-group">
                        <label>Status:</label>
                        <div className="filter-buttons">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'overdue', label: 'Overdue' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'in-progress', label: 'In Progress' },
                                { value: 'not-started', label: 'Not Started' }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    className={`filter-btn ${statusFilter === option.value ? 'active' : ''}`}
                                    onClick={() => setStatusFilter(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Members Table View */}
            {activeView === 'detailed' && (
                <Card className="members-detailed-table-card">
                    <CardBody className="p-0">
                        {/* Mass Communication Toolbar */}
                        <div className="mass-comm-toolbar">
                            <div className="mass-comm-left">
                                <span className="mass-comm-count">
                                    {selectedMembers.size > 0
                                        ? `${selectedMembers.size} of ${filteredData.length} selected`
                                        : `${filteredData.length} team members`
                                    }
                                </span>
                            </div>
                            <div className="mass-comm-actions">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    leftIcon={<Mail size={14} />}
                                    onClick={() => handleMassCommunication('email', selectedMembers.size > 0 ? 'selected' : 'all')}
                                >
                                    {selectedMembers.size > 0 ? `Email Selected (${selectedMembers.size})` : 'Email All'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    leftIcon={<Send size={14} />}
                                    onClick={() => handleMassCommunication('sms', selectedMembers.size > 0 ? 'selected' : 'all')}
                                >
                                    {selectedMembers.size > 0 ? `SMS Selected (${selectedMembers.size})` : 'SMS All'}
                                </Button>
                                {selectedMembers.size > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedMembers(new Set())}
                                    >
                                        Clear Selection
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                            <table className="table members-detailed-table">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col">
                                            <button
                                                className="table-checkbox"
                                                onClick={selectAllMembers}
                                                title={isAllSelected ? "Deselect all" : "Select all"}
                                            >
                                                {isAllSelected ? <CheckSquare size={18} /> :
                                                    isSomeSelected ? <Minus size={18} /> :
                                                        <Square size={18} />}
                                            </button>
                                        </th>
                                        <th>Team Member</th>
                                        <th>Trade</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Progress</th>
                                        <th>Forms</th>
                                        <th>Docs</th>
                                        <th>Compliance</th>
                                        <th>Training</th>
                                        <th>Processor</th>
                                        <th className="communication-col">Reminder</th>
                                        <th className="communication-col">Contact</th>
                                        <th className="communication-col">Chat</th>
                                        <th>Last Activity</th>
                                        <th className="actions-col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={16} className="empty-message">
                                                <div className="empty-state-inline">
                                                    <AlertCircle size={20} />
                                                    <span>No members match your search criteria</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map(({ member, overdueCount }) => {
                                            const categoryStats = getTaskCategoryStats(member);
                                            const lastActivity = getRandomLastActivity(member.id);
                                            const isSelected = selectedMembers.has(member.id);

                                            return (
                                                <tr
                                                    key={member.id}
                                                    className={`${overdueCount > 0 ? 'has-overdue' : ''} ${isSelected ? 'row-selected' : ''}`}
                                                    onClick={() => handleOpenDrawer(member)}
                                                >
                                                    <td className="checkbox-col">
                                                        <button
                                                            className="table-checkbox"
                                                            onClick={() => toggleMemberSelection(member.id)}
                                                        >
                                                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar avatar-sm">
                                                                {member.firstName[0]}{member.lastName[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{member.firstName} {member.lastName}</div>
                                                                <div className="text-xs text-muted">ID: {member.ssn}</div>
                                                            </div>
                                                            {overdueCount > 0 && (
                                                                <Badge variant="danger" className="overdue-badge-sm">
                                                                    {overdueCount}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge variant={getTradeColor(member.trade) as 'primary' | 'secondary' | 'success' | 'warning' | 'danger'}>
                                                            {member.trade}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm">{member.category.replace('_', ' ')}</span>
                                                    </td>
                                                    <td>
                                                        <Badge variant={getStatusVariant(member.status)}>
                                                            {member.status.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2" style={{ minWidth: '100px' }}>
                                                            <Progress value={member.progressPercentage} />
                                                            <span className="text-xs font-medium" style={{ minWidth: '32px' }}>
                                                                {member.progressPercentage}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm font-medium"
                                                            style={{ color: categoryStats.forms.completed === categoryStats.forms.total ? 'var(--color-secondary-600)' : undefined }}>
                                                            {categoryStats.forms.completed}/{categoryStats.forms.total}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm font-medium"
                                                            style={{ color: categoryStats.docs.completed === categoryStats.docs.total ? 'var(--color-secondary-600)' : undefined }}>
                                                            {categoryStats.docs.completed}/{categoryStats.docs.total}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm font-medium"
                                                            style={{ color: categoryStats.compliance.completed === categoryStats.compliance.total ? 'var(--color-secondary-600)' : undefined }}>
                                                            {categoryStats.compliance.completed}/{categoryStats.compliance.total}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm font-medium"
                                                            style={{ color: categoryStats.training.completed === categoryStats.training.total ? 'var(--color-secondary-600)' : undefined }}>
                                                            {categoryStats.training.completed}/{categoryStats.training.total}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm text-secondary">{member.assignedProcessorName}</span>
                                                    </td>
                                                    <td className="communication-col">
                                                        <div className="communication-actions">
                                                            <ActionButton
                                                                icon={<Mail size={14} />}
                                                                label="Send Email Reminder"
                                                                variant="primary"
                                                                onClick={() => handleSendReminder(member.id, 'email')}
                                                            />
                                                            <ActionButton
                                                                icon={<Send size={14} />}
                                                                label="Send SMS Reminder"
                                                                variant="success"
                                                                onClick={() => handleSendReminder(member.id, 'sms')}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="communication-col">
                                                        <div className="communication-actions">
                                                            <ActionButton
                                                                icon={<Mail size={14} />}
                                                                label="Email Contact"
                                                                onClick={() => handleContact(member.id, 'email')}
                                                            />
                                                            <ActionButton
                                                                icon={<Phone size={14} />}
                                                                label="Phone Contact"
                                                                onClick={() => handleContact(member.id, 'phone')}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="communication-col">
                                                        <ActionButton
                                                            icon={<MessageCircle size={16} />}
                                                            label="Open In-App Chat"
                                                            variant="primary"
                                                            onClick={() => handleChat(member.id)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="last-activity">
                                                            <span className="activity-text">{lastActivity.description}</span>
                                                            <span className="activity-time">{lastActivity.timeAgo}</span>
                                                        </div>
                                                    </td>
                                                    <td className="actions-col">
                                                        <ActionsDropdown memberId={member.id} />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Matrix Table View */}
            {activeView === 'matrix' && (
                <Card className="matrix-table-card">
                    <CardBody className="p-0">
                        <div className="matrix-table-container">
                            <table className="matrix-table">
                                <thead>
                                    <tr>
                                        <th className="sticky-col member-col">Team Member</th>
                                        <th className="sticky-col trade-col">Trade</th>
                                        <th className="sticky-col progress-col">Progress</th>
                                        {tasks.map(task => (
                                            <th key={task.id} className="task-col" title={task.name}>
                                                <div className="task-header">
                                                    <span className="task-name">{task.name.length > 15 ? task.name.substring(0, 15) + '...' : task.name}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={3 + tasks.length} className="empty-message">
                                                <div className="empty-state-inline">
                                                    <AlertCircle size={20} />
                                                    <span>No members match your search criteria</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map(({ member, taskStatuses, overdueCount }) => (
                                            <tr
                                                key={member.id}
                                                className={overdueCount > 0 ? 'has-overdue' : ''}
                                                onClick={() => handleOpenDrawer(member)}
                                            >
                                                <td className="sticky-col member-col">
                                                    <div className="member-cell">
                                                        <div className="member-avatar">
                                                            {member.firstName[0]}{member.lastName[0]}
                                                        </div>
                                                        <div className="member-info">
                                                            <span className="member-name">{member.firstName} {member.lastName}</span>
                                                            <span className="member-email">{member.email}</span>
                                                        </div>
                                                        {overdueCount > 0 && (
                                                            <Badge variant="danger" className="overdue-badge">
                                                                {overdueCount} overdue
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="sticky-col trade-col">
                                                    <Badge variant={getTradeColor(member.trade) as 'primary' | 'secondary' | 'success' | 'warning' | 'danger'}>
                                                        {member.trade}
                                                    </Badge>
                                                </td>
                                                <td className="sticky-col progress-col">
                                                    <div className="progress-cell">
                                                        <Progress value={member.progressPercentage} size="sm" />
                                                        <span className="progress-value">{member.progressPercentage}%</span>
                                                    </div>
                                                </td>
                                                {tasks.map(task => {
                                                    const taskData = taskStatuses[task.id];
                                                    return (
                                                        <td
                                                            key={task.id}
                                                            className={`task-cell ${taskData?.isOverdue ? 'overdue-cell' : ''}`}
                                                            title={`${task.name}: ${taskData?.status || 'NOT_STARTED'}${taskData?.isOverdue ? ' (OVERDUE)' : ''}`}
                                                        >
                                                            <StatusIcon
                                                                status={taskData?.status || 'NOT_STARTED'}
                                                                isOverdue={taskData?.isOverdue}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Info Footer */}
            <div className="matrix-footer">
                <p className="matrix-info-text">
                    Showing {filteredData.length} of {onboardingData.length} team members •
                    {activeView === 'matrix' ? ` ${tasks.length} tasks tracked •` : ''}
                    {' Click on a row to view member details'}
                </p>
            </div>

            {/* Team Member Drawer */}
            <TeamMemberDrawer
                member={selectedMember}
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                onOpenTaskDetail={handleOpenTaskModal}
            />

            {/* Task Detail Modal */}
            <TaskDetailModal
                task={selectedTask}
                taskInstance={selectedTaskInstance}
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                onUpdateStatus={handleUpdateTaskStatus}
                onAddComment={handleAddTaskComment}
            />
        </div>
    );
}
