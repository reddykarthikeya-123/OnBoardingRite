import { useState, useMemo } from 'react';
import {
    X,
    Mail,
    Phone,
    Send,
    MessageCircle,
    ChevronDown,
    ChevronRight,
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
    Plus
} from 'lucide-react';
import { Badge, Button, Progress } from '../../../../components/ui';
import { mockTasks, getChecklistCommentsByMember } from '../../../../data';
import type { TeamMember, Task, TaskStatus, TaskInstance, ChecklistComment } from '../../../../types';

interface TeamMemberDrawerProps {
    member: TeamMember | null;
    isOpen: boolean;
    onClose: () => void;
    onOpenTaskDetail: (taskInstance: TaskInstance, task: Task) => void;
}

const TASK_TYPE_INFO: Record<string, { icon: React.ReactNode; color: string }> = {
    CUSTOM_FORM: { icon: <FileText size={14} />, color: 'primary' },
    DOCUMENT_UPLOAD: { icon: <Upload size={14} />, color: 'secondary' },
    REST_API: { icon: <Zap size={14} />, color: 'warning' },
    REDIRECT: { icon: <ExternalLink size={14} />, color: 'default' },
};

const StatusIcon = ({ status }: { status: TaskStatus }) => {
    switch (status) {
        case 'COMPLETED':
            return <CheckCircle size={16} className="text-success" />;
        case 'IN_PROGRESS':
            return <Clock size={16} className="text-warning" />;
        case 'BLOCKED':
            return <AlertCircle size={16} className="text-danger" />;
        case 'WAIVED':
            return <ArrowRight size={16} className="text-muted" />;
        default:
            return <Circle size={16} className="text-muted" />;
    }
};

const getStatusVariant = (status: TaskStatus): 'success' | 'warning' | 'danger' | 'secondary' | 'default' => {
    switch (status) {
        case 'COMPLETED': return 'success';
        case 'IN_PROGRESS': return 'warning';
        case 'BLOCKED': return 'danger';
        case 'WAIVED': return 'secondary';
        default: return 'default';
    }
};

