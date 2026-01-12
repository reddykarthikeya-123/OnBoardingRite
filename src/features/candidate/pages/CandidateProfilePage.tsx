import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    Briefcase,
    Calendar,
    Loader2,
    FileText,
    CheckCircle2,
    ChevronRight,
    Sparkles,
    MessageCircle,
    User,
    Bell,
    LogOut,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { Modal } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { candidateApi } from '../../../services/api';
import { SubmittedTaskViewer } from '../components/SubmittedTaskViewer';

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    trade: string | null;
    projectName: string | null;
    startDate: string | null;
    location: string | null;
}

interface DocumentInfo {
    id: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    documentSide?: string;
}

interface SubmittedTask {
    id: string;
    taskId: string;
    taskName: string;
    category: string | null;
    submittedAt: string | null;
    formData: Record<string, any> | null;
    documents?: DocumentInfo[];
    reviewStatus?: string;
    adminRemarks?: string;
}

interface ProjectSubmissionGroup {
    projectId: string;
    projectName: string;
    role: string | null;
    submissions: SubmittedTask[];
}

const API_BASE = 'http://localhost:8000/api/v1';

export function CandidateProfilePage() {
    const navigate = useNavigate();
    const { user, logout, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [submissions, setSubmissions] = useState<ProjectSubmissionGroup[]>([]);
    const [viewTask, setViewTask] = useState<SubmittedTask | null>(null);

    // Change password state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (user) {
            setProfileData({
                firstName: user.firstName || 'User',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: null,
                trade: null,
                projectName: user.assignmentId ? 'Current Project' : null,
                startDate: null,
                location: null,
            });

            // Fetch submitted tasks
            try {
                const data = await candidateApi.getSubmittedTasks(user.id);
                setSubmissions(data);

                // Update profile data with info from first project if available
                if (data.length > 0) {
                    const firstProject = data[0];
                    setProfileData(prev => prev ? ({
                        ...prev,
                        projectName: firstProject.projectName,
                        trade: firstProject.role
                    }) : null);
                }
            } catch (err) {
                console.error('Failed to load submissions:', err);
            }
        }
        setLoading(false);
    };

    const getInitials = () => {
        const first = profileData?.firstName?.[0] || 'U';
        const last = profileData?.lastName?.[0] || '';
        return (first + last).toUpperCase();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess(false);

        // Validation
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordError('All fields are required');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        setChangingPassword(true);

        try {
            const response = await fetch(`${API_BASE}/auth/candidate/change-password?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordForm)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to change password');
            }

            setPasswordSuccess(true);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

            // Close modal after success
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess(false);
            }, 2000);
        } catch (err: any) {
            setPasswordError(err.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const totalSubmissions = submissions.reduce((acc, group) => acc + group.submissions.length, 0);

    if (loading) {
        return (
            <div className="candidate-profile-v2">
                <div className="profile-v2-loading">
                    <Loader2 className="spin" size={32} />
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="candidate-profile-v2">
                <div className="profile-v2-error">
                    <p>Unable to load profile</p>
                </div>
            </div>
        );
    }

    return (
        <div className="candidate-profile-v2">
            {/* Premium Hero Header with Gradient */}
            <div className="profile-v2-hero">
                <div className="profile-v2-hero-bg" />
                <div className="profile-v2-hero-content">
                    <div className="profile-v2-avatar">
                        <span>{getInitials()}</span>
                        <div className="profile-v2-avatar-ring" />
                    </div>
                    <h1 className="profile-v2-name">
                        {profileData.firstName} {profileData.lastName}
                    </h1>
                    {profileData.trade && (
                        <div className="profile-v2-trade-badge">
                            <Briefcase size={14} />
                            <span>{profileData.trade}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="profile-v2-stats">
                <div className="profile-v2-stat-card">
                    <div className="profile-v2-stat-icon forms">
                        <FileText size={20} />
                    </div>
                    <div className="profile-v2-stat-info">
                        <span className="profile-v2-stat-value">{totalSubmissions}</span>
                        <span className="profile-v2-stat-label">Submitted</span>
                    </div>
                </div>
                <div className="profile-v2-stat-card">
                    <div className="profile-v2-stat-icon completed">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="profile-v2-stat-info">
                        <span className="profile-v2-stat-value">{totalSubmissions}</span>
                        <span className="profile-v2-stat-label">Completed</span>
                    </div>
                </div>
            </div>

            {/* Contact & Project Info */}
            <section className="profile-v2-section">
                <h2 className="profile-v2-section-title">
                    <span>My Information</span>
                </h2>
                <div className="profile-v2-info-card">
                    <div className="profile-v2-info-row">
                        <div className="profile-v2-info-icon email">
                            <Mail size={16} />
                        </div>
                        <div className="profile-v2-info-content">
                            <span className="profile-v2-info-label">Email</span>
                            <span className="profile-v2-info-value">{profileData.email}</span>
                        </div>
                    </div>
                    {profileData.projectName && (
                        <div className="profile-v2-info-row">
                            <div className="profile-v2-info-icon project">
                                <Briefcase size={16} />
                            </div>
                            <div className="profile-v2-info-content">
                                <span className="profile-v2-info-label">Current Project</span>
                                <span className="profile-v2-info-value">{profileData.projectName}</span>
                            </div>
                        </div>
                    )}
                    {profileData.startDate && (
                        <div className="profile-v2-info-row">
                            <div className="profile-v2-info-icon date">
                                <Calendar size={16} />
                            </div>
                            <div className="profile-v2-info-content">
                                <span className="profile-v2-info-label">Start Date</span>
                                <span className="profile-v2-info-value">
                                    {new Date(profileData.startDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Submitted Forms - Functional */}
            <section className="profile-v2-section">
                <h2 className="profile-v2-section-title">
                    <span>Submitted Forms</span>
                    {totalSubmissions > 0 && (
                        <span className="profile-v2-badge">{totalSubmissions}</span>
                    )}
                </h2>
                <div className="profile-v2-submissions">
                    {submissions.length === 0 ? (
                        <div className="profile-v2-empty">
                            <FileText size={40} />
                            <p>No submitted forms yet</p>
                            <span>Complete your tasks to see them here</span>
                        </div>
                    ) : (
                        submissions.map((group) => (
                            <div key={group.projectId} className="profile-v2-submission-group">
                                {submissions.length > 1 && (
                                    <div className="profile-v2-group-header">
                                        <Briefcase size={14} />
                                        <span>{group.projectName}</span>
                                    </div>
                                )}
                                {group.submissions.map((task) => (
                                    <button
                                        key={task.id}
                                        className="profile-v2-submission-item"
                                        onClick={() => setViewTask(task)}
                                    >
                                        <div className={`profile-v2-submission-icon ${task.reviewStatus === 'APPROVED' ? 'approved' :
                                                task.reviewStatus === 'REJECTED' ? 'rejected' : ''
                                            }`}>
                                            {task.reviewStatus === 'APPROVED' ? (
                                                <CheckCircle size={18} />
                                            ) : task.reviewStatus === 'REJECTED' ? (
                                                <XCircle size={18} />
                                            ) : (
                                                <AlertCircle size={18} />
                                            )}
                                        </div>
                                        <div className="profile-v2-submission-content">
                                            <span className="profile-v2-submission-name">{task.taskName}</span>
                                            <span className="profile-v2-submission-date">
                                                {task.reviewStatus === 'APPROVED' ? 'Approved' :
                                                    task.reviewStatus === 'REJECTED' ? 'Rejected - Resubmit' :
                                                        task.submittedAt
                                                            ? new Date(task.submittedAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })
                                                            : 'Pending Review'}
                                            </span>
                                        </div>
                                        <ChevronRight size={18} className="profile-v2-submission-arrow" />
                                    </button>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Account Actions */}
            <section className="profile-v2-section">
                <h2 className="profile-v2-section-title">
                    <span>Account</span>
                </h2>

                {/* Change Password Button */}
                <button
                    className="profile-v2-action-btn"
                    onClick={() => setShowPasswordModal(true)}
                >
                    <div className="profile-v2-action-icon">
                        <Lock size={18} />
                    </div>
                    <span>Change Password</span>
                    <ChevronRight size={18} className="profile-v2-action-arrow" />
                </button>

                {/* Logout Button */}
                <button className="profile-v2-logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </section>

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
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate/notifications')}
                >
                    <Bell size={22} />
                    <span>Alerts</span>
                </button>
                <button className="candidate-v2-nav-item active">
                    <User size={22} />
                    <span>Profile</span>
                </button>
            </nav>

            {/* Task Viewer Modal */}
            <Modal
                isOpen={!!viewTask}
                onClose={() => setViewTask(null)}
                title={viewTask?.taskName || 'Submitted Form'}
                size="lg"
            >
                {viewTask && (
                    <SubmittedTaskViewer
                        taskName={viewTask.taskName}
                        submittedAt={viewTask.submittedAt}
                        formData={viewTask.formData || {}}
                        onClose={() => setViewTask(null)}
                        documents={viewTask.documents}
                    />
                )}
            </Modal>

            {/* Change Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                title="Change Password"
                size="sm"
            >
                <div className="change-password-form">
                    {passwordSuccess ? (
                        <div className="change-password-success">
                            <CheckCircle2 size={48} />
                            <p>Password changed successfully!</p>
                        </div>
                    ) : (
                        <>
                            {passwordError && (
                                <div className="change-password-error">
                                    {passwordError}
                                </div>
                            )}

                            <div className="change-password-field">
                                <label>Current Password</label>
                                <div className="change-password-input-wrapper">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        className="change-password-toggle"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                    >
                                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="change-password-field">
                                <label>New Password</label>
                                <div className="change-password-input-wrapper">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                        placeholder="Enter new password (min 6 characters)"
                                    />
                                    <button
                                        type="button"
                                        className="change-password-toggle"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                    >
                                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="change-password-field">
                                <label>Confirm New Password</label>
                                <div className="change-password-input-wrapper">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        className="change-password-toggle"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                    >
                                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                className="change-password-submit"
                                onClick={handleChangePassword}
                                disabled={changingPassword}
                            >
                                {changingPassword ? (
                                    <>
                                        <Loader2 size={18} className="spin" />
                                        <span>Changing...</span>
                                    </>
                                ) : (
                                    <span>Change Password</span>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
