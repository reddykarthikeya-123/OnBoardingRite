import { useState } from 'react';
import { Search, CheckCircle2, Layers, FileText, Copy, Folder, ChevronDown, ChevronRight, Info, AlertCircle } from 'lucide-react';
import { Badge, Card, CardBody } from '../../../../components/ui';
import { mockTemplates, mockProjects } from '../../../../data';
import type { ProjectFormData } from '../ProjectSetupWizard';
import type { ChecklistTemplate, Project } from '../../../../types';

type SourceOption = 'blank' | 'template' | 'project';

interface TemplateSelectionStepProps {
    data: ProjectFormData;
    onUpdate: (data: Partial<ProjectFormData>) => void;
}

export function TemplateSelectionStep({ data, onUpdate }: TemplateSelectionStepProps) {
    const [sourceOption, setSourceOption] = useState<SourceOption | null>(
        data.templateId ? 'template' : null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const filteredTemplates = mockTemplates.filter((template) =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredProjects = mockProjects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        project.taskGroups.length > 0
    );

    const selectedTemplate = mockTemplates.find((t) => t.id === data.templateId);
    const selectedProject = mockProjects.find((p) => p.id === data.sourceProjectId);

    const handleSelectOption = (option: SourceOption) => {
        setSourceOption(option);
        if (option === 'blank') {
            onUpdate({ templateId: '', templateName: '', sourceProjectId: undefined, taskGroups: [] });
        } else {
            onUpdate({ templateId: '', templateName: '', sourceProjectId: undefined });
        }
    };

    const handleSelectTemplate = (template: ChecklistTemplate) => {
        onUpdate({
            templateId: template.id,
            templateName: template.name,
            sourceProjectId: undefined,
            taskGroups: template.taskGroups
        });
    };

    const handleSelectProject = (project: Project) => {
        onUpdate({
            templateId: '',
            templateName: `Copy of ${project.name}`,
            sourceProjectId: project.id,
            taskGroups: project.taskGroups
        });
    };

    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    const getPreviewData = () => {
        if (selectedTemplate) {
            return { name: selectedTemplate.name, taskGroups: selectedTemplate.taskGroups, type: 'template' };
        }
        if (selectedProject) {
            return { name: selectedProject.name, taskGroups: selectedProject.taskGroups, type: 'project' };
        }
        return null;
    };

    const previewData = getPreviewData();

    return (
        <div className="template-selection-v2">
            {/* Step 1: Choose Source Option */}
            <div className="form-section">
                <h2 className="form-section-title">How would you like to set up tasks?</h2>
                <p className="text-sm text-secondary mb-4">
                    Choose how you want to configure the onboarding checklist for this project
                </p>

                <div className="source-options-grid">
                    {/* Start Blank */}
                    <button
                        className={`source-option-card ${sourceOption === 'blank' ? 'selected' : ''}`}
                        onClick={() => handleSelectOption('blank')}
                    >
                        <div className="source-option-icon blank">
                            <FileText size={28} />
                        </div>
                        <div className="source-option-content">
                            <span className="source-option-title">Start from Blank</span>
                            <span className="source-option-desc">
                                Create a custom checklist from scratch
                            </span>
                        </div>
                        {sourceOption === 'blank' && (
                            <CheckCircle2 size={20} className="source-option-check" />
                        )}
                    </button>

                    {/* Copy from Template */}
                    <button
                        className={`source-option-card ${sourceOption === 'template' ? 'selected' : ''}`}
                        onClick={() => handleSelectOption('template')}
                    >
                        <div className="source-option-icon template">
                            <Layers size={28} />
                        </div>
                        <div className="source-option-content">
                            <span className="source-option-title">Copy from Template</span>
                            <span className="source-option-desc">
                                Use a pre-built checklist template
                            </span>
                        </div>
                        {sourceOption === 'template' && (
                            <CheckCircle2 size={20} className="source-option-check" />
                        )}
                    </button>

                    {/* Copy from Project */}
                    <button
                        className={`source-option-card ${sourceOption === 'project' ? 'selected' : ''}`}
                        onClick={() => handleSelectOption('project')}
                    >
                        <div className="source-option-icon project">
                            <Copy size={28} />
                        </div>
                        <div className="source-option-content">
                            <span className="source-option-title">Copy from Project</span>
                            <span className="source-option-desc">
                                Duplicate tasks from an existing project
                            </span>
                        </div>
                        {sourceOption === 'project' && (
                            <CheckCircle2 size={20} className="source-option-check" />
                        )}
                    </button>
                </div>
            </div>

            {/* Step 2: Selection Panel (for template or project) */}
            {sourceOption === 'template' && (
                <div className="form-section">
                    <h3 className="form-section-title">Select a Template</h3>

                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.25rem' }}
                        />
                    </div>

                    <div className="source-selection-list">
                        {filteredTemplates.map((template) => {
                            const totalTasks = template.taskGroups.reduce((acc, g) => acc + g.tasks.length, 0);
                            const isSelected = data.templateId === template.id;

                            return (
                                <button
                                    key={template.id}
                                    className={`source-selection-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    <div className="source-selection-item-content">
                                        <span className="source-selection-item-name">{template.name}</span>
                                        <span className="source-selection-item-meta">
                                            {template.taskGroups.length} groups • {totalTasks} tasks
                                        </span>
                                    </div>
                                    {isSelected && <CheckCircle2 size={18} className="source-selection-check" />}
                                </button>
                            );
                        })}
                        {filteredTemplates.length === 0 && (
                            <div className="text-center py-6 text-muted">
                                <p>No templates found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {sourceOption === 'project' && (
                <div className="form-section">
                    <h3 className="form-section-title">Select a Project to Copy</h3>

                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.25rem' }}
                        />
                    </div>

                    <div className="source-selection-list">
                        {filteredProjects.map((project) => {
                            const totalTasks = project.taskGroups.reduce((acc, g) => acc + g.tasks.length, 0);
                            const isSelected = data.sourceProjectId === project.id;

                            return (
                                <button
                                    key={project.id}
                                    className={`source-selection-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelectProject(project)}
                                >
                                    <div className="source-selection-item-icon">
                                        <Folder size={18} />
                                    </div>
                                    <div className="source-selection-item-content">
                                        <span className="source-selection-item-name">{project.name}</span>
                                        <span className="source-selection-item-meta">
                                            {project.clientName} • {project.taskGroups.length} groups • {totalTasks} tasks
                                        </span>
                                    </div>
                                    {isSelected && <CheckCircle2 size={18} className="source-selection-check" />}
                                </button>
                            );
                        })}
                        {filteredProjects.length === 0 && (
                            <div className="text-center py-6 text-muted">
                                <p>No projects found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Preview Section */}
            {previewData && (
                <div className="form-section">
                    <div className="template-preview-header">
                        <h3 className="form-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                            Task Preview
                        </h3>
                        <Badge variant="primary">{previewData.taskGroups.reduce((acc, g) => acc + g.tasks.length, 0)} tasks</Badge>
                    </div>

                    <Card className="template-preview-card">
                        <CardBody>
                            <div className="template-preview-info">
                                <Info size={16} />
                                <span>These tasks will be copied to your project. You can edit, add, or remove tasks later.</span>
                            </div>

                            <div className="template-preview-groups">
                                {previewData.taskGroups.map((group) => (
                                    <div key={group.id} className="template-preview-group">
                                        <button
                                            className="template-preview-group-header"
                                            onClick={() => toggleGroup(group.id)}
                                        >
                                            {expandedGroups.has(group.id) ? (
                                                <ChevronDown size={16} />
                                            ) : (
                                                <ChevronRight size={16} />
                                            )}
                                            <span className="template-preview-group-name">{group.name}</span>
                                            <Badge variant="secondary">{group.tasks.length}</Badge>
                                        </button>

                                        {expandedGroups.has(group.id) && (
                                            <div className="template-preview-tasks">
                                                {group.tasks.map((taskId, index) => (
                                                    <div key={taskId} className="template-preview-task">
                                                        <span className="template-preview-task-num">{index + 1}</span>
                                                        <span className="template-preview-task-name">
                                                            Task {taskId.replace('task-', '#')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Blank option confirmation */}
            {sourceOption === 'blank' && (
                <div className="form-section">
                    <Card className="blank-confirmation-card">
                        <CardBody>
                            <div className="blank-confirmation-content">
                                <AlertCircle size={24} className="text-warning" />
                                <div>
                                    <h4>Starting with a blank checklist</h4>
                                    <p>You'll be able to add tasks after the project is created. Go to the Edit Project page to configure your custom onboarding checklist.</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
}
