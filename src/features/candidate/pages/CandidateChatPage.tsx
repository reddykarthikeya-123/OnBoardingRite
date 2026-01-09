import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Sparkles,
    FileText,
    MessageCircle,
    User,
    Bell,
    Wrench
} from 'lucide-react';

export function CandidateChatPage() {
    const navigate = useNavigate();

    return (
        <div className="candidate-chat">
            {/* Chat Header */}
            <header className="candidate-chat-header">
                <button
                    className="candidate-v2-back-btn"
                    onClick={() => navigate('/candidate-v2')}
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="candidate-chat-hr-info">
                    <h2 className="candidate-chat-hr-name" style={{ marginLeft: '12px' }}>Chat</h2>
                </div>
            </header>

            {/* Under Development Message */}
            <div className="candidate-chat-messages" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 20px' }}>
                <Wrench size={64} style={{ color: '#8792a2', marginBottom: '20px' }} />
                <h2 style={{ color: '#1a1f36', fontSize: '1.5rem', marginBottom: '8px' }}>Still Under Development</h2>
                <p style={{ color: '#697386', fontSize: '1rem', maxWidth: '300px' }}>
                    The chat feature is currently being developed. Check back soon!
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
                <button className="candidate-v2-nav-item active">
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
