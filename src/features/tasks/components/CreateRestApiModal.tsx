import { useState, useEffect } from 'react';
import {
    Zap,
    Globe,
    Key,
    Code,
    RefreshCw,
    Info,
    Shield
} from 'lucide-react';
import { Modal, Button, Badge } from '../../../components/ui';
import { CollapsibleSection } from './CollapsibleSection';
import { KeyValueEditor } from './KeyValueEditor';
import type { TaskCategory, AuthenticationConfig } from '../../../types';

interface CreateRestApiModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: RestApiTaskData) => void;
    initialData?: RestApiTaskData;
    editMode?: boolean;
}

export interface RestApiTaskData {
    name: string;
    description: string;
    category: TaskCategory;
    estimatedTime: number;
    required: boolean;
    instructions: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    baseUrl: string;
    headers: { key: string; value: string }[];
    requestBodyTemplate: string;
    authentication: AuthenticationConfig;
    checkExisting: boolean;
    pollForResults: boolean;
    pollInterval: number;
    expectedStatusCodes: number[];
    retryPolicy: {
        maxRetries: number;
        retryDelay: number;
    };
}

const httpMethods = [
    { value: 'GET', color: 'success', description: 'Retrieve data' },
    { value: 'POST', color: 'primary', description: 'Create new resource' },
    { value: 'PUT', color: 'warning', description: 'Update resource' },
    { value: 'PATCH', color: 'accent', description: 'Partial update' },
    { value: 'DELETE', color: 'danger', description: 'Delete resource' },
];

const authTypes = [
    { value: 'NONE', label: 'No Authentication', icon: <Globe size={14} /> },
    { value: 'BASIC', label: 'Basic Auth', icon: <Key size={14} /> },
    { value: 'BEARER', label: 'Bearer Token', icon: <Shield size={14} /> },
    { value: 'API_KEY', label: 'API Key', icon: <Key size={14} /> },
    { value: 'OAUTH2', label: 'OAuth 2.0', icon: <Shield size={14} /> },
];

