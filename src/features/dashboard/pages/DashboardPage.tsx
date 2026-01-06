import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderKanban,
    Users,
    CheckCircle2,
    Clock,
    TrendingUp,
    AlertCircle,
    ArrowRight,
    Filter,
    Mail,
    Phone,
    Send,
    MessageCircle,
    MoreHorizontal,
    CheckSquare,
    Square,
    Minus
} from 'lucide-react';
import { Card, CardBody, Badge, Progress, Button } from '../../../components/ui';
import { mockProjects, mockTeamMembers, getTeamMembersByProject } from '../../../data';
import { dashboardApi, projectsApi } from '../../../services/api';
import type { TeamMember } from '../../../types';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative';
    icon: React.ReactNode;
    iconColor: 'primary' | 'secondary' | 'accent';
}

function StatCard({ title, value, change, changeType, icon, iconColor }: StatCardProps) {
    return (
        <Card className="stats-card">
            <div className="stats-card-header">
                <div className={`stats-card-icon ${iconColor}`}>
                    {icon}
                </div>
                {change && (
                    <span className={`stats-card-change ${changeType}`}>
                        <TrendingUp size={14} />
                        {change}
                    </span>
                )}
            </div>
            <div className="stats-card-value">{value}</div>
            <div className="stats-card-label">{title}</div>
        </Card>
    );
}

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

// Action button component
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

