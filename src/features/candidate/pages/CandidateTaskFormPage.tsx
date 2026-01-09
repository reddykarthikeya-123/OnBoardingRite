import { useState, useEffect } from 'react';
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
    Clock
} from 'lucide-react';
import { candidateApi } from '../../../services/api';

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
            // Fallback mock data for demo
            setTaskDetail({
                taskInstance: {
                    id: taskInstanceId || 'demo',
                    status: 'IN_PROGRESS',
                    result: null,
                    startedAt: new Date().toISOString(),
                    completedAt: null,
                    dueDate: '2025-12-20'
                },
                task: {
                    id: 'demo-task',
                    name: 'W-4 Tax Form',
                    description: 'Please complete your federal tax withholding form.',
                    type: 'CUSTOM_FORM',
                    category: 'FORMS',
                    isRequired: true,
                    configuration: {
                        formFields: [
                            { name: 'fullName', label: 'Full Legal Name', type: 'TEXT', required: true, placeholder: 'Enter your full legal name' },
                            { name: 'ssn', label: 'Social Security Number', type: 'TEXT', required: true, placeholder: 'XXX-XX-XXXX' },
                            { name: 'address', label: 'Home Address', type: 'TEXTAREA', required: true, placeholder: 'Street address, city, state, zip' },
                            {
                                name: 'filingStatus', label: 'Filing Status', type: 'SELECT', required: true, options: [
                                    { value: 'single', label: 'Single' },
                                    { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
                                    { value: 'married_filing_separately', label: 'Married Filing Separately' },
                                    { value: 'head_of_household', label: 'Head of Household' }
                                ]
                            },
                            { name: 'multipleJobs', label: 'Do you have multiple jobs?', type: 'CHECKBOX', required: false },
                            { name: 'dependents', label: 'Number of Dependents', type: 'NUMBER', required: false, placeholder: '0' },
                            { name: 'additionalWithholding', label: 'Additional Withholding Amount', type: 'NUMBER', required: false, placeholder: '0.00' },
                            { name: 'signature', label: 'Electronic Signature', type: 'TEXT', required: true, placeholder: 'Type your full name as signature' },
                            { name: 'signatureDate', label: 'Date', type: 'DATE', required: true }
                        ]
                    }
                },
                documents: []
            });
        } finally {
            setLoading(false);
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
                <p>Task not found</p>
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
                {!submitSuccess && (
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
