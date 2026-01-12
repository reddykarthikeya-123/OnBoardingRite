import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronRight,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Search,
    Circle
} from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'forms', label: 'Forms' },
    { id: 'documents', label: 'Docs' },
    { id: 'training', label: 'Training' },
    { id: 'compliance', label: 'Compliance' },
];

const MOCK_TASKS = [
    { id: 'task-001', name: 'W-4 Tax Form', category: 'forms', status: 'pending', dueDate: '2025-12-18' },
    { id: 'task-002', name: 'State Tax Withholding', category: 'forms', status: 'completed', dueDate: '2025-12-15' },
    { id: 'task-003', name: 'Direct Deposit Setup', category: 'forms', status: 'in_progress', dueDate: '2025-12-18' },
    { id: 'task-004', name: 'Emergency Contact', category: 'forms', status: 'completed', dueDate: '2025-12-14' },
    { id: 'task-005', name: 'Handbook Acknowledgment', category: 'forms', status: 'pending', dueDate: '2025-12-20' },
    { id: 'task-010', name: 'Driver\'s License', category: 'documents', status: 'pending', dueDate: '2025-12-18' },
    { id: 'task-011', name: 'TWIC Card', category: 'documents', status: 'completed', dueDate: '2025-12-15' },
    { id: 'task-012', name: 'Social Security Card', category: 'documents', status: 'completed', dueDate: '2025-12-14' },
    { id: 'task-013', name: 'DOT Medical Card', category: 'documents', status: 'pending', dueDate: '2025-12-20' },
    { id: 'task-020', name: 'Drug Test Appointment', category: 'compliance', status: 'pending', dueDate: '2025-12-17' },
    { id: 'task-021', name: 'Background Check', category: 'compliance', status: 'in_progress', dueDate: '2025-12-18' },
    { id: 'task-022', name: 'Form I-9 Section 1', category: 'compliance', status: 'completed', dueDate: '2025-12-14' },
    { id: 'task-030', name: 'OSHA 10 Training', category: 'training', status: 'pending', dueDate: '2025-12-22' },
    { id: 'task-031', name: 'H2S Safety Training', category: 'training', status: 'pending', dueDate: '2025-12-22' },
    { id: 'task-032', name: 'Confined Space Entry', category: 'training', status: 'completed', dueDate: '2025-12-10' },
];

export function CandidateTasksV3Page() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTasks = MOCK_TASKS
        .filter(task => activeCategory === 'all' || task.category === activeCategory)
        .filter(task => task.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Sort: pending first, then in_progress, then completed
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const order = { pending: 0, in_progress: 1, completed: 2 };
        return (order[a.status as keyof typeof order] || 0) - (order[b.status as keyof typeof order] || 0);
    });

    const pendingCount = filteredTasks.filter(t => t.status !== 'completed').length;
    const completedCount = filteredTasks.filter(t => t.status === 'completed').length;

    return (
        <div className="tasks-v3">
            {/* Compact Header */}
            <header className="tasks-v3-header">
                <button
                    className="tasks-v3-back"
                    onClick={() => navigate('/candidate')}
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="tasks-v3-header-info">
                    <h1 className="tasks-v3-title">Tasks</h1>
                    <span className="tasks-v3-count">{pendingCount} pending • {completedCount} done</span>
                </div>
            </header>

            {/* Compact Search */}
            <div className="tasks-v3-search-wrapper">
                <Search size={16} className="tasks-v3-search-icon" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="tasks-v3-search"
                />
            </div>

            {/* Compact Category Tabs */}
            <div className="tasks-v3-tabs">
                {CATEGORIES.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`tasks-v3-tab ${activeCategory === category.id ? 'active' : ''}`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>

            {/* Condensed Task List */}
            <div className="tasks-v3-list">
                {sortedTasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    const isInProgress = task.status === 'in_progress';

                    return (
                        <button
                            key={task.id}
                            className={`tasks-v3-item ${isCompleted ? 'completed' : ''}`}
                            onClick={() => navigate(`/candidate/tasks/${task.id}`)}
                        >
                            <div className="tasks-v3-item-left">
                                {isCompleted ? (
                                    <CheckCircle2 size={18} className="tasks-v3-check" />
                                ) : (
                                    <Circle size={18} className="tasks-v3-circle" />
                                )}
                                <span className="tasks-v3-item-name">{task.name}</span>
                            </div>
                            <div className="tasks-v3-item-right">
                                {isCompleted ? (
                                    <span className="tasks-v3-chip done">Done</span>
                                ) : isInProgress ? (
                                    <span className="tasks-v3-chip progress">In Progress</span>
                                ) : (
                                    <span className="tasks-v3-chip pending">Pending</span>
                                )}
                                <ChevronRight size={16} className="tasks-v3-arrow" />
                            </div>
                        </button>
                    );
                })}

                {sortedTasks.length === 0 && (
                    <div className="tasks-v3-empty">
                        <Clock size={32} />
                        <span>No tasks found</span>
                    </div>
                )}
            </div>
        </div>
    );
}