export function DashboardPage() {
    const navigate = useNavigate();
    const [selectedProject, setSelectedProject] = useState<string>('project-001');
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
    const [showMassCommModal, setShowMassCommModal] = useState<'email' | 'sms' | null>(null);

    // API Data State
    const [apiStats, setApiStats] = useState<{
        activeProjects: number;
        totalTeamMembers: number;
        completedOnboarding: number;
        inProgress: number;
        blockedMembers: number;
        memberGrowthThisWeek: number;
    } | null>(null);
    const [apiProjects, setApiProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch data from API on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [stats, projectsResponse] = await Promise.all([
                    dashboardApi.getGlobalStats(),
                    projectsApi.list({ status: 'ACTIVE' })
                ]);
                setApiStats(stats);
                setApiProjects(projectsResponse.items || []);
                // Set first project as selected if available
                if (projectsResponse.items?.[0]) {
                    setSelectedProject(projectsResponse.items[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // API Team Members State
    const [apiMembers, setApiMembers] = useState<any[]>([]);

    // Fetch team members when selected project changes
    useEffect(() => {
        const fetchMembers = async () => {
            if (!selectedProject || selectedProject.startsWith('project-')) {
                // Fallback to mock for mock project IDs
                return;
            }
            try {
                const members = await projectsApi.getMembers(selectedProject);
                setApiMembers(members);
            } catch (error) {
                console.error('Failed to fetch team members:', error);
                setApiMembers([]);
            }
        };
        fetchMembers();
    }, [selectedProject]);

    // Use API data if available, fallback to mock
    const activeProjects = apiProjects.length > 0 ? apiProjects : mockProjects.filter(p => p.status === 'ACTIVE');
    const currentProject = apiProjects.find(p => p.id === selectedProject) || mockProjects.find(p => p.id === selectedProject);

    // Use API members if available, fallback to mock
    const projectMembers = apiMembers.length > 0 ? apiMembers : getTeamMembersByProject(selectedProject);

    // Use API stats if available, otherwise calculate from mock data
    const globalStats = useMemo(() => {
        if (apiStats) {
            return {
                total: apiStats.totalTeamMembers,
                completed: apiStats.completedOnboarding,
                inProgress: apiStats.inProgress,
                blocked: apiStats.blockedMembers,
                activeProjects: apiStats.activeProjects
            };
        }
        // Fallback to mock data calculation
        const total = mockTeamMembers.length;
        const completed = mockTeamMembers.filter(m => m.progressPercentage === 100).length;
        const inProgress = mockTeamMembers.filter(m => m.progressPercentage > 0 && m.progressPercentage < 100).length;
        const blocked = mockTeamMembers.filter(m => m.taskInstances?.some(t => t.status === 'BLOCKED')).length;
        return { total, completed, inProgress, blocked, activeProjects: activeProjects.length };
    }, [apiStats, activeProjects.length]);

    // Stats for selected project (used in table header)
    const selectedProjectStats = useMemo(() => {
        const members = projectMembers;
        const blocked = members.filter(m => m.taskInstances?.some(t => t.status === 'BLOCKED')).length;
        return { blocked };
    }, [projectMembers]);

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

    // Calculate task category completions
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
        if (selectedMembers.size === projectMembers.length) {
            setSelectedMembers(new Set());
        } else {
            setSelectedMembers(new Set(projectMembers.map(m => m.id)));
        }
    };

    const handleSendReminder = (memberId: string, type: 'email' | 'sms' | 'both') => {
        console.log(`Sending ${type} reminder to ${memberId}`);
    };

    const handleContact = (memberId: string, type: 'email' | 'phone') => {
        console.log(`Contacting ${memberId} via ${type}`);
    };

    const handleChat = (memberId: string) => {
        console.log(`Opening chat with ${memberId}`);
    };

    const handleMassCommunication = (type: 'email' | 'sms', recipients: 'selected' | 'all') => {
        const targetMembers = recipients === 'all'
            ? projectMembers
            : projectMembers.filter(m => selectedMembers.has(m.id));
        console.log(`Sending ${type} to ${targetMembers.length} members:`, targetMembers.map(m => m.email));
        // In real app, would open a compose modal or call API
        alert(`${type.toUpperCase()} will be sent to ${targetMembers.length} team member(s)`);
    };

    const isAllSelected = selectedMembers.size === projectMembers.length && projectMembers.length > 0;
    const isSomeSelected = selectedMembers.size > 0 && selectedMembers.size < projectMembers.length;

    return (
        <div className="page-enter">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-top">
                    <div>
                        <h1 className="page-title">Onboarding Dashboard</h1>
                        <p className="page-description">Monitor team member progress across all active projects</p>
                    </div>
                    <div className="page-actions">
                        <Button variant="secondary" leftIcon={<Filter size={16} />}>
                            Filters
                        </Button>
                        <Button variant="primary" onClick={() => navigate('/projects')}>
                            View All Projects
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Row - GLOBAL stats across ALL projects */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Active Projects"
                    value={activeProjects.length}
                    icon={<FolderKanban size={22} />}
                    iconColor="primary"
                />
                <StatCard
                    title="Total Team Members"
                    value={globalStats.total}
                    change="+12 this week"
                    changeType="positive"
                    icon={<Users size={22} />}
                    iconColor="secondary"
                />
                <StatCard
                    title="Completed Onboarding"
                    value={globalStats.completed}
                    icon={<CheckCircle2 size={22} />}
                    iconColor="secondary"
                />
                <StatCard
                    title="In Progress"
                    value={globalStats.inProgress}
                    icon={<Clock size={22} />}
                    iconColor="accent"
                />
            </div>

            {/* Project Selector */}
            <Card className="mb-6">
                <CardBody>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Active Projects</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            rightIcon={<ArrowRight size={16} />}
                            onClick={() => navigate('/projects')}
                        >
                            Manage Projects
                        </Button>
                    </div>
                    <div className="project-selector-grid">
                        {activeProjects.map((project) => {
                            const isSelected = selectedProject === project.id;
                            const members = getTeamMembersByProject(project.id);
                            const completedCount = members.filter(m => m.progressPercentage === 100).length;

                            return (
                                <button
                                    key={project.id}
                                    onClick={() => {
                                        setSelectedProject(project.id);
                                        setSelectedMembers(new Set()); // Clear selections when switching projects
                                    }}
                                    className={`project-selector-card ${isSelected ? 'selected' : ''}`}
                                >
                                    {isSelected && <div className="selected-indicator" />}
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="font-semibold text-sm">{project.name}</span>
                                        <Badge variant={project.flags.isODRISA ? 'warning' : 'secondary'}>
                                            {project.flags.isODRISA ? 'ODRISA' : project.flags.isDOD ? 'DOD' : 'Standard'}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-secondary mb-3">{project.clientName} • {project.location}</div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="flex items-center gap-1">
                                            <Users size={12} />
                                            {members.length} members
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 size={12} />
                                            {completedCount} complete
                                        </span>
                                    </div>
                                    <Progress
                                        value={completedCount}
                                        max={members.length || 1}
                                        showLabel
                                        className="mt-3"
                                    />
                                </button>
                            );
                        })}
                    </div>
                </CardBody>
            </Card>

            {/* Team Member Detail Table */}
            <Card>
                <CardBody className="p-0">
                    <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
                        <div>
                            <h2 className="text-lg font-semibold">{currentProject?.name || 'Project'}</h2>
                            <p className="text-sm text-secondary">{projectMembers.length} team members</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedProjectStats.blocked > 0 && (
                                <Badge variant="danger" icon={<AlertCircle size={12} />}>
                                    {selectedProjectStats.blocked} blocked
                                </Badge>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate(`/projects/${selectedProject}/dashboard`)}
                            >
                                Open Project Dashboard
                            </Button>
                        </div>
                    </div>

                    {/* Mass Communication Toolbar */}
                    <div className="mass-comm-toolbar">
                        <div className="mass-comm-left">
                            <span className="mass-comm-count">
                                {selectedMembers.size > 0
                                    ? `${selectedMembers.size} of ${projectMembers.length} selected`
                                    : `${projectMembers.length} team members`
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
                                {projectMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={16} className="empty-message">
                                            <div className="empty-state-inline">
                                                <AlertCircle size={20} />
                                                <span>No team members in this project yet</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    projectMembers.map((member) => {
                                        const categoryStats = getTaskCategoryStats(member);
                                        const lastActivity = getRandomLastActivity(member.id);
                                        const isSelected = selectedMembers.has(member.id);

                                        return (
                                            <tr key={member.id} className={`cursor-pointer ${isSelected ? 'row-selected' : ''}`}>
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
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge variant="secondary">{member.trade}</Badge>
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
        </div>
    );
}
