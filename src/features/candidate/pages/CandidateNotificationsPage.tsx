import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Bell,
    CheckCircle2,
    AlertTriangle,
    Info,
    Calendar,
    FileText,
    Clock,
    Sparkles,
    MessageCircle,
    User,
    Check,
    Trash2,
    BellOff
} from 'lucide-react';
import { mockTeamMembers } from '../../../data';

// Get a mock candidate for demo purposes
const mockCandidate = mockTeamMembers[0];

type NotificationType = 'info' | 'success' | 'warning' | 'reminder' | 'task';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
}

// Mock notifications
const initialNotifications: Notification[] = [
    {
        id: 'notif-001',
        type: 'warning',
        title: 'Drug Test Deadline Approaching',
        message: 'Your drug test appointment is scheduled for tomorrow at 9 AM. Please don\'t forget to bring a valid ID.',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        read: false,
        actionUrl: '/candidate/tasks/task-020',
        actionLabel: 'View Details'
    },
    {
        id: 'notif-002',
        type: 'success',
        title: 'Form I-9 Section 1 Completed',
        message: 'Great job! You\'ve successfully completed the Form I-9 Section 1. Your HR Lead has been notified.',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        read: false
    },
    {
        id: 'notif-003',
        type: 'info',
        title: 'New Message from HR Lead',
        message: `${mockCandidate.assignedProcessorName} sent you a new message regarding your onboarding tasks.`,
        timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
        read: false,
        actionUrl: '/candidate/chat',
        actionLabel: 'Open Chat'
    },
    {
        id: 'notif-004',
        type: 'reminder',
        title: 'W-4 Form Due Soon',
        message: 'Please complete your W-4 form within the next 2 days to avoid delays in your onboarding process.',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        read: true,
        actionUrl: '/candidate/tasks/task-001',
        actionLabel: 'Complete Now'
    },
    {
        id: 'notif-005',
        type: 'task',
        title: 'New Task Assigned',
        message: 'A new training task "OSHA 10 Training" has been assigned to you. Due date: Dec 22, 2025.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        read: true,
        actionUrl: '/candidate/tasks/task-030',
        actionLabel: 'View Task'
    },
    {
        id: 'notif-006',
        type: 'success',
        title: 'Welcome to the Team!',
        message: `Welcome to ${mockCandidate.projectName}! We're excited to have you on board. Complete your onboarding tasks to get started.`,
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
        read: true
    },
];

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case 'success': return CheckCircle2;
        case 'warning': return AlertTriangle;
        case 'reminder': return Calendar;
        case 'task': return FileText;
        default: return Info;
    }
};

const getNotificationColor = (type: NotificationType) => {
    switch (type) {
        case 'success': return 'success';
        case 'warning': return 'warning';
        case 'reminder': return 'accent';
        case 'task': return 'primary';
        default: return 'info';
    }
};

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

export function CandidateNotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(initialNotifications);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const unreadCount = notifications.filter(n => !n.read).length;
    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    return (
        <div className="candidate-notifications">
            {/* Header */}
            <header className="candidate-notifications-header">
                <button
                    className="candidate-v2-back-btn"
                    onClick={() => navigate('/candidate-v2')}
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="candidate-notifications-title-group">
                    <h1 className="candidate-notifications-title">Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="candidate-notifications-badge">{unreadCount} new</span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        className="candidate-notifications-mark-read"
                        onClick={markAllAsRead}
                        title="Mark all as read"
                    >
                        <Check size={20} />
                    </button>
                )}
            </header>

            {/* Filter Tabs */}
            <div className="candidate-notifications-filters">
                <button
                    className={`candidate-notifications-filter ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`candidate-notifications-filter ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
            </div>

            {/* Notifications List */}
            <div className="candidate-notifications-list">
                {filteredNotifications.length === 0 ? (
                    <div className="candidate-notifications-empty">
                        <BellOff size={48} />
                        <h3>{filter === 'unread' ? 'All caught up!' : 'No notifications'}</h3>
                        <p>{filter === 'unread' ? 'You have no unread notifications.' : 'You don\'t have any notifications yet.'}</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification, index) => {
                        const Icon = getNotificationIcon(notification.type);
                        const colorClass = getNotificationColor(notification.type);

                        return (
                            <div
                                key={notification.id}
                                className={`candidate-notification-item ${!notification.read ? 'unread' : ''}`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div
                                    className="candidate-notification-content"
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={`candidate-notification-icon ${colorClass}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="candidate-notification-body">
                                        <div className="candidate-notification-header">
                                            <h3 className="candidate-notification-title">{notification.title}</h3>
                                            <span className="candidate-notification-time">
                                                <Clock size={12} />
                                                {formatTimestamp(notification.timestamp)}
                                            </span>
                                        </div>
                                        <p className="candidate-notification-message">{notification.message}</p>
                                        {notification.actionLabel && (
                                            <span className="candidate-notification-action">
                                                {notification.actionLabel} →
                                            </span>
                                        )}
                                    </div>
                                    {!notification.read && (
                                        <div className="candidate-notification-unread-dot" />
                                    )}
                                </div>
                                <button
                                    className="candidate-notification-delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                    title="Delete notification"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })
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
                <button className="candidate-v2-nav-item active">
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
