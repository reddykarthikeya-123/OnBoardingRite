import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    AlertCircle,
    MapPin,
    Calendar,
    Phone,
    Mail,
    Pencil,
    Building,
    FileText,
    Layers,
    ExternalLink,
    Shield,
    ChevronRight,
    ListChecks,
    Loader2,
    UserPlus,
    Check,
    Search,
    Trash2
} from 'lucide-react';
import { Card, CardBody, Button, Badge, Progress, Modal } from '../../../components/ui';
import { projectsApi, teamMembersApi } from '../../../services/api';

interface ProjectDetail {
    id: string;
    name: string;
    description: string;
    clientName: string;
    location: string;
    status: string;
    startDate: string;
    endDate?: string;
    templateName: string;
    totalTeamMembers: number;
    completedOnboarding: number;
    inProgress: number;
    flags: { isDOD: boolean; isODRISA: boolean };
    taskGroups: Array<{ id: string; name: string; tasks: any[] }>;
    projectManager?: { name: string; email: string; phone?: string };
    safetyLead?: { name: string; email: string };
    siteContact?: { name: string; email: string };
}

interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    trade: string;
    status: string;
    progressPercentage: number;
    assignedProcessorName?: string;
}

export function ProjectDetailPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    // Add Member modal state
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [isAddingMembers, setIsAddingMembers] = useState(false);

    // Delete Member modal state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (projectId) {
            loadProjectData();
        }
    }, [projectId]);

    const loadProjectData = async () => {
        try {
            setIsLoading(true);
            const [projectData, membersData] = await Promise.all([
                projectsApi.get(projectId!),
                projectsApi.getMembers(projectId!).catch(() => [])
            ]);

            // Map project data
            const stats = projectData.stats || {};
            setProject({
                id: projectData.id,
                name: projectData.name,
                description: projectData.description || '',
                clientName: projectData.clientName || projectData.client_name || 'N/A',
                location: projectData.location || 'N/A',
                status: projectData.status,
                startDate: projectData.startDate || projectData.start_date || new Date().toISOString(),
                endDate: projectData.endDate || projectData.end_date,
                templateName: projectData.templateName || projectData.template_name || '',
                totalTeamMembers: stats.totalMembers || projectData.totalTeamMembers || 0,
                completedOnboarding: stats.completed || projectData.completedOnboarding || 0,
                inProgress: stats.inProgress || projectData.inProgress || 0,
                flags: projectData.flags || { isDOD: projectData.is_dod || false, isODRISA: projectData.is_odrisa || false },
                taskGroups: projectData.taskGroups || projectData.task_groups || [],
                projectManager: projectData.keyMembers?.projectManager || projectData.projectManager || projectData.project_manager,
                safetyLead: projectData.keyMembers?.safetyLead || projectData.safetyLead || projectData.safety_lead,
                siteContact: projectData.keyMembers?.siteLead || projectData.siteContact || projectData.site_contact
            });

            // Map members data
            setTeamMembers(membersData.map((m: any) => ({
                id: m.id,
                firstName: m.firstName || m.first_name || '',
                lastName: m.lastName || m.last_name || '',
                email: m.email || '',
                trade: m.trade || 'General',
                status: m.status || 'PENDING',
                progressPercentage: m.progressPercentage || m.progress_percentage || 0,
                assignedProcessorName: m.assignedProcessorName || m.assigned_processor_name
            })));

            setError('');
        } catch (err) {
            console.error('Failed to load project:', err);
            setError('Failed to load project details.');
        } finally {
            setIsLoading(false);
        }
    };

    // Load all team members and filter out already-assigned ones
    const loadAvailableMembers = async () => {
        try {
            const allMembers = await teamMembersApi.list();
            const assignedIds = new Set(teamMembers.map(m => m.id));
            const available = allMembers
                .filter((m: any) => !assignedIds.has(m.id))
                .map((m: any) => ({
                    id: m.id,
                    firstName: m.firstName || m.first_name || '',
                    lastName: m.lastName || m.last_name || '',
                    email: m.email || '',
                    trade: m.trade || 'General',
                    status: 'PENDING',
                    progressPercentage: 0
                }));
            setAvailableMembers(available);
        } catch (err) {
            console.error('Failed to load available members:', err);
        }
    };

    const handleOpenAddMemberModal = async () => {
        setShowAddMemberModal(true);
        setSelectedMemberIds(new Set());
        setMemberSearchQuery('');
        await loadAvailableMembers();
    };

    const handleToggleMember = (memberId: string) => {
        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                newSet.delete(memberId);
            } else {
                newSet.add(memberId);
            }
            return newSet;
        });
    };

    const handleAddSelectedMembers = async () => {
        if (selectedMemberIds.size === 0) return;

        try {
            setIsAddingMembers(true);
            await projectsApi.addMembers(projectId!, Array.from(selectedMemberIds));
            setShowAddMemberModal(false);
            // Reload project data to reflect new members
            await loadProjectData();
        } catch (err) {
            console.error('Failed to add members:', err);
        } finally {
            setIsAddingMembers(false);
        }
    };

    const filteredAvailableMembers = availableMembers.filter(m => {
        if (!memberSearchQuery) return true;
        const query = memberSearchQuery.toLowerCase();
        return (
            m.firstName.toLowerCase().includes(query) ||
            m.lastName.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query) ||
            m.trade.toLowerCase().includes(query)
        );
    });

    const handleOpenDeleteConfirm = (member: TeamMember) => {
        setMemberToDelete(member);
        setShowDeleteConfirm(true);
    };

    const handleDeleteMember = async () => {
        if (!memberToDelete) return;

        try {
            setIsDeleting(true);
            await projectsApi.removeMember(projectId!, memberToDelete.id);
            setShowDeleteConfirm(false);
            setMemberToDelete(null);
            // Reload project data to reflect removed member
            await loadProjectData();
        } catch (err) {
            console.error('Failed to delete member:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] page-enter">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="page-enter">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold mb-2">{error || 'Project not found'}</h2>
                    <p className="text-secondary mb-4">The project you're looking for doesn't exist or couldn't be loaded.</p>
                    <Button variant="secondary" onClick={() => navigate('/projects')}>
                        Back to Projects
                    </Button>
                </div>
            </div>
        );
    }

    const progressPercent = project.totalTeamMembers > 0
        ? Math.round((project.completedOnboarding / project.totalTeamMembers) * 100)
        : 0;

    const totalTasks = project.taskGroups.reduce((acc, group) => acc + group.tasks.length, 0);
    const pendingCount = Math.max(0, project.totalTeamMembers - project.completedOnboarding - project.inProgress);
    const requiredTasksCount = project.taskGroups.reduce((acc, group) =>
        acc + group.tasks.filter((task: any) => task.isRequired || task.is_required).length, 0);

    return (
        <div className="page-enter project-detail-page">
            {/* Hero Section */}
            <div className="project-detail-hero">
                <div className="project-detail-hero-bg" />
                <div className="project-detail-hero-content">
                    <div className="project-detail-hero-left">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="btn-icon project-detail-back"
                            onClick={() => navigate('/projects')}
                        >
                            <ArrowLeft size={18} />
                        </Button>
                        <div>
                            <div className="project-detail-badges">
                                <Badge variant={project.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                    {project.status}
                                </Badge>
                                {project.flags.isDOD && <Badge variant="danger">DOD</Badge>}
                                {project.flags.isODRISA && <Badge variant="warning">ODRISA</Badge>}
                            </div>
                            <h1 className="project-detail-hero-title">{project.name}</h1>
                            <p className="project-detail-hero-subtitle">{project.description}</p>
                        </div>
                    </div>
                    <div className="project-detail-hero-actions">
                        <Button
                            variant="secondary"
                            leftIcon={<Pencil size={16} />}
                            onClick={() => navigate(`/projects/${projectId}/edit`)}
                        >
                            Edit Project
                        </Button>
                        <Button variant="primary" leftIcon={<ExternalLink size={16} />}>
                            View Dashboard
                        </Button>
                    </div>
                </div>

                {/* Quick Info Bar */}
                <div className="project-detail-quickinfo">
                    <div className="project-detail-quickinfo-item">
                        <Building size={16} />
                        <span>{project.clientName}</span>
                    </div>
                    <div className="project-detail-quickinfo-divider" />
                    <div className="project-detail-quickinfo-item">
                        <MapPin size={16} />
                        <span>{project.location}</span>
                    </div>
                    <div className="project-detail-quickinfo-divider" />
                    <div className="project-detail-quickinfo-item">
                        <Calendar size={16} />
                        <span>
                            {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Overview Section - Progress & Stats */}
            <section className="project-detail-section">
                <div className="project-detail-section-header">
                    <h2 className="project-detail-section-title">
                        <ListChecks size={20} />
                        Onboarding Overview
                    </h2>
                </div>

                <div className="project-overview-grid">
                    {/* Large Progress Card */}
                    <Card className="project-progress-card">
                        <CardBody>
                            <div className="project-progress-header">
                                <span className="project-progress-title">Overall Progress</span>
                                <span className="project-progress-percent">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} size="lg" className="mb-4" />
                            <div className="project-progress-breakdown">
                                <div className="project-progress-stat">
                                    <div className="project-progress-stat-dot success" />
                                    <span className="project-progress-stat-label">Completed</span>
                                    <span className="project-progress-stat-value">{project.completedOnboarding}</span>
                                </div>
                                <div className="project-progress-stat">
                                    <div className="project-progress-stat-dot warning" />
                                    <span className="project-progress-stat-label">In Progress</span>
                                    <span className="project-progress-stat-value">{project.inProgress}</span>
                                </div>
                                <div className="project-progress-stat">
                                    <div className="project-progress-stat-dot pending" />
                                    <span className="project-progress-stat-label">Pending</span>
                                    <span className="project-progress-stat-value">{pendingCount}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Stats Cards */}
                    <div className="project-mini-stats">
                        <div className="project-mini-stat">
                            <div className="project-mini-stat-icon primary">
                                <Users size={20} />
                            </div>
                            <div className="project-mini-stat-content">
                                <span className="project-mini-stat-value">{project.totalTeamMembers}</span>
                                <span className="project-mini-stat-label">Team Members</span>
                            </div>
                        </div>
                        <div className="project-mini-stat">
                            <div className="project-mini-stat-icon secondary">
                                <Layers size={20} />
                            </div>
                            <div className="project-mini-stat-content">
                                <span className="project-mini-stat-value">{project.taskGroups.length}</span>
                                <span className="project-mini-stat-label">Task Groups</span>
                            </div>
                        </div>
                        <div className="project-mini-stat">
                            <div className="project-mini-stat-icon accent">
                                <FileText size={20} />
                            </div>
                            <div className="project-mini-stat-content">
                                <span className="project-mini-stat-value">{totalTasks}</span>
                                <span className="project-mini-stat-label">Total Tasks</span>
                            </div>
                        </div>
                        <div className="project-mini-stat">
                            <div className="project-mini-stat-icon danger">
                                <AlertCircle size={20} />
                            </div>
                            <div className="project-mini-stat-content">
                                <span className="project-mini-stat-value">{requiredTasksCount}</span>
                                <span className="project-mini-stat-label">Required</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Three Column Info Row */}
            <div className="project-info-row">
                {/* Template Card */}
                <Card className="project-info-card">
                    <CardBody>
                        <div className="project-info-card-header">
                            <div className="project-info-card-icon">
                                <Layers size={20} />
                            </div>
                            <div>
                                <h3 className="project-info-card-title">Checklist Template</h3>
                                <p className="project-info-card-subtitle">{project.templateName}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto btn-icon"
                                onClick={() => setShowTemplateModal(true)}
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                        <div className="project-template-preview">
                            {project.taskGroups.slice(0, 3).map((group, index) => (
                                <div key={group.id} className="project-template-preview-item">
                                    <span className="project-template-preview-num">{index + 1}</span>
                                    <span className="project-template-preview-name">{group.name}</span>
                                    <span className="project-template-preview-count">{group.tasks.length}</span>
                                </div>
                            ))}
                            {project.taskGroups.length > 3 && (
                                <div
                                    className="project-template-preview-more"
                                    onClick={() => setShowTemplateModal(true)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    +{project.taskGroups.length - 3} more
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Key Contacts Card */}
                <Card className="project-info-card project-contacts-card">
                    <CardBody>
                        <div className="project-info-card-header">
                            <div className="project-info-card-icon">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="project-info-card-title">Key Contacts</h3>
                                <p className="project-info-card-subtitle">Project leadership team</p>
                            </div>
                        </div>
                        <div className="project-contacts-row">
                            {project.projectManager && (
                                <div className="project-contact-inline">
                                    <div className="project-contact-inline-avatar primary">
                                        {project.projectManager.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="project-contact-inline-info">
                                        <span className="project-contact-inline-name">{project.projectManager.name}</span>
                                        <span className="project-contact-inline-role">Project Manager</span>
                                        <div className="project-contact-inline-meta">
                                            <Mail size={12} />
                                            <span>{project.projectManager.email}</span>
                                        </div>
                                        {project.projectManager.phone && (
                                            <div className="project-contact-inline-meta">
                                                <Phone size={12} />
                                                <span>{project.projectManager.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {project.safetyLead && (
                                <div className="project-contact-inline">
                                    <div className="project-contact-inline-avatar secondary">
                                        {project.safetyLead.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="project-contact-inline-info">
                                        <span className="project-contact-inline-name">{project.safetyLead.name}</span>
                                        <span className="project-contact-inline-role">Safety Lead</span>
                                        <div className="project-contact-inline-meta">
                                            <Mail size={12} />
                                            <span>{project.safetyLead.email}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {project.siteContact && (
                                <div className="project-contact-inline">
                                    <div className="project-contact-inline-avatar accent">
                                        {project.siteContact.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="project-contact-inline-info">
                                        <span className="project-contact-inline-name">{project.siteContact.name}</span>
                                        <span className="project-contact-inline-role">Site Contact</span>
                                        <div className="project-contact-inline-meta">
                                            <Mail size={12} />
                                            <span>{project.siteContact.email}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!project.projectManager && !project.safetyLead && !project.siteContact && (
                                <div className="project-contacts-empty">
                                    <p>No contacts assigned</p>
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/edit`)}>
                                        Add Contacts
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Compliance Card */}
                <Card className="project-info-card">
                    <CardBody>
                        <div className="project-info-card-header">
                            <div className="project-info-card-icon">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="project-info-card-title">Compliance</h3>
                                <p className="project-info-card-subtitle">Requirements & flags</p>
                            </div>
                        </div>
                        <div className="project-compliance-badges">
                            {project.flags.isDOD && (
                                <div className="project-compliance-badge danger">
                                    <Shield size={16} />
                                    <span>DOD Clearance Required</span>
                                </div>
                            )}
                            {project.flags.isODRISA && (
                                <div className="project-compliance-badge warning">
                                    <AlertCircle size={16} />
                                    <span>ODRISA Compliance</span>
                                </div>
                            )}
                            {!project.flags.isDOD && !project.flags.isODRISA && (
                                <div className="project-compliance-badge neutral">
                                    <span>Standard compliance</span>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Full Width Team Members Section */}
            <section className="project-detail-section project-team-section">
                <div className="project-detail-section-header">
                    <h2 className="project-detail-section-title">
                        <Users size={20} />
                        Team Members
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted">{teamMembers.length} members</span>
                        <Button variant="primary" size="sm" leftIcon={<UserPlus size={14} />} onClick={handleOpenAddMemberModal}>
                            Add Member
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardBody className="p-0">
                        {teamMembers.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} className="empty-state-icon" />
                                <h3 className="empty-state-title">No Team Members</h3>
                                <p className="empty-state-description">
                                    Add team members to start onboarding
                                </p>
                                <Button variant="primary" className="mt-4">Add Team Member</Button>
                            </div>
                        ) : (
                            <div className="team-table-container">
                                <table className="table team-table">
                                    <thead>
                                        <tr>
                                            <th>Team Member</th>
                                            <th>Trade</th>
                                            <th>Status</th>
                                            <th>Progress</th>
                                            <th>Processor</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamMembers.map((member) => (
                                            <tr key={member.id} className="team-row">
                                                <td>
                                                    <div className="team-member-cell">
                                                        <div className="team-member-avatar">
                                                            {member.firstName[0]}{member.lastName[0]}
                                                        </div>
                                                        <div className="team-member-info">
                                                            <span className="team-member-name">
                                                                {member.firstName} {member.lastName}
                                                            </span>
                                                            <span className="team-member-email">{member.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><Badge variant="secondary">{member.trade}</Badge></td>
                                                <td>
                                                    <Badge
                                                        variant={
                                                            member.status === 'ACTIVE' ? 'success' :
                                                                member.status === 'REFERRED_TO_SITE' ? 'primary' :
                                                                    'warning'
                                                        }
                                                    >
                                                        {member.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="progress-cell">
                                                        <Progress value={member.progressPercentage} size="sm" />
                                                        <span className="progress-cell-value">{member.progressPercentage}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-sm text-secondary">
                                                        {member.assignedProcessorName || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="btn-icon text-danger hover:bg-danger-50"
                                                        onClick={() => handleOpenDeleteConfirm(member)}
                                                        title="Remove member from project"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </section>

            {/* Checklist Template Modal */}
            <Modal
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                title={`Checklist Template: ${project.templateName}`}
                size="lg"
            >
                <div className="template-modal-content">
                    <div className="template-modal-stats">
                        <div className="template-modal-stat">
                            <span className="template-modal-stat-value">{project.taskGroups.length}</span>
                            <span className="template-modal-stat-label">Task Groups</span>
                        </div>
                        <div className="template-modal-stat">
                            <span className="template-modal-stat-value">{totalTasks}</span>
                            <span className="template-modal-stat-label">Total Tasks</span>
                        </div>
                        <div className="template-modal-stat">
                            <span className="template-modal-stat-value">{requiredTasksCount}</span>
                            <span className="template-modal-stat-label">Required</span>
                        </div>
                    </div>
                    <div className="template-modal-groups">
                        {project.taskGroups.map((group, index) => (
                            <div key={group.id} className="template-modal-group">
                                <div className="template-modal-group-header">
                                    <span className="template-modal-group-num">{index + 1}</span>
                                    <span className="template-modal-group-name">{group.name}</span>
                                    <Badge variant="secondary">{group.tasks.length} tasks</Badge>
                                </div>
                                <div className="template-modal-tasks">
                                    {group.tasks.map((task: any) => (
                                        <div key={task.id} className="template-modal-task">
                                            <FileText size={14} />
                                            <span className="template-modal-task-name">{task.name}</span>
                                            {(task.isRequired || task.is_required) && (
                                                <Badge variant="danger" className="ml-auto">Required</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Add Member Modal */}
            <Modal
                isOpen={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                title="Add Team Members"
                size="lg"
            >
                <div className="add-member-modal">
                    {/* Search */}
                    <div className="add-member-search">
                        <Search size={16} className="add-member-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or trade..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="add-member-search-input"
                        />
                    </div>

                    {/* Member List */}
                    <div className="add-member-list">
                        {filteredAvailableMembers.length === 0 ? (
                            <div className="add-member-empty">
                                <Users size={32} className="text-muted" />
                                <p>No available members to add</p>
                            </div>
                        ) : (
                            filteredAvailableMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className={`add-member-item ${selectedMemberIds.has(member.id) ? 'selected' : ''}`}
                                    onClick={() => handleToggleMember(member.id)}
                                >
                                    <div className="add-member-checkbox">
                                        {selectedMemberIds.has(member.id) && <Check size={14} />}
                                    </div>
                                    <div className="add-member-avatar">
                                        {member.firstName[0]}{member.lastName[0]}
                                    </div>
                                    <div className="add-member-info">
                                        <span className="add-member-name">
                                            {member.firstName} {member.lastName}
                                        </span>
                                        <span className="add-member-email">{member.email}</span>
                                    </div>
                                    <Badge variant="secondary">{member.trade}</Badge>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Actions */}
                    <div className="add-member-actions">
                        <span className="add-member-count">
                            {selectedMemberIds.size} member{selectedMemberIds.size !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setShowAddMemberModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddSelectedMembers}
                                disabled={selectedMemberIds.size === 0 || isAddingMembers}
                            >
                                {isAddingMembers ? 'Adding...' : `Add ${selectedMemberIds.size} Member${selectedMemberIds.size !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Member Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Remove Team Member"
                size="sm"
            >
                <div className="delete-confirm-modal">
                    <div className="delete-confirm-icon">
                        <AlertCircle size={48} className="text-danger" />
                    </div>
                    <p className="delete-confirm-message">
                        Are you sure you want to remove <strong>{memberToDelete?.firstName} {memberToDelete?.lastName}</strong> from this project?
                    </p>
                    <p className="delete-confirm-warning text-sm text-muted">
                        This action cannot be undone. The member will lose access to all project tasks.
                    </p>
                    <div className="delete-confirm-actions">
                        <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteMember}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Removing...' : 'Remove Member'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
