import { Edit2, MapPin, Calendar, FolderKanban, Users, Shield, Layers } from 'lucide-react';
import { Badge, Button, Card, CardBody } from '../../../../components/ui';
import { mockTemplates } from '../../../../data';
import type { ProjectFormData } from '../ProjectSetupWizard';

interface ProjectReviewStepProps {
    data: ProjectFormData;
    onEdit: (stepIndex: number) => void;
}

export function ProjectReviewStep({ data, onEdit }: ProjectReviewStepProps) {
    const selectedTemplate = mockTemplates.find((t) => t.id === data.templateId);
    const totalTasks = selectedTemplate?.taskGroups.reduce((acc, group) => acc + group.tasks.length, 0) || 0;

    return (
        <div>
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))' }}>
                    <FolderKanban size={28} style={{ color: 'var(--color-primary-600)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2">Review Your Project</h2>
                <p className="text-secondary">
                    Please review the details below before creating your project
                </p>
            </div>

            {/* Project Details Section */}
            <Card className="mb-4">
                <CardBody>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FolderKanban size={18} className="text-muted" />
                            Project Details
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(0)}>
                            <Edit2 size={14} />
                            Edit
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-muted block mb-1">Project Name</span>
                            <span className="font-medium">{data.name || '—'}</span>
                        </div>
                        <div>
                            <span className="text-xs text-muted block mb-1">Client</span>
                            <span className="font-medium">{data.clientName || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-muted" />
                            <span>{data.location || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-muted" />
                            <span>
                                {data.startDate ? new Date(data.startDate).toLocaleDateString() : '—'}
                                {data.endDate && ` – ${new Date(data.endDate).toLocaleDateString()}`}
                            </span>
                        </div>
                    </div>

                    {(data.isDOD || data.isODRISA) && (
                        <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                            {data.isDOD && <Badge variant="danger">DOD Project</Badge>}
                            {data.isODRISA && <Badge variant="warning">ODRISA</Badge>}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Team Contacts Section */}
            <Card className="mb-4">
                <CardBody>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Users size={18} className="text-muted" />
                            Team Contacts
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
                            <Edit2 size={14} />
                            Edit
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <span className="text-xs text-muted block mb-1">Project Manager</span>
                            {data.projectManager?.name ? (
                                <>
                                    <span className="font-medium block">{data.projectManager.name}</span>
                                    <span className="text-xs text-muted">{data.projectManager.email}</span>
                                </>
                            ) : (
                                <span className="text-muted">Not specified</span>
                            )}
                        </div>
                        <div>
                            <span className="text-xs text-muted block mb-1">Safety Lead</span>
                            {data.safetyLead?.name ? (
                                <>
                                    <span className="font-medium block">{data.safetyLead.name}</span>
                                    <span className="text-xs text-muted">{data.safetyLead.email}</span>
                                </>
                            ) : (
                                <span className="text-muted">Not specified</span>
                            )}
                        </div>
                        <div>
                            <span className="text-xs text-muted block mb-1">Site Contact</span>
                            {data.siteContact?.name ? (
                                <>
                                    <span className="font-medium block">{data.siteContact.name}</span>
                                    <span className="text-xs text-muted">{data.siteContact.email}</span>
                                </>
                            ) : (
                                <span className="text-muted">Not specified</span>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Template Section */}
            <Card>
                <CardBody>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Layers size={18} className="text-muted" />
                            Checklist Template
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
                            <Edit2 size={14} />
                            Edit
                        </Button>
                    </div>

                    {selectedTemplate ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary-100)' }}>
                                    <Shield size={20} style={{ color: 'var(--color-primary-600)' }} />
                                </div>
                                <div>
                                    <span className="font-semibold block">{selectedTemplate.name}</span>
                                    <span className="text-sm text-muted">
                                        {selectedTemplate.taskGroups.length} task groups • {totalTasks} total tasks
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {selectedTemplate.taskGroups.map((group) => (
                                    <Badge key={group.id} variant="secondary">
                                        {group.name}
                                    </Badge>
                                ))}
                            </div>
                        </>
                    ) : (
                        <span className="text-muted">No template selected</span>
                    )}
                </CardBody>
            </Card>

            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-secondary-50)', border: '1px solid var(--color-secondary-200)' }}>
                <p className="text-sm" style={{ color: 'var(--color-secondary-700)' }}>
                    <strong>Note:</strong> Once created, you can add or remove individual tasks and customize the checklist for this specific project.
                </p>
            </div>
        </div>
    );
}
