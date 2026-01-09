import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronRight,
    CheckCircle2,
    Clock,
    FileText,
    Shield,
    Upload,
    ArrowLeft,
    Search,
    Filter,
    Sparkles,
    MessageCircle,
    User,
    Bell,
    Loader2,
    Zap
} from 'lucide-react';
import { candidateApi } from '../../../services/api';

const CATEGORIES = [
    { id: 'all', label: 'All', emoji: '📋' },
    { id: 'forms', label: 'Forms', emoji: '📝' },
    { id: 'documents', label: 'Docs', emoji: '📄' },
    { id: 'training', label: 'Training', emoji: '🎓' },
    { id: 'compliance', label: 'Compliance', emoji: '✅' },
];

const getTaskIcon = (type: string) => {
    switch (type?.toUpperCase()) {
        case 'CUSTOM_FORM': return FileText;
        case 'DOCUMENT_UPLOAD': return Upload;
        case 'REST_API': return Zap;
        case 'REDIRECT': return Shield;
        default: return FileText;
    }
};

interface TaskItem {
    id: string;
    taskId: string;
    name: string;
    description: string | null;
    type: string;
    category: string | null;
    status: string;
    dueDate: string | null;
    isRequired: boolean;
    configuration: any;
    result: any;
    startedAt: string | null;
    completedAt: string | null;
}

