import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    Shield,
    GraduationCap,
    Upload
} from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'forms', label: 'Forms' },
    { id: 'documents', label: 'Documents' },
    { id: 'training', label: 'Training' },
    { id: 'compliance', label: 'Compliance' },
];

const MOCK_TASKS = [
    { id: 'task-001', name: 'Complete W-4 Form', category: 'forms', status: 'pending', type: 'form', dueDate: '2025-12-18' },
    { id: 'task-002', name: 'State Tax Withholding', category: 'forms', status: 'completed', type: 'form', dueDate: '2025-12-15' },
    { id: 'task-003', name: 'Direct Deposit Form', category: 'forms', status: 'in_progress', type: 'form', dueDate: '2025-12-18' },
    { id: 'task-004', name: 'Emergency Contact', category: 'forms', status: 'completed', type: 'form', dueDate: '2025-12-14' },
    { id: 'task-005', name: 'Employee Handbook Acknowledgment', category: 'forms', status: 'pending', type: 'form', dueDate: '2025-12-20' },
    { id: 'task-010', name: "Upload Driver's License", category: 'documents', status: 'pending', type: 'upload', dueDate: '2025-12-18' },
    { id: 'task-011', name: 'TWIC Card', category: 'documents', status: 'completed', type: 'upload', dueDate: '2025-12-15' },
    { id: 'task-012', name: 'Social Security Card', category: 'documents', status: 'completed', type: 'upload', dueDate: '2025-12-14' },
    { id: 'task-013', name: 'DOT Medical Card', category: 'documents', status: 'pending', type: 'upload', dueDate: '2025-12-20' },
    { id: 'task-020', name: 'Drug Test', category: 'compliance', status: 'pending', type: 'schedule', dueDate: '2025-12-17' },
    { id: 'task-021', name: 'Background Check', category: 'compliance', status: 'in_progress', type: 'api', dueDate: '2025-12-18' },
    { id: 'task-022', name: 'Form I-9 Section 1', category: 'compliance', status: 'completed', type: 'form', dueDate: '2025-12-14' },
    { id: 'task-030', name: 'OSHA 10 Training', category: 'training', status: 'pending', type: 'training', dueDate: '2025-12-22' },
    { id: 'task-031', name: 'H2S Safety Training', category: 'training', status: 'pending', type: 'training', dueDate: '2025-12-22' },
    { id: 'task-032', name: 'Confined Space Entry', category: 'training', status: 'completed', type: 'training', dueDate: '2025-12-10' },
];

const getTaskIcon = (type: string) => {
    switch (type) {
        case 'form': return FileText;
        case 'upload': return Upload;
        case 'training': return GraduationCap;
        default: return Shield;
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed': return CheckCircle2;
        case 'in_progress': return Clock;
        case 'pending': return AlertCircle;
        default: return AlertCircle;
    }
};

export function CandidateTasksPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';
    const [activeCategory, setActiveCategory] = useState(initialCategory);

    const filteredTasks = activeCategory === 'all'
        ? MOCK_TASKS
        : MOCK_TASKS.filter((task) => task.category === activeCategory);

    // Sort: pending first, then in_progress, then completed
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const order = { pending: 0, in_progress: 1, completed: 2 };
        return (order[a.status as keyof typeof order] || 0) - (order[b.status as keyof typeof order] || 0);
    });

    return (
        <div className="candidate-tasks-page">
            <header className="candidate-page-header">
                <h1 className="candidate-page-title">My Tasks</h1>
                <p className="candidate-page-subtitle">
                    {MOCK_TASKS.filter((t) => t.status !== 'completed').length} tasks remaining
                </p>
            </header>

            {/* Category Tabs */}
            <div className="category-tabs">
                {CATEGORIES.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="task-list">
                {sortedTasks.map((task) => {
                    const TaskIcon = getTaskIcon(task.type);
                    const StatusIcon = getStatusIcon(task.status);
                    const dueDate = new Date(task.dueDate);
                    const isOverdue = task.status !== 'completed' && dueDate < new Date();

                    return (
                        <button
                            key={task.id}
                            className={`task-list-item task-status-${task.status}`}
                            onClick={() => navigate(`/candidate/tasks/${task.id}`)}
                        >
                            <div className={`task-list-icon task-icon-${task.category}`}>
                                <TaskIcon size={20} />
                            </div>

                            <div className="task-list-content">
                                <h3 className="task-list-name">{task.name}</h3>
                                <div className="task-list-meta">
                                    <span className={`task-list-status ${task.status}`}>
                                        <StatusIcon size={12} />
                                        {task.status === 'completed' ? 'Done' :
                                            task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                    </span>
                                    {task.status !== 'completed' && (
                                        <span className={`task-list-due ${isOverdue ? 'overdue' : ''}`}>
                                            Due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <ChevronRight size={18} className="task-list-arrow" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
