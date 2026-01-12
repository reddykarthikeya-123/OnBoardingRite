import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Shield,
    Clock,
    ChevronRight,
    Sparkles,
    Bell,
    User,
    Zap,
    Star,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { candidateApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';


// Category icon mapping
const getCategoryIcon = (categoryId: string) => {
    switch (categoryId.toLowerCase()) {
        case 'forms': return FileText;
        case 'documents': return Shield;
        case 'rest_api': return Zap;
        default: return FileText;
    }
};

interface DashboardData {
    candidateId: string;
    candidateName: string;
    projectName: string;
    projectId: string;
    trade: string | null;
    totalTasks: number;
    completedTasks: number;
    remainingTasks: number;
    progressPercent: number;
    daysUntilStart: number | null;
    startDate: string | null;
    categories: Array<{
        id: string;
        name: string;
        completed: number;
        total: number;
    }>;
    priorityTasks: Array<{
        id: string;
        taskId: string;
        name: string;
        type: string;
        dueIn: number | null;
        priority: string;
        status: string;
    }>;
}

export function CandidateHomeV2Page() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Get assignmentId from auth context (set during login)
    const assignmentId = user?.assignmentId || '';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);

    useEffect(() => {
        if (assignmentId) {
            loadDashboard();
        } else {
            setLoading(false);
            setError('No active assignment found. Please contact your administrator.');
        }
    }, [assignmentId]);


    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await candidateApi.getDashboard(assignmentId);
            setDashboard(data);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
            setError('Failed to load dashboard. Please try again.');
            // Use fallback mock data for demo
            setDashboard({
                candidateId: 'demo',
                candidateName: 'John Rodriguez',
                projectName: 'Marathon Galveston Turnaround',
                projectId: 'demo-project',
                trade: 'Pipefitter',
                totalTasks: 15,
                completedTasks: 7,
                remainingTasks: 8,
                progressPercent: 47,
                daysUntilStart: 3,
                startDate: null,
                categories: [
                    { id: 'forms', name: 'Forms', completed: 3, total: 5 },
                    { id: 'documents', name: 'Documents', completed: 2, total: 4 },
                    { id: 'rest_api', name: 'REST API', completed: 1, total: 5 },
                ],
                priorityTasks: [
                    { id: 'task-001', taskId: 't1', name: 'Complete W-4 Form', type: 'form', dueIn: 2, priority: 'high', status: 'NOT_STARTED' },
                    { id: 'task-010', taskId: 't2', name: 'Upload Driver\'s License', type: 'upload', dueIn: 3, priority: 'medium', status: 'NOT_STARTED' },
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Get initials from name
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    if (loading) {
        return (
            <div className="candidate-v2 candidate-loading">
                <Loader2 className="spin" size={32} />
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="candidate-v2 candidate-error">
                <p>{error || 'Something went wrong'}</p>
                <button onClick={loadDashboard}>Try Again</button>
            </div>
        );
    }

    const {
        candidateName,
        projectName,
        totalTasks,
        completedTasks,
        remainingTasks,
        progressPercent,
        daysUntilStart,
        categories,
        priorityTasks
    } = dashboard;

    const firstName = candidateName.split(' ')[0];

    return (
        <div className="candidate-v2">
            {/* Mobile Header */}
            <header className="candidate-v2-header">
                <div className="candidate-v2-header-left">
                    <div className="candidate-v2-avatar">
                        {getInitials(candidateName)}
                    </div>
                    <div>
                        <span className="candidate-v2-greeting">{getGreeting()}</span>
                        <h1 className="candidate-v2-name">{firstName}</h1>
                    </div>
                </div>
                <div className="candidate-v2-header-right">
                    <button className="candidate-v2-icon-btn" onClick={() => navigate('/candidate/notifications')}>
                        <Bell size={22} />
                    </button>
                    <button className="candidate-v2-icon-btn" onClick={() => navigate('/candidate/profile')}>
                        <User size={22} />
                    </button>
                </div>
            </header>

            {/* Hero Progress Card */}
            <div className="candidate-v2-hero-card">
                <div className="candidate-v2-hero-bg" />
                <div className="candidate-v2-hero-content">
                    <div className="candidate-v2-hero-info">
                        <div className="candidate-v2-hero-badge">
                            <Sparkles size={14} />
                            <span>{projectName}</span>
                        </div>
                        <h2 className="candidate-v2-hero-title">
                            {progressPercent < 100 ? 'Almost there!' : 'All done!'}
                        </h2>
                        <p className="candidate-v2-hero-subtitle">
                            {completedTasks} of {totalTasks} tasks completed
                        </p>
                    </div>

                    <div className="candidate-v2-progress-ring">
                        <svg viewBox="0 0 120 120">
                            <circle
                                className="candidate-v2-ring-bg"
                                cx="60"
                                cy="60"
                                r="52"
                                strokeWidth="10"
                                fill="none"
                            />
                            <circle
                                className="candidate-v2-ring-fill"
                                cx="60"
                                cy="60"
                                r="52"
                                strokeWidth="10"
                                fill="none"
                                strokeDasharray={`${progressPercent * 3.27} 327`}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                            />
                        </svg>
                        <div className="candidate-v2-progress-text">
                            <span className="candidate-v2-progress-value">{progressPercent}%</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="candidate-v2-quick-stats">
                    <div className="candidate-v2-quick-stat">
                        <Zap size={16} className="text-warning" />
                        <span className="candidate-v2-quick-stat-value">{remainingTasks}</span>
                        <span className="candidate-v2-quick-stat-label">Pending</span>
                    </div>
                    <div className="candidate-v2-stat-divider" />
                    <div className="candidate-v2-quick-stat">
                        <Clock size={16} className="text-danger" />
                        <span className="candidate-v2-quick-stat-value">{daysUntilStart ?? '-'}</span>
                        <span className="candidate-v2-quick-stat-label">Days left</span>
                    </div>
                    <div className="candidate-v2-stat-divider" />
                    <div className="candidate-v2-quick-stat">
                        <Star size={16} className="text-primary" />
                        <span className="candidate-v2-quick-stat-value">{completedTasks}</span>
                        <span className="candidate-v2-quick-stat-label">Complete</span>
                    </div>
                </div>
            </div>

            {/* Priority Tasks */}
            {priorityTasks.length > 0 && (
                <section className="candidate-v2-section">
                    <div className="candidate-v2-section-header">
                        <h2 className="candidate-v2-section-title">Priority Tasks</h2>
                        <span className="candidate-v2-section-badge">{priorityTasks.length}</span>
                    </div>

                    <div className="candidate-v2-priority-list">
                        {priorityTasks.map((task, index) => (
                            <button
                                key={task.id}
                                className="candidate-v2-priority-item"
                                onClick={() => navigate(`/candidate/tasks/${task.id}?assignmentId=${assignmentId}`)}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={`candidate-v2-priority-indicator priority-${task.priority}`} />
                                <div className="candidate-v2-priority-content">
                                    <span className="candidate-v2-priority-name">{task.name}</span>
                                    <span className="candidate-v2-priority-due">
                                        <Clock size={12} />
                                        {task.dueIn !== null ? `Due in ${task.dueIn} days` : 'No due date'}
                                    </span>
                                </div>
                                <ChevronRight size={18} className="candidate-v2-priority-arrow" />
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Category Cards - Swipeable on Mobile */}
            <section className="candidate-v2-section">
                <div className="candidate-v2-section-header">
                    <h2 className="candidate-v2-section-title">Categories</h2>
                    <button
                        className="candidate-v2-view-all"
                        onClick={() => navigate(`/candidate/tasks?assignmentId=${assignmentId}`)}
                    >
                        View All
                    </button>
                </div>

                <div className="candidate-v2-categories-scroll">
                    {categories.map((category, index) => {
                        const Icon = getCategoryIcon(category.id);
                        const percent = category.total > 0
                            ? Math.round((category.completed / category.total) * 100)
                            : 0;
                        const isDone = category.completed === category.total && category.total > 0;

                        return (
                            <button
                                key={category.id}
                                className="candidate-v2-category-card"
                                onClick={() => navigate(`/candidate/tasks?category=${category.id}&assignmentId=${assignmentId}`)}
                                style={{ animationDelay: `${index * 75}ms` }}
                            >
                                <div className={`candidate-v2-category-icon ${category.id}`}>
                                    <Icon size={24} />
                                </div>
                                <span className="candidate-v2-category-name">{category.name}</span>
                                <div className="candidate-v2-category-progress">
                                    <div
                                        className="candidate-v2-category-bar"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <span className="candidate-v2-category-status">
                                    {isDone ? (
                                        <><CheckCircle2 size={12} /> Done</>
                                    ) : (
                                        `${category.completed}/${category.total}`
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>


        </div>
    );
}
