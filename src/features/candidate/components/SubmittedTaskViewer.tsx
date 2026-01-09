import { ArrowLeft } from 'lucide-react';
import './SubmittedTaskViewer.css';

interface SubmittedTaskViewerProps {
    taskName: string;
    submittedAt: string | null;
    formData: Record<string, any>;
    onClose: () => void;
}

export function SubmittedTaskViewer({ taskName, submittedAt, formData, onClose }: SubmittedTaskViewerProps) {
    if (!formData) return null;

    // Helper to format key names to readable labels
    const formatLabel = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1') // insert space before capital letters
            .replace(/^./, str => str.toUpperCase()); // capitalize first letter
    };

    // Helper to format values
    const formatValue = (value: any) => {
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    };

    return (
        <div className="viewer-inline">
            <header className="viewer-inline-header">
                <button className="viewer-back-btn" onClick={onClose}>
                    <ArrowLeft size={16} />
                    <span>Back to list</span>
                </button>
            </header>

            <div className="viewer-inline-title">
                <h3>{taskName}</h3>
                {submittedAt && (
                    <p className="viewer-subtitle">
                        Submitted on {new Date(submittedAt).toLocaleDateString()}
                    </p>
                )}
            </div>

            <div className="viewer-inline-content">
                <div className="form-data-grid">
                    {Object.entries(formData).map(([key, value]) => (
                        <div key={key} className="form-data-item">
                            <span className="form-data-label">{formatLabel(key)}</span>
                            <div className="form-data-value-box">
                                {formatValue(value)}
                            </div>
                        </div>
                    ))}
                </div>

                {Object.keys(formData).length === 0 && (
                    <div className="empty-state">
                        <p>No form data available for this task.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
