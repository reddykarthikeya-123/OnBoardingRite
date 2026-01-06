import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, User, MessageCircle, Bell } from 'lucide-react';

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

    return (
        <div className="mobile-layout">
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
