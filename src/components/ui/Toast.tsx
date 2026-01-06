import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Undo } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    undoAction?: () => void;
}

interface ToastContextType {
    showToast: (toast: Omit<Toast, 'id'>) => string;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    useEffect(() => {
        if (toast.duration !== 0) {
            const timer = setTimeout(onClose, toast.duration || 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, onClose]);

    const icons = {
        success: <CheckCircle size={18} />,
        error: <AlertCircle size={18} />,
        info: <Info size={18} />,
        warning: <AlertTriangle size={18} />,
    };

    return (
        <div className={`toast toast-${toast.type}`}>
            <div className="toast-icon">{icons[toast.type]}</div>
            <div className="toast-content">
                <span className="toast-message">{toast.message}</span>
                {toast.undoAction && (
                    <button
                        className="toast-undo"
                        onClick={() => {
                            toast.undoAction?.();
                            onClose();
                        }}
                    >
                        <Undo size={14} />
                        Undo
                    </button>
                )}
            </div>
            <button className="toast-close" onClick={onClose}>
                <X size={16} />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}`;
        setToasts((prev) => [...prev, { ...toast, id }]);
        return id;
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {createPortal(
                <div className="toast-container">
                    {toasts.map((toast) => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onClose={() => hideToast(toast.id)}
                        />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}
