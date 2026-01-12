import { useState, useEffect } from 'react';
import { FileText, Upload, Zap, ExternalLink } from 'lucide-react';
import { Modal, Button } from '../../../components/ui';
import type { Task, TaskType } from '../../../types';

interface TaskEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskId: string, updates: { name: string; description: string; required: boolean }) => void;
    task: Task | null;
}

const taskTypeConfig: Record<TaskType, { icon: React.ReactNode; color: string; label: string }> = {
    CUSTOM_FORM: { icon: <FileText size={14} />, color: 'primary', label: 'Custom Form' },
    DOCUMENT_UPLOAD: { icon: <Upload size={14} />, color: 'secondary', label: 'Document Upload' },
    REST_API: { icon: <Zap size={14} />, color: 'accent', label: 'REST API' },
    REDIRECT: { icon: <ExternalLink size={14} />, color: 'neutral', label: 'Redirect Task' },
};

export function TaskEditModal({
    isOpen,
    onClose,
    onSave,
    task,
}: TaskEditModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [required, setRequired] = useState(false);
    const [errors, setErrors] = useState<{ name?: string }>({});

    // Reset form when modal opens or task changes
    useEffect(() => {
        if (isOpen && task) {
            setName(task.name);
            setDescription(task.description);
            setRequired(task.required);
            setErrors({});
        }
    }, [isOpen, task]);

    const validate = (): boolean => {
        const newErrors: { name?: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate() || !task) return;

        onSave(task.id, {
            name: name.trim(),
            description: description.trim(),
            required,
        });
        onClose();
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    if (!task) return null;

    const typeConfig = taskTypeConfig[task.type];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Edit Task"
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        Update Task
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                {/* Task Type (read-only) */}
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--color-neutral-50)' }}>
                    <div className={`task-card-type ${typeConfig.color}`}>
                        {typeConfig.icon}
                        {typeConfig.label}
                    </div>
                    <span className="text-sm text-muted">Task type cannot be changed</span>
                </div>

                <div className="input-group">
                    <label className="input-label">Name *</label>
                    <input
                        type="text"
                        className={`input ${errors.name ? 'input-error' : ''}`}
                        placeholder="Task name"
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
                        placeholder="Task description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="checkbox">
                    <input
                        type="checkbox"
                        id="task-required"
                        checked={required}
                        onChange={(e) => setRequired(e.target.checked)}
                    />
                    <label htmlFor="task-required">
                        This task is required for onboarding completion
                    </label>
                </div>

                {/* Configuration preview (read-only) */}
                {task.configuration.estimatedTime && (
                    <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                        <h4 className="font-medium text-sm mb-2">Configuration</h4>
                        <div className="text-sm text-secondary">
                            Estimated time: {task.configuration.estimatedTime} minutes
                        </div>
                        <p className="text-xs text-muted mt-2">
                            To modify task configuration, edit the task in the Task Library.
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
