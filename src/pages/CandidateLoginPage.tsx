import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import './auth.css';

export function CandidateLoginPage() {
    const navigate = useNavigate();
    const { login, user } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const result = await login(email, password, 'candidate');

            if (result.isFirstLogin) {
                // Redirect to set password page
                navigate('/set-password', {
                    replace: true,
                    state: { email }
                });
            } else {
                navigate('/candidate-v2', { replace: true });
            }
        } catch (err: any) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page candidate-auth">
            <div className="auth-container">
                <Link to="/" className="auth-back">
                    <ArrowLeft size={20} />
                    Back
                </Link>

                <div className="auth-header">
                    <div className="auth-icon candidate">
                        <UserCircle size={32} />
                    </div>
                    <h1>Candidate Login</h1>
                    <p>Sign in to complete your onboarding tasks</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />
                        <span className="auth-field-hint">
                            First time? Just enter your email and any password to get started.
                        </span>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit candidate"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className="auth-hint">
                    Are you an admin? <Link to="/login/admin">Login here</Link>
                </p>
            </div>
        </div>
    );
}
