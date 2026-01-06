import {
    Building,
    Users,
    Calendar,
    MapPin,
    CheckCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    Target,
    Activity,
    ArrowUpRight,
    Briefcase
} from 'lucide-react';
import { Card, CardBody, Progress } from '../../../../components/ui';
import type { PPMProject, OnboardingMember } from '../../../../types';

interface OverviewSectionProps {
    ppmProject: PPMProject;
    members: OnboardingMember[];
}

export function OverviewSection({ ppmProject, members }: OverviewSectionProps) {
    const totalMembers = members.length;
    const completed = members.filter(m => m.status === 'COMPLETED').length;
    const inProgress = members.filter(m => m.status === 'IN_PROGRESS' || m.status === 'ONBOARDING_INITIATED').length;
    const pending = members.filter(m => m.status === 'PENDING').length;
    const completionRate = totalMembers > 0 ? Math.round((completed / totalMembers) * 100) : 0;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Calculate days remaining
    const endDate = new Date(ppmProject.endDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="overview-section">
            {/* Hero Stats Section */}
            <div className="overview-hero">
                <div className="hero-stat-main">
                    <div className="hero-stat-ring">
                        <svg viewBox="0 0 100 100" className="progress-ring">
                            <circle className="progress-ring-bg" cx="50" cy="50" r="42" />
                            <circle
                                className="progress-ring-fill"
                                cx="50"
                                cy="50"
                                r="42"
                                style={{
                                    strokeDasharray: `${completionRate * 2.64} 264`,
                                    strokeDashoffset: '0'
                                }}
                            />
                        </svg>
                        <div className="hero-stat-value">
                            <span className="value">{completionRate}</span>
                            <span className="unit">%</span>
                        </div>
                    </div>
                    <div className="hero-stat-label">
                        <span className="label-main">Onboarding Progress</span>
                        <span className="label-sub">{completed} of {totalMembers} completed</span>
                    </div>
                </div>

                <div className="hero-stats-grid">
                    <div className="hero-stat-card">
                        <div className="hero-stat-icon total">
                            <Users size={20} />
                        </div>
                        <div className="hero-stat-info">
                            <span className="hero-stat-number">{totalMembers}</span>
                            <span className="hero-stat-text">Total Members</span>
                        </div>
                    </div>

                    <div className="hero-stat-card">
                        <div className="hero-stat-icon active">
                            <Activity size={20} />
                        </div>
                        <div className="hero-stat-info">
                            <span className="hero-stat-number">{inProgress}</span>
                            <span className="hero-stat-text">In Progress</span>
                        </div>
                    </div>

                    <div className="hero-stat-card">
                        <div className="hero-stat-icon success">
                            <CheckCircle size={20} />
                        </div>
                        <div className="hero-stat-info">
                            <span className="hero-stat-number">{completed}</span>
                            <span className="hero-stat-text">Completed</span>
                        </div>
                    </div>

                    <div className="hero-stat-card">
                        <div className="hero-stat-icon pending">
                            <Clock size={20} />
                        </div>
                        <div className="hero-stat-info">
                            <span className="hero-stat-number">{pending}</span>
                            <span className="hero-stat-text">Pending</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Info Cards */}
            <div className="overview-cards-grid">
                {/* Project Details Card */}
                <Card className="overview-card project-info-card">
                    <CardBody>
                        <div className="card-header-row">
                            <div className="card-icon-wrapper project">
                                <Briefcase size={18} />
                            </div>
                            <h3 className="card-title">Project Details</h3>
                        </div>

                        <div className="project-info-list">
                            <div className="project-info-item">
                                <Building size={16} className="info-icon" />
                                <div className="info-content">
                                    <span className="info-label">Client</span>
                                    <span className="info-value">{ppmProject.clientName}</span>
                                </div>
                            </div>
                            <div className="project-info-item">
                                <MapPin size={16} className="info-icon" />
                                <div className="info-content">
                                    <span className="info-label">Location</span>
                                    <span className="info-value">{ppmProject.location}</span>
                                </div>
                            </div>
                            <div className="project-info-item">
                                <Calendar size={16} className="info-icon" />
                                <div className="info-content">
                                    <span className="info-label">Timeline</span>
                                    <span className="info-value">{formatDate(ppmProject.startDate)} — {formatDate(ppmProject.endDate)}</span>
                                </div>
                            </div>
                        </div>

                        {ppmProject.description && (
                            <div className="project-description-box">
                                <p>{ppmProject.description}</p>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Timeline Card */}
                <Card className="overview-card timeline-card">
                    <CardBody>
                        <div className="card-header-row">
                            <div className="card-icon-wrapper timeline">
                                <Target size={18} />
                            </div>
                            <h3 className="card-title">Project Timeline</h3>
                        </div>

                        <div className="timeline-stats">
                            <div className="timeline-stat-item">
                                <div className="timeline-stat-value">
                                    {daysRemaining > 0 ? daysRemaining : 0}
                                </div>
                                <div className="timeline-stat-label">Days Remaining</div>
                            </div>
                            <div className="timeline-divider" />
                            <div className="timeline-stat-item">
                                <div className="timeline-stat-value">{formatDate(ppmProject.endDate)}</div>
                                <div className="timeline-stat-label">Target End Date</div>
                            </div>
                        </div>

                        <div className="timeline-progress">
                            <div className="timeline-progress-header">
                                <span>Project Progress</span>
                                <span className="timeline-progress-percent">
                                    {Math.min(100, Math.round(((new Date().getTime() - new Date(ppmProject.startDate).getTime()) / (endDate.getTime() - new Date(ppmProject.startDate).getTime())) * 100))}%
                                </span>
                            </div>
                            <Progress
                                value={Math.min(100, ((new Date().getTime() - new Date(ppmProject.startDate).getTime()) / (endDate.getTime() - new Date(ppmProject.startDate).getTime())) * 100)}
                                size="sm"
                                variant="default"
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Status Breakdown Card */}
                <Card className="overview-card status-card">
                    <CardBody>
                        <div className="card-header-row">
                            <div className="card-icon-wrapper status">
                                <TrendingUp size={18} />
                            </div>
                            <h3 className="card-title">Status Breakdown</h3>
                        </div>

                        {totalMembers > 0 ? (
                            <div className="status-breakdown">
                                <div className="status-bar-chart">
                                    {completed > 0 && (
                                        <div
                                            className="status-bar-segment completed"
                                            style={{ width: `${(completed / totalMembers) * 100}%` }}
                                            title={`Completed: ${completed}`}
                                        />
                                    )}
                                    {inProgress > 0 && (
                                        <div
                                            className="status-bar-segment in-progress"
                                            style={{ width: `${(inProgress / totalMembers) * 100}%` }}
                                            title={`In Progress: ${inProgress}`}
                                        />
                                    )}
                                    {pending > 0 && (
                                        <div
                                            className="status-bar-segment pending"
                                            style={{ width: `${(pending / totalMembers) * 100}%` }}
                                            title={`Pending: ${pending}`}
                                        />
                                    )}
                                </div>

                                <div className="status-legend">
                                    <div className="legend-item">
                                        <span className="legend-dot completed" />
                                        <span className="legend-label">Completed</span>
                                        <span className="legend-value">{completed}</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-dot in-progress" />
                                        <span className="legend-label">In Progress</span>
                                        <span className="legend-value">{inProgress}</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-dot pending" />
                                        <span className="legend-label">Pending</span>
                                        <span className="legend-value">{pending}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-status">
                                <AlertCircle size={24} />
                                <p>No members added yet</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Empty State */}
            {totalMembers === 0 && (
                <Card className="overview-empty-state">
                    <CardBody>
                        <div className="empty-state-content">
                            <div className="empty-state-icon">
                                <Users size={32} />
                            </div>
                            <h3>Ready to Start Onboarding</h3>
                            <p>Add candidates from requisitions or existing employees to begin the onboarding process.</p>
                            <div className="empty-state-hint">
                                <ArrowUpRight size={16} />
                                <span>Go to "Requisitions & Members" to get started</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
