import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

// Types
interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
    assignmentId?: string;
}

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    role: 'admin' | 'candidate' | null;
    token: string | null;
    isFirstLogin: boolean;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string, role: 'admin' | 'candidate') => Promise<{ success: boolean; isFirstLogin?: boolean }>;
    setPassword: (email: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Storage keys
const TOKEN_KEY = 'onboardrite_token';
const USER_KEY = 'onboardrite_user';
const ROLE_KEY = 'onboardrite_role';

export function AuthProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        role: null,
        token: null,
        isFirstLogin: false
    });

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            const savedUser = localStorage.getItem(USER_KEY);
            const savedRole = localStorage.getItem(ROLE_KEY);

            if (token && savedUser) {
                try {
                    // Verify token with backend
                    const response = await fetch(`${API_BASE_URL}/auth/me?token=${token}`);
                    if (response.ok) {
                        const data = await response.json();
                        setState({
                            isAuthenticated: true,
                            isLoading: false,
                            user: data.user,
                            role: data.role,
                            token,
                            isFirstLogin: false
                        });
                        return;
                    }
                } catch (err) {
                    console.error('Token verification failed:', err);
                }
            }

            // Clear invalid session
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(ROLE_KEY);

            setState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                role: null,
                token: null,
                isFirstLogin: false
            });
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string, role: 'admin' | 'candidate') => {
        try {
            const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/candidate/login';

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();

            // Save to localStorage
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            localStorage.setItem(ROLE_KEY, data.role);

            setState({
                isAuthenticated: true,
                isLoading: false,
                user: data.user,
                role: data.role,
                token: data.token,
                isFirstLogin: data.isFirstLogin
            });

            return { success: true, isFirstLogin: data.isFirstLogin };
        } catch (err) {
            console.error('Login error:', err);
            throw err;
        }
    };

    const setPassword = async (email: string, newPassword: string, confirmPassword: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/candidate/set-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword, confirmPassword })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to set password');
            }

            const data = await response.json();

            // Update auth state
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            localStorage.setItem(ROLE_KEY, 'candidate');

            setState({
                isAuthenticated: true,
                isLoading: false,
                user: data.user,
                role: 'candidate',
                token: data.token,
                isFirstLogin: false
            });

            return true;
        } catch (err) {
            console.error('Set password error:', err);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ROLE_KEY);

        setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            role: null,
            token: null,
            isFirstLogin: false
        });

        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ ...state, login, setPassword, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

// Protected Route component
interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ('admin' | 'candidate')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                // Redirect to landing page if not authenticated
                navigate('/', { replace: true, state: { from: location } });
            } else if (allowedRoles && role && !allowedRoles.includes(role)) {
                // Redirect to appropriate home if role not allowed
                if (role === 'admin') {
                    navigate('/dashboard', { replace: true });
                } else {
                    navigate('/candidate-v2', { replace: true });
                }
            }
        }
    }, [isAuthenticated, isLoading, role, allowedRoles, navigate, location]);

    if (isLoading) {
        return (
            <div className="auth-loading">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return null;
    }

    return <>{children}</>;
}
