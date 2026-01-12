import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Bell,
    Sparkles,
    FileText,
    MessageCircle,
    User,
    CheckCircle,
    XCircle,
    Info,
    Loader2,
    CheckCheck
} from 'lucide-react';
import { notificationsApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    taskInstanceId: string | null;
    taskName: string | null;
    isRead: boolean;
    createdAt: string | null;
}

export function CandidateNotificationsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.id) {
            loadNotifications();
        }
    }, [user?.id]);

    const loadNotifications = async () => {
        if (!user?.id) return;
        try {
            setIsLoading(true);
            const data = await notificationsApi.list(user.id);
            setNotifications(data);
            setError('');
        } catch (err) {
            console.error('Failed to load notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationsApi.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user?.id) return;
        try {
            await notificationsApi.markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TASK_APPROVED':
                return <CheckCircle size={20} className="notification-icon-approved" />;
            case 'TASK_REJECTED':
                return <XCircle size={20} className="notification-icon-rejected" />;
            default:
                return <Info size={20} className="notification-icon-info" />;
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="candidate-notifications">
            {/* Header */}
            <header className="candidate-notifications-header">
                <button
                    className="candidate-v2-back-btn"
                    onClick={() => navigate('/candidate')}
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="candidate-notifications-title-group">
                    <h1 className="candidate-notifications-title">Alerts</h1>
                    {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount} new</span>
                    )}
                </div>
                {notifications.length > 0 && unreadCount > 0 && (
                    <button
                        className="mark-all-read-btn"
                        onClick={handleMarkAllAsRead}
                    >
                        <CheckCheck size={16} />
                        Mark all read
                    </button>
                )}
            </header>

            {/* Notifications List */}
            <div className="candidate-notifications-list">
                {isLoading ? (
                    <div className="notifications-loading">
                        <Loader2 size={32} className="spin" />
                        <p>Loading notifications...</p>
                    </div>
                ) : error ? (
                    <div className="notifications-error">
                        <p>{error}</p>
                        <button onClick={loadNotifications}>Retry</button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notifications-empty">
                        <Bell size={48} style={{ color: '#8792a2', marginBottom: '16px' }} />
                        <h2>No Notifications</h2>
                        <p>You're all caught up! Check back later for updates.</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                            onClick={() => {
                                if (!notification.isRead) {
                                    handleMarkAsRead(notification.id);
                                }
                                // If it has a task, navigate to tasks page
                                if (notification.taskInstanceId) {
                                    navigate('/candidate/tasks');
                                }
                            }}
                        >
                            <div className="notification-icon-wrapper">
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div className="notification-content">
                                <div className="notification-header">
                                    <span className="notification-title">{notification.title}</span>
                                    <span className="notification-time">{formatDate(notification.createdAt)}</span>
                                </div>
                                {notification.message && (
                                    <p className="notification-message">{notification.message}</p>
                                )}
                                {notification.taskName && (
                                    <span className="notification-task-name">
                                        <FileText size={12} /> {notification.taskName}
                                    </span>
                                )}
                            </div>
                            {!notification.isRead && <div className="unread-dot" />}
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="candidate-v2-bottom-nav">
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate')}
                >
                    <Sparkles size={22} />
                    <span>Home</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate/tasks')}
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