export function TeamMemberDrawer({ member, isOpen, onClose, onOpenTaskDetail }: TeamMemberDrawerProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['FORMS', 'DOCUMENTS', 'COMPLIANCE', 'TRAININGS']));
    const [newComment, setNewComment] = useState('');
    const [isCommentVisible, setIsCommentVisible] = useState(false);
    const [checklistComments, setChecklistComments] = useState<ChecklistComment[]>([]);
    const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
    const [showAddComment, setShowAddComment] = useState(false);

    // Load checklist comments when member changes
    useMemo(() => {
        if (member) {
            setChecklistComments(getChecklistCommentsByMember(member.id));
        }
    }, [member]);

    // Get tasks grouped by category
    const taskGroups = useMemo(() => {
        if (!member?.taskInstances) return {};

        const groups: Record<string, { tasks: { instance: TaskInstance; task: Task }[] }> = {};

        member.taskInstances.forEach(instance => {
            const task = mockTasks.find(t => t.id === instance.taskId);
            if (task) {
                if (!groups[task.category]) {
                    groups[task.category] = { tasks: [] };
                }
                groups[task.category].tasks.push({ instance, task });
            }
        });

        return groups;
    }, [member]);

    const toggleGroup = (category: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const handleAddComment = () => {
        if (!newComment.trim() || !member) return;

        const comment: ChecklistComment = {
            id: `cc-${Date.now()}`,
            teamMemberId: member.id,
            projectId: member.projectId || '',
            text: newComment,
            authorId: 'hr-001',
            authorName: 'Current User (HR)',
            authorRole: 'HR_LEAD',
            isVisibleToMember: isCommentVisible,
            createdAt: new Date().toISOString(),
        };

        setChecklistComments(prev => [comment, ...prev]);
        setNewComment('');
        setIsCommentVisible(false);
        setShowAddComment(false);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCommentCount = (instance: TaskInstance): number => {
        return instance.comments?.length || 0;
    };

    if (!member) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`team-member-drawer ${isOpen ? 'open' : ''}`}>
                {/* Fixed Header */}
                <div className="drawer-header">
                    <div className="drawer-header-content">
                        <div className="member-avatar-lg">
                            {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div className="member-header-info">
                            <h2>{member.firstName} {member.lastName}</h2>
                            <div className="member-meta">
                                <Badge variant={getStatusVariant(member.status as TaskStatus)}>
                                    {member.status.replace(/_/g, ' ')}
                                </Badge>
                                <span className="meta-separator">•</span>
                                <span>{member.trade}</span>
                                <span className="meta-separator">•</span>
                                <span>{member.category.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                    <button className="drawer-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="drawer-scrollable-content">
                    {/* Quick Actions */}
                    <div className="drawer-quick-actions">
                        <Button variant="secondary" size="sm" leftIcon={<Mail size={14} />}>
                            Email
                        </Button>
                        <Button variant="secondary" size="sm" leftIcon={<Phone size={14} />}>
                            Call
                        </Button>
                        <Button variant="secondary" size="sm" leftIcon={<Send size={14} />}>
                            SMS
                        </Button>
                        <Button variant="secondary" size="sm" leftIcon={<MessageCircle size={14} />}>
                            Chat
                        </Button>
                    </div>

                    {/* Compact Progress Overview */}
                    <div className="drawer-progress-inline">
                        <div className="progress-inline-header">
                            <span className="progress-label">Progress</span>
                            <span className="progress-value-inline">{member.completedTasks}/{member.totalTasks} tasks • {member.progressPercentage}%</span>
                        </div>
                        <Progress value={member.progressPercentage} size="sm" />
                    </div>

                    {/* Collapsible Comments Section */}
                    <div className="drawer-comments-collapsible">
                        <button
                            className="comments-toggle-btn"
                            onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                        >
                            <div className="comments-toggle-left">
                                {isCommentsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <MessageSquare size={16} />
                                <span>Checklist Comments</span>
                                {checklistComments.length > 0 && (
                                    <span className="comment-count-badge">{checklistComments.length}</span>
                                )}
                            </div>
                            <button
                                className="add-comment-icon-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAddComment(!showAddComment);
                                    setIsCommentsExpanded(true);
                                }}
                                title="Add comment"
                            >
                                <Plus size={16} />
                            </button>
                        </button>

                        {isCommentsExpanded && (
                            <div className="comments-expanded-content">
                                {/* Add Comment Form */}
                                {showAddComment && (
                                    <div className="add-comment-compact">
                                        <textarea
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            rows={2}
                                        />
                                        <div className="comment-actions-compact">
                                            <label className="visibility-toggle-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={isCommentVisible}
                                                    onChange={(e) => setIsCommentVisible(e.target.checked)}
                                                />
                                                {isCommentVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                                <span>{isCommentVisible ? 'Visible' : 'Private'}</span>
                                            </label>
                                            <div className="comment-btns">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowAddComment(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={handleAddComment}
                                                    disabled={!newComment.trim()}
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Comments List */}
                                {checklistComments.length > 0 ? (
                                    <div className="comments-list-compact">
                                        {checklistComments.map(comment => (
                                            <div key={comment.id} className="comment-item-compact">
                                                <div className="comment-header-compact">
                                                    <span className="comment-author">{comment.authorName}</span>
                                                    <span className="comment-time">{formatDate(comment.createdAt)}</span>
                                                    {comment.isVisibleToMember ? (
                                                        <Eye size={12} className="visibility-icon visible" />
                                                    ) : (
                                                        <EyeOff size={12} className="visibility-icon private" />
                                                    )}
                                                </div>
                                                <p className="comment-text-compact">{comment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : !showAddComment && (
                                    <p className="no-comments-text">No comments yet</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Task Groups */}
                    <div className="drawer-task-groups">
                        <h3 className="drawer-section-title">Tasks by Category</h3>
                        {Object.entries(taskGroups).map(([category, { tasks }]) => {
                            const completedCount = tasks.filter(t => t.instance.status === 'COMPLETED').length;
                            const isExpanded = expandedGroups.has(category);

                            return (
                                <div key={category} className="drawer-task-group">
                                    <button
                                        className="drawer-group-header"
                                        onClick={() => toggleGroup(category)}
                                    >
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        <span className="drawer-group-name">{category}</span>
                                        <span className="drawer-group-count">{completedCount}/{tasks.length}</span>
                                    </button>

                                    {isExpanded && (
                                        <div className="drawer-task-list">
                                            {tasks.map(({ instance, task }) => (
                                                <div
                                                    key={instance.id}
                                                    className="drawer-task-item"
                                                    onClick={() => onOpenTaskDetail(instance, task)}
                                                >
                                                    <StatusIcon status={instance.status} />
                                                    <div className="drawer-task-type-badge" data-type={task.type}>
                                                        {TASK_TYPE_INFO[task.type]?.icon}
                                                    </div>
                                                    <div className="drawer-task-content">
                                                        <span className="drawer-task-name">{task.name}</span>
                                                        <span className="drawer-task-type-label">{task.type.replace('_', ' ')}</span>
                                                    </div>
                                                    <div className="drawer-task-actions">
                                                        {getCommentCount(instance) > 0 && (
                                                            <span className="drawer-comment-count">
                                                                <MessageSquare size={12} />
                                                                {getCommentCount(instance)}
                                                            </span>
                                                        )}
                                                        <Badge variant={getStatusVariant(instance.status)} size="sm">
                                                            {instance.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
