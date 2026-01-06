import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    MapPin,
    Calendar,
    Users,
    CheckCircle2,
    AlertTriangle,
    Filter
} from 'lucide-react';
import { Card, CardBody, Button, Badge, Progress, EmptyState } from '../../../components/ui';
import { mockProjects } from '../../../data';
import type { ProjectStatus } from '../../../types';

const statusColors: Record<ProjectStatus, 'success' | 'primary' | 'warning' | 'secondary' | 'danger'> = {
    ACTIVE: 'success',
    DRAFT: 'secondary',
    ON_HOLD: 'warning',
    COMPLETED: 'primary',
    ARCHIVED: 'secondary',
};

export function ProjectsPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const filteredProjects = mockProjects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.location.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        ALL: mockProjects.length,
        ACTIVE: mockProjects.filter(p => p.status === 'ACTIVE').length,
        DRAFT: mockProjects.filter(p => p.status === 'DRAFT').length,
        ON_HOLD: mockProjects.filter(p => p.status === 'ON_HOLD').length,
        COMPLETED: mockProjects.filter(p => p.status === 'COMPLETED').length,
    };

    return (
        <div className="page-enter">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-top">
                    <div>
                        <h1 className="page-title">Projects</h1>
                        <p className="page-description">Manage onboarding projects and assignments</p>
                    </div>
                    <div className="page-actions">
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={16} />}
                            onClick={() => navigate('/projects/new')}
                        >
                            New Project
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="search-bar" style={{ maxWidth: '300px' }}>
                    <Search size={18} className="search-bar-icon" />
                    <input
                        type="text"
                        className="input search-bar-input"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    {(['ALL', 'ACTIVE', 'DRAFT', 'ON_HOLD'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
                        >
                            {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                            <span className="text-xs opacity-60 ml-1">({statusCounts[status]})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
                <EmptyState
                    icon={<Filter size={48} />}
                    title="No projects found"
                    description="Try adjusting your search or filter criteria"
                />
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {filteredProjects.map((project) => {
                        const progressPercent = project.totalTeamMembers > 0
                            ? Math.round((project.completedOnboarding / project.totalTeamMembers) * 100)
                            : 0;

                        return (
                            <Card
                                key={project.id}
                                variant="interactive"
                                onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                            >
                                <CardBody>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={statusColors[project.status]}>
                                                {project.status.replace('_', ' ')}
                                            </Badge>
                                            {project.flags.isDOD && (
                                                <Badge variant="danger">DOD</Badge>
                                            )}
                                            {project.flags.isODRISA && (
                                                <Badge variant="warning">ODRISA</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted">{project.templateName}</span>
                                    </div>

                                    <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                                    <p className="text-sm text-secondary mb-4">{project.clientName}</p>

                                    <div className="flex flex-col gap-2 mb-4 text-sm text-secondary">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} />
                                            <span>{project.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            <span>
                                                {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                            </span>
                                        </div>
                                    </div>

                                    {project.status === 'ACTIVE' && project.totalTeamMembers > 0 && (
                                        <>
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users size={14} className="text-muted" />
                                                    <span className="font-medium">{project.totalTeamMembers}</span>
                                                    <span className="text-muted">team members</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 size={14} style={{ color: 'var(--color-secondary-500)' }} />
                                                    <span className="font-medium">{project.completedOnboarding}</span>
                                                    <span className="text-muted">complete</span>
                                                </div>
                                                {project.inProgress > 0 && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <AlertTriangle size={14} style={{ color: 'var(--color-accent-500)' }} />
                                                        <span className="font-medium">{project.inProgress}</span>
                                                        <span className="text-muted">in progress</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Progress value={progressPercent} className="flex-1" />
                                                <span className="text-sm font-medium" style={{ minWidth: '40px' }}>
                                                    {progressPercent}%
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {project.projectManager && (
                                        <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: 'var(--color-border-light)' }}>
                                            <div className="avatar avatar-sm">
                                                {project.projectManager.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{project.projectManager.name}</div>
                                                <div className="text-xs text-muted">Project Manager</div>
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
