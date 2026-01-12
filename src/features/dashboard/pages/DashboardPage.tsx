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
    FileText,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { Card, CardBody, Badge, Progress, Button, Modal } from '../../../components/ui';
// All data now comes from API
import { dashboardApi, projectsApi, candidateApi } from '../../../services/api';
import type { TeamMember } from '../../../types';
import { SubmittedTaskViewer } from '../../candidate/components/SubmittedTaskViewer';

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


export function DashboardPage() {
    const navigate = useNavigate();
    const [selectedProject, setSelectedProject] = useState<string>('project-001');

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [progressFilter, setProgressFilter] = useState<string>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');


    // View Submissions Modal State
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [selectedMemberForSubmissions, setSelectedMemberForSubmissions] = useState<any>(null);
    const [memberSubmissions, setMemberSubmissions] = useState<Array<{
        id: string;
        taskId: string;
        taskName: string;
        category: string | null;
        submittedAt: string | null;
        formData: Record<string, any> | null;
        documents?: Array<{
            id: string;
            originalFilename: string;
            mimeType: string;
            fileSize: number;
        }>;
    }>>([]);
    const [viewTask, setViewTask] = useState<any>(null);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

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
    const [, setLoading] = useState(true);

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

    // All data from API - no mock fallbacks
    const activeProjects = apiProjects;
    const currentProject = apiProjects.find(p => p.id === selectedProject);

    // Team members from API
    const projectMembers = apiMembers;

    // Filter members based on active filters
    const filteredMembers = useMemo(() => {
        return projectMembers.filter((member: any) => {
            // Status filter
            if (statusFilter !== 'ALL' && member.status !== statusFilter) {
                return false;
            }
            // Progress filter
            if (progressFilter !== 'ALL') {
                const progress = member.progressPercentage || 0;
                if (progressFilter === 'NOT_STARTED' && progress > 0) return false;
                if (progressFilter === 'IN_PROGRESS' && (progress === 0 || progress === 100)) return false;
                if (progressFilter === 'COMPLETED' && progress < 100) return false;
            }
            // Category filter
            if (categoryFilter !== 'ALL' && member.category !== categoryFilter) {
                return false;
            }
            return true;
        });
    }, [projectMembers, statusFilter, progressFilter, categoryFilter]);

    // Active filter count
    const activeFilterCount = [statusFilter, progressFilter, categoryFilter].filter(f => f !== 'ALL').length;


    // Stats from API
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
        // Default empty stats if API call fails
        return { total: 0, completed: 0, inProgress: 0, blocked: 0, activeProjects: activeProjects.length };
    }, [apiStats, activeProjects.length]);


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

    // Calculate task category completions using taskCategory field from API
    const getTaskCategoryStats = (member: TeamMember) => {
        const tasks = member.taskInstances || [];

        // Filter by task category (from API)
        const formsTasks = tasks.filter((t: any) => t.taskCategory === 'FORMS');
        const formsCompleted = formsTasks.filter((t: any) => t.status === 'COMPLETED').length;

        const docsTasks = tasks.filter((t: any) => t.taskCategory === 'DOCUMENTS');
        const docsCompleted = docsTasks.filter((t: any) => t.status === 'COMPLETED').length;

        const complianceTasks = tasks.filter((t: any) => t.taskCategory === 'COMPLIANCE');
        const complianceCompleted = complianceTasks.filter((t: any) => t.status === 'COMPLETED').length;

        const trainingTasks = tasks.filter((t: any) => t.taskCategory === 'TRAININGS');
        const trainingCompleted = trainingTasks.filter((t: any) => t.status === 'COMPLETED').length;

        return {
            forms: { completed: formsCompleted, total: formsTasks.length },
            docs: { completed: docsCompleted, total: docsTasks.length },
            compliance: { completed: complianceCompleted, total: complianceTasks.length },
            training: { completed: trainingCompleted, total: trainingTasks.length }
        };
    };


    const handleViewSubmissions = async (member: any) => {
        if (!selectedProject) return;
        setSelectedMemberForSubmissions(member);
        setIsLoadingSubmissions(true);
        setShowSubmissionsModal(true);
        try {
            const submissions = await candidateApi.getSubmittedTasksByProject(member.id, selectedProject);
            setMemberSubmissions(submissions);
        } catch (err) {
            console.error('Failed to load submissions:', err);
            setMemberSubmissions([]);
        } finally {
            setIsLoadingSubmissions(false);
        }
    };


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
                        <div style={{ position: 'relative' }}>
                            <Button
                                variant={showFilters ? 'primary' : 'secondary'}
                                leftIcon={<Filter size={16} />}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                Filters
                                {activeFilterCount > 0 && (
                                    <span style={{
                                        marginLeft: '6px',
                                        background: 'var(--color-primary-600)',
                                        color: 'white',
                                        borderRadius: '10px',
                                        padding: '2px 7px',
                                        fontSize: '11px',
                                        fontWeight: 600
                                    }}>
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                        <Button variant="primary" onClick={() => navigate('/projects')}>
                            View All Projects
                        </Button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div style={{
                        marginTop: '16px',
                        padding: '20px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border-light)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Filter Team Members</h3>
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setStatusFilter('ALL');
                                        setProgressFilter('ALL');
                                        setCategoryFilter('ALL');
                                    }}
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            {/* Status Filter */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                    Status
                                </label>
                                <select
                                    className="input"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{ fontSize: '13px' }}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="NEW_HIRE">New Hire</option>
                                    <option value="ONBOARDING_INITIATED">Onboarding Initiated</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="REFERRED_TO_SITE">Referred to Site</option>
                                    <option value="ARRIVED_TO_SITE">Arrived to Site</option>
                                </select>
                            </div>

                            {/* Progress Filter */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                    Progress
                                </label>
                                <select
                                    className="input"
                                    value={progressFilter}
                                    onChange={(e) => setProgressFilter(e.target.value)}
                                    style={{ fontSize: '13px' }}
                                >
                                    <option value="ALL">All Progress</option>
                                    <option value="NOT_STARTED">Not Started (0%)</option>
                                    <option value="IN_PROGRESS">In Progress (1-99%)</option>
                                    <option value="COMPLETED">Completed (100%)</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                    Category
                                </label>
                                <select
                                    className="input"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    style={{ fontSize: '13px' }}
                                >
                                    <option value="ALL">All Categories</option>
                                    <option value="NEW_HIRE">New Hire</option>
                                    <option value="REHIRE">Rehire</option>
                                    <option value="TRANSFER">Transfer</option>
                                    <option value="CONTRACTOR">Contractor</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
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
                            const members = project.id === selectedProject ? projectMembers : [];
                            const completedCount = members.filter(m => m.progressPercentage === 100).length;

                            return (
                                <button
                                    key={project.id}
                                    onClick={() => setSelectedProject(project.id)}
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
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate(`/projects/${selectedProject}/dashboard`)}
                            >
                                Open Project Dashboard
                            </Button>
                        </div>
                    </div>

                    {/* Member Count */}
                    <div className="mass-comm-toolbar">
                        <div className="mass-comm-left">
                            <span className="mass-comm-count">
                                {`${filteredMembers.length} team member${filteredMembers.length !== 1 ? 's' : ''}${activeFilterCount > 0 ? ' (filtered)' : ''}`}
                            </span>
                        </div>
                    </div>

                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                        <table className="table members-detailed-table">
                            <thead>
                                <tr>
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
                                    <th>Submissions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="empty-message">
                                            <div className="empty-state-inline">
                                                <AlertCircle size={20} />
                                                <span>{activeFilterCount > 0 ? 'No members match the current filters' : 'No team members in this project yet'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.map((member) => {
                                        const categoryStats = getTaskCategoryStats(member);

                                        return (
                                            <tr key={member.id}>
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
                                                    <span className="text-sm">{member?.category?.replace('_', ' ')}</span>
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
                                                <td>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        leftIcon={<FileText size={14} />}
                                                        onClick={() => handleViewSubmissions(member)}
                                                    >
                                                        View
                                                    </Button>
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

            {/* View Submissions Modal */}
            <Modal
                isOpen={showSubmissionsModal}
                onClose={() => {
                    setShowSubmissionsModal(false);
                    setViewTask(null);
                }}
                title={`Submitted Forms - ${selectedMemberForSubmissions?.firstName} ${selectedMemberForSubmissions?.lastName}`}
                size="lg"
            >
                <div className="submissions-modal">
                    {isLoadingSubmissions ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : memberSubmissions.length === 0 ? (
                        <div className="text-center py-8 text-muted">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No submitted forms yet</p>
                        </div>
                    ) : viewTask ? (
                        <SubmittedTaskViewer
                            taskName={viewTask.taskName}
                            submittedAt={viewTask.submittedAt}
                            formData={viewTask.formData || {}}
                            onClose={() => setViewTask(null)}
                            documents={viewTask.documents}
                        />
                    ) : (
                        <div className="submissions-list">
                            {memberSubmissions.map((submission) => (
                                <div
                                    key={submission.id}
                                    className="submission-item"
                                    onClick={() => setViewTask(submission)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #f0f0f0',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                >
                                    <FileText size={20} style={{ color: '#4caf50' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, color: '#1a1f36' }}>
                                            {submission.taskName}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#697386' }}>
                                            {submission.submittedAt
                                                ? new Date(submission.submittedAt).toLocaleDateString()
                                                : 'Completed'}
                                        </div>
                                    </div>
                                    <ChevronRight size={16} style={{ color: '#697386' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </div >
    );
}
