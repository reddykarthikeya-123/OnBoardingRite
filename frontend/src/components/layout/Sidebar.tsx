import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ListChecks,
    ClipboardList,
    FolderKanban,
    Users,
    Settings,
    Filter,
    PanelLeftClose,
    PanelLeft,
    LogOut
} from 'lucide-react';
import { projectsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
    to: string;
    icon: React.ReactNode;
    label: string;
    badge?: string;
}

const mainNavItems: NavItem[] = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/projects', icon: <FolderKanban size={20} />, label: 'Projects', badge: '...' },
    { to: '/templates', icon: <ListChecks size={20} />, label: 'Templates' },
    { to: '/tasks', icon: <ClipboardList size={20} />, label: 'Task Library' },
    { to: '/eligibility-rules', icon: <Filter size={20} />, label: 'Eligibility Rules' },
];

const secondaryNavItems: NavItem[] = [
    { to: '/team-members', icon: <Users size={20} />, label: 'Team Members' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [projectCount, setProjectCount] = useState<number | null>(null);
    const location = useLocation();
    const { user, logout } = useAuth();

    useEffect(() => {
        const fetchProjectCount = async () => {
            try {
                // Fetch all projects count (removed status: 'ACTIVE' filter)
                const result = await projectsApi.list();
                // If API returns array directly
                if (Array.isArray(result)) {
                    setProjectCount(result.length);
                }
                // If API returns paginated response { items: [], total: ... }
                else if (result && typeof result === 'object' && 'total' in result) {
                    setProjectCount((result as any).total);
                }
                // Fallback for active filter
                else if (result && (result as any).items) {
                    setProjectCount((result as any).items.length);
                }
            } catch (error) {
                console.error('Failed to fetch project count:', error);
                setProjectCount(null);
            }
        };

        fetchProjectCount();

        // Refresh count when navigating to projects page (in case of deletions/additions)
        if (location.pathname === '/projects' || location.pathname === '/dashboard') {
            fetchProjectCount();
        }
    }, [location.pathname]);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const userInitials = user
        ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
        : 'U';
    const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
        : 'User';

    return (
        <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <img src="/logo.png" alt="OnboardRite" className="sidebar-logo-img" />
                    </div>
                    <div className="sidebar-logo-text">
                        OnboardRite
                    </div>
                </div>
                <button
                    className="sidebar-toggle-btn"
                    onClick={toggleSidebar}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-nav-section">
                    <div className="sidebar-nav-title">Main Menu</div>
                    {mainNavItems.map((item) => {
                        // Dynamic badge logic
                        let badgeValue = item.badge;
                        if (item.label === 'Projects' && projectCount !== null) {
                            badgeValue = projectCount.toString();
                        } else if (item.label === 'Projects' && projectCount === null && item.badge === '...') {
                            badgeValue = undefined; // Don't show badge if loading failed or init
                        }

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                                }
                                title={isCollapsed ? item.label : undefined}
                            >
                                <span className="sidebar-nav-item-icon">{item.icon}</span>
                                <span className="sidebar-nav-item-text">{item.label}</span>
                                {badgeValue && (
                                    <span className="sidebar-nav-item-badge">{badgeValue}</span>
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                <div className="sidebar-nav-section">
                    <div className="sidebar-nav-title">Management</div>
                    {secondaryNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${isActive ? 'active' : ''}`
                            }
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className="sidebar-nav-item-icon">{item.icon}</span>
                            <span className="sidebar-nav-item-text">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="avatar avatar-sm">{userInitials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{userName}</div>
                        <div className="sidebar-user-role">{user?.role || 'Admin'}</div>
                    </div>
                </div>
                <button
                    className="sidebar-logout-btn"
                    onClick={logout}
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}

