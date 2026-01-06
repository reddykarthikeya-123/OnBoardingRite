import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    FileText,
    GraduationCap,
    Shield,
    Clock,
    ChevronRight,
    Sparkles,
    Bell,
    User,
    Zap,
    Star,
    MessageCircle
} from 'lucide-react';
import { mockTeamMembers } from '../../../data';

// Get a mock candidate for demo purposes
const mockCandidate = mockTeamMembers[0];

// Mock priority tasks
const priorityTasks = [
    { id: 'task-001', name: 'Complete W-4 Form', type: 'form', dueIn: 2, priority: 'high' },
    { id: 'task-010', name: 'Upload Driver\'s License', type: 'upload', dueIn: 3, priority: 'medium' },
    { id: 'task-020', name: 'Drug Test Appointment', type: 'schedule', dueIn: 5, priority: 'low' },
];

// Task categories with progress
const categories = [
    { id: 'forms', name: 'Forms', icon: FileText, completed: 3, total: 5, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'documents', name: 'Documents', icon: Shield, completed: 2, total: 4, gradient: 'from-emerald-500 to-teal-600' },
    { id: 'training', name: 'Training', icon: GraduationCap, completed: 1, total: 3, gradient: 'from-purple-500 to-pink-600' },
    { id: 'compliance', name: 'Compliance', icon: CheckCircle2, completed: 1, total: 3, gradient: 'from-orange-500 to-red-600' },
];

export function CandidateHomeV2Page() {
    const navigate = useNavigate();

    const totalTasks = categories.reduce((acc, cat) => acc + cat.total, 0);
    const completedTasks = categories.reduce((acc, cat) => acc + cat.completed, 0);
    const progressPercent = Math.round((completedTasks / totalTasks) * 100);

    return (
        <div className="candidate-v2">
            {/* Mobile Header */}
            <header className="candidate-v2-header">
                <div className="candidate-v2-header-left">
                    <div className="candidate-v2-avatar">
                        {mockCandidate.firstName[0]}{mockCandidate.lastName[0]}
                    </div>
                    <div>
                        <span className="candidate-v2-greeting">Good morning</span>
                        <h1 className="candidate-v2-name">{mockCandidate.firstName}</h1>
                    </div>
                </div>
                <div className="candidate-v2-header-right">
                    <button className="candidate-v2-icon-btn has-badge">
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
                            <span>Onboarding</span>
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
                        <span className="candidate-v2-quick-stat-value">{totalTasks - completedTasks}</span>
                        <span className="candidate-v2-quick-stat-label">Pending</span>
                    </div>
                    <div className="candidate-v2-stat-divider" />
                    <div className="candidate-v2-quick-stat">
                        <Clock size={16} className="text-danger" />
                        <span className="candidate-v2-quick-stat-value">3</span>
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
                            onClick={() => navigate(`/candidate/tasks/${task.id}`)}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`candidate-v2-priority-indicator priority-${task.priority}`} />
                            <div className="candidate-v2-priority-content">
                                <span className="candidate-v2-priority-name">{task.name}</span>
                                <span className="candidate-v2-priority-due">
                                    <Clock size={12} />
                                    Due in {task.dueIn} days
                                </span>
                            </div>
                            <ChevronRight size={18} className="candidate-v2-priority-arrow" />
                        </button>
                    ))}
                </div>
            </section>

            {/* Category Cards - Swipeable on Mobile */}
            <section className="candidate-v2-section">
                <div className="candidate-v2-section-header">
                    <h2 className="candidate-v2-section-title">Categories</h2>
                    <button
                        className="candidate-v2-view-all"
                        onClick={() => navigate('/candidate-v2/tasks')}
                    >
                        View All
                    </button>
                </div>

                <div className="candidate-v2-categories-scroll">
                    {categories.map((category, index) => {
                        const Icon = category.icon;
                        const percent = Math.round((category.completed / category.total) * 100);
                        const isDone = category.completed === category.total;

                        return (
                            <button
                                key={category.id}
                                className="candidate-v2-category-card"
                                onClick={() => navigate(`/candidate-v2/tasks?category=${category.id}`)}
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

            {/* Bottom Navigation */}
            <nav className="candidate-v2-bottom-nav">
                <button className="candidate-v2-nav-item active">
                    <Sparkles size={22} />
                    <span>Home</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate-v2/tasks')}
                >
                    <FileText size={22} />
                    <span>Tasks</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate/chat')}
                >
                    <MessageCircle size={22} />
                    <span>Chat</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate/notifications')}
                >
                    <Bell size={22} />
                    <span>Alerts</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate/profile')}
                >
                    <User size={22} />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
}
