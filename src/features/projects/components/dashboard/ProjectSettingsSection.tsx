import { useState } from 'react';
import {
    Shield,
    Building2,
    DollarSign,
    Car,
    Info,
    Save,
    AlertTriangle,
    Check,
    MapPin,
    Clock,
    Phone,
    HardHat,
    FileText,
    Navigation,
    Plus,
    Trash2,
    Upload,
    Image
} from 'lucide-react';
import { Card, CardBody, Button, Badge } from '../../../../components/ui';
import type { ProjectSettings, PerDiemRules, MileageRules, DispatchSheet, SiteContact, MileageRateType } from '../../../../types';

type SettingsTab = 'general' | 'perdiem-mileage' | 'dispatch-sheet';

const IRS_RATE_2024 = 0.67;

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General Settings', icon: <Shield size={16} /> },
    { id: 'perdiem-mileage', label: 'Per Diem & Mileage', icon: <DollarSign size={16} /> },
    { id: 'dispatch-sheet', label: 'Dispatch Sheet', icon: <FileText size={16} /> },
];

const DEFAULT_CONTACT: SiteContact = {
    name: '',
    title: '',
    phone: '',
    email: '',
    isPrimary: false
};

const DEFAULT_DISPATCH: DispatchSheet = {
    siteName: '',
    siteAddress: '',
    siteCity: '',
    siteState: '',
    siteZip: '',
    gateInstructions: '',
    parkingInstructions: '',
    plantLayoutImageUrl: '',
    reportingTime: '6:00 AM',
    shiftEndTime: '4:30 PM',
    lunchBreakDuration: 30,
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    siteContacts: [{ name: '', title: 'Site Superintendent', phone: '', email: '', isPrimary: true }],
    lateCallNumber: '',
    emergencyNumber: '911',
    requiredPPE: ['Hard Hat', 'Safety Glasses', 'Steel Toe Boots'],
    siteRequirements: '',
    safetyNotes: '',
    additionalNotes: ''
};

const DEFAULT_SETTINGS: ProjectSettings = {
    isDOD: false,
    isODRISA: false,
    disaOwnerId: '',
    perDiemRules: {
        enabled: false,
        maxEligiblePercentage: 100,
        notes: ''
    },
    mileageRules: {
        enabled: false,
        rateType: 'IRS',
        ratePerMile: IRS_RATE_2024,
        minDistanceForEligibility: undefined,
        mileageToSubtract: undefined,
        capAmount: undefined,
        maxMilesPerDay: undefined,
        useAddressToAddress: false,
        siteAddress: '',
        requiresApproval: false,
        notes: ''
    },
    dispatchSheet: DEFAULT_DISPATCH
};

const PPE_OPTIONS = [
    'Hard Hat',
    'Safety Glasses',
    'Steel Toe Boots',
    'High-Visibility Vest',
    'Hearing Protection',
    'Gloves',
    'Face Shield',
    'Respiratory Protection',
    'Fall Protection Harness',
    'FR Clothing'
];

