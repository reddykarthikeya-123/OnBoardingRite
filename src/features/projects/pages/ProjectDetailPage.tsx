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
    MoreVertical,
    Shield,
    ChevronRight,
    ListChecks
} from 'lucide-react';
import { Card, CardBody, Button, Badge, Progress } from '../../../components/ui';
import { getProjectById, getTeamMembersByProject, mockTasks } from '../../../data';

export function ProjectDetailPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const project = getProjectById(projectId || '');
    const teamMembers = getTeamMembersByProject(projectId || '');

    if (!project) {
        return (
            <div className="page-enter">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold mb-2">Project not found</h2>
                    <p className="text-secondary mb-4">The project you're looking for doesn't exist.</p>
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
    const pendingCount = project.totalTeamMembers - project.completedOnboarding - project.inProgress;
    const requiredTasksCount = project.taskGroups.reduce((acc, group) =>
        acc + group.tasks.filter(taskId => {
            const task = mockTasks.find(t => t.id === taskId);
            return task?.required;
        }).length, 0);

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
                            <Button variant="ghost" size="sm" className="ml-auto btn-icon">
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
                                <div className="project-template-preview-more">
                                    +{project.taskGroups.length - 3} more
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Key Contacts Card - All in one polished block */}
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
                        <Button variant="primary" size="sm">Add Member</Button>
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
                                                    <Button variant="ghost" size="sm" className="btn-icon">
                                                        <MoreVertical size={16} />
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
        </div>
    );
}
