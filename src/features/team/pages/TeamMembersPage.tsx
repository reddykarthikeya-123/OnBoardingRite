import { useState, useEffect } from 'react';
import { Search, Plus, Users, Mail, Phone, MapPin, Loader2, Trash2, Edit } from 'lucide-react';
import { Card, Button, Badge } from '../../../components/ui';
import { teamMembersApi } from '../../../services/api';

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
}

export function TeamMembersPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter members by search
    const filteredMembers = members.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (memberId: string) => {
        if (confirm('Are you sure you want to delete this team member?')) {
            try {
                await teamMembersApi.delete(memberId);
                loadMembers();
            } catch (error) {
                console.error('Failed to delete team member:', error);
                alert('Failed to delete team member.');
            }
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
                            onClick={() => alert('Add Team Member form coming soon!')}
                        >
                            Add Member
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="search-input-wrapper" style={{ maxWidth: '400px' }}>
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row mb-6">
                <div className="stat-card">
                    <div className="stat-value">{members.length}</div>
                    <div className="stat-label">Total Members</div>
                </div>
            </div>

            {/* Members Grid */}
            {filteredMembers.length === 0 ? (
                <Card>
                    <div className="p-12 text-center">
                        <div className="mb-4">
                            <Users size={48} className="text-muted mx-auto" style={{ opacity: 0.3 }} />
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
                            <Button variant="primary" leftIcon={<Plus size={16} />}>
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
                                        onClick={() => alert('Edit coming soon!')}
                                        title="Edit"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        className="btn-icon-sm btn-danger-ghost"
                                        onClick={() => handleDelete(member.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="team-member-card-body">
                                <h3 className="team-member-card-name">
                                    {member.firstName} {member.lastName}
                                </h3>
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
        </div>
    );
}
