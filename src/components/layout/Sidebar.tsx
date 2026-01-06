import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ListChecks,
    ClipboardList,
    FolderKanban,
    Users,
    Settings,
    Zap,
    Filter,
    PanelLeftClose,
    PanelLeft
} from 'lucide-react';

interface NavItem {
    to: string;
    icon: React.ReactNode;
    label: string;
    badge?: string;
}

const mainNavItems: NavItem[] = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/projects', icon: <FolderKanban size={20} />, label: 'Projects', badge: '5' },
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

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Zap size={24} color="white" />
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
                    {mainNavItems.map((item) => (
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
                            {item.badge && (
                                <span className="sidebar-nav-item-badge">{item.badge}</span>
                            )}
                        </NavLink>
                    ))}
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
                    <div className="avatar avatar-sm">SJ</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">Sarah Johnson</div>
                        <div className="sidebar-user-role">HR Lead</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
