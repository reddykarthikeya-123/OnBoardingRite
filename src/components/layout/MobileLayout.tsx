import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, User, MessageCircle, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="mobile-nav-label">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