export function CreateRestApiModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    editMode = false
}: CreateRestApiModalProps) {
    // Basic info state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<TaskCategory>('INTEGRATION');
    const [estimatedTime, setEstimatedTime] = useState(5);
    const [required, setRequired] = useState(false);
    const [instructions, setInstructions] = useState('');

    // API Configuration
    const [endpoint, setEndpoint] = useState('');
    const [method, setMethod] = useState<RestApiTaskData['method']>('POST');
    const [baseUrl, setBaseUrl] = useState('');
    const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
        { key: 'Content-Type', value: 'application/json' }
    ]);
    const [requestBodyTemplate, setRequestBodyTemplate] = useState('{\n  "employeeId": "{{employeeId}}",\n  "data": {}\n}');

    // Authentication
    const [authType, setAuthType] = useState<AuthenticationConfig['type']>('NONE');
    const [authUsername, setAuthUsername] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authToken, setAuthToken] = useState('');
    const [apiKeyName, setApiKeyName] = useState('');
    const [apiKeyValue, setApiKeyValue] = useState('');
    const [apiKeyLocation, setApiKeyLocation] = useState<'HEADER' | 'QUERY'>('HEADER');
    const [oauth2ClientId, setOauth2ClientId] = useState('');
    const [oauth2ClientSecret, setOauth2ClientSecret] = useState('');
    const [oauth2TokenUrl, setOauth2TokenUrl] = useState('');
    const [oauth2Scope, setOauth2Scope] = useState('');

    // Execution options
    const [checkExisting, setCheckExisting] = useState(false);
    const [pollForResults, setPollForResults] = useState(false);
    const [pollInterval, setPollInterval] = useState(30);
    const [expectedStatusCodes, setExpectedStatusCodes] = useState('200, 201');
    const [maxRetries, setMaxRetries] = useState(3);
    const [retryDelay, setRetryDelay] = useState(5);

    // Validation
    const [errors, setErrors] = useState<{ name?: string; endpoint?: string }>({});

    // Populate form when editing
    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setDescription(initialData.description);
            setCategory(initialData.category);
            setEstimatedTime(initialData.estimatedTime);
            setRequired(initialData.required);
            setInstructions(initialData.instructions);
            setEndpoint(initialData.endpoint);
            setMethod(initialData.method);
            setBaseUrl(initialData.baseUrl);
            setHeaders(initialData.headers || []);
            setRequestBodyTemplate(initialData.requestBodyTemplate);
            if (initialData.authentication) {
                setAuthType(initialData.authentication.type);
            }
            setCheckExisting(initialData.checkExisting);
            setPollForResults(initialData.pollForResults);
            setPollInterval(initialData.pollInterval);
            setMaxRetries(initialData.retryPolicy?.maxRetries || 3);
            setRetryDelay(initialData.retryPolicy?.retryDelay || 5);
        }
    }, [isOpen, initialData]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setCategory('INTEGRATION');
        setEstimatedTime(5);
        setRequired(false);
        setInstructions('');
        setEndpoint('');
        setMethod('POST');
        setBaseUrl('');
        setHeaders([{ key: 'Content-Type', value: 'application/json' }]);
        setRequestBodyTemplate('{\n  "employeeId": "{{employeeId}}",\n  "data": {}\n}');
        setAuthType('NONE');
        setAuthUsername('');
        setAuthPassword('');
        setAuthToken('');
        setApiKeyName('');
        setApiKeyValue('');
        setApiKeyLocation('HEADER');
        setOauth2ClientId('');
        setOauth2ClientSecret('');
        setOauth2TokenUrl('');
        setOauth2Scope('');
        setCheckExisting(false);
        setPollForResults(false);
        setPollInterval(30);
        setExpectedStatusCodes('200, 201');
        setMaxRetries(3);
        setRetryDelay(5);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const buildAuthConfig = (): AuthenticationConfig => {
        const config: AuthenticationConfig = { type: authType };
        switch (authType) {
            case 'BASIC':
                config.username = authUsername;
                config.password = authPassword;
                break;
            case 'BEARER':
                config.token = authToken;
                break;
            case 'API_KEY':
                config.apiKeyName = apiKeyName;
                config.apiKeyValue = apiKeyValue;
                config.apiKeyLocation = apiKeyLocation;
                break;
            case 'OAUTH2':
                config.oauth2Config = {
                    clientId: oauth2ClientId,
                    clientSecret: oauth2ClientSecret,
                    tokenUrl: oauth2TokenUrl,
                    scope: oauth2Scope || undefined,
                };
                break;
        }
        return config;
    };

    const validate = (): boolean => {
        const newErrors: { name?: string; endpoint?: string } = {};
        if (!name.trim()) {
            newErrors.name = 'Task name is required';
        }
        if (!endpoint.trim()) {
            newErrors.endpoint = 'API endpoint is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const statusCodes = expectedStatusCodes
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));

        onSave({
            name: name.trim(),
            description: description.trim(),
            category,
            estimatedTime,
            required,
            instructions: instructions.trim(),
            endpoint: endpoint.trim(),
            method,
            baseUrl: baseUrl.trim(),
            headers,
            requestBodyTemplate,
            authentication: buildAuthConfig(),
            checkExisting,
            pollForResults,
            pollInterval,
            expectedStatusCodes: statusCodes,
            retryPolicy: {
                maxRetries,
                retryDelay
            }
        });
        handleClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={editMode ? "Edit REST API Task" : "Create REST API Task"}
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
                <CollapsibleSection title="Basic Information" icon={<Zap size={16} />}>
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">Task Name *</label>
                            <input
                                type="text"
                                className={`input ${errors.name ? 'input-error' : ''}`}
                                placeholder="e.g., Submit Background Check"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {errors.name && <span className="input-error-message">{errors.name}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Description</label>
                            <textarea
                                className="input textarea"
                                placeholder="Describe what this API call does..."
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
                                    <option value="INTEGRATION">Integration</option>
                                    <option value="COMPLIANCE">Compliance</option>
                                    <option value="DOCUMENTS">Documents</option>
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
                                id="api-required"
                                checked={required}
                                onChange={(e) => setRequired(e.target.checked)}
                            />
                            <label htmlFor="api-required">This task is required for onboarding completion</label>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* API Configuration */}
                <CollapsibleSection title="API Configuration" icon={<Globe size={16} />}>
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">Base URL (optional)</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="https://api.example.com or {{BASE_URL}}"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                            />
                            <span className="input-helper">Use {'{{VARIABLE}}'} for environment variables</span>
                        </div>

                        <div className="api-endpoint-row">
                            <div className="input-group" style={{ width: '140px', flexShrink: 0 }}>
                                <label className="input-label">Method</label>
                                <select
                                    className="input select"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value as RestApiTaskData['method'])}
                                >
                                    {httpMethods.map(m => (
                                        <option key={m.value} value={m.value}>{m.value}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group flex-1">
                                <label className="input-label">Endpoint *</label>
                                <input
                                    type="text"
                                    className={`input ${errors.endpoint ? 'input-error' : ''}`}
                                    placeholder="/api/v1/employees/{{employeeId}}/background-check"
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                />
                                {errors.endpoint && <span className="input-error-message">{errors.endpoint}</span>}
                            </div>
                        </div>

                        <div className="method-badge-row">
                            <Badge variant={httpMethods.find(m => m.value === method)?.color as any}>
                                {method}
                            </Badge>
                            <span className="text-sm text-muted">
                                {httpMethods.find(m => m.value === method)?.description}
                            </span>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Authentication */}
                <CollapsibleSection title="Authentication" icon={<Key size={16} />}>
                    <div className="form-section">
                        <div className="auth-type-selector">
                            {authTypes.map(auth => (
                                <button
                                    key={auth.value}
                                    type="button"
                                    className={`auth-type-option ${authType === auth.value ? 'selected' : ''}`}
                                    onClick={() => setAuthType(auth.value as AuthenticationConfig['type'])}
                                >
                                    {auth.icon}
                                    <span>{auth.label}</span>
                                </button>
                            ))}
                        </div>

                        {authType === 'BASIC' && (
                            <div className="auth-config-fields">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">Username</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="username or {{USERNAME}}"
                                            value={authUsername}
                                            onChange={(e) => setAuthUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Password</label>
                                        <input
                                            type="password"
                                            className="input"
                                            placeholder="••••••••"
                                            value={authPassword}
                                            onChange={(e) => setAuthPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {authType === 'BEARER' && (
                            <div className="auth-config-fields">
                                <div className="input-group">
                                    <label className="input-label">Bearer Token</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Enter token or {{API_TOKEN}}"
                                        value={authToken}
                                        onChange={(e) => setAuthToken(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {authType === 'API_KEY' && (
                            <div className="auth-config-fields">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">API Key Name</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="X-API-Key"
                                            value={apiKeyName}
                                            onChange={(e) => setApiKeyName(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">API Key Value</label>
                                        <input
                                            type="password"
                                            className="input"
                                            placeholder="••••••••"
                                            value={apiKeyValue}
                                            onChange={(e) => setApiKeyValue(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Location</label>
                                    <div className="radio-group">
                                        <label className="radio">
                                            <input
                                                type="radio"
                                                name="apiKeyLocation"
                                                checked={apiKeyLocation === 'HEADER'}
                                                onChange={() => setApiKeyLocation('HEADER')}
                                            />
                                            <span>Header</span>
                                        </label>
                                        <label className="radio">
                                            <input
                                                type="radio"
                                                name="apiKeyLocation"
                                                checked={apiKeyLocation === 'QUERY'}
                                                onChange={() => setApiKeyLocation('QUERY')}
                                            />
                                            <span>Query Parameter</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {authType === 'OAUTH2' && (
                            <div className="auth-config-fields">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">Client ID</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="client_id"
                                            value={oauth2ClientId}
                                            onChange={(e) => setOauth2ClientId(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Client Secret</label>
                                        <input
                                            type="password"
                                            className="input"
                                            placeholder="••••••••"
                                            value={oauth2ClientSecret}
                                            onChange={(e) => setOauth2ClientSecret(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Token URL</label>
                                    <input
                                        type="url"
                                        className="input"
                                        placeholder="https://auth.example.com/oauth2/token"
                                        value={oauth2TokenUrl}
                                        onChange={(e) => setOauth2TokenUrl(e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Scope (optional)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="read write"
                                        value={oauth2Scope}
                                        onChange={(e) => setOauth2Scope(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* Request Configuration */}
                <CollapsibleSection title="Request Configuration" icon={<Code size={16} />}>
                    <div className="form-section">
                        <KeyValueEditor
                            pairs={headers}
                            onChange={setHeaders}
                            keyPlaceholder="Header Name"
                            valuePlaceholder="Header Value"
                            label="Request Headers"
                        />

                        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
                            <div className="input-group">
                                <label className="input-label">Request Body Template (JSON)</label>
                                <textarea
                                    className="input textarea code-editor"
                                    value={requestBodyTemplate}
                                    onChange={(e) => setRequestBodyTemplate(e.target.value)}
                                    rows={6}
                                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                                />
                                <span className="input-helper">Use {'{{variable}}'} for dynamic values</span>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* Execution Options */}
                <CollapsibleSection title="Execution Options" icon={<RefreshCw size={16} />} defaultOpen={false}>
                    <div className="form-section">
                        <div className="execution-options-grid">
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="check-existing"
                                    checked={checkExisting}
                                    onChange={(e) => setCheckExisting(e.target.checked)}
                                />
                                <label htmlFor="check-existing">Check existing before execution</label>
                            </div>

                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="poll-results"
                                    checked={pollForResults}
                                    onChange={(e) => setPollForResults(e.target.checked)}
                                />
                                <label htmlFor="poll-results">Poll for results (async operation)</label>
                            </div>
                        </div>

                        {pollForResults && (
                            <div className="input-group">
                                <label className="input-label">Polling Interval (seconds)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={pollInterval}
                                    onChange={(e) => setPollInterval(Number(e.target.value))}
                                    min={5}
                                    style={{ width: '120px' }}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Expected Success Status Codes</label>
                            <input
                                type="text"
                                className="input"
                                value={expectedStatusCodes}
                                onChange={(e) => setExpectedStatusCodes(e.target.value)}
                                placeholder="200, 201, 204"
                            />
                            <span className="input-helper">Comma-separated HTTP status codes</span>
                        </div>

                        <div className="retry-config">
                            <label className="input-label">Retry Policy</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label className="input-label text-sm">Max Retries</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={maxRetries}
                                        onChange={(e) => setMaxRetries(Number(e.target.value))}
                                        min={0}
                                        max={10}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label text-sm">Retry Delay (seconds)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={retryDelay}
                                        onChange={(e) => setRetryDelay(Number(e.target.value))}
                                        min={1}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Instructions */}
                <CollapsibleSection title="Instructions" icon={<Info size={16} />} defaultOpen={false}>
                    <div className="input-group">
                        <label className="input-label">Internal Notes / Instructions</label>
                        <textarea
                            className="input textarea"
                            placeholder="Add any internal notes about this API integration..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={3}
                        />
                    </div>
                </CollapsibleSection>
            </div>
        </Modal>
    );
}
