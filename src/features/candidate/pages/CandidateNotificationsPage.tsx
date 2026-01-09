import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Bell,
    Sparkles,
    FileText,
    MessageCircle,
    User,
    Wrench
} from 'lucide-react';

export function CandidateNotificationsPage() {
    const navigate = useNavigate();

    return (
        <div className="candidate-notifications">
            {/* Header */}
            <header className="candidate-notifications-header">
                <button
                    className="candidate-v2-back-btn"
                    onClick={() => navigate('/candidate-v2')}
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="candidate-notifications-title-group">
                    <h1 className="candidate-notifications-title">Alerts</h1>
                </div>
            </header>

            {/* Under Development Message */}
            <div className="candidate-notifications-list" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '60px 20px' }}>
                <Wrench size={64} style={{ color: '#8792a2', marginBottom: '20px' }} />
                <h2 style={{ color: '#1a1f36', fontSize: '1.5rem', marginBottom: '8px' }}>Still Under Development</h2>
                <p style={{ color: '#697386', fontSize: '1rem', maxWidth: '300px' }}>
                    The alerts feature is currently being developed. Check back soon!
                </p>
            </div>

            {/* Bottom Navigation */}
            <nav className="candidate-v2-bottom-nav">
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate-v2')}
                >
                    <Sparkles size={22} />
                    <span>Home</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate-v2/tasks')}
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
                <button className="candidate-v2-nav-item active">
                    <Bell size={22} />
                    <span>Alerts</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate/profile')}
                >
                    <User size={22} />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
}
