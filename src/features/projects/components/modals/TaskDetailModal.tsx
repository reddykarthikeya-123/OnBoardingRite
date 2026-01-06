import { useState } from 'react';
import {
    X,
    CheckCircle,
    Clock,
    AlertCircle,
    Circle,
    ArrowRight,
    FileText,
    Upload,
    Zap,
    ExternalLink,
    MessageSquare,
    Eye,
    EyeOff,
    ChevronDown
} from 'lucide-react';
import { Badge, Button } from '../../../../components/ui';
import type { Task, TaskInstance, TaskStatus, TaskComment } from '../../../../types';

interface TaskDetailModalProps {
    task: Task | null;
    taskInstance: TaskInstance | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (instanceId: string, newStatus: TaskStatus) => void;
    onAddComment: (instanceId: string, comment: TaskComment) => void;
}

const TASK_TYPE_INFO: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    CUSTOM_FORM: { icon: <FileText size={16} />, label: 'Custom Form', color: 'primary' },
    DOCUMENT_UPLOAD: { icon: <Upload size={16} />, label: 'Document Upload', color: 'secondary' },
    REST_API: { icon: <Zap size={16} />, label: 'API Integration', color: 'warning' },
    REDIRECT: { icon: <ExternalLink size={16} />, label: 'External Redirect', color: 'default' },
};

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'NOT_STARTED', label: 'Not Started', icon: <Circle size={14} /> },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: <Clock size={14} /> },
    { value: 'COMPLETED', label: 'Completed', icon: <CheckCircle size={14} /> },
    { value: 'BLOCKED', label: 'Blocked', icon: <AlertCircle size={14} /> },
    { value: 'WAIVED', label: 'Waived', icon: <ArrowRight size={14} /> },
];

const getStatusVariant = (status: TaskStatus): 'success' | 'warning' | 'danger' | 'secondary' | 'default' => {
    switch (status) {
        case 'COMPLETED': return 'success';
        case 'IN_PROGRESS': return 'warning';
        case 'BLOCKED': return 'danger';
        case 'WAIVED': return 'secondary';
        default: return 'default';
    }
};

export function TaskDetailModal({
    task,
    taskInstance,
    isOpen,
    onClose,
    onUpdateStatus,
    onAddComment
}: TaskDetailModalProps) {
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isCommentVisible, setIsCommentVisible] = useState(false);
    const [localComments, setLocalComments] = useState<TaskComment[]>([]);

    if (!isOpen || !task || !taskInstance) return null;

    const taskTypeInfo = TASK_TYPE_INFO[task.type] || TASK_TYPE_INFO.REDIRECT;
    const allComments = [...(taskInstance.comments || []), ...localComments];

    const handleStatusChange = (newStatus: TaskStatus) => {
        onUpdateStatus(taskInstance.id, newStatus);
        setShowStatusDropdown(false);
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;

        const comment: TaskComment = {
            id: `tc-${Date.now()}`,
            text: newComment,
            authorId: 'hr-001',
            authorName: 'Current User (HR)',
            authorRole: 'HR_LEAD',
            isVisibleToMember: isCommentVisible,
            createdAt: new Date().toISOString(),
        };

        setLocalComments(prev => [comment, ...prev]);
        onAddComment(taskInstance.id, comment);
        setNewComment('');
        setIsCommentVisible(false);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div className="modal-backdrop" onClick={onClose} />

            {/* Modal */}
            <div className="task-detail-modal">
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title">
                        <div className="task-type-badge" data-type={task.type}>
                            {taskTypeInfo.icon}
                            <span>{taskTypeInfo.label}</span>
                        </div>
                        <h2>{task.name}</h2>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content">
                    {/* Task Info */}
                    <div className="task-info-section">
                        <div className="info-row">
                            <label>Description</label>
                            <p>{task.description}</p>
                        </div>
                        <div className="info-row">
                            <label>Category</label>
                            <Badge variant="secondary">{task.category}</Badge>
                        </div>
                        <div className="info-row">
                            <label>Required</label>
                            <span>{task.required ? 'Yes' : 'Optional'}</span>
                        </div>
                        {task.configuration.estimatedTime && (
                            <div className="info-row">
                                <label>Estimated Time</label>
                                <span>{task.configuration.estimatedTime} minutes</span>
                            </div>
                        )}
                    </div>

                    {/* Status Section */}
                    <div className="status-section">
                        <label>Status</label>
                        <div className="status-dropdown-container">
                            <button
                                className="status-dropdown-trigger"
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            >
                                <Badge variant={getStatusVariant(taskInstance.status)}>
                                    {taskInstance.status.replace('_', ' ')}
                                </Badge>
                                <ChevronDown size={16} />
                            </button>
                            {showStatusDropdown && (
                                <>
                                    <div
                                        className="status-dropdown-backdrop"
                                        onClick={() => setShowStatusDropdown(false)}
                                    />
                                    <div className="status-dropdown-menu">
                                        {STATUS_OPTIONS.map(option => (
                                            <button
                                                key={option.value}
                                                className={`status-option ${taskInstance.status === option.value ? 'active' : ''}`}
                                                onClick={() => handleStatusChange(option.value)}
                                            >
                                                {option.icon}
                                                <span>{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="comments-section">
                        <div className="comments-header">
                            <h3>
                                <MessageSquare size={16} />
                                Comments
                            </h3>
                            <span className="comment-count">{allComments.length}</span>
                        </div>

                        {/* Add Comment */}
                        <div className="add-comment-form">
                            <textarea
                                placeholder="Add a comment about this task..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={2}
                            />
                            <div className="comment-form-actions">
                                <label className="visibility-toggle">
                                    <input
                                        type="checkbox"
                                        checked={isCommentVisible}
                                        onChange={(e) => setIsCommentVisible(e.target.checked)}
                                    />
                                    {isCommentVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                    <span>{isCommentVisible ? 'Visible to member' : 'Private'}</span>
                                </label>
                                <Button
                                    size="sm"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    Add Comment
                                </Button>
                            </div>
                        </div>

                        {/* Comments List */}
                        {allComments.length > 0 && (
                            <div className="comments-list">
                                {allComments.map(comment => (
                                    <div key={comment.id} className="comment-item">
                                        <div className="comment-header">
                                            <span className="comment-author">{comment.authorName}</span>
                                            <span className="comment-time">{formatDate(comment.createdAt)}</span>
                                            {comment.isVisibleToMember ? (
                                                <span className="visibility-badge visible">
                                                    <Eye size={12} /> Visible
                                                </span>
                                            ) : (
                                                <span className="visibility-badge private">
                                                    <EyeOff size={12} /> Private
                                                </span>
                                            )}
                                        </div>
                                        <p className="comment-text">{comment.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </>
    );
}
