import { useState, useEffect } from 'react';
import {
    Upload,
    FileImage,
    FileText,
    File,
    Camera,
    Info
} from 'lucide-react';
import { Modal, Button } from '../../../components/ui';
import { CollapsibleSection } from './CollapsibleSection';
import type { TaskCategory } from '../../../types';

interface CreateDocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: DocumentUploadTaskData) => void;
    initialData?: DocumentUploadTaskData;
    editMode?: boolean;
}

export interface DocumentUploadTaskData {
    name: string;
    description: string;
    category: TaskCategory;
    estimatedTime: number;
    required: boolean;
    instructions: string;
    documentTypeName: string;
    documentTypePreset: string;
    allowedFileTypes: string[];
    maxFileSize: number;
}

const fileTypeOptions = [
    { value: 'image/jpeg', label: 'JPEG', icon: <FileImage size={14} /> },
    { value: 'image/png', label: 'PNG', icon: <FileImage size={14} /> },
    { value: 'image/webp', label: 'WebP', icon: <FileImage size={14} /> },
    { value: 'application/pdf', label: 'PDF', icon: <FileText size={14} /> },
    { value: 'image/heic', label: 'HEIC', icon: <FileImage size={14} /> },
];

const documentTypePresets = [
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'passport', label: 'Passport' },
    { value: 'id_card', label: 'ID Card' },
    { value: 'work_permit', label: 'Work Permit' },
    { value: 'visa', label: 'Visa' },
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'social_security', label: 'Social Security Card' },
    { value: 'degree_certificate', label: 'Degree/Certificate' },
    { value: 'custom', label: 'Custom Document' },
];

export function CreateDocumentUploadModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    editMode = false
}: CreateDocumentUploadModalProps) {
    // Basic info state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<TaskCategory>('DOCUMENTS');
    const [estimatedTime, setEstimatedTime] = useState(5);
    const [required, setRequired] = useState(false);
    const [instructions, setInstructions] = useState('');

    // Document configuration
    const [documentTypeName, setDocumentTypeName] = useState('');
    const [selectedPreset, setSelectedPreset] = useState('custom');
    const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>(['image/jpeg', 'image/png', 'application/pdf']);
    const [maxFileSize, setMaxFileSize] = useState(10);

    // Validation
    const [errors, setErrors] = useState<{ name?: string; documentTypeName?: string }>({});

    // Populate form when editing
    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setDescription(initialData.description);
            setCategory(initialData.category);
            setEstimatedTime(initialData.estimatedTime);
            setRequired(initialData.required);
            setInstructions(initialData.instructions);
            setDocumentTypeName(initialData.documentTypeName);
            setSelectedPreset(initialData.documentTypePreset || 'custom');
            setAllowedFileTypes(initialData.allowedFileTypes);
            setMaxFileSize(initialData.maxFileSize);
        }
    }, [isOpen, initialData]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setCategory('DOCUMENTS');
        setEstimatedTime(5);
        setRequired(false);
        setInstructions('');
        setDocumentTypeName('');
        setSelectedPreset('custom');
        setAllowedFileTypes(['image/jpeg', 'image/png', 'application/pdf']);
        setMaxFileSize(10);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handlePresetChange = (presetValue: string) => {
        setSelectedPreset(presetValue);
        const preset = documentTypePresets.find(p => p.value === presetValue);
        if (preset && presetValue !== 'custom') {
            setDocumentTypeName(preset.label);
        }
    };

    const toggleFileType = (fileType: string) => {
        if (allowedFileTypes.includes(fileType)) {
            setAllowedFileTypes(allowedFileTypes.filter(t => t !== fileType));
        } else {
            setAllowedFileTypes([...allowedFileTypes, fileType]);
        }
    };

    const validate = (): boolean => {
        const newErrors: { name?: string; documentTypeName?: string } = {};
        if (!name.trim()) {
            newErrors.name = 'Task name is required';
        }
        if (!documentTypeName.trim()) {
            newErrors.documentTypeName = 'Document type name is required';
        }
        if (allowedFileTypes.length === 0) {
            newErrors.documentTypeName = 'At least one file type must be selected';
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
            documentTypeName: documentTypeName.trim(),
            documentTypePreset: selectedPreset,
            allowedFileTypes,
            maxFileSize
        });
        handleClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={editMode ? "Edit Document Upload Task" : "Create Document Upload Task"}
            size="lg"
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
                <CollapsibleSection title="Basic Information" icon={<Upload size={16} />}>
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">Task Name *</label>
                            <input
                                type="text"
                                className={`input ${errors.name ? 'input-error' : ''}`}
                                placeholder="e.g., Upload Driver's License"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {errors.name && <span className="input-error-message">{errors.name}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Description</label>
                            <textarea
                                className="input textarea"
                                placeholder="Describe what document needs to be uploaded..."
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
                                    <option value="DOCUMENTS">Documents</option>
                                    <option value="FORMS">Forms</option>
                                    <option value="CERTIFICATIONS">Certifications</option>
                                    <option value="COMPLIANCE">Compliance</option>
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
                                id="doc-required"
                                checked={required}
                                onChange={(e) => setRequired(e.target.checked)}
                            />
                            <label htmlFor="doc-required">This task is required for onboarding completion</label>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Document Configuration */}
                <CollapsibleSection title="Document Configuration" icon={<File size={16} />}>
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">Document Type Preset</label>
                            <select
                                className="input select"
                                value={selectedPreset}
                                onChange={(e) => handlePresetChange(e.target.value)}
                            >
                                {documentTypePresets.map(preset => (
                                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Document Type Name *</label>
                            <input
                                type="text"
                                className={`input ${errors.documentTypeName ? 'input-error' : ''}`}
                                placeholder="e.g., Driver's License"
                                value={documentTypeName}
                                onChange={(e) => setDocumentTypeName(e.target.value)}
                            />
                            {errors.documentTypeName && <span className="input-error-message">{errors.documentTypeName}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Accepted File Types</label>
                            <div className="file-type-selector">
                                {fileTypeOptions.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`file-type-chip ${allowedFileTypes.includes(option.value) ? 'selected' : ''}`}
                                        onClick={() => toggleFileType(option.value)}
                                    >
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Maximum File Size (MB)</label>
                            <div className="file-size-slider">
                                <input
                                    type="range"
                                    min={1}
                                    max={50}
                                    value={maxFileSize}
                                    onChange={(e) => setMaxFileSize(Number(e.target.value))}
                                    className="slider"
                                />
                                <span className="file-size-value">{maxFileSize} MB</span>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Instructions */}
                <CollapsibleSection title="Instructions" icon={<Info size={16} />} defaultOpen={false}>
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">Instructions for the user</label>
                            <textarea
                                className="input textarea"
                                placeholder="Provide instructions on how to capture and upload the document..."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="instructions-tips">
                            <div className="tip-card">
                                <Camera size={16} />
                                <span>Ensure the entire document is visible in the image</span>
                            </div>
                            <div className="tip-card">
                                <FileImage size={16} />
                                <span>Photos should be clear and readable</span>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>
            </div>
        </Modal>
    );
}
