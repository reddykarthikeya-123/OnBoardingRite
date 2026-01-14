import { useState, useEffect } from 'react';
import { Search, Plus, Users, Mail, Phone, MapPin, Loader2, Trash2, Edit, Save, FileText, ChevronRight, ChevronDown, UserCheck, UserX } from 'lucide-react';
import { Card, Button, Badge, Modal, ConfirmDialog } from '../../../components/ui';
import { teamMembersApi, candidateApi, taskInstancesApi } from '../../../services/api';
import { SubmittedTaskViewer } from '../../candidate/components/SubmittedTaskViewer';
import { useAuth } from '../../../contexts/AuthContext';

interface TeamMember {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    createdAt: string;
    isActive?: boolean;
}

interface TeamMemberFormData {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

const emptyFormData: TeamMemberFormData = {
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
};

export function TeamMembersPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [formData, setFormData] = useState<TeamMemberFormData>(emptyFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

    // Deactivation confirmation state
    const [deactivateConfirm, setDeactivateConfirm] = useState<TeamMember | null>(null);

    // Submissions modal state
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [selectedMemberForSubmissions, setSelectedMemberForSubmissions] = useState<TeamMember | null>(null);
    const [groupedSubmissions, setGroupedSubmissions] = useState<Array<{
        projectId: string;
        projectName: string;
        role: string | null;
        submissions: Array<{
            id: string;
            taskId: string;
            taskName: string;
            category: string | null;
            submittedAt: string | null;
            formData: Record<string, any> | null;
            documents?: Array<{
                id: string;
                originalFilename: string;
                mimeType: string;
                fileSize: number;
                documentSide?: string;
            }>;
            reviewStatus?: string;
            adminRemarks?: string;
        }>;
    }>>([]);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [viewTask, setViewTask] = useState<{
        id: string;
        name: string;
        submittedAt: string | null;
        formData: Record<string, any>;
        documents?: Array<{
            id: string;
            originalFilename: string;
            mimeType: string;
            fileSize: number;
            documentSide?: string;
        }>;
        reviewStatus?: string;
        adminRemarks?: string;
    } | null>(null);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setIsLoading(true);
            const data = await teamMembersApi.list();
            setMembers(data || []);
        } catch (error) {
            console.error('Failed to load team members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter members by search and status
    const filteredMembers = members.filter(member => {
        const matchesSearch =
            `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (member.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && member.isActive !== false) ||
            (statusFilter === 'inactive' && member.isActive === false);

        return matchesSearch && matchesStatus;
    });

    // Toggle member active/inactive status
    const handleToggleStatus = async (member: TeamMember) => {
        // If currently active, show confirmation dialog before deactivating
        if (member.isActive !== false) {
            setDeactivateConfirm(member);
            return;
        }
        // If already inactive, just activate (no confirmation needed)
        await performStatusToggle(member);
    };

    // Perform the actual status toggle after confirmation
    const performStatusToggle = async (member: TeamMember) => {
        try {
            setTogglingStatus(member.id);
            setDeactivateConfirm(null);
            const newStatus = member.isActive === false ? true : false;
            await teamMembersApi.updateStatus(member.id, newStatus);
            // Update local state
            setMembers(prev => prev.map(m =>
                m.id === member.id ? { ...m, isActive: newStatus } : m
            ));
        } catch (error) {
            console.error('Failed to toggle status:', error);
            alert('Failed to update member status.');
        } finally {
            setTogglingStatus(null);
        }
    };

    // Open modal for new member
    const handleAddNew = () => {
        setEditingMember(null);
        setFormData(emptyFormData);
        setFormErrors([]);
        setShowModal(true);
    };

    // Open modal for editing
    const handleEdit = async (member: TeamMember) => {
        try {
            // Fetch full details
            const fullMember = await teamMembersApi.get(member.id);
            setEditingMember(member);
            setFormData({
                employeeId: fullMember.employeeId || '',
                firstName: fullMember.firstName || '',
                lastName: fullMember.lastName || '',
                email: fullMember.email || '',
                phone: fullMember.phone || '',
                addressLine1: fullMember.addressLine1 || '',
                addressLine2: fullMember.addressLine2 || '',
                city: fullMember.city || '',
                state: fullMember.state || '',
                zipCode: fullMember.zipCode || '',
                country: fullMember.country || 'USA',
            });
            setFormErrors([]);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to load member details:', error);
            alert('Failed to load member details.');
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: string[] = [];
        if (!formData.firstName.trim()) errors.push('First name is required');
        if (!formData.lastName.trim()) errors.push('Last name is required');
        if (!formData.email.trim()) errors.push('Email is required');
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.push('Invalid email format');
        }
        setFormErrors(errors);
        return errors.length === 0;
    };

    // Save member (create or update)
    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setIsSaving(true);
            if (editingMember) {
                await teamMembersApi.update(editingMember.id, formData);
            } else {
                await teamMembersApi.create(formData);
            }
            setShowModal(false);
            loadMembers();
        } catch (error: any) {
            console.error('Failed to save team member:', error);
            const message = error?.message || 'Failed to save team member.';
            setFormErrors([message]);
        } finally {
            setIsSaving(false);
        }
    };

    // Delete member
    const handleDelete = async (memberId: string, memberName: string) => {
        setDeleteConfirm({ id: memberId, name: memberName });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setIsDeleting(true);
        try {
            await teamMembersApi.delete(deleteConfirm.id);
            loadMembers();
        } catch (error) {
            console.error('Failed to delete team member:', error);
            alert('Failed to delete team member.');
        } finally {
            setIsDeleting(false);
            setDeleteConfirm(null);
        }
    };

    // Handle form field changes
    const handleFieldChange = (field: keyof TeamMemberFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors.length > 0) setFormErrors([]);
    };

    // View submissions for a member (all projects)
    const handleViewSubmissions = async (member: TeamMember) => {
        setSelectedMemberForSubmissions(member);
        setShowSubmissionsModal(true);
        setIsLoadingSubmissions(true);
        setViewTask(null);
        setExpandedProjects(new Set());

        try {
            const data = await candidateApi.getSubmittedTasks(member.id);
            setGroupedSubmissions(data || []);
            // Auto-expand all projects
            if (data && data.length > 0) {
                setExpandedProjects(new Set(data.map((g: any) => g.projectId)));
            }
        } catch (error) {
            console.error('Failed to load submissions:', error);
            setGroupedSubmissions([]);
        } finally {
            setIsLoadingSubmissions(false);
        }
    };

    // Toggle project expansion in submissions modal
    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    };

    const handleApproveTask = async (taskId: string) => {
        if (!user?.id) return;
        try {
            await taskInstancesApi.approve(taskId, user.id);

            // Update local state
            setGroupedSubmissions(prev => prev.map(group => ({
                ...group,
                submissions: group.submissions.map(sub =>
                    sub.id === taskId
                        ? { ...sub, reviewStatus: 'APPROVED', adminRemarks: undefined }
                        : sub
                )
            })));

            // Update view task state if open
            if (viewTask && viewTask.id === taskId) {
                setViewTask(prev => prev ? { ...prev, reviewStatus: 'APPROVED', adminRemarks: undefined } : null);
            }
        } catch (error) {
            console.error('Failed to approve task:', error);
            alert('Failed to approve task. Please try again.');
        }
    };

    const handleRejectTask = async (taskId: string, remarks: string) => {
        if (!user?.id) return;
        try {
            await taskInstancesApi.reject(taskId, user.id, remarks);

            // Update local state
            setGroupedSubmissions(prev => prev.map(group => ({
                ...group,
                submissions: group.submissions.map(sub =>
                    sub.id === taskId
                        ? { ...sub, reviewStatus: 'REJECTED', adminRemarks: remarks }
                        : sub
                )
            })));

            // Update view task state if open
            if (viewTask && viewTask.id === taskId) {
                setViewTask(prev => prev ? { ...prev, reviewStatus: 'REJECTED', adminRemarks: remarks } : null);
            }
        } catch (error) {
            console.error('Failed to reject task:', error);
            alert('Failed to reject task. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="page-enter flex items-center justify-center" style={{ minHeight: '400px' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="page-enter">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-top">
                    <div>
                        <h1 className="page-title">Team Members</h1>
                        <p className="page-description">
                            Manage all team members and contractors across projects.
                        </p>
                    </div>
                    <div className="page-actions">
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={16} />}
                            onClick={handleAddNew}
                        >
                            Add Member
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search Bar and Filters */}
            <div className="mb-6" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-input-wrapper" style={{ maxWidth: '400px', flex: 1 }}>
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="input"
                    style={{ width: '150px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                >
                    <option value="all">All Members</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>

            {/* Stats */}
            <div className="stats-row mb-6">
                <div className="stat-card">
                    <div className="stat-value">{members.filter(m => m.isActive !== false).length}</div>
                    <div className="stat-label">Active Members</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{members.filter(m => m.isActive === false).length}</div>
                    <div className="stat-label">Inactive Members</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{members.length}</div>
                    <div className="stat-label">Total Members</div>
                </div>
            </div>

            {/* Members Grid */}
            {filteredMembers.length === 0 ? (
                <Card>
                    <div className="py-16 px-8 flex flex-col items-center justify-center text-center">
                        <div className="mb-4">
                            <Users size={48} className="text-muted" style={{ opacity: 0.3 }} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {members.length === 0 ? 'No team members yet' : 'No results found'}
                        </h3>
                        <p className="text-muted mb-4">
                            {members.length === 0
                                ? 'Add team members to start tracking onboarding progress.'
                                : 'Try a different search term.'}
                        </p>
                        {members.length === 0 && (
                            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleAddNew}>
                                Add First Member
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="team-members-grid">
                    {filteredMembers.map((member) => (
                        <Card key={member.id} className="team-member-card">
                            <div className="team-member-card-header">
                                <div className="avatar avatar-md">
                                    {member.firstName[0]}{member.lastName[0]}
                                </div>
                                <div className="team-member-card-actions">
                                    <button
                                        className="btn-icon-sm"
                                        onClick={() => handleViewSubmissions(member)}
                                        title="View Submissions"
                                    >
                                        <FileText size={14} />
                                    </button>
                                    <button
                                        className="btn-icon-sm"
                                        onClick={() => handleEdit(member)}
                                        title="Edit"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        className={`btn-icon-sm ${member.isActive === false ? 'btn-success-ghost' : 'btn-warning-ghost'}`}
                                        onClick={() => handleToggleStatus(member)}
                                        title={member.isActive === false ? 'Activate' : 'Deactivate'}
                                        disabled={togglingStatus === member.id}
                                    >
                                        {togglingStatus === member.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : member.isActive === false ? (
                                            <UserCheck size={14} />
                                        ) : (
                                            <UserX size={14} />
                                        )}
                                    </button>
                                    <button
                                        className="btn-icon-sm btn-danger-ghost"
                                        onClick={() => handleDelete(member.id, `${member.firstName} ${member.lastName}`)}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="team-member-card-body">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <h3 className="team-member-card-name" style={{ margin: 0 }}>
                                        {member.firstName} {member.lastName}
                                    </h3>
                                    <Badge variant={member.isActive === false ? 'warning' : 'success'}>
                                        {member.isActive === false ? 'Inactive' : 'Active'}
                                    </Badge>
                                </div>
                                {member.employeeId && (
                                    <Badge variant="secondary" className="mb-2">
                                        ID: {member.employeeId}
                                    </Badge>
                                )}
                                <div className="team-member-card-details">
                                    <div className="team-member-detail">
                                        <Mail size={14} />
                                        <span>{member.email}</span>
                                    </div>
                                    {member.phone && (
                                        <div className="team-member-detail">
                                            <Phone size={14} />
                                            <span>{member.phone}</span>
                                        </div>
                                    )}
                                    {(member.city || member.state) && (
                                        <div className="team-member-detail">
                                            <MapPin size={14} />
                                            <span>{[member.city, member.state].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingMember ? 'Edit Team Member' : 'Add Team Member'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={isSaving}
                            leftIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        >
                            {isSaving ? 'Saving...' : 'Save Member'}
                        </Button>
                    </>
                }
            >
                {formErrors.length > 0 && (
                    <div className="mb-4">
                        {formErrors.map((error, idx) => (
                            <div key={idx} className="eligibility-error">{error}</div>
                        ))}
                    </div>
                )}

                <div className="form-grid">
                    {/* Row 1: Employee ID */}
                    <div className="form-group">
                        <label className="form-label">Employee ID</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g., EMP001"
                            value={formData.employeeId}
                            onChange={(e) => handleFieldChange('employeeId', e.target.value)}
                        />
                    </div>
                    <div></div>

                    {/* Row 2: First & Last Name */}
                    <div className="form-group">
                        <label className="form-label">First Name <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            className="input"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        />
                    </div>

                    {/* Row 3: Email & Phone */}
                    <div className="form-group">
                        <label className="form-label">Email <span className="text-danger">*</span></label>
                        <input
                            type="email"
                            className="input"
                            placeholder="john.doe@example.com"
                            value={formData.email}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                            type="tel"
                            className="input"
                            placeholder="(555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                        />
                    </div>

                    {/* Row 4: Address */}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Address Line 1</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="123 Main Street"
                            value={formData.addressLine1}
                            onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
                        />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Address Line 2</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Apt 4B"
                            value={formData.addressLine2}
                            onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
                        />
                    </div>

                    {/* Row 5: City, State, Zip */}
                    <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Houston"
                            value={formData.city}
                            onChange={(e) => handleFieldChange('city', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">State</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="TX"
                            value={formData.state}
                            onChange={(e) => handleFieldChange('state', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Zip Code</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="77001"
                            value={formData.zipCode}
                            onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Country</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="USA"
                            value={formData.country}
                            onChange={(e) => handleFieldChange('country', e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            {/* Submissions Modal - Grouped by Project */}
            <Modal
                isOpen={showSubmissionsModal}
                onClose={() => { setShowSubmissionsModal(false); setViewTask(null); }}
                title={viewTask
                    ? `${selectedMemberForSubmissions?.firstName} ${selectedMemberForSubmissions?.lastName}`
                    : `Submitted Forms - ${selectedMemberForSubmissions?.firstName} ${selectedMemberForSubmissions?.lastName}`
                }
                size="lg"
            >
                {viewTask ? (
                    <SubmittedTaskViewer
                        taskName={viewTask.name}
                        submittedAt={viewTask.submittedAt}
                        formData={viewTask.formData}
                        onClose={() => setViewTask(null)}
                        documents={viewTask.documents}
                        isAdmin={isAdmin}
                        reviewStatus={viewTask.reviewStatus as any}
                        adminRemarks={viewTask.adminRemarks}
                        onApprove={() => handleApproveTask(viewTask.id)}
                        onReject={(remarks) => handleRejectTask(viewTask.id, remarks)}
                    />
                ) : isLoadingSubmissions ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="ml-2">Loading submissions...</span>
                    </div>
                ) : groupedSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-muted">
                        <FileText size={32} className="mx-auto mb-2" style={{ opacity: 0.3 }} />
                        <p>No submitted forms yet.</p>
                    </div>
                ) : (
                    <div className="submissions-list">
                        {groupedSubmissions.map((project) => (
                            <div key={project.projectId} className="project-group">
                                <button
                                    className="project-group-header"
                                    onClick={() => toggleProject(project.projectId)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'var(--color-bg-subtle)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        marginBottom: '8px',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {expandedProjects.has(project.projectId) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        <span style={{ fontWeight: 600 }}>{project.projectName}</span>
                                        <Badge variant="secondary">{project.submissions.length} forms</Badge>
                                    </div>
                                </button>

                                {expandedProjects.has(project.projectId) && (
                                    <div style={{ paddingLeft: '16px', marginBottom: '16px' }}>
                                        {project.submissions.map((task) => (
                                            <div
                                                key={task.id}
                                                onClick={() => setViewTask({
                                                    id: task.id,
                                                    name: task.taskName,
                                                    submittedAt: task.submittedAt,
                                                    formData: task.formData || {},
                                                    documents: task.documents,
                                                    reviewStatus: task.reviewStatus,
                                                    adminRemarks: task.adminRemarks
                                                })}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--color-border-light)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <FileText size={18} style={{ color: 'var(--color-primary-600)' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{task.taskName}</div>
                                                        {task.submittedAt && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                {new Date(task.submittedAt).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Delete Team Member"
                message={`Are you sure you want to delete "${deleteConfirm?.name}"? This will also remove all their project assignments and submissions.`}
                confirmText="Delete Member"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Deactivation Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deactivateConfirm}
                onClose={() => setDeactivateConfirm(null)}
                onConfirm={() => deactivateConfirm && performStatusToggle(deactivateConfirm)}
                title="Deactivate Team Member"
                message={`Are you sure you want to deactivate "${deactivateConfirm?.firstName} ${deactivateConfirm?.lastName}"? This will:\n\n• Archive all their project assignments\n• Block them from logging in\n• Reset their login credentials (they'll need to set up a new password if reactivated)`}
                confirmText="Deactivate Member"
                variant="warning"
                isLoading={togglingStatus === deactivateConfirm?.id}
            />
        </div>
    );
}
