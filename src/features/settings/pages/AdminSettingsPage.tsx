import { useState, useEffect } from 'react';
import {
    User,
    Lock,
    UserPlus,
    Save,
    X,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    Check,
    AlertCircle,
    Shield,
    Mail,
    Calendar,
    MoreVertical
} from 'lucide-react';
import { Card, CardBody, Button, Badge, Modal } from '../../../components/ui';
import { adminApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: string | null;
}

interface ToastNotification {
    id: string;
    message: string;
    type: 'success' | 'error';
}

type SettingsSection = 'profile' | 'security' | 'admins';

export function AdminSettingsPage() {
    const { user, token } = useAuth();

    // Active section
    const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

    // Profile state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Admin users state
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [adminsLoading, setAdminsLoading] = useState(false);

    // Create admin modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminFirstName, setNewAdminFirstName] = useState('');
    const [newAdminLastName, setNewAdminLastName] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Toast notifications
    const [toasts, setToasts] = useState<ToastNotification[]>([]);

    // Load profile on mount
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
        }
    }, [user]);

    // Load admin users when tab is active
    useEffect(() => {
        if (activeSection === 'admins' && token) {
            loadAdminUsers();
        }
    }, [activeSection, token]);

    const showToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const loadAdminUsers = async () => {
        if (!token) return;
        setAdminsLoading(true);
        try {
            const users = await adminApi.listUsers(token);
            setAdminUsers(users);
        } catch (err: any) {
            showToast(err.message || 'Failed to load admin users', 'error');
        } finally {
            setAdminsLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!token) return;
        setProfileLoading(true);
        try {
            await adminApi.updateProfile(token, { firstName, lastName });
            showToast('Profile updated successfully', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to update profile', 'error');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!token) return;
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        setPasswordLoading(true);
        try {
            await adminApi.changePassword(token, {
                currentPassword,
                newPassword,
                confirmPassword
            });
            showToast('Password changed successfully', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            showToast(err.message || 'Failed to change password', 'error');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!token) return;
        if (!newAdminEmail || !newAdminFirstName || !newAdminLastName || !newAdminPassword) {
            showToast('Please fill all fields', 'error');
            return;
        }
        if (newAdminPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        setCreateLoading(true);
        try {
            await adminApi.createUser(token, {
                email: newAdminEmail,
                firstName: newAdminFirstName,
                lastName: newAdminLastName,
                password: newAdminPassword
            });
            showToast('Admin user created successfully', 'success');
            setShowCreateModal(false);
            setNewAdminEmail('');
            setNewAdminFirstName('');
            setNewAdminLastName('');
            setNewAdminPassword('');
            loadAdminUsers();
        } catch (err: any) {
            showToast(err.message || 'Failed to create admin user', 'error');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeleteAdmin = async () => {
        if (!token || !deleteTarget) return;
        setDeleteLoading(true);
        try {
            await adminApi.deleteUser(token, deleteTarget.id);
            showToast('Admin user deleted successfully', 'success');
            setDeleteTarget(null);
            loadAdminUsers();
        } catch (err: any) {
            showToast(err.message || 'Failed to delete admin user', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    const sections = [
        { id: 'profile' as const, label: 'Profile', icon: <User size={18} />, description: 'Manage your account details' },
        { id: 'security' as const, label: 'Security', icon: <Lock size={18} />, description: 'Update your password' },
        { id: 'admins' as const, label: 'Admin Users', icon: <Shield size={18} />, description: 'Manage administrators' },
    ];

    const userInitials = user
        ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
        : 'U';

    return (
        <div className="page-enter">
            {/* Toast Notifications */}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast toast-${toast.type === 'success' ? 'success' : 'danger'}`}>
                            <div className="toast-content">
                                {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                <span className="toast-message">{toast.message}</span>
                            </div>
                            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-top">
                    <div>
                        <h1 className="page-title">Settings</h1>
                        <p className="page-description">Manage your account preferences and admin users</p>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row mb-6">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-600)' }}>
                        <User size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{user?.firstName} {user?.lastName}</div>
                        <div className="stat-label">Logged in as</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-600)' }}>
                        <Mail size={20} />
                    </div>
                    <div>
                        <div className="stat-value" style={{ fontSize: '14px' }}>{user?.email}</div>
                        <div className="stat-label">Email</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-secondary-100)', color: 'var(--color-secondary-600)' }}>
                        <Shield size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{adminUsers.length || '—'}</div>
                        <div className="stat-label">Total Admins</div>
                    </div>
                </div>
            </div>

            {/* Settings Layout */}
            <div className="flex gap-6">
                {/* Sidebar Navigation */}
                <div style={{ width: '280px', flexShrink: 0 }}>
                    <Card>
                        <CardBody style={{ padding: '8px' }}>
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '14px 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: activeSection === section.id ? 'var(--color-primary-50)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'left',
                                        marginBottom: '4px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeSection !== section.id) {
                                            e.currentTarget.style.background = 'var(--color-neutral-50)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeSection !== section.id) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: activeSection === section.id ? 'var(--color-primary-100)' : 'var(--color-neutral-100)',
                                        color: activeSection === section.id ? 'var(--color-primary-600)' : 'var(--color-neutral-500)'
                                    }}>
                                        {section.icon}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            color: activeSection === section.id ? 'var(--color-primary-700)' : 'var(--color-text-primary)'
                                        }}>
                                            {section.label}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: 'var(--color-text-secondary)',
                                            marginTop: '2px'
                                        }}>
                                            {section.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </CardBody>
                    </Card>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1 }}>
                    {/* Profile Section */}
                    {activeSection === 'profile' && (
                        <Card>
                            <CardBody style={{ padding: '32px' }}>
                                {/* Profile Header with Avatar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border-light)' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '28px',
                                        fontWeight: 700,
                                        boxShadow: '0 4px 12px rgba(var(--color-primary-500-rgb), 0.3)'
                                    }}>
                                        {userInitials}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
                                            {user?.firstName} {user?.lastName}
                                        </h2>
                                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Mail size={14} />
                                            {user?.email}
                                        </p>
                                        <Badge variant="primary" style={{ marginTop: '8px' }}>Administrator</Badge>
                                    </div>
                                </div>

                                {/* Form */}
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Personal Information</h3>
                                <div style={{ maxWidth: '500px' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className="input"
                                            value={user?.email || ''}
                                            disabled
                                            style={{ background: 'var(--color-neutral-50)', cursor: 'not-allowed' }}
                                        />
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                                            Email address cannot be changed
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        onClick={handleUpdateProfile}
                                        disabled={profileLoading}
                                        leftIcon={profileLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    >
                                        {profileLoading ? 'Saving Changes...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Security Section */}
                    {activeSection === 'security' && (
                        <Card>
                            <CardBody style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border-light)' }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, var(--color-warning-400), var(--color-warning-500))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                                    }}>
                                        <Lock size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Security Settings</h2>
                                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                            Manage your password and security preferences
                                        </p>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Change Password</h3>
                                <div style={{ maxWidth: '400px' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                            Current Password
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                className="input"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter current password"
                                                style={{ paddingRight: '44px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--color-text-muted)',
                                                    padding: '4px'
                                                }}
                                            >
                                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                            New Password
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                className="input"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                style={{ paddingRight: '44px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--color-text-muted)',
                                                    padding: '4px'
                                                }}
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                                            Must be at least 6 characters
                                        </span>
                                    </div>

                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                            Confirm New Password
                                        </label>
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            className="input"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                        />
                                    </div>

                                    <Button
                                        variant="primary"
                                        onClick={handleChangePassword}
                                        disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                                        leftIcon={passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                    >
                                        {passwordLoading ? 'Updating Password...' : 'Update Password'}
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Admin Users Section */}
                    {activeSection === 'admins' && (
                        <Card>
                            <CardBody style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border-light)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, var(--color-accent-400), var(--color-accent-500))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                        }}>
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Admin Users</h2>
                                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                                {adminUsers.length} administrator{adminUsers.length !== 1 ? 's' : ''} with system access
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="primary"
                                        leftIcon={<UserPlus size={16} />}
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        Add Admin
                                    </Button>
                                </div>

                                {adminsLoading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                                        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary-500)' }} />
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {adminUsers.map(admin => (
                                            <div
                                                key={admin.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '16px 20px',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--color-border-light)',
                                                    background: user?.id === admin.id ? 'var(--color-primary-50)' : 'white',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{
                                                        width: '44px',
                                                        height: '44px',
                                                        borderRadius: '10px',
                                                        background: user?.id === admin.id
                                                            ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))'
                                                            : 'var(--color-neutral-100)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: user?.id === admin.id ? 'white' : 'var(--color-neutral-600)',
                                                        fontWeight: 600,
                                                        fontSize: '14px'
                                                    }}>
                                                        {admin.firstName?.[0]}{admin.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {admin.firstName} {admin.lastName}
                                                            {user?.id === admin.id && (
                                                                <Badge variant="primary" style={{ fontSize: '10px', padding: '2px 6px' }}>You</Badge>
                                                            )}
                                                        </div>
                                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Mail size={12} />
                                                            {admin.email}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {admin.createdAt && (
                                                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={12} />
                                                            {new Date(admin.createdAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    <Badge variant={admin.isActive ? 'success' : 'secondary'}>
                                                        {admin.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    {user?.id !== admin.id && (
                                                        <button
                                                            onClick={() => setDeleteTarget(admin)}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'var(--color-danger-500)',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'var(--color-danger-50)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {adminUsers.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
                                                <Shield size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                                <p>No admin users found</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>

            {/* Create Admin Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Admin User"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateAdmin}
                            disabled={createLoading}
                            leftIcon={createLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        >
                            {createLoading ? 'Creating...' : 'Create Admin'}
                        </Button>
                    </>
                }
            >
                <div>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                        Create a new administrator account with full system access.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                Email Address *
                            </label>
                            <input
                                type="email"
                                className="input"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newAdminFirstName}
                                    onChange={(e) => setNewAdminFirstName(e.target.value)}
                                    placeholder="First name"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newAdminLastName}
                                    onChange={(e) => setNewAdminLastName(e.target.value)}
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                Password *
                            </label>
                            <input
                                type="password"
                                className="input"
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                placeholder="At least 6 characters"
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => !deleteLoading && setDeleteTarget(null)}
                title="Delete Admin User"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteAdmin}
                            disabled={deleteLoading}
                            leftIcon={deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        >
                            {deleteLoading ? 'Deleting...' : 'Delete Admin'}
                        </Button>
                    </>
                }
            >
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--color-danger-50)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <Trash2 size={24} style={{ color: 'var(--color-danger-500)' }} />
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                        Are you sure you want to delete
                    </p>
                    <p style={{ fontWeight: 600, fontSize: '16px' }}>
                        {deleteTarget?.firstName} {deleteTarget?.lastName}?
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '12px' }}>
                        This action cannot be undone.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
