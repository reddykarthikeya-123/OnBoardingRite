import { useState } from 'react';
import {
    Plus,
    UserPlus,
    ChevronDown,
    ChevronRight,
    Trash2,
    Send,
    Users,
    MoreHorizontal,
    Mail,
    Phone,
    MapPin,
    ExternalLink
} from 'lucide-react';
import { Button, Badge, Checkbox } from '../../../../components/ui';
import { AddRequisitionModal } from '../modals/AddRequisitionModal';
import { AddEmployeeModal } from '../modals/AddEmployeeModal';
import { InitiateOnboardingModal } from '../modals/InitiateOnboardingModal';
import type { Requisition, Candidate, OnboardingMember, Employee } from '../../../../types';

interface RequisitionsSectionProps {
    requisitions: Requisition[];
    members: OnboardingMember[];
    onAddMembers: (members: OnboardingMember[]) => void;
    onRemoveMembers: (memberIds: string[]) => void;
    onInitiateOnboarding: (memberIds: string[]) => void;
}

export function RequisitionsSection({
    requisitions,
    members,
    onAddMembers,
    onRemoveMembers,
    onInitiateOnboarding
}: RequisitionsSectionProps) {
    const [expandedRequisitions, setExpandedRequisitions] = useState<Set<string>>(new Set());
    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

    const [showAddRequisitionModal, setShowAddRequisitionModal] = useState(false);
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [showInitiateModal, setShowInitiateModal] = useState(false);

    const memberSourceIds = new Set(members.map(m => m.sourceId));

    // Flatten all candidates from all line items for each requisition
    const getRequisitionCandidates = (req: Requisition): Candidate[] => {
        return req.lineItems.flatMap(li => li.candidates);
    };

    const toggleRequisition = (reqId: string) => {
        const newExpanded = new Set(expandedRequisitions);
        if (newExpanded.has(reqId)) {
            newExpanded.delete(reqId);
        } else {
            newExpanded.add(reqId);
        }
        setExpandedRequisitions(newExpanded);
    };

    const toggleCandidateSelection = (candidateId: string) => {
        const newSelected = new Set(selectedCandidates);
        if (newSelected.has(candidateId)) {
            newSelected.delete(candidateId);
        } else {
            newSelected.add(candidateId);
        }
        setSelectedCandidates(newSelected);
    };

    const toggleAllCandidatesInRequisition = (candidates: Candidate[]) => {
        const availableCandidates = candidates.filter(c => !memberSourceIds.has(c.id));
        const allSelected = availableCandidates.every(c => selectedCandidates.has(c.id));

        const newSelected = new Set(selectedCandidates);
        if (allSelected) {
            availableCandidates.forEach(c => newSelected.delete(c.id));
        } else {
            availableCandidates.forEach(c => newSelected.add(c.id));
        }
        setSelectedCandidates(newSelected);
    };

    const toggleMemberSelection = (memberId: string) => {
        const newSelected = new Set(selectedMembers);
        if (newSelected.has(memberId)) {
            newSelected.delete(memberId);
        } else {
            newSelected.add(memberId);
        }
        setSelectedMembers(newSelected);
    };

    const toggleAllMembers = () => {
        if (selectedMembers.size === members.length) {
            setSelectedMembers(new Set());
        } else {
            setSelectedMembers(new Set(members.map(m => m.id)));
        }
    };

    const handleAddSelectedToMembers = () => {
        const allCandidates = requisitions.flatMap(r => getRequisitionCandidates(r));
        const candidatesToAdd = allCandidates.filter(c => selectedCandidates.has(c.id));

        const newMembers: OnboardingMember[] = candidatesToAdd.map(c => ({
            id: `member-${Date.now()}-${c.id}`,
            onboardingProjectId: 'current-project',
            sourceType: 'CANDIDATE' as const,
            sourceId: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            location: c.location,
            trade: c.trade,
            status: 'PENDING' as const,
            addedAt: new Date().toISOString()
        }));

        onAddMembers(newMembers);
        setSelectedCandidates(new Set());
    };

    const handleRemoveSelectedMembers = () => {
        onRemoveMembers(Array.from(selectedMembers));
        setSelectedMembers(new Set());
    };

    const handleInitiateOnboarding = () => {
        setShowInitiateModal(true);
    };

    const confirmInitiateOnboarding = () => {
        onInitiateOnboarding(Array.from(selectedMembers));
        setSelectedMembers(new Set());
        setShowInitiateModal(false);
    };

    const handleAddEmployee = (employee: Employee, isExEmployee: boolean = false) => {
        const newMember: OnboardingMember = {
            id: `member-${Date.now()}-${employee.id}`,
            onboardingProjectId: 'current-project',
            sourceType: isExEmployee ? 'EX_EMPLOYEE' : 'EMPLOYEE',
            sourceId: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            location: employee.location,
            trade: employee.position,
            status: 'PENDING',
            addedAt: new Date().toISOString()
        };
        onAddMembers([newMember]);
        setShowAddEmployeeModal(false);
    };

    const pendingMembers = members.filter(m => m.status === 'PENDING');
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'ONBOARDING_INITIATED':
            case 'IN_PROGRESS': return 'primary';
            default: return 'secondary';
        }
    };

    return (
        <div className="requisitions-section">
            {/* Requisitions Panel */}
            <div className="section-panel">
                <div className="panel-header">
                    <div className="panel-header-left">
                        <h2 className="panel-title">Requisitions</h2>
                        <Badge variant="secondary">{requisitions.length}</Badge>
                    </div>
                    <div className="panel-header-actions">
                        {selectedCandidates.size > 0 && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAddSelectedToMembers}
                            >
                                <UserPlus size={14} />
                                Add {selectedCandidates.size} to Team
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowAddRequisitionModal(true)}
                        >
                            <Plus size={14} />
                            Add Requisition
                        </Button>
                    </div>
                </div>

                <div className="requisitions-list">
                    {requisitions.map(req => {
                        const candidates = getRequisitionCandidates(req);
                        const availableCandidates = candidates.filter(c => !memberSourceIds.has(c.id));
                        const totalCandidates = candidates.length;
                        const addedCount = candidates.filter(c => memberSourceIds.has(c.id)).length;

                        return (
                            <div key={req.id} className="requisition-item">
                                <button
                                    className={`requisition-row ${expandedRequisitions.has(req.id) ? 'expanded' : ''}`}
                                    onClick={() => toggleRequisition(req.id)}
                                >
                                    <div className="requisition-expand-icon">
                                        {expandedRequisitions.has(req.id)
                                            ? <ChevronDown size={18} />
                                            : <ChevronRight size={18} />
                                        }
                                    </div>
                                    <div className="requisition-info">
                                        <span className="requisition-number">{req.requisitionNumber}</span>
                                        <span className="requisition-title">{req.title}</span>
                                    </div>
                                    <div className="requisition-meta">
                                        <Badge variant={req.status === 'OPEN' ? 'success' : 'secondary'}>
                                            {req.status}
                                        </Badge>
                                        <span className="requisition-count">
                                            <Users size={14} />
                                            {totalCandidates} candidates
                                        </span>
                                        {addedCount > 0 && (
                                            <span className="requisition-added">
                                                {addedCount} shortlisted
                                            </span>
                                        )}
                                    </div>
                                    <a
                                        href={`/requisitions/${req.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="requisition-external-link"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Open requisition in new tab"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </button>

                                {expandedRequisitions.has(req.id) && (
                                    <div className="candidates-panel">
                                        <div className="candidates-table-header">
                                            <div className="candidates-header-row">
                                                <Checkbox
                                                    checked={availableCandidates.length > 0 && availableCandidates.every(c => selectedCandidates.has(c.id))}
                                                    onChange={() => toggleAllCandidatesInRequisition(candidates)}
                                                    disabled={availableCandidates.length === 0}
                                                />
                                                <span className="col-name">Pending Worker</span>
                                                <span className="col-contact">Contact</span>
                                                <span className="col-location">Location</span>
                                                <span className="col-experience">Experience</span>
                                                <span className="col-status">Status</span>
                                            </div>
                                        </div>
                                        <div className="candidates-table-body">
                                            {candidates.map(candidate => {
                                                const isAlreadyMember = memberSourceIds.has(candidate.id);
                                                return (
                                                    <div
                                                        key={candidate.id}
                                                        className={`candidate-row ${isAlreadyMember ? 'shortlisted' : ''} ${selectedCandidates.has(candidate.id) ? 'selected' : ''}`}
                                                    >
                                                        <Checkbox
                                                            checked={selectedCandidates.has(candidate.id)}
                                                            onChange={() => toggleCandidateSelection(candidate.id)}
                                                            disabled={isAlreadyMember}
                                                        />
                                                        <div className="col-name">
                                                            <div className="candidate-avatar">
                                                                {candidate.firstName[0]}{candidate.lastName[0]}
                                                            </div>
                                                            <div className="candidate-name-info">
                                                                <span className="candidate-name">{candidate.firstName} {candidate.lastName}</span>
                                                                <span className="candidate-trade">{candidate.trade}</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-contact">
                                                            <span className="contact-item">
                                                                <Mail size={12} />
                                                                {candidate.email}
                                                            </span>
                                                            <span className="contact-item">
                                                                <Phone size={12} />
                                                                {candidate.phone}
                                                            </span>
                                                        </div>
                                                        <div className="col-location">
                                                            <MapPin size={12} />
                                                            {candidate.location}
                                                        </div>
                                                        <div className="col-experience">
                                                            {candidate.experience}
                                                        </div>
                                                        <div className="col-status">
                                                            {isAlreadyMember ? (
                                                                <Badge variant="primary">Added</Badge>
                                                            ) : (
                                                                <Badge variant={candidate.status === 'AVAILABLE' ? 'success' : 'secondary'}>
                                                                    {candidate.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {requisitions.length === 0 && (
                        <div className="empty-panel-state">
                            <Users size={32} />
                            <p>No requisitions available</p>
                            <span>Add requisitions to view candidates</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Team Members Panel */}
            <div className="section-panel members-panel">
                <div className="panel-header">
                    <div className="panel-header-left">
                        <h2 className="panel-title">Team Members</h2>
                        <Badge variant="primary">{members.length}</Badge>
                    </div>
                    <div className="panel-header-actions">
                        {selectedMembers.size > 0 && (
                            <>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={handleRemoveSelectedMembers}
                                >
                                    <Trash2 size={14} />
                                    Remove ({selectedMembers.size})
                                </Button>
                                {pendingMembers.filter(m => selectedMembers.has(m.id)).length > 0 && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleInitiateOnboarding}
                                    >
                                        <Send size={14} />
                                        Initiate Onboarding
                                    </Button>
                                )}
                            </>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowAddEmployeeModal(true)}
                        >
                            <UserPlus size={14} />
                            Add Employee
                        </Button>
                    </div>
                </div>

                {members.length > 0 ? (
                    <div className="members-table">
                        <div className="members-table-header">
                            <div className="members-header-row">
                                <Checkbox
                                    checked={selectedMembers.size === members.length && members.length > 0}
                                    onChange={toggleAllMembers}
                                />
                                <span className="col-member">Member</span>
                                <span className="col-contact">Contact</span>
                                <span className="col-trade">Trade</span>
                                <span className="col-source">Source</span>
                                <span className="col-status">Status</span>
                                <span className="col-actions"></span>
                            </div>
                        </div>
                        <div className="members-table-body">
                            {members.map(member => (
                                <div
                                    key={member.id}
                                    className={`member-row ${selectedMembers.has(member.id) ? 'selected' : ''}`}
                                >
                                    <Checkbox
                                        checked={selectedMembers.has(member.id)}
                                        onChange={() => toggleMemberSelection(member.id)}
                                    />
                                    <div className="col-member">
                                        <div className="member-avatar">
                                            {member.firstName[0]}{member.lastName[0]}
                                        </div>
                                        <div className="member-name-info">
                                            <span className="member-name">{member.firstName} {member.lastName}</span>
                                            <span className="member-location">
                                                <MapPin size={10} />
                                                {member.location}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-contact">
                                        <span className="contact-item">
                                            <Mail size={12} />
                                            {member.email}
                                        </span>
                                        <span className="contact-item">
                                            <Phone size={12} />
                                            {member.phone}
                                        </span>
                                    </div>
                                    <div className="col-trade">
                                        <Badge variant="secondary">{member.trade}</Badge>
                                    </div>
                                    <div className="col-source">
                                        <span className="source-badge">
                                            {member.sourceType === 'CANDIDATE' ? 'Pending Worker'
                                                : member.sourceType === 'EMPLOYEE' ? 'Employee'
                                                    : member.sourceType === 'EX_EMPLOYEE' ? 'Ex-Employee'
                                                        : member.sourceType}
                                        </span>
                                    </div>
                                    <div className="col-status">
                                        <Badge variant={getStatusVariant(member.status)}>
                                            {member.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <div className="col-actions">
                                        <button className="action-btn">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="empty-panel-state">
                        <Users size={32} />
                        <p>No members shortlisted</p>
                        <span>Select candidates from requisitions above or add employees directly</span>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddRequisitionModal && (
                <AddRequisitionModal onClose={() => setShowAddRequisitionModal(false)} />
            )}
            {showAddEmployeeModal && (
                <AddEmployeeModal
                    onClose={() => setShowAddEmployeeModal(false)}
                    onAddEmployee={handleAddEmployee}
                />
            )}
            {showInitiateModal && (
                <InitiateOnboardingModal
                    memberCount={Array.from(selectedMembers).filter(id =>
                        members.find(m => m.id === id)?.status === 'PENDING'
                    ).length}
                    onConfirm={confirmInitiateOnboarding}
                    onClose={() => setShowInitiateModal(false)}
                />
            )}
        </div>
    );
}
