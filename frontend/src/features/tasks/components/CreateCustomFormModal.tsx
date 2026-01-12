import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import {
    FileText,
    Plus,
    Settings,
    Trash2,
    Type,
    AlignLeft,
    Hash,
    Mail,
    Phone,
    Calendar,
    ListOrdered,
    CheckSquare,
    Upload,
    PenTool
} from 'lucide-react';
import { Modal, Button, Badge } from '../../../components/ui';
import { CollapsibleSection } from './CollapsibleSection';
import { SortableFieldItem } from './SortableFieldItem';
import type { FormField, TaskCategory } from '../../../types';

interface CreateCustomFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: CustomFormTaskData) => void;
    initialData?: CustomFormTaskData;
    editMode?: boolean;
}

export interface CustomFormTaskData {
    name: string;
    description: string;
    category: TaskCategory;
    estimatedTime: number;
    required: boolean;
    instructions: string;
    formFields: FormField[];
}

const fieldTypeConfig: Record<FormField['type'], { icon: React.ReactNode; label: string; description: string }> = {
    TEXT: { icon: <Type size={16} />, label: 'Text', description: 'Single line text input' },
    TEXTAREA: { icon: <AlignLeft size={16} />, label: 'Text Area', description: 'Multi-line text input' },
    NUMBER: { icon: <Hash size={16} />, label: 'Number', description: 'Numeric input' },
    EMAIL: { icon: <Mail size={16} />, label: 'Email', description: 'Email address input' },
    PHONE: { icon: <Phone size={16} />, label: 'Phone', description: 'Phone number input' },
    DATE: { icon: <Calendar size={16} />, label: 'Date', description: 'Date picker' },
    SELECT: { icon: <ListOrdered size={16} />, label: 'Dropdown', description: 'Single select dropdown' },
    MULTI_SELECT: { icon: <ListOrdered size={16} />, label: 'Multi-Select', description: 'Multiple selection' },
    RADIO: { icon: <CheckSquare size={16} />, label: 'Radio', description: 'Single choice options' },
    CHECKBOX: { icon: <CheckSquare size={16} />, label: 'Checkbox', description: 'Yes/No checkbox' },
    FILE: { icon: <Upload size={16} />, label: 'File Upload', description: 'File upload field' },
    SIGNATURE: { icon: <PenTool size={16} />, label: 'Signature', description: 'Digital signature capture' },
};