export function CandidateTasksV2Page() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const assignmentId = searchParams.get('assignmentId') || 'demo-assignment';
    const initialCategory = searchParams.get('category') || 'all';

    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTasks();
    }, [assignmentId]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await candidateApi.getTasks(assignmentId);
            setTasks(response.tasks);
        } catch (err) {
            console.error('Failed to load tasks:', err);
            setError('Failed to load tasks');
            // Fallback mock data
            setTasks([
                { id: 'task-001', taskId: 't1', name: 'Complete W-4 Form', category: 'FORMS', status: 'NOT_STARTED', type: 'CUSTOM_FORM', dueDate: '2025-12-18', description: 'Federal tax withholding form', isRequired: true, configuration: {}, result: null, startedAt: null, completedAt: null },
                { id: 'task-002', taskId: 't2', name: 'State Tax Withholding', category: 'FORMS', status: 'COMPLETED', type: 'CUSTOM_FORM', dueDate: '2025-12-15', description: 'State tax form required', isRequired: true, configuration: {}, result: null, startedAt: null, completedAt: '2025-12-14' },
                { id: 'task-010', taskId: 't3', name: 'Driver\'s License', category: 'DOCUMENTS', status: 'NOT_STARTED', type: 'DOCUMENT_UPLOAD', dueDate: '2025-12-18', description: 'Valid government ID', isRequired: true, configuration: {}, result: null, startedAt: null, completedAt: null },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Filter tasks
    const filteredTasks = tasks
        .filter(task => activeCategory === 'all' || task.category?.toLowerCase() === activeCategory.toLowerCase())
        .filter(task => task.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Group by status
    const pendingTasks = filteredTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'WAIVED');
    const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED');

    const getDaysUntil = (dateStr: string | null) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const handleTaskClick = (task: TaskItem) => {
        // Navigate to task detail/form page
        navigate(`/candidate/task/${task.id}?assignmentId=${assignmentId}`);
    };

    if (loading) {
        return (
            <div className="candidate-v2 candidate-tasks-v2 candidate-loading">
                <Loader2 className="spin" size={32} />
                <p>Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="candidate-v2 candidate-tasks-v2">
            {/* Header */}
            <header className="candidate-v2-page-header">
                <button
                    className="candidate-v2-back-btn"
                    onClick={() => navigate(`/candidate-v2?assignmentId=${assignmentId}`)}
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="candidate-v2-page-title-group">
                    <h1 className="candidate-v2-page-title">My Tasks</h1>
                    <span className="candidate-v2-page-subtitle">
                        {pendingTasks.length} remaining
                    </span>
                </div>
                <button className="candidate-v2-icon-btn">
                    <Filter size={20} />
                </button>
            </header>

            {/* Search */}
            <div className="candidate-v2-search">
                <Search size={18} className="candidate-v2-search-icon" />
                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="candidate-v2-search-input"
                />
            </div>

            {/* Pill Tabs */}
            <div className="candidate-v2-pill-tabs">
                {CATEGORIES.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`candidate-v2-pill ${activeCategory === category.id ? 'active' : ''}`}
                    >
                        <span className="candidate-v2-pill-emoji">{category.emoji}</span>
                        <span>{category.label}</span>
                    </button>
                ))}
            </div>

            {/* Task Lists */}
            <div className="candidate-v2-task-sections">
                {/* Pending Section */}
                {pendingTasks.length > 0 && (
                    <section className="candidate-v2-task-section">
                        <div className="candidate-v2-task-section-header">
                            <span className="candidate-v2-task-section-title">To Do</span>
                            <span className="candidate-v2-task-section-count">{pendingTasks.length}</span>
                        </div>

                        <div className="candidate-v2-task-list">
                            {pendingTasks.map((task, index) => {
                                const TaskIcon = getTaskIcon(task.type);
                                const daysLeft = getDaysUntil(task.dueDate);
                                const isUrgent = daysLeft !== null && daysLeft <= 2;
                                const isInProgress = task.status === 'IN_PROGRESS';

                                return (
                                    <button
                                        key={task.id}
                                        className={`candidate-v2-task-card ${isUrgent ? 'urgent' : ''} ${isInProgress ? 'in-progress' : ''}`}
                                        onClick={() => handleTaskClick(task)}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className={`candidate-v2-task-icon ${task.category?.toLowerCase() || 'forms'}`}>
                                            <TaskIcon size={22} />
                                        </div>
                                        <div className="candidate-v2-task-info">
                                            <h3 className="candidate-v2-task-name">{task.name}</h3>
                                            <p className="candidate-v2-task-desc">{task.description}</p>
                                            <div className="candidate-v2-task-meta">
                                                {isInProgress ? (
                                                    <span className="candidate-v2-task-status in-progress">
                                                        <Clock size={12} /> In Progress
                                                    </span>
                                                ) : (
                                                    <span className={`candidate-v2-task-due ${isUrgent ? 'urgent' : ''}`}>
                                                        <Clock size={12} />
                                                        {daysLeft !== null
                                                            ? (daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`)
                                                            : 'No due date'
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="candidate-v2-task-arrow" />
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Completed Section */}
                {completedTasks.length > 0 && (
                    <section className="candidate-v2-task-section">
                        <div className="candidate-v2-task-section-header">
                            <span className="candidate-v2-task-section-title">
                                <CheckCircle2 size={16} className="text-success" />
                                Completed
                            </span>
                            <span className="candidate-v2-task-section-count success">{completedTasks.length}</span>
                        </div>

                        <div className="candidate-v2-task-list completed">
                            {completedTasks.map((task, index) => (
                                <button
                                    key={task.id}
                                    className="candidate-v2-task-card completed"
                                    onClick={() => handleTaskClick(task)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className={`candidate-v2-task-icon ${task.category?.toLowerCase() || 'forms'} completed`}>
                                        <CheckCircle2 size={22} />
                                    </div>
                                    <div className="candidate-v2-task-info">
                                        <h3 className="candidate-v2-task-name">{task.name}</h3>
                                        <p className="candidate-v2-task-desc">{task.description}</p>
                                    </div>
                                    <ChevronRight size={20} className="candidate-v2-task-arrow" />
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {filteredTasks.length === 0 && (
                    <div className="candidate-v2-empty">
                        <Sparkles size={48} />
                        <h3>No tasks found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="candidate-v2-bottom-nav">
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate(`/candidate-v2?assignmentId=${assignmentId}`)}
                >
                    <Sparkles size={22} />
                    <span>Home</span>
                </button>
                <button className="candidate-v2-nav-item active">
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
