import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronRight,
    CheckCircle2,
    Clock,
    FileText,
    Shield,
    GraduationCap,
    Upload,
    ArrowLeft,
    Search,
    Filter,
    Sparkles,
    MessageCircle,
    User,
    Bell
} from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All', emoji: '📋' },
    { id: 'forms', label: 'Forms', emoji: '📝' },
    { id: 'documents', label: 'Docs', emoji: '📄' },
    { id: 'training', label: 'Training', emoji: '🎓' },
    { id: 'compliance', label: 'Compliance', emoji: '✅' },
];

const MOCK_TASKS = [
    { id: 'task-001', name: 'Complete W-4 Form', category: 'forms', status: 'pending', type: 'form', dueDate: '2025-12-18', description: 'Federal tax withholding form' },
    { id: 'task-002', name: 'State Tax Withholding', category: 'forms', status: 'completed', type: 'form', dueDate: '2025-12-15', description: 'State tax form required' },
    { id: 'task-003', name: 'Direct Deposit Setup', category: 'forms', status: 'in_progress', type: 'form', dueDate: '2025-12-18', description: 'Bank account information' },
    { id: 'task-004', name: 'Emergency Contact', category: 'forms', status: 'completed', type: 'form', dueDate: '2025-12-14', description: 'Emergency contact details' },
    { id: 'task-005', name: 'Handbook Acknowledgment', category: 'forms', status: 'pending', type: 'form', dueDate: '2025-12-20', description: 'Review and sign employee handbook' },
    { id: 'task-010', name: 'Driver\'s License', category: 'documents', status: 'pending', type: 'upload', dueDate: '2025-12-18', description: 'Valid government ID' },
    { id: 'task-011', name: 'TWIC Card', category: 'documents', status: 'completed', type: 'upload', dueDate: '2025-12-15', description: 'Transportation security card' },
    { id: 'task-012', name: 'Social Security Card', category: 'documents', status: 'completed', type: 'upload', dueDate: '2025-12-14', description: 'SSN verification' },
    { id: 'task-013', name: 'DOT Medical Card', category: 'documents', status: 'pending', type: 'upload', dueDate: '2025-12-20', description: 'Medical fitness certificate' },
    { id: 'task-020', name: 'Drug Test', category: 'compliance', status: 'pending', type: 'schedule', dueDate: '2025-12-17', description: 'Schedule testing appointment' },
    { id: 'task-021', name: 'Background Check', category: 'compliance', status: 'in_progress', type: 'api', dueDate: '2025-12-18', description: 'Processing background verification' },
    { id: 'task-022', name: 'Form I-9 Section 1', category: 'compliance', status: 'completed', type: 'form', dueDate: '2025-12-14', description: 'Employment eligibility' },
    { id: 'task-030', name: 'OSHA 10 Training', category: 'training', status: 'pending', type: 'training', dueDate: '2025-12-22', description: 'Safety certification course' },
    { id: 'task-031', name: 'H2S Safety Training', category: 'training', status: 'pending', type: 'training', dueDate: '2025-12-22', description: 'Hazardous gas awareness' },
    { id: 'task-032', name: 'Confined Space Entry', category: 'training', status: 'completed', type: 'training', dueDate: '2025-12-10', description: 'Safety protocols training' },
];

const getTaskIcon = (type: string) => {
    switch (type) {
        case 'form': return FileText;
        case 'upload': return Upload;
        case 'training': return GraduationCap;
        default: return Shield;
    }
};

export function CandidateTasksV2Page() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTasks = MOCK_TASKS
        .filter(task => activeCategory === 'all' || task.category === activeCategory)
        .filter(task => task.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Group by status
    const pendingTasks = filteredTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const completedTasks = filteredTasks.filter(t => t.status === 'completed');

    const getDaysUntil = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="candidate-v2 candidate-tasks-v2">
            {/* Header */}
            <header className="candidate-v2-page-header">
                <button
                    className="candidate-v2-back-btn"
                    onClick={() => navigate('/candidate-v2')}
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
                                const isUrgent = daysLeft <= 2;
                                const isInProgress = task.status === 'in_progress';

                                return (
                                    <button
                                        key={task.id}
                                        className={`candidate-v2-task-card ${isUrgent ? 'urgent' : ''} ${isInProgress ? 'in-progress' : ''}`}
                                        onClick={() => navigate(`/candidate/tasks/${task.id}`)}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className={`candidate-v2-task-icon ${task.category}`}>
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
                                                        {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
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
                            {completedTasks.map((task, index) => {
                                const TaskIcon = getTaskIcon(task.type);
                                return (
                                    <button
                                        key={task.id}
                                        className="candidate-v2-task-card completed"
                                        onClick={() => navigate(`/candidate/tasks/${task.id}`)}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className={`candidate-v2-task-icon ${task.category} completed`}>
                                            <CheckCircle2 size={22} />
                                        </div>
                                        <div className="candidate-v2-task-info">
                                            <h3 className="candidate-v2-task-name">{task.name}</h3>
                                            <p className="candidate-v2-task-desc">{task.description}</p>
                                        </div>
                                        <ChevronRight size={20} className="candidate-v2-task-arrow" />
                                    </button>
                                );
                            })}
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
                    onClick={() => navigate('/candidate-v2')}
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
