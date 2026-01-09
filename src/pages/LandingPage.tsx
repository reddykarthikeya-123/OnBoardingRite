import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { UserCircle, Shield } from 'lucide-react';
import './auth.css';

export function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, role } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            if (role === 'admin') {
                navigate('/dashboard', { replace: true });
            } else {
                navigate('/candidate-v2', { replace: true });
            }
        }
    }, [isAuthenticated, role, navigate]);

    return (
        <div className="landing-page">
            <div className="landing-bg" />

            <div className="landing-content">
                <div className="landing-logo">
                    <img src="/src/assets/logo.png" alt="OnboardRite" className="landing-logo-img" />
                </div>

                <h1 className="landing-title">OnboardRite</h1>
                <p className="landing-subtitle">Streamlined onboarding for everyone</p>

                <div className="landing-cards">
                    <button
                        className="landing-card admin-card"
                        onClick={() => navigate('/login/admin')}
                    >
                        <div className="landing-card-icon">
                            <Shield size={32} />
                        </div>
                        <h2>HR / Admin</h2>
                        <p>Manage projects, templates, and team members</p>
                    </button>

                    <button
                        className="landing-card candidate-card"
                        onClick={() => navigate('/login/candidate')}
                    >
                        <div className="landing-card-icon">
                            <UserCircle size={32} />
                        </div>
                        <h2>Candidate</h2>
                        <p>Complete your onboarding tasks</p>
                    </button>
                </div>

                <p className="landing-footer">
                    © {new Date().getFullYear()} OnboardRite. All rights reserved.
                </p>
            </div>
        </div>
    );
}