const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function CreateCustomFormModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    editMode = false
}: CreateCustomFormModalProps) {
    // Basic info state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<TaskCategory>('FORMS');
    const [estimatedTime, setEstimatedTime] = useState(15);
    const [required, setRequired] = useState(false);
    const [instructions, setInstructions] = useState('');

    // Form fields state
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [showFieldTypePicker, setShowFieldTypePicker] = useState(false);

    // Validation
    const [errors, setErrors] = useState<{ name?: string }>({});

    // Populate form when editing
    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setDescription(initialData.description);
            setCategory(initialData.category);
            setEstimatedTime(initialData.estimatedTime);
            setRequired(initialData.required);
            setInstructions(initialData.instructions);
            setFormFields(initialData.formFields || []);
        }
    }, [isOpen, initialData]);

    const selectedField = formFields.find(f => f.id === selectedFieldId);

    const resetForm = () => {
        setName('');
        setDescription('');
        setCategory('FORMS');
        setEstimatedTime(15);
        setRequired(false);
        setInstructions('');
        setFormFields([]);
        setSelectedFieldId(null);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const addField = (type: FormField['type']) => {
        const fieldNum = formFields.length + 1;
        const newField: FormField = {
            id: generateId(),
            name: `Field ${fieldNum}`,
            label: `New ${fieldTypeConfig[type].label}`,
            type,
            required: false,
            placeholder: '',
            helpText: '',
            options: type === 'SELECT' || type === 'MULTI_SELECT' || type === 'RADIO'
                ? [{ value: 'option1', label: 'Option 1' }]
                : undefined,
        };
        setFormFields([...formFields, newField]);
        setSelectedFieldId(newField.id);
        setShowFieldTypePicker(false);
    };

    const updateField = (fieldId: string, updates: Partial<FormField>) => {
        setFormFields(formFields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    };

    const removeField = (fieldId: string) => {
        setFormFields(formFields.filter(f => f.id !== fieldId));
        if (selectedFieldId === fieldId) {
            setSelectedFieldId(null);
        }
    };

    const moveField = (fieldId: string, direction: 'up' | 'down') => {
        const index = formFields.findIndex(f => f.id === fieldId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === formFields.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        setFormFields(arrayMove(formFields, index, newIndex));
    };

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = formFields.findIndex(f => f.id === active.id);
            const newIndex = formFields.findIndex(f => f.id === over.id);
            setFormFields(arrayMove(formFields, oldIndex, newIndex));
        }
    };

    const updateFieldOption = (fieldId: string, optionIndex: number, updates: { value?: string; label?: string }) => {
        setFormFields(formFields.map(f => {
            if (f.id !== fieldId || !f.options) return f;
            const newOptions = [...f.options];
            newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
            return { ...f, options: newOptions };
        }));
    };

    const addFieldOption = (fieldId: string) => {
        setFormFields(formFields.map(f => {
            if (f.id !== fieldId || !f.options) return f;
            return {
                ...f,
                options: [...f.options, { value: `option${f.options.length + 1}`, label: `Option ${f.options.length + 1}` }]
            };
        }));
    };

    const removeFieldOption = (fieldId: string, optionIndex: number) => {
        setFormFields(formFields.map(f => {
            if (f.id !== fieldId || !f.options) return f;
            return { ...f, options: f.options.filter((_, i) => i !== optionIndex) };
        }));
    };

    const validate = (): boolean => {
        const newErrors: { name?: string } = {};
        if (!name.trim()) {
            newErrors.name = 'Task name is required';
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
            formFields
        });
        handleClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={editMode ? "Edit Custom Form Task" : "Create Custom Form Task"}
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
                <div className="create-task-layout">
                    {/* Left Panel - Task Info + Field List */}
                    <div className="create-task-main">
                        {/* Basic Information */}
                        <CollapsibleSection title="Basic Information" icon={<FileText size={16} />}>
                            <div className="form-section">
                                <div className="input-group">
                                    <label className="input-label">Task Name *</label>
                                    <input
                                        type="text"
                                        className={`input ${errors.name ? 'input-error' : ''}`}
                                        placeholder="e.g., Employee Information Form"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    {errors.name && <span className="input-error-message">{errors.name}</span>}
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Description</label>
                                    <textarea
                                        className="input textarea"
                                        placeholder="Describe what this form collects..."
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
                                            <option value="FORMS">Forms</option>
                                            <option value="DOCUMENTS">Documents</option>
                                            <option value="CERTIFICATIONS">Certifications</option>
                                            <option value="TRAININGS">Trainings</option>
                                            <option value="COMPLIANCE">Compliance</option>
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
                                        id="task-required"
                                        checked={required}
                                        onChange={(e) => setRequired(e.target.checked)}
                                    />
                                    <label htmlFor="task-required">This task is required for onboarding completion</label>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Form Fields Builder */}
                        <CollapsibleSection
                            title="Form Fields"
                            icon={<Settings size={16} />}
                            badge={<Badge variant="primary">{formFields.length}</Badge>}
                        >
                            <div className="form-builder">
                                {formFields.length === 0 ? (
                                    <div className="form-builder-empty">
                                        <div className="text-muted text-center p-6">
                                            <FileText size={32} className="mb-2" style={{ opacity: 0.3, margin: '0 auto' }} />
                                            <p className="mb-4">No fields added yet</p>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                leftIcon={<Plus size={14} />}
                                                onClick={() => setShowFieldTypePicker(true)}
                                            >
                                                Add First Field
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={formFields.map(f => f.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="field-list">
                                                {formFields.map((field, index) => {
                                                    const config = fieldTypeConfig[field.type];
                                                    return (
                                                        <SortableFieldItem
                                                            key={field.id}
                                                            field={field}
                                                            index={index}
                                                            totalFields={formFields.length}
                                                            isSelected={field.id === selectedFieldId}
                                                            config={config}
                                                            onSelect={() => setSelectedFieldId(field.id)}
                                                            onMoveUp={() => moveField(field.id, 'up')}
                                                            onMoveDown={() => moveField(field.id, 'down')}
                                                            onRemove={() => removeField(field.id)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                )}

                                {formFields.length > 0 && (
                                    <div className="form-builder-actions">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            leftIcon={<Plus size={14} />}
                                            onClick={() => setShowFieldTypePicker(true)}
                                        >
                                            Add Field
                                        </Button>
                                    </div>
                                )}

                                {/* Field Type Picker */}
                                {showFieldTypePicker && (
                                    <div className="field-type-picker-overlay" onClick={() => setShowFieldTypePicker(false)}>
                                        <div className="field-type-picker" onClick={e => e.stopPropagation()}>
                                            <div className="field-type-picker-header">
                                                <h4>Select Field Type</h4>
                                                <button
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => setShowFieldTypePicker(false)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div className="field-type-picker-grid">
                                                {(Object.entries(fieldTypeConfig) as [FormField['type'], typeof fieldTypeConfig[FormField['type']]][]).map(([type, config]) => (
                                                    <button
                                                        key={type}
                                                        className="field-type-option"
                                                        onClick={() => addField(type)}
                                                    >
                                                        <div className="field-type-option-icon">{config.icon}</div>
                                                        <div className="field-type-option-label">{config.label}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>

                        {/* Instructions */}
                        <CollapsibleSection title="Instructions" defaultOpen={false}>
                            <div className="input-group">
                                <label className="input-label">Instructions for the user</label>
                                <textarea
                                    className="input textarea"
                                    placeholder="Provide instructions on how to complete this form..."
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CollapsibleSection>
                    </div>

                    {/* Right Panel - Field Configuration */}
                    <div className="create-task-sidebar">
                        <div className="field-config-panel">
                            <h4 className="field-config-title">Field Configuration</h4>
                            {selectedField ? (
                                <div className="field-config-form">
                                    <div className="input-group">
                                        <label className="input-label">Field Name *</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={selectedField.name}
                                            onChange={(e) => updateField(selectedField.id, {
                                                name: e.target.value,
                                                label: e.target.value
                                            })}
                                            placeholder="First Name"
                                        />
                                        <span className="input-helper">Displayed as label and used for data storage</span>
                                    </div>

                                    {selectedField.type !== 'CHECKBOX' && (
                                        <div className="input-group">
                                            <label className="input-label">Placeholder</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={selectedField.placeholder || ''}
                                                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="input-group">
                                        <label className="input-label">Help Text</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={selectedField.helpText || ''}
                                            onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                                            placeholder="Additional guidance for the user"
                                        />
                                    </div>

                                    <div className="checkbox">
                                        <input
                                            type="checkbox"
                                            id="field-required"
                                            checked={selectedField.required}
                                            onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                        />
                                        <label htmlFor="field-required">Required field</label>
                                    </div>

                                    {/* Options for Select/Radio/Multi-Select */}
                                    {(selectedField.type === 'SELECT' || selectedField.type === 'MULTI_SELECT' || selectedField.type === 'RADIO') && (
                                        <div className="field-options-section">
                                            <label className="input-label">Options</label>
                                            <div className="field-options-list">
                                                {selectedField.options?.map((option, index) => (
                                                    <div key={index} className="field-option-row">
                                                        <input
                                                            type="text"
                                                            className="input"
                                                            value={option.label}
                                                            onChange={(e) => updateFieldOption(selectedField.id, index, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                                                            placeholder="Option label"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost btn-icon btn-sm"
                                                            onClick={() => removeFieldOption(selectedField.id, index)}
                                                            disabled={selectedField.options!.length <= 1}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                leftIcon={<Plus size={14} />}
                                                onClick={() => addFieldOption(selectedField.id)}
                                            >
                                                Add Option
                                            </Button>
                                        </div>
                                    )}

                                    {/* PDF Configuration Removed */}
                                </div>
                            ) : (
                                <div className="field-config-empty">
                                    <Settings size={24} style={{ opacity: 0.3 }} />
                                    <p>Select a field to configure</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
