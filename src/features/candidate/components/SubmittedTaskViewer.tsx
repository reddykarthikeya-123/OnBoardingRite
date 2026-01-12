import { useState } from 'react';
import { ArrowLeft, FileText, Download, Image, ExternalLink, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
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
    // Admin review props
    isAdmin?: boolean;
    reviewStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | null;
    adminRemarks?: string | null;
    onApprove?: () => Promise<void>;
    onReject?: (remarks: string) => Promise<void>;
}

export function SubmittedTaskViewer({
    taskName,
    submittedAt,
    formData,
    onClose,
    documents,
    isAdmin = false,
    reviewStatus,
    adminRemarks,
    onApprove,
    onReject
}: SubmittedTaskViewerProps) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

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

    const handleApprove = async () => {
        if (!onApprove) return;
        setIsApproving(true);
        try {
            await onApprove();
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!onReject || !rejectRemarks.trim()) return;
        setIsRejecting(true);
        try {
            await onReject(rejectRemarks.trim());
            setShowRejectModal(false);
            setRejectRemarks('');
        } finally {
            setIsRejecting(false);
        }
    };

    // Filter out internal document tracking fields from formData display
    const displayableFormData = Object.entries(formData || {}).filter(([key, value]) => {
        if (key === 'documentIds' || key === 'documentCount') return false;
        return formatValue(value) !== null;
    });

    const hasDocuments = documents && documents.length > 0;
    const hasFormData = displayableFormData.length > 0;

    const getReviewStatusBadge = () => {
        if (!reviewStatus) return null;

        switch (reviewStatus) {
            case 'APPROVED':
                return (
                    <span className="review-status-badge approved">
                        <CheckCircle size={14} /> Approved
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="review-status-badge rejected">
                        <XCircle size={14} /> Rejected
                    </span>
                );
            case 'PENDING_REVIEW':
                return (
                    <span className="review-status-badge pending">
                        <AlertCircle size={14} /> Pending Review
                    </span>
                );
            default:
                return null;
        }
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3>{taskName}</h3>
                    {getReviewStatusBadge()}
                </div>
                {submittedAt && (
                    <p className="viewer-subtitle">
                        Submitted on {new Date(submittedAt).toLocaleDateString()}
                    </p>
                )}
            </div>

            {/* Admin remarks (if rejected) */}
            {adminRemarks && reviewStatus === 'REJECTED' && (
                <div className="admin-remarks-box">
                    <strong>Admin Remarks:</strong>
                    <p>{adminRemarks}</p>
                </div>
            )}

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

            {/* Admin Review Actions */}
            {isAdmin && onApprove && onReject && reviewStatus !== 'APPROVED' && (
                <div className="review-actions">
                    <button
                        className="review-btn approve-btn"
                        onClick={handleApprove}
                        disabled={isApproving || isRejecting}
                    >
                        {isApproving ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                        Approve
                    </button>
                    <button
                        className="review-btn reject-btn"
                        onClick={() => setShowRejectModal(true)}
                        disabled={isApproving || isRejecting}
                    >
                        <XCircle size={16} />
                        Reject
                    </button>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="reject-modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="reject-modal" onClick={e => e.stopPropagation()}>
                        <h4>Reject Submission</h4>
                        <p>Please provide remarks explaining why this submission is being rejected. The candidate will see this message.</p>
                        <textarea
                            value={rejectRemarks}
                            onChange={(e) => setRejectRemarks(e.target.value)}
                            placeholder="Enter rejection reason..."
                            rows={4}
                        />
                        <div className="reject-modal-actions">
                            <button className="cancel-btn" onClick={() => setShowRejectModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="confirm-reject-btn"
                                onClick={handleReject}
                                disabled={!rejectRemarks.trim() || isRejecting}
                            >
                                {isRejecting ? 'Rejecting...' : 'Reject Submission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
