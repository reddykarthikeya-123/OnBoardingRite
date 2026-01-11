import { useState, useEffect } from 'react';
import { ChevronRight, Mail, Phone, MapPin, Loader2, FileText } from 'lucide-react';
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
}

interface ProjectSubmissionGroup {
    projectId: string;
    projectName: string;
    role: string | null;
    submissions: SubmittedTask[];
}

export function CandidateProfilePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [submissions, setSubmissions] = useState<ProjectSubmissionGroup[]>([]);
    const [viewTask, setViewTask] = useState<SubmittedTask | null>(null);

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

    if (loading) {
        return (
            <div className="candidate-profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 className="spin" size={32} />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="candidate-profile-page">
                <p>Unable to load profile</p>
            </div>
        );
    }

    return (
        <div className="candidate-profile-page">
            {/* Profile Header */}
            <div className="profile-hero">
                <div className="profile-avatar">
                    <span className="profile-avatar-text">
                        {getInitials()}
                    </span>
                </div>
                <h1 className="profile-name">
                    {profileData.firstName} {profileData.lastName}
                </h1>
                {profileData.trade && (
                    <span className="profile-trade">{profileData.trade}</span>
                )}
            </div>

            {/* Contact Information */}
            <div className="profile-section">
                <h2 className="profile-section-title">Contact Information</h2>
                <div className="profile-card">
                    <div className="profile-card-item">
                        <Mail size={18} className="profile-card-icon" />
                        <div className="profile-card-content">
                            <span className="profile-card-label">Email</span>
                            <span className="profile-card-value">{profileData.email}</span>
                        </div>
                    </div>
                    {profileData.phone && (
                        <div className="profile-card-item">
                            <Phone size={18} className="profile-card-icon" />
                            <div className="profile-card-content">
                                <span className="profile-card-label">Phone</span>
                                <span className="profile-card-value">{profileData.phone}</span>
                            </div>
                        </div>
                    )}
                    {profileData.location && (
                        <div className="profile-card-item">
                            <MapPin size={18} className="profile-card-icon" />
                            <div className="profile-card-content">
                                <span className="profile-card-label">Location</span>
                                <span className="profile-card-value">{profileData.location}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Submitted Forms Section */}
            <div className="profile-section">
                <h2 className="profile-section-title">Submitted Forms</h2>
                <div className="profile-card">
                    {submissions.length === 0 ? (
                        <div className="profile-card-item">
                            <div className="profile-card-content">
                                <span className="profile-card-value" style={{ color: '#697386', fontStyle: 'italic' }}>
                                    No submitted forms yet
                                </span>
                            </div>
                        </div>
                    ) : (
                        submissions.map((group) => (
                            <div key={group.projectId}>
                                {submissions.length > 1 && (
                                    <div className="profile-list-header" style={{ padding: '8px 0', color: '#8792a2', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                        {group.projectName}
                                    </div>
                                )}

                                {group.submissions.map((task, index) => (
                                    <div
                                        key={task.id}
                                        className="profile-card-item clickable"
                                        onClick={() => setViewTask(task)}
                                        style={{
                                            borderBottom: index < group.submissions.length - 1 ? '1px solid #f0f0f0' : 'none',
                                            cursor: 'pointer',
                                            padding: '12px 0'
                                        }}
                                    >
                                        <FileText size={18} className="profile-card-icon" style={{ color: '#4caf50' }} />
                                        <div className="profile-card-content" style={{ flex: 1 }}>
                                            <span className="profile-card-label">
                                                {group.projectName} • {task.submittedAt ? new Date(task.submittedAt).toLocaleDateString() : 'Completed'}
                                            </span>
                                            <span className="profile-card-value" style={{ color: '#1a1f36' }}>{task.taskName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', color: '#697386' }}>
                                            <span style={{ fontSize: '13px', marginRight: '8px' }}>View</span>
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Settings Menu */}
            <div className="profile-section">
                <h2 className="profile-section-title">Settings</h2>
                <div className="profile-menu">
                    <button className="profile-menu-item">
                        <span>Notification Preferences</span>
                        <ChevronRight size={18} />
                    </button>
                    <button className="profile-menu-item">
                        <span>Language</span>
                        <div className="profile-menu-value">
                            <span>English</span>
                            <ChevronRight size={18} />
                        </div>
                    </button>
                    <button className="profile-menu-item">
                        <span>Help & Support</span>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

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
        </div>
    );
}
