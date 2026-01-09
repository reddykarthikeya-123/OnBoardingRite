import { useState, useEffect } from 'react';
import { ChevronRight, Mail, Phone, MapPin, Briefcase, Building, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

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

export function CandidateProfilePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        // For now, use the user data from auth context
        // In the future, this could fetch more details from an API
        if (user) {
            setProfileData({
                firstName: user.firstName || 'User',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: null,  // Would come from API
                trade: null,  // Would come from API
                projectName: null,  // Would come from API
                startDate: null,  // Would come from API
                location: null,  // Would come from API
            });
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

            {/* Project Assignment - Only show if data exists */}
            {profileData.projectName && (
                <div className="profile-section">
                    <h2 className="profile-section-title">Project Assignment</h2>
                    <div className="profile-card">
                        <div className="profile-card-item">
                            <Building size={18} className="profile-card-icon" />
                            <div className="profile-card-content">
                                <span className="profile-card-label">Project</span>
                                <span className="profile-card-value">{profileData.projectName}</span>
                            </div>
                        </div>
                        {profileData.trade && (
                            <div className="profile-card-item">
                                <Briefcase size={18} className="profile-card-icon" />
                                <div className="profile-card-content">
                                    <span className="profile-card-label">Trade</span>
                                    <span className="profile-card-value">{profileData.trade}</span>
                                </div>
                            </div>
                        )}
                        {profileData.startDate && (
                            <div className="profile-card-item">
                                <Calendar size={18} className="profile-card-icon" />
                                <div className="profile-card-content">
                                    <span className="profile-card-label">Start Date</span>
                                    <span className="profile-card-value">{profileData.startDate}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
        </div>
    );
}
