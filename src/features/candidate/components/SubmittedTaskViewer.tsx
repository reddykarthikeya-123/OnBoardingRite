import { ArrowLeft, FileText, Download, Image, ExternalLink } from 'lucide-react';
import { documentsApi } from '../../../services/api';
import './SubmittedTaskViewer.css';

interface SubmittedTaskViewerProps {
    taskName: string;
    submittedAt: string | null;
    formData: Record<string, any>;
    onClose: () => void;
    documents?: Array<{
        id: string;
        originalFilename: string;
        mimeType: string;
        fileSize: number;
    }>;
}

export function SubmittedTaskViewer({ taskName, submittedAt, formData, onClose, documents }: SubmittedTaskViewerProps) {
    if (!formData && (!documents || documents.length === 0)) return null;

    // Helper to format key names to readable labels
    const formatLabel = (key: string) => {
        // Skip internal document tracking fields
        if (key === 'documentIds' || key === 'documentCount') return null;
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
        if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
            // Likely documentIds array - skip display
            return null;
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) {
            return <Image size={20} />;
        }
        return <FileText size={20} />;
    };

    // Filter out internal document tracking fields from formData display
    const displayableFormData = Object.entries(formData || {}).filter(([key, value]) => {
        if (key === 'documentIds' || key === 'documentCount') return false;
        return formatValue(value) !== null;
    });

    const hasDocuments = documents && documents.length > 0;
    const hasFormData = displayableFormData.length > 0;

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
                {/* Uploaded Documents Section */}
                {hasDocuments && (
                    <div className="viewer-documents-section">
                        <h4 className="viewer-section-title">Uploaded Documents ({documents.length})</h4>
                        <div className="viewer-documents-list">
                            {documents.map((doc) => (
                                <div key={doc.id} className="viewer-document-item">
                                    <div className="viewer-document-icon">
                                        {getFileIcon(doc.mimeType)}
                                    </div>
                                    <div className="viewer-document-info">
                                        <span className="viewer-document-name">{doc.originalFilename}</span>
                                        <span className="viewer-document-size">{formatFileSize(doc.fileSize)}</span>
                                    </div>
                                    <div className="viewer-document-actions">
                                        <a
                                            href={documentsApi.getUrl(doc.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="viewer-document-btn"
                                            title="View"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                        <a
                                            href={documentsApi.getDownloadUrl(doc.id)}
                                            className="viewer-document-btn"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form Data Grid */}
                {hasFormData && (
                    <div className="form-data-grid">
                        {displayableFormData.map(([key, value]) => (
                            <div key={key} className="form-data-item">
                                <span className="form-data-label">{formatLabel(key)}</span>
                                <div className="form-data-value-box">
                                    {formatValue(value)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!hasDocuments && !hasFormData && (
                    <div className="empty-state">
                        <p>No data available for this submission.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
