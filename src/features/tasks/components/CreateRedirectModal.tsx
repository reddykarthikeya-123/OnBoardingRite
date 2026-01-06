import { useState, useEffect } from 'react';
import {
    ExternalLink,
    Globe,
    RefreshCw,
    Key,
    Link,
    Info,
    ArrowRight,
    Settings,
    Clock,
    CheckCircle
} from 'lucide-react';
import { Modal, Button, Badge } from '../../../components/ui';
import { CollapsibleSection } from './CollapsibleSection';
import { KeyValueEditor } from './KeyValueEditor';
import type { TaskCategory, AuthenticationConfig, TaskStatus } from '../../../types';

interface CreateRedirectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: RedirectTaskData) => void;
    initialData?: RedirectTaskData;
    editMode?: boolean;
}

export interface RedirectTaskData {
    name: string;
    description: string;
    category: TaskCategory;
    estimatedTime: number;
    required: boolean;
    instructions: string;
    redirectUrl: string;
    externalSystemName: string;
    urlParameters: { key: string; value: string }[];
    openInNewTab: boolean;
    statusTracking: {
        enabled: boolean;
        pollingUrl: string;
        pollingMethod: 'GET' | 'POST';
        pollingHeaders: { key: string; value: string }[];
        pollingAuthentication: AuthenticationConfig;
        pollingInterval: number;
        statusFieldPath: string;
        statusMapping: { externalStatus: string; taskStatus: TaskStatus }[];
    };
}

const authTypes = [
    { value: 'NONE', label: 'No Authentication', icon: <Globe size={14} /> },
    { value: 'BASIC', label: 'Basic Auth', icon: <Key size={14} /> },
    { value: 'BEARER', label: 'Bearer Token', icon: <Key size={14} /> },
    { value: 'API_KEY', label: 'API Key', icon: <Key size={14} /> },
];

const taskStatusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'NOT_STARTED', label: 'Not Started', color: 'secondary' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'warning' },
    { value: 'COMPLETED', label: 'Completed', color: 'success' },
    { value: 'BLOCKED', label: 'Blocked', color: 'danger' },
];

