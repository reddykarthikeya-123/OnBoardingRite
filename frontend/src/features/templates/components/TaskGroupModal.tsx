import { useState, useEffect } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { TaskGroup, TaskCategory } from '../../../types';

interface TaskGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (group: Omit<TaskGroup, 'id' | 'order' | 'tasks'> & { id?: string }) => void;
    group?: TaskGroup | null;
    mode: 'create' | 'edit';
}

const categoryOptions: { value: TaskCategory; label: string }[] = [
    { value: 'FORMS', label: 'Forms' },
    { value: 'DOCUMENTS', label: 'Documents' },
    { value: 'CERTIFICATIONS', label: 'Certifications' },
    { value: 'TRAININGS', label: 'Trainings' },
    { value: 'COMPLIANCE', label: 'Compliance' },
    { value: 'INTEGRATION', label: 'Integration' },
];

export function TaskGroupModal({
    isOpen,
    onClose,
    onSave,
    group,
    mode,
}: TaskGroupModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<TaskCategory>('FORMS');
    const [errors, setErrors] = useState<{ name?: string }>({});

    // Reset form when modal opens/closes or group changes
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && group) {
                setName(group.name);
                setDescription(group.description || '');
                setCategory(group.category);
            } else {
                setName('');
                setDescription('');
                setCategory('FORMS');
            }
            setErrors({});
        }
    }, [isOpen, mode, group]);

    const validate = (): boolean => {
        const newErrors: { name?: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        onSave({
            id: group?.id,
            name: name.trim(),
            description: description.trim() || undefined,
            category,
        });
        onClose();
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={mode === 'create' ? 'Add Task Group' : 'Edit Task Group'}
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {mode === 'create' ? 'Add Group' : 'Update Group'}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <div className="input-group">
                    <label className="input-label">Name *</label>
                    <input
                        type="text"
                        className={`input ${errors.name ? 'input-error' : ''}`}
                        placeholder="e.g., Required Documents"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    {errors.name && (
                        <span className="input-error-message">{errors.name}</span>
                    )}
                </div>

                <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea
                        className="input textarea"
                        placeholder="Optional description for this task group..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Category *</label>
                    <select
                        className="input select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    >
                        {categoryOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </Modal>
    );
}
