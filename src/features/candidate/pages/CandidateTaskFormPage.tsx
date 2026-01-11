import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    CheckCircle2,
    Loader2,
    AlertCircle,
    FileText,
    Sparkles,
    MessageCircle,
    Bell,
    User,
    Clock,
    Upload,
    File,
    Image,
    Trash2
} from 'lucide-react';
import { candidateApi, documentsApi } from '../../../services/api';
import './CandidateForm.css';

interface FormField {
    name: string;
    label: string;
    type: 'TEXT' | 'NUMBER' | 'EMAIL' | 'PHONE' | 'DATE' | 'SELECT' | 'CHECKBOX' | 'TEXTAREA' | 'FILE';
    required: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    helpText?: string;
}

interface TaskDetail {
    taskInstance: {
        id: string;
        status: string;
        result: any;
        startedAt: string | null;
        completedAt: string | null;
        dueDate: string | null;
    };
    task: {
        id: string;
        name: string;
        description: string | null;
        type: string;
        category: string | null;
        isRequired: boolean;
        configuration: any;
    };
    documents: Array<{
        id: string;
        filename: string;
        mimeType: string;
        fileSize: number;
    }>;
}

export function CandidateTaskFormPage() {
    const navigate = useNavigate();
    const { taskInstanceId } = useParams<{ taskInstanceId: string }>();
    const [searchParams] = useSearchParams();
    const assignmentId = searchParams.get('assignmentId') || 'demo-assignment';

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Document upload state
    const [uploadedFiles, setUploadedFiles] = useState<Array<{
        id: string;
        originalFilename: string;
        mimeType: string;
        fileSize: number;
        documentSide?: string;
    }>>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (taskInstanceId) {
            loadTaskDetail();
        }
    }, [taskInstanceId, assignmentId]);

    const loadTaskDetail = async () => {
        try {
            setLoading(true);
            const data = await candidateApi.getTaskDetail(assignmentId, taskInstanceId!);
            setTaskDetail(data);

            // Pre-populate form with existing data if any
            if (data.taskInstance.result?.formData) {
                setFormData(data.taskInstance.result.formData);
            }

            // Mark task as started if not already
            if (data.taskInstance.status === 'NOT_STARTED') {
                await candidateApi.startTask(assignmentId, taskInstanceId!);
            }
        } catch (err) {
            console.error('Failed to load task:', err);
            setSubmitError('Failed to load task details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // File upload handlers
    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0 || !taskInstanceId) return;

        setUploading(true);
        setSubmitError(null);
        setUploadProgress(0);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));

                const result = await documentsApi.upload(file, taskInstanceId);

                setUploadedFiles(prev => [...prev, {
                    id: result.document.id,
                    originalFilename: result.document.originalFilename,
                    mimeType: result.document.mimeType,
                    fileSize: result.document.fileSize,
                    documentSide: result.document.documentSide
                }]);
            }
        } catch (err: any) {
            console.error('Upload failed:', err);
            setSubmitError(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDeleteFile = async (documentId: string) => {
        try {
            await documentsApi.delete(documentId);
            setUploadedFiles(prev => prev.filter(f => f.id !== documentId));
        } catch (err) {
            console.error('Failed to delete file:', err);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDocumentSubmit = async () => {
        if (uploadedFiles.length === 0) {
            setSubmitError('Please upload at least one file');
            return;
        }

        try {
            setSubmitting(true);
            setSubmitError(null);

            // Submit with reference to uploaded files
            await candidateApi.submitForm(assignmentId, taskInstanceId!, {
                documentIds: uploadedFiles.map(f => f.id),
                documentCount: uploadedFiles.length
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate(`/candidate-v2/tasks?assignmentId=${assignmentId}`);
            }, 2000);
        } catch (err) {
            console.error('Failed to submit:', err);
            setSubmitError('Failed to submit documents. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        // Clear error when user starts typing
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const fields: FormField[] = taskDetail?.task.configuration?.formFields || [];

        fields.forEach(field => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            setSubmitError(null);

            await candidateApi.submitForm(assignmentId, taskInstanceId!, formData);

            setSubmitSuccess(true);

            // Navigate back after short delay
            setTimeout(() => {
                navigate(`/candidate-v2/tasks?assignmentId=${assignmentId}`);
            }, 2000);
        } catch (err) {
            console.error('Failed to submit form:', err);
            setSubmitError('Failed to submit form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field: FormField) => {
        const value = formData[field.name] ?? '';
        const error = errors[field.name];

        const baseInputClass = `candidate-form-input ${error ? 'error' : ''}`;

        switch (field.type) {
            case 'SELECT':
                return (
                    <select
                        className={baseInputClass}
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        disabled={submitSuccess}
                    >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );

            case 'TEXTAREA':
                return (
                    <textarea
                        className={baseInputClass}
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        disabled={submitSuccess}
                    />
                );

            case 'CHECKBOX':
                return (
                    <label className="candidate-form-checkbox">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                            disabled={submitSuccess}
                        />
                        <span>Yes</span>
                    </label>
                );

            case 'NUMBER':
                return (
                    <input
                        type="number"
                        className={baseInputClass}
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={submitSuccess}
                    />
                );

            case 'DATE':
                return (
                    <input
                        type="date"
                        className={baseInputClass}
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        disabled={submitSuccess}
                    />
                );

            case 'EMAIL':
                return (
                    <input
                        type="email"
                        className={baseInputClass}
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={submitSuccess}
                    />
                );

            case 'PHONE':
                return (
                    <input
                        type="tel"
                        className={baseInputClass}
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={submitSuccess}
                    />
                );

            default: // TEXT
                return (
                    <input
                        type="text"
                        className={baseInputClass}
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={submitSuccess}
                    />
                );
        }
    };

    if (loading) {
        return (
            <div className="candidate-v2 candidate-form-page candidate-loading">
                <Loader2 className="spin" size={32} />
                <p>Loading form...</p>
            </div>
        );
    }

    if (!taskDetail) {
        return (
            <div className="candidate-v2 candidate-form-page candidate-error">
                <AlertCircle size={48} />
                <p>{submitError || 'Task not found'}</p>
                <button onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }


    const { task, taskInstance } = taskDetail;
    const formFields: FormField[] = task.configuration?.formFields || [];
    const isCompleted = taskInstance.status === 'COMPLETED' || submitSuccess;

    return (
        <div className="candidate-v2 candidate-form-page">
            {/* Header */}
            <header className="candidate-v2-page-header">
                <button
                    className="candidate-v2-back-btn"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="candidate-v2-page-title-group">
                    <h1 className="candidate-v2-page-title">{task.name}</h1>
                    <span className="candidate-v2-page-subtitle">
                        {task.category?.replace('_', ' ')}
                    </span>
                </div>
                {isCompleted && (
                    <div className="candidate-form-completed-badge">
                        <CheckCircle2 size={20} />
                    </div>
                )}
            </header>

            {/* Form Content */}
            <div className="candidate-form-container">
                {/* Task Description */}
                {task.description && (
                    <div className="candidate-form-description">
                        <p>{task.description}</p>
                    </div>
                )}

                {/* Due Date */}
                {taskInstance.dueDate && (
                    <div className="candidate-form-due">
                        <Clock size={14} />
                        <span>Due: {new Date(taskInstance.dueDate).toLocaleDateString()}</span>
                    </div>
                )}

                {/* Success Message */}
                {submitSuccess && (
                    <div className="candidate-form-success">
                        <CheckCircle2 size={24} />
                        <h3>Form Submitted Successfully!</h3>
                        <p>Redirecting back to your tasks...</p>
                    </div>
                )}

                {/* Error Message */}
                {submitError && (
                    <div className="candidate-form-error-message">
                        <AlertCircle size={20} />
                        <span>{submitError}</span>
                    </div>
                )}

                {/* Form Fields */}
                {!submitSuccess && task.type !== 'DOCUMENT_UPLOAD' && (
                    <form className="candidate-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                        {formFields.map((field, index) => (
                            <div key={field.name} className="candidate-form-field" style={{ animationDelay: `${index * 30}ms` }}>
                                <label className="candidate-form-label">
                                    {field.label}
                                    {field.required && <span className="required">*</span>}
                                </label>
                                {renderField(field)}
                                {field.helpText && (
                                    <span className="candidate-form-help">{field.helpText}</span>
                                )}
                                {errors[field.name] && (
                                    <span className="candidate-form-field-error">{errors[field.name]}</span>
                                )}
                            </div>
                        ))}

                        {/* Submit Button */}
                        <div className="candidate-form-actions">
                            <button
                                type="button"
                                className="candidate-form-btn-secondary"
                                onClick={() => navigate(-1)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="candidate-form-btn-primary"
                                disabled={submitting || isCompleted}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Submit Form
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* Document Upload UI */}
                {!submitSuccess && task.type === 'DOCUMENT_UPLOAD' && (
                    <div className="candidate-upload-container">
                        {/* Instructions */}
                        {task.configuration?.instructions && (
                            <div className="candidate-upload-instructions">
                                <p>{task.configuration.instructions}</p>
                            </div>
                        )}

                        {/* Drag and Drop Zone */}
                        <div
                            className={`candidate-upload-dropzone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept={task.configuration?.allowedFileTypes?.join(',') || 'image/*,.pdf'}
                                onChange={(e) => handleFileSelect(e.target.files)}
                                style={{ display: 'none' }}
                            />

                            {uploading ? (
                                <>
                                    <Loader2 size={48} className="spin" style={{ color: '#667eea' }} />
                                    <p>Uploading... {uploadProgress}%</p>
                                </>
                            ) : (
                                <>
                                    <Upload size={48} style={{ color: '#667eea' }} />
                                    <p><strong>Click to upload</strong> or drag and drop</p>
                                    <span className="candidate-upload-hint">
                                        {task.configuration?.allowedFileTypes?.length > 0
                                            ? `Accepted: ${task.configuration.allowedFileTypes.join(', ')}`
                                            : 'Images and PDF files accepted'
                                        }
                                        {' • Max 5MB'}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                            <div className="candidate-upload-files">
                                <h4>Uploaded Files ({uploadedFiles.length})</h4>
                                {uploadedFiles.map((file) => (
                                    <div key={file.id} className="candidate-upload-file-item">
                                        <div className="candidate-upload-file-icon">
                                            {file.mimeType.startsWith('image/') ? (
                                                <Image size={24} />
                                            ) : (
                                                <File size={24} />
                                            )}
                                        </div>
                                        <div className="candidate-upload-file-info">
                                            <span className="candidate-upload-file-name">{file.originalFilename}</span>
                                            <span className="candidate-upload-file-size">{formatFileSize(file.fileSize)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="candidate-upload-file-delete"
                                            onClick={() => handleDeleteFile(file.id)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="candidate-form-actions">
                            <button
                                type="button"
                                className="candidate-form-btn-secondary"
                                onClick={() => navigate(-1)}
                                disabled={submitting || uploading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="candidate-form-btn-primary"
                                onClick={handleDocumentSubmit}
                                disabled={submitting || uploading || uploadedFiles.length === 0 || isCompleted}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Submit Documents
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="candidate-v2-bottom-nav">
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate(`/candidate-v2?assignmentId=${assignmentId}`)}
                >
                    <Sparkles size={22} />
                    <span>Home</span>
                </button>
                <button
                    className="candidate-v2-nav-item active"
                    onClick={() => navigate(`/candidate-v2/tasks?assignmentId=${assignmentId}`)}
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
