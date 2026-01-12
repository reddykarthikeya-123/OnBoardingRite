import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import './auth.css';

export function SetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setPassword, user } = useAuth();

    // Get email from location state or user
    const email = (location.state as any)?.email || user?.email || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await setPassword(email, newPassword, confirmPassword);
            navigate('/candidate', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page candidate-auth">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-icon success">
                        <KeyRound size={32} />
                    </div>
                    <h1>Set Your Password</h1>
                    <p>Create a password to secure your account</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="auth-welcome">
                    <CheckCircle2 size={18} />
                    <span>Welcome! Your email <strong>{email}</strong> has been verified.</span>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Create a strong password"
                            required
                            minLength={6}
                            disabled={loading}
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <ul className="password-requirements">
                        <li className={newPassword.length >= 6 ? 'met' : ''}>
                            At least 6 characters
                        </li>
                        <li className={newPassword && confirmPassword && newPassword === confirmPassword ? 'met' : ''}>
                            Passwords match
                        </li>
                    </ul>

                    <button
                        type="submit"
                        className="auth-submit candidate"
                        disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="spin" />
                                Setting password...
                            </>
                        ) : (
                            'Set Password & Continue'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
