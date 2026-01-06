import { CheckCircle2, FileText, GraduationCap, Shield, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockTeamMembers } from '../../../data';

// Get a mock candidate for demo purposes
const mockCandidate = mockTeamMembers[0];

// Calculate task categories from mock data
const taskCategories = [
    { id: 'forms', name: 'Forms', icon: FileText, color: 'primary', completed: 3, total: 5 },
    { id: 'documents', name: 'Documents', icon: Shield, color: 'secondary', completed: 2, total: 4 },
    { id: 'training', name: 'Training', icon: GraduationCap, color: 'accent', completed: 1, total: 3 },
    { id: 'compliance', name: 'Compliance', icon: CheckCircle2, color: 'danger', completed: 1, total: 3 },
];

export function CandidateHomePage() {
    const navigate = useNavigate();

    const totalTasks = taskCategories.reduce((acc, cat) => acc + cat.total, 0);
    const completedTasks = taskCategories.reduce((acc, cat) => acc + cat.completed, 0);
    const progressPercent = Math.round((completedTasks / totalTasks) * 100);

    return (
        <div className="candidate-home">
            {/* Hero Header with Gradient */}
            <div className="candidate-hero">
                <div className="candidate-hero-content">
                    <div className="candidate-greeting">
                        <span className="candidate-greeting-small">Welcome back,</span>
                        <h1 className="candidate-greeting-name">
                            {mockCandidate.firstName} {mockCandidate.lastName}
                        </h1>
                        <p className="candidate-greeting-subtitle">
                            Let's complete your onboarding
                        </p>
                    </div>

                    {/* Progress Ring */}
                    <div className="progress-ring-container">
                        <svg className="progress-ring" viewBox="0 0 100 100">
                            <circle
                                className="progress-ring-bg"
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                strokeWidth="8"
                            />
                            <circle
                                className="progress-ring-fill"
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                strokeWidth="8"
                                strokeDasharray={`${progressPercent * 2.64} 264`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="progress-ring-text">
                            <span className="progress-ring-value">{progressPercent}%</span>
                            <span className="progress-ring-label">Complete</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="candidate-stats">
                    <div className="candidate-stat">
                        <span className="candidate-stat-value">{completedTasks}</span>
                        <span className="candidate-stat-label">Completed</span>
                    </div>
                    <div className="candidate-stat-divider" />
                    <div className="candidate-stat">
                        <span className="candidate-stat-value">{totalTasks - completedTasks}</span>
                        <span className="candidate-stat-label">Remaining</span>
                    </div>
                    <div className="candidate-stat-divider" />
                    <div className="candidate-stat">
                        <span className="candidate-stat-value">
                            <Clock size={16} style={{ display: 'inline', marginRight: '4px' }} />
                            3d
                        </span>
                        <span className="candidate-stat-label">Due</span>
                    </div>
                </div>
            </div>

            {/* Task Categories */}
            <div className="candidate-section">
                <div className="candidate-section-header">
                    <h2 className="candidate-section-title">Your Tasks</h2>
                    <button
                        className="candidate-section-link"
                        onClick={() => navigate('/candidate/tasks')}
                    >
                        View All
                    </button>
                </div>

                <div className="task-category-grid">
                    {taskCategories.map((category) => {
                        const Icon = category.icon;
                        const isComplete = category.completed === category.total;

                        return (
                            <button
                                key={category.id}
                                className={`task-category-card task-category-${category.color}`}
                                onClick={() => navigate(`/candidate/tasks?category=${category.id}`)}
                            >
                                <div className="task-category-icon-wrapper">
                                    <Icon size={24} />
                                </div>
                                <div className="task-category-info">
                                    <span className="task-category-name">{category.name}</span>
                                    <span className="task-category-progress">
                                        {isComplete ? (
                                            <span className="task-category-complete">
                                                <CheckCircle2 size={14} /> Complete
                                            </span>
                                        ) : (
                                            `${category.completed}/${category.total} done`
                                        )}
                                    </span>
                                </div>
                                <ChevronRight size={18} className="task-category-arrow" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Action Required Section */}
            <div className="candidate-section">
                <div className="candidate-section-header">
                    <h2 className="candidate-section-title">Action Required</h2>
                </div>

                <div className="action-cards">
                    <div className="action-card action-card-urgent">
                        <div className="action-card-icon">
                            <FileText size={24} />
                        </div>
                        <div className="action-card-content">
                            <h3 className="action-card-title">Complete W-4 Form</h3>
                            <p className="action-card-description">Federal tax withholding form</p>
                        </div>
                        <button
                            className="action-card-button"
                            onClick={() => navigate('/candidate/tasks/task-001')}
                        >
                            Start
                        </button>
                    </div>

                    <div className="action-card">
                        <div className="action-card-icon">
                            <Shield size={24} />
                        </div>
                        <div className="action-card-content">
                            <h3 className="action-card-title">Upload Driver's License</h3>
                            <p className="action-card-description">Valid government ID required</p>
                        </div>
                        <button
                            className="action-card-button"
                            onClick={() => navigate('/candidate/tasks/task-010')}
                        >
                            Upload
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