export function CreateRedirectModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    editMode = false
}: CreateRedirectModalProps) {
    // Basic info state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<TaskCategory>('TRAININGS');
    const [estimatedTime, setEstimatedTime] = useState(30);
    const [required, setRequired] = useState(false);
    const [instructions, setInstructions] = useState('');

    // Redirect configuration
    const [redirectUrl, setRedirectUrl] = useState('');
    const [externalSystemName, setExternalSystemName] = useState('');
    const [urlParameters, setUrlParameters] = useState<{ key: string; value: string }[]>([]);
    const [openInNewTab, setOpenInNewTab] = useState(true);

    // Status tracking configuration
    const [statusTrackingEnabled, setStatusTrackingEnabled] = useState(false);
    const [pollingUrl, setPollingUrl] = useState('');
    const [pollingMethod, setPollingMethod] = useState<'GET' | 'POST'>('GET');
    const [pollingHeaders, setPollingHeaders] = useState<{ key: string; value: string }[]>([]);
    const [pollingInterval, setPollingInterval] = useState(60);
    const [statusFieldPath, setStatusFieldPath] = useState('');
    const [statusMapping, setStatusMapping] = useState<{ externalStatus: string; taskStatus: TaskStatus }[]>([
        { externalStatus: 'COMPLETED', taskStatus: 'COMPLETED' },
        { externalStatus: 'IN_PROGRESS', taskStatus: 'IN_PROGRESS' },
    ]);

    // Polling authentication
    const [pollingAuthType, setPollingAuthType] = useState<AuthenticationConfig['type']>('NONE');
    const [pollingAuthUsername, setPollingAuthUsername] = useState('');
    const [pollingAuthPassword, setPollingAuthPassword] = useState('');
    const [pollingAuthToken, setPollingAuthToken] = useState('');
    const [pollingApiKeyName, setPollingApiKeyName] = useState('');
    const [pollingApiKeyValue, setPollingApiKeyValue] = useState('');
    const [pollingApiKeyLocation, setPollingApiKeyLocation] = useState<'HEADER' | 'QUERY'>('HEADER');

    // Validation
    const [errors, setErrors] = useState<{ name?: string; redirectUrl?: string; externalSystemName?: string }>({});

    // Populate form when editing
    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setDescription(initialData.description);
            setCategory(initialData.category);
            setEstimatedTime(initialData.estimatedTime);
            setRequired(initialData.required);
            setInstructions(initialData.instructions);
            setRedirectUrl(initialData.redirectUrl);
            setExternalSystemName(initialData.externalSystemName);
            setUrlParameters(initialData.urlParameters || []);
            setOpenInNewTab(initialData.openInNewTab);
            if (initialData.statusTracking) {
                setStatusTrackingEnabled(initialData.statusTracking.enabled);
                setPollingUrl(initialData.statusTracking.pollingUrl);
                setPollingMethod(initialData.statusTracking.pollingMethod);
                setPollingHeaders(initialData.statusTracking.pollingHeaders || []);
                setPollingInterval(initialData.statusTracking.pollingInterval);
                setStatusFieldPath(initialData.statusTracking.statusFieldPath);
                if (initialData.statusTracking.statusMapping) {
                    setStatusMapping(initialData.statusTracking.statusMapping);
                }
            }
        }
    }, [isOpen, initialData]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setCategory('TRAININGS');
        setEstimatedTime(30);
        setRequired(false);
        setInstructions('');
        setRedirectUrl('');
        setExternalSystemName('');
        setUrlParameters([]);
        setOpenInNewTab(true);
        setStatusTrackingEnabled(false);
        setPollingUrl('');
        setPollingMethod('GET');
        setPollingHeaders([]);
        setPollingInterval(60);
        setStatusFieldPath('');
        setStatusMapping([
            { externalStatus: 'COMPLETED', taskStatus: 'COMPLETED' },
            { externalStatus: 'IN_PROGRESS', taskStatus: 'IN_PROGRESS' },
        ]);
        setPollingAuthType('NONE');
        setPollingAuthUsername('');
        setPollingAuthPassword('');
        setPollingAuthToken('');
        setPollingApiKeyName('');
        setPollingApiKeyValue('');
        setPollingApiKeyLocation('HEADER');
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const buildPollingAuthConfig = (): AuthenticationConfig => {
        const config: AuthenticationConfig = { type: pollingAuthType };
        switch (pollingAuthType) {
            case 'BASIC':
                config.username = pollingAuthUsername;
                config.password = pollingAuthPassword;
                break;
            case 'BEARER':
                config.token = pollingAuthToken;
                break;
            case 'API_KEY':
                config.apiKeyName = pollingApiKeyName;
                config.apiKeyValue = pollingApiKeyValue;
                config.apiKeyLocation = pollingApiKeyLocation;
                break;
        }
        return config;
    };

    const addStatusMapping = () => {
        setStatusMapping([...statusMapping, { externalStatus: '', taskStatus: 'COMPLETED' }]);
    };

    const updateStatusMapping = (index: number, field: 'externalStatus' | 'taskStatus', value: string) => {
        setStatusMapping(statusMapping.map((m, i) =>
            i === index ? { ...m, [field]: value } : m
        ));
    };

    const removeStatusMapping = (index: number) => {
        setStatusMapping(statusMapping.filter((_, i) => i !== index));
    };

    const validate = (): boolean => {
        const newErrors: { name?: string; redirectUrl?: string; externalSystemName?: string } = {};
        if (!name.trim()) {
            newErrors.name = 'Task name is required';
        }
        if (!redirectUrl.trim()) {
            newErrors.redirectUrl = 'Redirect URL is required';
        }
        if (!externalSystemName.trim()) {
            newErrors.externalSystemName = 'External system name is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        onSave({
            name: name.trim(),
            description: description.trim(),
            category,
            estimatedTime,
            required,
            instructions: instructions.trim(),
            redirectUrl: redirectUrl.trim(),
            externalSystemName: externalSystemName.trim(),
            urlParameters,
            openInNewTab,
            statusTracking: {
                enabled: statusTrackingEnabled,
                pollingUrl: pollingUrl.trim(),
                pollingMethod,
                pollingHeaders,
                pollingAuthentication: buildPollingAuthConfig(),
                pollingInterval,
                statusFieldPath: statusFieldPath.trim(),
                statusMapping
            }
        });
        handleClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={editMode ? "Edit Redirect Task" : "Create Redirect Task"}
            size="xl"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {editMode ? "Save Changes" : "Create Task"}
                    </Button>
                </>
            }
        >
            <div className="create-task-modal">
                {/* Basic Information */}
                <CollapsibleSection title="Basic Information" icon={<ExternalLink size={16} />}>
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">Task Name *</label>
                            <input
                                type="text"
                                className={`input ${errors.name ? 'input-error' : ''}`}
                                placeholder="e.g., Complete Security Training"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {errors.name && <span className="input-error-message">{errors.name}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Description</label>
                            <textarea
                                className="input textarea"
                                placeholder="Describe what the user needs to complete in the external system..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">Category</label>
                                <select
                                    className="input select"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                                >
                                    <option value="TRAININGS">Trainings</option>
                                    <option value="COMPLIANCE">Compliance</option>
                                    <option value="CERTIFICATIONS">Certifications</option>
                                    <option value="INTEGRATION">Integration</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Est. Time (minutes)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(Number(e.target.value))}
                                    min={1}
                                />
                            </div>
                        </div>

                        <div className="checkbox">
                            <input
                                type="checkbox"
                                id="redirect-required"
                                checked={required}
                                onChange={(e) => setRequired(e.target.checked)}
                            />
                            <label htmlFor="redirect-required">This task is required for onboarding completion</label>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Redirect Configuration */}
                <CollapsibleSection title="Redirect Configuration" icon={<Link size={16} />}>
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">External System Name *</label>
                            <input
                                type="text"
                                className={`input ${errors.externalSystemName ? 'input-error' : ''}`}
                                placeholder="e.g., Oracle Learning, Workday Training"
                                value={externalSystemName}
                                onChange={(e) => setExternalSystemName(e.target.value)}
                            />
                            {errors.externalSystemName && <span className="input-error-message">{errors.externalSystemName}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Redirect URL *</label>
                            <input
                                type="url"
                                className={`input ${errors.redirectUrl ? 'input-error' : ''}`}
                                placeholder="https://training.example.com/courses/{{courseId}}"
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                            />
                            {errors.redirectUrl && <span className="input-error-message">{errors.redirectUrl}</span>}
                            <span className="input-helper">Use {'{{variable}}'} for dynamic values like employee ID</span>
                        </div>

                        <KeyValueEditor
                            pairs={urlParameters}
                            onChange={setUrlParameters}
                            keyPlaceholder="Parameter Name"
                            valuePlaceholder="Parameter Value"
                            label="URL Parameters (optional)"
                        />

                        <div className="redirect-options">
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="open-new-tab"
                                    checked={openInNewTab}
                                    onChange={(e) => setOpenInNewTab(e.target.checked)}
                                />
                                <label htmlFor="open-new-tab">Open in new tab</label>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="redirect-preview">
                            <div className="redirect-preview-header">
                                <Globe size={16} />
                                <span>Preview</span>
                            </div>
                            <div className="redirect-preview-content">
                                <span className="redirect-preview-system">{externalSystemName || 'External System'}</span>
                                <ArrowRight size={14} />
                                <span className="redirect-preview-url">{redirectUrl || 'https://...'}</span>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Status Tracking */}
                <CollapsibleSection
                    title="Status Tracking"
                    icon={<RefreshCw size={16} />}
                    badge={statusTrackingEnabled ? <Badge variant="success">Enabled</Badge> : null}
                >
                    <div className="form-section">
                        <div className="status-tracking-toggle">
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="enable-tracking"
                                    checked={statusTrackingEnabled}
                                    onChange={(e) => setStatusTrackingEnabled(e.target.checked)}
                                />
                                <label htmlFor="enable-tracking">
                                    <strong>Enable status tracking from external system</strong>
                                </label>
                            </div>
                            <p className="text-sm text-muted mt-1">
                                Poll an API to automatically update task status based on completion in the external system.
                            </p>
                        </div>

                        {statusTrackingEnabled && (
                            <div className="status-tracking-config">
                                <div className="api-endpoint-row">
                                    <div className="input-group" style={{ width: '120px', flexShrink: 0 }}>
                                        <label className="input-label">Method</label>
                                        <select
                                            className="input select"
                                            value={pollingMethod}
                                            onChange={(e) => setPollingMethod(e.target.value as 'GET' | 'POST')}
                                        >
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                        </select>
                                    </div>
                                    <div className="input-group flex-1">
                                        <label className="input-label">Status Polling URL</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://api.example.com/status/{{employeeId}}"
                                            value={pollingUrl}
                                            onChange={(e) => setPollingUrl(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">
                                            <Clock size={14} className="mr-2" style={{ display: 'inline' }} />
                                            Polling Interval (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={pollingInterval}
                                            onChange={(e) => setPollingInterval(Number(e.target.value))}
                                            min={5}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Status Field Path</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="data.status or result[0].state"
                                            value={statusFieldPath}
                                            onChange={(e) => setStatusFieldPath(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Authentication for Polling */}
                                <div className="polling-auth-section">
                                    <label className="input-label">Authentication</label>
                                    <div className="auth-type-selector compact">
                                        {authTypes.map(auth => (
                                            <button
                                                key={auth.value}
                                                type="button"
                                                className={`auth-type-option ${pollingAuthType === auth.value ? 'selected' : ''}`}
                                                onClick={() => setPollingAuthType(auth.value as AuthenticationConfig['type'])}
                                            >
                                                {auth.icon}
                                                <span>{auth.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {pollingAuthType === 'BASIC' && (
                                        <div className="auth-config-fields">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="input-group">
                                                    <label className="input-label">Username</label>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={pollingAuthUsername}
                                                        onChange={(e) => setPollingAuthUsername(e.target.value)}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Password</label>
                                                    <input
                                                        type="password"
                                                        className="input"
                                                        value={pollingAuthPassword}
                                                        onChange={(e) => setPollingAuthPassword(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {pollingAuthType === 'BEARER' && (
                                        <div className="auth-config-fields">
                                            <div className="input-group">
                                                <label className="input-label">Bearer Token</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={pollingAuthToken}
                                                    onChange={(e) => setPollingAuthToken(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {pollingAuthType === 'API_KEY' && (
                                        <div className="auth-config-fields">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="input-group">
                                                    <label className="input-label">Key Name</label>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={pollingApiKeyName}
                                                        onChange={(e) => setPollingApiKeyName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Key Value</label>
                                                    <input
                                                        type="password"
                                                        className="input"
                                                        value={pollingApiKeyValue}
                                                        onChange={(e) => setPollingApiKeyValue(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <KeyValueEditor
                                    pairs={pollingHeaders}
                                    onChange={setPollingHeaders}
                                    keyPlaceholder="Header Name"
                                    valuePlaceholder="Header Value"
                                    label="Request Headers"
                                />

                                {/* Status Mapping */}
                                <div className="status-mapping-section">
                                    <label className="input-label">
                                        <CheckCircle size={14} className="mr-2" style={{ display: 'inline' }} />
                                        Status Value Mapping
                                    </label>
                                    <p className="text-xs text-muted mb-3">Map external system status values to task statuses</p>

                                    <div className="status-mapping-list">
                                        {statusMapping.map((mapping, index) => (
                                            <div key={index} className="status-mapping-row">
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="External status value"
                                                    value={mapping.externalStatus}
                                                    onChange={(e) => updateStatusMapping(index, 'externalStatus', e.target.value)}
                                                />
                                                <span className="status-mapping-arrow">→</span>
                                                <select
                                                    className="input select"
                                                    value={mapping.taskStatus}
                                                    onChange={(e) => updateStatusMapping(index, 'taskStatus', e.target.value)}
                                                >
                                                    {taskStatusOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => removeStatusMapping(index)}
                                                    disabled={statusMapping.length <= 1}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        leftIcon={<Settings size={14} />}
                                        onClick={addStatusMapping}
                                    >
                                        Add Mapping
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* Instructions */}
                <CollapsibleSection title="User Instructions" icon={<Info size={16} />} defaultOpen={false}>
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">Instructions shown before redirect</label>
                            <textarea
                                className="input textarea"
                                placeholder="Provide instructions on what the user needs to complete in the external system..."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="instructions-preview">
                            <div className="tip-card">
                                <ExternalLink size={16} />
                                <span>After clicking "Start Task", you will be redirected to <strong>{externalSystemName || 'the external system'}</strong></span>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>
            </div>
        </Modal>
    );
}
