import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreVertical,
    Copy,
    Pencil,
    Trash2,
    CheckCircle2,
    FileText,
    FolderOpen
} from 'lucide-react';
import { Card, CardBody, Button, Badge, EmptyState, Modal } from '../../../components/ui';
import { mockTemplates } from '../../../data';
import type { ChecklistTemplate } from '../../../types';

export function TemplatesPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [templates, setTemplates] = useState(mockTemplates);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleClone = (template: ChecklistTemplate) => {
        const cloned: ChecklistTemplate = {
            ...template,
            id: `template-${Date.now()}`,
            name: `${template.name} (Copy)`,
            version: 1,
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setTemplates([...templates, cloned]);
        setActiveDropdown(null);
    };

    const handleDelete = (templateId: string) => {
        setTemplates(templates.filter(t => t.id !== templateId));
        setActiveDropdown(null);
    };

    const totalTasks = (template: ChecklistTemplate) => {
        return template.taskGroups.reduce((acc, group) => acc + group.tasks.length, 0);
    };

    return (
        <div className="page-enter">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-top">
                    <div>
                        <h1 className="page-title">Checklist Templates</h1>
                        <p className="page-description">Manage reusable onboarding checklist templates for projects</p>
                    </div>
                    <div className="page-actions">
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={16} />}
                            onClick={() => setShowCreateModal(true)}
                        >
                            Create Template
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="search-bar" style={{ maxWidth: '400px' }}>
                    <Search size={18} className="search-bar-icon" />
                    <input
                        type="text"
                        className="input search-bar-input"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
                <EmptyState
                    icon={<FileText size={48} />}
                    title="No templates found"
                    description={searchQuery ? "Try adjusting your search query" : "Create your first checklist template to get started"}
                    action={
                        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                            Create Template
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                        <Card
                            key={template.id}
                            variant="interactive"
                            onClick={() => navigate(`/templates/${template.id}`)}
                        >
                            <CardBody>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={template.isActive ? 'success' : 'secondary'}>
                                            {template.isActive ? 'Active' : 'Draft'}
                                        </Badge>
                                        <Badge variant="outline">v{template.version}</Badge>
                                    </div>
                                    <div className="relative">
                                        <button
                                            className="btn btn-ghost btn-icon btn-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(activeDropdown === template.id ? null : template.id);
                                            }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {activeDropdown === template.id && (
                                            <div className="dropdown-menu" style={{ right: 0, left: 'auto' }}>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/templates/${template.id}`);
                                                    }}
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClone(template);
                                                    }}
                                                >
                                                    <Copy size={14} />
                                                    Clone
                                                </button>
                                                <div className="dropdown-divider" />
                                                <button
                                                    className="dropdown-item dropdown-item-danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(template.id);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-base font-semibold mb-1">{template.name}</h3>
                                <p className="text-sm text-secondary line-clamp-2 mb-4">{template.description}</p>

                                <div className="flex items-center gap-4 text-xs text-muted mb-4">
                                    <span className="flex items-center gap-1">
                                        <FolderOpen size={12} />
                                        {template.taskGroups.length} groups
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 size={12} />
                                        {totalTasks(template)} tasks
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {template.taskGroups.slice(0, 4).map((group) => (
                                        <Badge key={group.id} variant="secondary" className="text-xs">
                                            {group.category}
                                        </Badge>
                                    ))}
                                    {template.taskGroups.length > 4 && (
                                        <Badge variant="secondary" className="text-xs">
                                            +{template.taskGroups.length - 4} more
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted">{template.clientName}</span>
                                        <span className="text-xs text-muted">by {template.createdBy}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Template Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Template"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={() => setShowCreateModal(false)}>
                            Create Template
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="input-group">
                        <label className="input-label">Template Name</label>
                        <input type="text" className="input" placeholder="e.g., Standard Onboarding" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea className="input textarea" placeholder="Describe the purpose of this template..." rows={3} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Client (Optional)</label>
                        <select className="input select">
                            <option value="">All Clients</option>
                            <option value="marathon">Marathon Petroleum</option>
                            <option value="exxon">ExxonMobil</option>
                            <option value="shell">Shell</option>
                            <option value="chevron">Chevron</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Start From</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                className="p-4 border rounded-lg text-left hover:bg-neutral-50 transition-colors"
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                <div className="font-medium mb-1">Blank Template</div>
                                <div className="text-sm text-secondary">Start from scratch</div>
                            </button>
                            <button
                                className="p-4 border rounded-lg text-left hover:bg-neutral-50 transition-colors"
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                <div className="font-medium mb-1">Clone Existing</div>
                                <div className="text-sm text-secondary">Copy from another template</div>
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