const WORK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ProjectSettingsSection() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const updateSettings = <K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSaved(false);
    };

    const updatePerDiemRules = <K extends keyof PerDiemRules>(key: K, value: PerDiemRules[K]) => {
        setSettings(prev => ({
            ...prev,
            perDiemRules: { ...prev.perDiemRules, [key]: value }
        }));
        setHasChanges(true);
        setSaved(false);
    };

    const updateMileageRules = <K extends keyof MileageRules>(key: K, value: MileageRules[K]) => {
        setSettings(prev => ({
            ...prev,
            mileageRules: { ...prev.mileageRules, [key]: value }
        }));
        setHasChanges(true);
        setSaved(false);
    };

    const updateDispatchSheet = <K extends keyof DispatchSheet>(key: K, value: DispatchSheet[K]) => {
        setSettings(prev => ({
            ...prev,
            dispatchSheet: { ...(prev.dispatchSheet || DEFAULT_DISPATCH), [key]: value }
        }));
        setHasChanges(true);
        setSaved(false);
    };

    const addContact = () => {
        const dispatch = settings.dispatchSheet || DEFAULT_DISPATCH;
        updateDispatchSheet('siteContacts', [...dispatch.siteContacts, { ...DEFAULT_CONTACT }]);
    };

    const updateContact = (index: number, field: keyof SiteContact, value: string | boolean) => {
        const dispatch = settings.dispatchSheet || DEFAULT_DISPATCH;
        const updatedContacts = [...dispatch.siteContacts];
        updatedContacts[index] = { ...updatedContacts[index], [field]: value };
        updateDispatchSheet('siteContacts', updatedContacts);
    };

    const removeContact = (index: number) => {
        const dispatch = settings.dispatchSheet || DEFAULT_DISPATCH;
        const updatedContacts = dispatch.siteContacts.filter((_, i) => i !== index);
        updateDispatchSheet('siteContacts', updatedContacts);
    };

    const togglePPE = (ppe: string) => {
        const dispatch = settings.dispatchSheet || DEFAULT_DISPATCH;
        const currentPPE = dispatch.requiredPPE || [];
        if (currentPPE.includes(ppe)) {
            updateDispatchSheet('requiredPPE', currentPPE.filter(p => p !== ppe));
        } else {
            updateDispatchSheet('requiredPPE', [...currentPPE, ppe]);
        }
    };

    const toggleWorkDay = (day: string) => {
        const dispatch = settings.dispatchSheet || DEFAULT_DISPATCH;
        const currentDays = dispatch.workDays || [];
        if (currentDays.includes(day)) {
            updateDispatchSheet('workDays', currentDays.filter(d => d !== day));
        } else {
            updateDispatchSheet('workDays', [...currentDays, day]);
        }
    };

    const handleSave = () => {
        setSaved(true);
        setHasChanges(false);
        setTimeout(() => setSaved(false), 3000);
    };

    const renderGeneralTab = () => (
        <div className="settings-tab-content">
            {/* DOD Project Setting */}
            <Card className="settings-card">
                <CardBody>
                    <div className="settings-item">
                        <div className="settings-item-header">
                            <div className="settings-item-icon dod">
                                <Shield size={20} />
                            </div>
                            <div className="settings-item-info">
                                <h4>DOD Project</h4>
                                <p>Mark this project as a Department of Defense project requiring security clearances and DOD-specific compliance.</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.isDOD}
                                    onChange={(e) => updateSettings('isDOD', e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                        {settings.isDOD && (
                            <div className="settings-item-note warning">
                                <AlertTriangle size={14} />
                                <span>DOD compliance requirements will be enforced. Additional security forms will be added to the onboarding checklist.</span>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* ODRISA Project Setting */}
            <Card className="settings-card">
                <CardBody>
                    <div className="settings-item">
                        <div className="settings-item-header">
                            <div className="settings-item-icon odrisa">
                                <Building2 size={20} />
                            </div>
                            <div className="settings-item-info">
                                <h4>ODRISA Project</h4>
                                <p>Enable ODRISA compliance requirements. The ODRISA acknowledgment form will be automatically added to the onboarding process.</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.isODRISA}
                                    onChange={(e) => updateSettings('isODRISA', e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                        {settings.isODRISA && (
                            <div className="settings-item-note info">
                                <Info size={14} />
                                <span>ODRISA form will be added to the "Compliance" section of the onboarding checklist.</span>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* DISA Owner ID */}
            <Card className="settings-card">
                <CardBody>
                    <div className="settings-item">
                        <div className="settings-item-header">
                            <div className="settings-item-icon disa">
                                <Building2 size={20} />
                            </div>
                            <div className="settings-item-info">
                                <h4>DISA Owner ID</h4>
                                <p>Enter the site code for DISA API integration. If not specified, the default TCC code will be used.</p>
                            </div>
                        </div>
                        <div className="settings-input-group">
                            <input
                                type="text"
                                className="settings-input"
                                placeholder="Enter DISA Owner ID (default: TCC)"
                                value={settings.disaOwnerId || ''}
                                onChange={(e) => updateSettings('disaOwnerId', e.target.value)}
                            />
                            {!settings.disaOwnerId && (
                                <Badge variant="secondary" className="ml-2">Using Default: TCC</Badge>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );

    const renderPerDiemMileageTab = () => (
        <div className="settings-tab-content">
            {/* Per Diem Rules */}
            <Card className="settings-card">
                <CardBody>
                    <div className="settings-item">
                        <div className="settings-item-header">
                            <div className="settings-item-icon perdiem">
                                <DollarSign size={20} />
                            </div>
                            <div className="settings-item-info">
                                <h4>Per Diem Eligibility Rules</h4>
                                <p>Configure per diem eligibility limits for this project. Some clients may specify workforce percentage limitations.</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.perDiemRules.enabled}
                                    onChange={(e) => updatePerDiemRules('enabled', e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        {settings.perDiemRules.enabled && (
                            <div className="settings-expanded-content">
                                <div className="settings-form-row">
                                    <label className="settings-label">
                                        Maximum Eligible Percentage
                                        <span className="settings-label-hint">Max % of workforce eligible for Per Diem</span>
                                    </label>
                                    <div className="settings-slider-group">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={settings.perDiemRules.maxEligiblePercentage}
                                            onChange={(e) => updatePerDiemRules('maxEligiblePercentage', parseInt(e.target.value))}
                                            className="settings-slider"
                                        />
                                        <div className="settings-slider-value">
                                            <span className="value">{settings.perDiemRules.maxEligiblePercentage}</span>
                                            <span className="unit">%</span>
                                        </div>
                                    </div>
                                </div>

                                {settings.perDiemRules.maxEligiblePercentage < 100 && (
                                    <div className="settings-item-note warning">
                                        <AlertTriangle size={14} />
                                        <span>
                                            Only {settings.perDiemRules.maxEligiblePercentage}% of the workforce can receive Per Diem.
                                            Workers exceeding this limit will be informed they are not eligible even if otherwise qualified.
                                        </span>
                                    </div>
                                )}

                                <div className="settings-form-row">
                                    <label className="settings-label">Notes / Additional Rules</label>
                                    <textarea
                                        className="settings-textarea"
                                        placeholder="Enter any additional per diem rules or notes..."
                                        rows={3}
                                        value={settings.perDiemRules.notes || ''}
                                        onChange={(e) => updatePerDiemRules('notes', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Enhanced Mileage Rules */}
            <Card className="settings-card">
                <CardBody>
                    <div className="settings-item">
                        <div className="settings-item-header">
                            <div className="settings-item-icon mileage">
                                <Car size={20} />
                            </div>
                            <div className="settings-item-info">
                                <h4>Mileage Reimbursement Rules</h4>
                                <p>Configure client-specific mileage calculation rules including eligibility, rates, and caps.</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.mileageRules.enabled}
                                    onChange={(e) => updateMileageRules('enabled', e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        {settings.mileageRules.enabled && (
                            <div className="settings-expanded-content">
                                {/* Eligibility Section */}
                                <div className="settings-section-divider">
                                    <span>Eligibility</span>
                                </div>

                                <div className="settings-form-grid">
                                    <div className="settings-form-row">
                                        <label className="settings-label">
                                            Minimum Distance for Eligibility
                                            <span className="settings-label-hint">Miles required to qualify for reimbursement</span>
                                        </label>
                                        <div className="settings-input-with-suffix">
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="settings-input"
                                                placeholder="e.g., 50"
                                                value={settings.mileageRules.minDistanceForEligibility || ''}
                                                onChange={(e) => updateMileageRules('minDistanceForEligibility', parseInt(e.target.value) || undefined)}
                                            />
                                            <span className="input-suffix">miles</span>
                                        </div>
                                    </div>

                                    <div className="settings-form-row">
                                        <label className="settings-label">
                                            Maximum Miles Per Day
                                            <span className="settings-label-hint">Leave empty for no limit</span>
                                        </label>
                                        <div className="settings-input-with-suffix">
                                            <input
                                                type="number"
                                                min="0"
                                                className="settings-input"
                                                placeholder="No limit"
                                                value={settings.mileageRules.maxMilesPerDay || ''}
                                                onChange={(e) => updateMileageRules('maxMilesPerDay', parseInt(e.target.value) || undefined)}
                                            />
                                            <span className="input-suffix">miles</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Calculation Section */}
                                <div className="settings-section-divider">
                                    <span>Calculation</span>
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">Rate Type</label>
                                    <div className="settings-rate-type-selector">
                                        <button
                                            type="button"
                                            className={`rate-type-btn ${settings.mileageRules.rateType === 'IRS' ? 'active' : ''}`}
                                            onClick={() => {
                                                updateMileageRules('rateType', 'IRS' as MileageRateType);
                                                updateMileageRules('ratePerMile', IRS_RATE_2024);
                                            }}
                                        >
                                            <span className="rate-type-label">IRS Standard Rate</span>
                                            <span className="rate-type-value">${IRS_RATE_2024}/mile (2024)</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`rate-type-btn ${settings.mileageRules.rateType === 'CUSTOM' ? 'active' : ''}`}
                                            onClick={() => updateMileageRules('rateType', 'CUSTOM' as MileageRateType)}
                                        >
                                            <span className="rate-type-label">Custom Rate</span>
                                            <span className="rate-type-value">Set your own rate</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="settings-form-grid">
                                    <div className="settings-form-row">
                                        <label className="settings-label">
                                            Rate Per Mile
                                            <span className="settings-label-hint">{settings.mileageRules.rateType === 'IRS' ? 'Auto-filled based on IRS rate' : 'Enter custom rate'}</span>
                                        </label>
                                        <div className="settings-input-with-prefix">
                                            <span className="input-prefix">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="settings-input"
                                                placeholder="0.67"
                                                value={settings.mileageRules.ratePerMile || ''}
                                                onChange={(e) => updateMileageRules('ratePerMile', parseFloat(e.target.value) || 0)}
                                                disabled={settings.mileageRules.rateType === 'IRS'}
                                            />
                                        </div>
                                    </div>

                                    <div className="settings-form-row">
                                        <label className="settings-label">
                                            Mileage to Subtract
                                            <span className="settings-label-hint">Base commute miles to deduct from calculation</span>
                                        </label>
                                        <div className="settings-input-with-suffix">
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="settings-input"
                                                placeholder="e.g., 30"
                                                value={settings.mileageRules.mileageToSubtract || ''}
                                                onChange={(e) => updateMileageRules('mileageToSubtract', parseInt(e.target.value) || undefined)}
                                            />
                                            <span className="input-suffix">miles</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">
                                        CAP Amount
                                        <span className="settings-label-hint">Maximum reimbursement amount per day</span>
                                    </label>
                                    <div className="settings-input-with-prefix" style={{ maxWidth: '200px' }}>
                                        <span className="input-prefix">$</span>
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            className="settings-input"
                                            placeholder="No cap"
                                            value={settings.mileageRules.capAmount || ''}
                                            onChange={(e) => updateMileageRules('capAmount', parseFloat(e.target.value) || undefined)}
                                        />
                                    </div>
                                </div>

                                {/* Address to Address Calculation */}
                                <div className="settings-section-divider">
                                    <span>Distance Calculation</span>
                                </div>

                                <div className="settings-checkbox-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={settings.mileageRules.useAddressToAddress || false}
                                            onChange={(e) => updateMileageRules('useAddressToAddress', e.target.checked)}
                                        />
                                        <Navigation size={16} className="checkbox-icon" />
                                        <span className="checkbox-text">Calculate distance Address-to-Address (from worker's home to site)</span>
                                    </label>
                                </div>

                                {settings.mileageRules.useAddressToAddress && (
                                    <div className="settings-form-row">
                                        <label className="settings-label">
                                            Site Address for Calculation
                                            <span className="settings-label-hint">Address used to calculate distance from worker's home</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            placeholder="Enter site address (e.g., 1234 Industrial Blvd, Houston, TX 77001)"
                                            value={settings.mileageRules.siteAddress || ''}
                                            onChange={(e) => updateMileageRules('siteAddress', e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Approval */}
                                <div className="settings-section-divider">
                                    <span>Approval & Notes</span>
                                </div>

                                <div className="settings-checkbox-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={settings.mileageRules.requiresApproval || false}
                                            onChange={(e) => updateMileageRules('requiresApproval', e.target.checked)}
                                        />
                                        <span className="checkbox-text">Require manager approval for mileage claims</span>
                                    </label>
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">Notes / Additional Requirements</label>
                                    <textarea
                                        className="settings-textarea"
                                        placeholder="Enter any additional mileage rules or requirements..."
                                        rows={3}
                                        value={settings.mileageRules.notes || ''}
                                        onChange={(e) => updateMileageRules('notes', e.target.value)}
                                    />
                                </div>

                                {/* Calculation Preview */}
                                {settings.mileageRules.ratePerMile && (
                                    <div className="settings-item-note info">
                                        <Info size={14} />
                                        <span>
                                            <strong>Calculation Formula:</strong> (Actual Miles
                                            {settings.mileageRules.mileageToSubtract ? ` - ${settings.mileageRules.mileageToSubtract} base miles` : ''}
                                            ) × ${settings.mileageRules.ratePerMile}/mile
                                            {settings.mileageRules.capAmount ? `, capped at $${settings.mileageRules.capAmount}` : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );

    const renderDispatchSheetTab = () => {
        const dispatch = settings.dispatchSheet || DEFAULT_DISPATCH;

        return (
            <div className="settings-tab-content">
                {/* Site Information */}
                <Card className="settings-card">
                    <CardBody>
                        <div className="settings-item">
                            <div className="settings-item-header">
                                <div className="settings-item-icon site">
                                    <MapPin size={20} />
                                </div>
                                <div className="settings-item-info">
                                    <h4>Site Information</h4>
                                    <p>Location details and access instructions for workers reporting to the site.</p>
                                </div>
                            </div>

                            <div className="settings-expanded-content">
                                <div className="settings-form-row">
                                    <label className="settings-label">Site Name</label>
                                    <input
                                        type="text"
                                        className="settings-input"
                                        placeholder="e.g., Marathon Galveston Bay Refinery"
                                        value={dispatch.siteName}
                                        onChange={(e) => updateDispatchSheet('siteName', e.target.value)}
                                    />
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">Street Address</label>
                                    <input
                                        type="text"
                                        className="settings-input"
                                        placeholder="e.g., 2401 5th Ave South"
                                        value={dispatch.siteAddress}
                                        onChange={(e) => updateDispatchSheet('siteAddress', e.target.value)}
                                    />
                                </div>

                                <div className="settings-form-grid-3">
                                    <div className="settings-form-row">
                                        <label className="settings-label">City</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            placeholder="City"
                                            value={dispatch.siteCity}
                                            onChange={(e) => updateDispatchSheet('siteCity', e.target.value)}
                                        />
                                    </div>
                                    <div className="settings-form-row">
                                        <label className="settings-label">State</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            placeholder="TX"
                                            value={dispatch.siteState}
                                            onChange={(e) => updateDispatchSheet('siteState', e.target.value)}
                                        />
                                    </div>
                                    <div className="settings-form-row">
                                        <label className="settings-label">ZIP Code</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            placeholder="77590"
                                            value={dispatch.siteZip}
                                            onChange={(e) => updateDispatchSheet('siteZip', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">Gate Entry Instructions</label>
                                    <textarea
                                        className="settings-textarea"
                                        placeholder="e.g., Enter through Gate 3 on Industrial Blvd. Show badge at security checkpoint."
                                        rows={2}
                                        value={dispatch.gateInstructions || ''}
                                        onChange={(e) => updateDispatchSheet('gateInstructions', e.target.value)}
                                    />
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">Parking Instructions</label>
                                    <textarea
                                        className="settings-textarea"
                                        placeholder="e.g., Park in Contractor Lot B (blue striped spaces). Do not park in visitor lot."
                                        rows={2}
                                        value={dispatch.parkingInstructions || ''}
                                        onChange={(e) => updateDispatchSheet('parkingInstructions', e.target.value)}
                                    />
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">
                                        Plant Layout / Parking Map
                                        <span className="settings-label-hint">Upload an image showing parking areas and site entry points</span>
                                    </label>
                                    <div className="settings-image-upload">
                                        {dispatch.plantLayoutImageUrl ? (
                                            <div className="uploaded-image-preview">
                                                <img src={dispatch.plantLayoutImageUrl} alt="Plant Layout" />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="remove-image-btn"
                                                    onClick={() => updateDispatchSheet('plantLayoutImageUrl', '')}
                                                >
                                                    <Trash2 size={14} /> Remove
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="image-upload-placeholder">
                                                <Image size={32} />
                                                <span>Click to upload plant layout image</span>
                                                <Button variant="secondary" size="sm" leftIcon={<Upload size={14} />}>
                                                    Upload Image
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Work Schedule */}
                <Card className="settings-card">
                    <CardBody>
                        <div className="settings-item">
                            <div className="settings-item-header">
                                <div className="settings-item-icon schedule">
                                    <Clock size={20} />
                                </div>
                                <div className="settings-item-info">
                                    <h4>Work Schedule</h4>
                                    <p>Reporting times, shift hours, and work days for this project.</p>
                                </div>
                            </div>

                            <div className="settings-expanded-content">
                                <div className="settings-form-grid">
                                    <div className="settings-form-row">
                                        <label className="settings-label">Reporting Time</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            placeholder="e.g., 6:00 AM"
                                            value={dispatch.reportingTime}
                                            onChange={(e) => updateDispatchSheet('reportingTime', e.target.value)}
                                        />
                                    </div>
                                    <div className="settings-form-row">
                                        <label className="settings-label">Shift End Time</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            placeholder="e.g., 4:30 PM"
                                            value={dispatch.shiftEndTime || ''}
                                            onChange={(e) => updateDispatchSheet('shiftEndTime', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">
                                        Lunch Break Duration
                                        <span className="settings-label-hint">In minutes</span>
                                    </label>
                                    <div className="settings-input-with-suffix" style={{ maxWidth: '150px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="15"
                                            className="settings-input"
                                            placeholder="30"
                                            value={dispatch.lunchBreakDuration || ''}
                                            onChange={(e) => updateDispatchSheet('lunchBreakDuration', parseInt(e.target.value) || undefined)}
                                        />
                                        <span className="input-suffix">min</span>
                                    </div>
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">Work Days</label>
                                    <div className="settings-day-selector">
                                        {WORK_DAYS.map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                className={`day-btn ${(dispatch.workDays || []).includes(day) ? 'active' : ''}`}
                                                onClick={() => toggleWorkDay(day)}
                                            >
                                                {day.substring(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Contacts */}
                <Card className="settings-card">
                    <CardBody>
                        <div className="settings-item">
                            <div className="settings-item-header">
                                <div className="settings-item-icon contacts">
                                    <Phone size={20} />
                                </div>
                                <div className="settings-item-info">
                                    <h4>Site Contacts</h4>
                                    <p>Who to call if running late, emergencies, or questions about the site.</p>
                                </div>
                            </div>

                            <div className="settings-expanded-content">
                                <div className="settings-form-grid">
                                    <div className="settings-form-row">
                                        <label className="settings-label">
                                            Call If Running Late
                                            <span className="settings-label-hint">Primary contact for tardiness</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="settings-input"
                                            placeholder="(555) 123-4567"
                                            value={dispatch.lateCallNumber || ''}
                                            onChange={(e) => updateDispatchSheet('lateCallNumber', e.target.value)}
                                        />
                                    </div>
                                    <div className="settings-form-row">
                                        <label className="settings-label">
                                            Emergency Number
                                            <span className="settings-label-hint">For urgent situations</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="settings-input"
                                            placeholder="911"
                                            value={dispatch.emergencyNumber || ''}
                                            onChange={(e) => updateDispatchSheet('emergencyNumber', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="settings-contacts-list">
                                    <label className="settings-label">Site Contacts</label>
                                    {dispatch.siteContacts.map((contact, index) => (
                                        <div key={index} className="contact-row">
                                            <input
                                                type="text"
                                                className="settings-input"
                                                placeholder="Name"
                                                value={contact.name}
                                                onChange={(e) => updateContact(index, 'name', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="settings-input"
                                                placeholder="Title"
                                                value={contact.title}
                                                onChange={(e) => updateContact(index, 'title', e.target.value)}
                                            />
                                            <input
                                                type="tel"
                                                className="settings-input"
                                                placeholder="Phone"
                                                value={contact.phone}
                                                onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                            />
                                            <input
                                                type="email"
                                                className="settings-input"
                                                placeholder="Email (optional)"
                                                value={contact.email || ''}
                                                onChange={(e) => updateContact(index, 'email', e.target.value)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="remove-contact-btn"
                                                onClick={() => removeContact(index)}
                                                disabled={dispatch.siteContacts.length === 1}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        leftIcon={<Plus size={14} />}
                                        onClick={addContact}
                                    >
                                        Add Contact
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Requirements */}
                <Card className="settings-card">
                    <CardBody>
                        <div className="settings-item">
                            <div className="settings-item-header">
                                <div className="settings-item-icon ppe">
                                    <HardHat size={20} />
                                </div>
                                <div className="settings-item-info">
                                    <h4>Site Requirements</h4>
                                    <p>Required PPE, certifications, and other site-specific requirements.</p>
                                </div>
                            </div>

                            <div className="settings-expanded-content">
                                <div className="settings-form-row">
                                    <label className="settings-label">Required PPE</label>
                                    <div className="settings-ppe-selector">
                                        {PPE_OPTIONS.map(ppe => (
                                            <button
                                                key={ppe}
                                                type="button"
                                                className={`ppe-btn ${(dispatch.requiredPPE || []).includes(ppe) ? 'active' : ''}`}
                                                onClick={() => togglePPE(ppe)}
                                            >
                                                {ppe}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">Additional Site Requirements</label>
                                    <textarea
                                        className="settings-textarea"
                                        placeholder="e.g., Must complete site orientation before first shift. TWIC card required for refinery access."
                                        rows={3}
                                        value={dispatch.siteRequirements || ''}
                                        onChange={(e) => updateDispatchSheet('siteRequirements', e.target.value)}
                                    />
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">Safety Notes</label>
                                    <textarea
                                        className="settings-textarea"
                                        placeholder="e.g., No cell phones in operating areas. Speed limit 15 mph on-site."
                                        rows={2}
                                        value={dispatch.safetyNotes || ''}
                                        onChange={(e) => updateDispatchSheet('safetyNotes', e.target.value)}
                                    />
                                </div>

                                <div className="settings-form-row">
                                    <label className="settings-label">Additional Notes</label>
                                    <textarea
                                        className="settings-textarea"
                                        placeholder="Any other important information for workers..."
                                        rows={2}
                                        value={dispatch.additionalNotes || ''}
                                        onChange={(e) => updateDispatchSheet('additionalNotes', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    };

    return (
        <div className="project-settings-section">
            {/* Section Header */}
            <div className="settings-section-header">
                <div className="settings-header-content">
                    <h2>Settings & Rules</h2>
                    <p>Configure project-specific settings, compliance requirements, and reimbursement rules.</p>
                </div>
                <Button
                    variant={saved ? 'secondary' : 'primary'}
                    leftIcon={saved ? <Check size={16} /> : <Save size={16} />}
                    onClick={handleSave}
                    disabled={!hasChanges && !saved}
                >
                    {saved ? 'Saved' : 'Save Settings'}
                </Button>
            </div>

            {/* Tab Navigation */}
            <div className="settings-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'perdiem-mileage' && renderPerDiemMileageTab()}
            {activeTab === 'dispatch-sheet' && renderDispatchSheetTab()}
        </div>
    );
}
