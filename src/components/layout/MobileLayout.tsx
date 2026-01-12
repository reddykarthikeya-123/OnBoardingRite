import { ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, User, MessageCircle, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsApi } from '../../services/api';

interface MobileLayoutProps {
    children: ReactNode;
}

const NAV_ITEMS = [
    { path: '/candidate', icon: Home, label: 'Home' },
    { path: '/candidate/tasks', icon: ClipboardList, label: 'Tasks' },
    { path: '/candidate/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/candidate/notifications', icon: Bell, label: 'Alerts' },
    { path: '/candidate/profile', icon: User, label: 'Profile' },
];

export function MobileLayout({ children }: MobileLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                if (user?.id) {
                    const response = await notificationsApi.getUnreadCount(user.id);
                    setUnreadCount(response.unreadCount);
                }
            } catch (err) {
                console.error('Failed to fetch unread count:', err);
            }
        };

        fetchUnreadCount();
        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user?.id, location.pathname]); // Update when changing pages too

    const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
        : 'User';

    return (
        <div className="mobile-layout">
            {/* Header with user info and logout */}
            <header className="mobile-header">
                <div className="mobile-header-user">
                    <span className="mobile-header-greeting">Hello, {userName.split(' ')[0]}</span>
                </div>
                <button
                    className="mobile-logout-btn"
                    onClick={logout}
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            </header>

            <main className="mobile-content">
                {children}
            </main>

            <nav className="mobile-bottom-nav">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/candidate' && location.pathname.startsWith(item.path));
                    const Icon = item.icon;
                    const isAlerts = item.label === 'Alerts';

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                            style={{ position: 'relative' }}
                        >
                            <div style={{ position: 'relative' }}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                {isAlerts && unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        right: '-6px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        minWidth: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 2px',
                                        border: '2px solid white'
                                    }}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="mobile-nav-label">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
