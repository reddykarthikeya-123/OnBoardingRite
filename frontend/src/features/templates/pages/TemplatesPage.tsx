import { useState, useEffect } from 'react';
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
    FolderOpen,
    Loader2
} from 'lucide-react';
import { Card, CardBody, Button, Badge, EmptyState, Modal } from '../../../components/ui';
import { templatesApi } from '../../../services/api';
import type { ChecklistTemplate } from '../../../types';

export function TemplatesPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Form State for Create Modal
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        clientId: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            const data = await templatesApi.list();
            setTemplates(data);
            setError('');
        } catch (err) {
            console.error('Failed to load templates:', err);
            setError('Failed to load templates. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTemplate.name) return;

        try {
            setIsCreating(true);
            await templatesApi.create({
                ...newTemplate,
                clientId: newTemplate.clientId || undefined // Convert empty string to undefined
            });
            setShowCreateModal(false);
            setNewTemplate({ name: '', description: '', clientId: '' });
            loadTemplates(); // Reload list
        } catch (err) {
            console.error('Failed to create template:', err);
            // Optionally set validation error here
        } finally {
            setIsCreating(false);
        }
    };

    const handleClone = async (templateId: string) => {
        try {
            await templatesApi.clone(templateId);
            setActiveDropdown(null);
            loadTemplates();
        } catch (err) {
            console.error('Failed to clone template:', err);
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        try {
            await templatesApi.delete(templateId);
            setTemplates(templates.filter(t => t.id !== templateId));
            setActiveDropdown(null);
        } catch (err) {
            console.error('Failed to delete template:', err);
        }
    };

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalTasks = (template: ChecklistTemplate) => {
        return (template.taskGroups || []).reduce((acc, group) => acc + (group.tasks?.length || 0), 0);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <p className="text-danger mb-4">{error}</p>
                <Button variant="secondary" onClick={loadTemplates}>Retry</Button>
            </div>
        );
    }

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
                    title={searchQuery ? "No templates match your search" : "No templates found"}
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
                                        <Badge variant="secondary">v{template.version}</Badge>
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
                                                        handleClone(template.id);
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
                                <p className="text-sm text-secondary line-clamp-2 mb-4">{template.description || 'No description'}</p>

                                <div className="flex items-center gap-4 text-xs text-muted mb-4">
                                    <span className="flex items-center gap-1">
                                        <FolderOpen size={12} />
                                        {template.taskGroups?.length || 0} groups
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 size={12} />
                                        {totalTasks(template)} tasks
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {(template.taskGroups || []).slice(0, 4).map((group) => (
                                        <Badge key={group.id} variant="secondary" className="text-xs">
                                            {group.category || 'General'}
                                        </Badge>
                                    ))}
                                    {(template.taskGroups || []).length > 4 && (
                                        <Badge variant="secondary" className="text-xs">
                                            +{(template.taskGroups || []).length - 4} more
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted">
                                            {template.clientName || 'All Clients'}
                                        </span>
                                        <span className="text-xs text-muted">
                                            Created {new Date(template.createdAt).toLocaleDateString()}
                                        </span>
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
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            disabled={isCreating || !newTemplate.name}
                        >
                            {isCreating ? 'Creating...' : 'Create Template'}
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="input-group">
                        <label className="input-label">Template Name <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g., Standard Onboarding"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea
                            className="input textarea"
                            placeholder="Describe the purpose of this template..."
                            rows={3}
                            value={newTemplate.description}
                            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Client (Optional)</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter Client Name"
                            value={newTemplate.clientId}
                            onChange={(e) => setNewTemplate({ ...newTemplate, clientId: e.target.value })}
                        />
                        <p className="input-hint">Leave empty for a global template</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

