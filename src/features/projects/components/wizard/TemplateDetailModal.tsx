import { X, Layers, Clock, FileText, Upload, Link2, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge, Button } from '../../../../components/ui';
import { mockTasks } from '../../../../data';
import type { ChecklistTemplate, TaskGroup, Task } from '../../../../types';

interface TemplateDetailModalProps {
    template: ChecklistTemplate;
    isOpen: boolean;
    onClose: () => void;
    onSelect: () => void;
    isSelected: boolean;
}

const getTaskTypeIcon = (type: string) => {
    switch (type) {
        case 'CUSTOM_FORM': return FileText;
        case 'DOCUMENT_UPLOAD': return Upload;
        case 'REDIRECT': return Link2;
        case 'REST_API': return Settings;
        default: return FileText;
    }
};

const getCategoryColor = (category: string): 'primary' | 'secondary' | 'warning' | 'danger' | 'success' => {
    switch (category) {
        case 'FORMS': return 'primary';
        case 'DOCUMENTS': return 'secondary';
        case 'CERTIFICATIONS': return 'success';
        case 'COMPLIANCE': return 'danger';
        case 'TRAININGS': return 'warning';
        case 'INTEGRATION': return 'primary';
        default: return 'secondary';
    }
};

function getTasksForGroup(group: TaskGroup): Task[] {
    return group.tasks.map(taskId => mockTasks.find(t => t.id === taskId)).filter(Boolean) as Task[];
}

export function TemplateDetailModal({ template, isOpen, onClose, onSelect, isSelected }: TemplateDetailModalProps) {
    if (!isOpen) return null;

    const totalTasks = template.taskGroups.reduce((acc, group) => acc + group.tasks.length, 0);
    const requiredTasks = template.taskGroups.reduce((acc, group) => {
        const tasks = getTasksForGroup(group);
        return acc + tasks.filter(t => t.required).length;
    }, 0);

    return (
        <>
            <div className="modal-backdrop" onClick={onClose} />
            <div className="modal modal-xl template-detail-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="template-detail-header">
                    <div className="template-detail-header-content">
                        <div className="template-detail-header-left">
                            <h2 className="template-detail-title">{template.name}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge variant={template.isActive ? 'success' : 'secondary'}>
                                    {template.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <span className="text-sm text-muted">Version {template.version}</span>
                                {template.clientName && (
                                    <span className="text-sm text-muted">• {template.clientName}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant={isSelected ? 'secondary' : 'primary'}
                                onClick={onSelect}
                            >
                                {isSelected ? (
                                    <>
                                        <CheckCircle size={16} />
                                        Selected
                                    </>
                                ) : (
                                    'Select Template'
                                )}
                            </Button>
                            <Button variant="ghost" className="btn-icon" onClick={onClose}>
                                <X size={20} />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="template-detail-stats">
                        <div className="template-detail-stat">
                            <Layers size={18} />
                            <span className="template-detail-stat-value">{template.taskGroups.length}</span>
                            <span className="template-detail-stat-label">Task Groups</span>
                        </div>
                        <div className="template-detail-stat">
                            <FileText size={18} />
                            <span className="template-detail-stat-value">{totalTasks}</span>
                            <span className="template-detail-stat-label">Total Tasks</span>
                        </div>
                        <div className="template-detail-stat">
                            <AlertCircle size={18} />
                            <span className="template-detail-stat-value">{requiredTasks}</span>
                            <span className="template-detail-stat-label">Required</span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="template-detail-body">
                    <p className="template-detail-description">{template.description}</p>

                    {/* Task Groups */}
                    <div className="template-detail-groups">
                        {template.taskGroups.map((group, groupIndex) => {
                            const tasks = getTasksForGroup(group);

                            return (
                                <div key={group.id} className="template-group-card">
                                    <div className="template-group-header">
                                        <div className="template-group-number">{groupIndex + 1}</div>
                                        <div className="template-group-info">
                                            <h3 className="template-group-name">{group.name}</h3>
                                            {group.description && (
                                                <p className="template-group-description">{group.description}</p>
                                            )}
                                        </div>
                                        <Badge variant={getCategoryColor(group.category)}>
                                            {group.category}
                                        </Badge>
                                    </div>

                                    <div className="template-group-tasks">
                                        {tasks.map((task) => {
                                            const TypeIcon = getTaskTypeIcon(task.type);

                                            return (
                                                <div key={task.id} className="template-task-row">
                                                    <div className="template-task-icon">
                                                        <TypeIcon size={16} />
                                                    </div>
                                                    <div className="template-task-info">
                                                        <span className="template-task-name">{task.name}</span>
                                                        <span className="template-task-description">{task.description}</span>
                                                    </div>
                                                    <div className="template-task-meta">
                                                        {task.required && (
                                                            <Badge variant="danger" className="badge-sm">Required</Badge>
                                                        )}
                                                        {task.configuration?.estimatedTime && (
                                                            <span className="template-task-time">
                                                                <Clock size={12} />
                                                                {task.configuration.estimatedTime >= 60
                                                                    ? `${Math.round(task.configuration.estimatedTime / 60)}h`
                                                                    : `${task.configuration.estimatedTime}m`}
                                                            </span>
                                                        )}
                                                        <Badge variant="secondary" className="badge-sm">{task.type.replace('_', ' ')}</Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Eligibility Rules */}
                    {template.eligibilityRules && template.eligibilityRules.length > 0 && (
                        <div className="template-eligibility">
                            <h4 className="template-eligibility-title">Eligibility Rules</h4>
                            <div className="template-eligibility-rules">
                                {template.eligibilityRules.map((rule, index) => (
                                    <div key={index} className="template-eligibility-rule">
                                        <code>{rule.field}</code>
                                        <span>{rule.operator}</span>
                                        <code>{rule.value}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
