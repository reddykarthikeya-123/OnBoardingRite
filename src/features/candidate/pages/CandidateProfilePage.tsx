import { ChevronRight, Mail, Phone, MapPin, Briefcase, Building, Calendar } from 'lucide-react';
import { mockTeamMembers } from '../../../data';

const mockCandidate = mockTeamMembers[0];

export function CandidateProfilePage() {

    return (
        <div className="candidate-profile-page">
            {/* Profile Header */}
            <div className="profile-hero">
                <div className="profile-avatar">
                    <span className="profile-avatar-text">
                        {mockCandidate.firstName[0]}{mockCandidate.lastName[0]}
                    </span>
                </div>
                <h1 className="profile-name">
                    {mockCandidate.firstName} {mockCandidate.lastName}
                </h1>
                <span className="profile-trade">{mockCandidate.trade}</span>
            </div>

            {/* Info Cards */}
            <div className="profile-section">
                <h2 className="profile-section-title">Contact Information</h2>
                <div className="profile-card">
                    <div className="profile-card-item">
                        <Mail size={18} className="profile-card-icon" />
                        <div className="profile-card-content">
                            <span className="profile-card-label">Email</span>
                            <span className="profile-card-value">{mockCandidate.email}</span>
                        </div>
                    </div>
                    <div className="profile-card-item">
                        <Phone size={18} className="profile-card-icon" />
                        <div className="profile-card-content">
                            <span className="profile-card-label">Phone</span>
                            <span className="profile-card-value">{mockCandidate.phone}</span>
                        </div>
                    </div>
                    <div className="profile-card-item">
                        <MapPin size={18} className="profile-card-icon" />
                        <div className="profile-card-content">
                            <span className="profile-card-label">Location</span>
                            <span className="profile-card-value">Texas</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-section">
                <h2 className="profile-section-title">Project Assignment</h2>
                <div className="profile-card">
                    <div className="profile-card-item">
                        <Building size={18} className="profile-card-icon" />
                        <div className="profile-card-content">
                            <span className="profile-card-label">Project</span>
                            <span className="profile-card-value">Marathon Galveston Turnaround</span>
                        </div>
                    </div>
                    <div className="profile-card-item">
                        <Briefcase size={18} className="profile-card-icon" />
                        <div className="profile-card-content">
                            <span className="profile-card-label">Trade</span>
                            <span className="profile-card-value">{mockCandidate.trade}</span>
                        </div>
                    </div>
                    <div className="profile-card-item">
                        <Calendar size={18} className="profile-card-icon" />
                        <div className="profile-card-content">
                            <span className="profile-card-label">Start Date</span>
                            <span className="profile-card-value">January 15, 2025</span>
                        </div>
                    </div>
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
        </div>
    );
}
