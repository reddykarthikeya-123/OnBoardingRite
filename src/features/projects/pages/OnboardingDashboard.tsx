import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    LayoutDashboard,
    Users,
    ListChecks,
    Building,
    MapPin,
    Calendar,
    User,
    Grid3X3,
    Settings
} from 'lucide-react';
import { Button, Badge } from '../../../components/ui';
import { mockPPMProjects, getRequisitionsByPPMProject } from '../../../data';
import { OverviewSection } from '../components/dashboard/OverviewSection';
import { RequisitionsSection } from '../components/dashboard/RequisitionsSection';
import { ChecklistsSection } from '../components/dashboard/ChecklistsSection';
import { OnboardingMatrixSection } from '../components/dashboard/OnboardingMatrixSection';
import { ProjectSettingsSection } from '../components/dashboard/ProjectSettingsSection';
import type { OnboardingMember } from '../../../types';

type DashboardSection = 'overview' | 'requisitions' | 'checklists' | 'onboarding-matrix' | 'settings';

const NAVIGATION_ITEMS: { id: DashboardSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'requisitions', label: 'Requisitions & Members', icon: <Users size={18} /> },
    { id: 'checklists', label: 'Checklists', icon: <ListChecks size={18} /> },
    { id: 'onboarding-matrix', label: 'Onboarding Dashboard', icon: <Grid3X3 size={18} /> },
    { id: 'settings', label: 'Settings & Rules', icon: <Settings size={18} /> },
];


export function OnboardingDashboard() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
    const [members, setMembers] = useState<OnboardingMember[]>([]);

    // For demo purposes, use first PPM project
    const ppmProject = mockPPMProjects[0];
    const requisitions = getRequisitionsByPPMProject(ppmProject.id);

    const handleAddMembers = (newMembers: OnboardingMember[]) => {
        setMembers(prev => [...prev, ...newMembers]);
    };

    const handleRemoveMembers = (memberIds: string[]) => {
        setMembers(prev => prev.filter(m => !memberIds.includes(m.id)));
    };

    const handleInitiateOnboarding = (memberIds: string[]) => {
        setMembers(prev => prev.map(m =>
            memberIds.includes(m.id)
                ? { ...m, status: 'ONBOARDING_INITIATED' as const, onboardingInitiatedAt: new Date().toISOString() }
                : m
        ));
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return <OverviewSection ppmProject={ppmProject} members={members} />;
            case 'requisitions':
                return (
                    <RequisitionsSection
                        requisitions={requisitions}
                        members={members}
                        onAddMembers={handleAddMembers}
                        onRemoveMembers={handleRemoveMembers}
                        onInitiateOnboarding={handleInitiateOnboarding}
                    />
                );
            case 'checklists':
                return <ChecklistsSection />;
            case 'onboarding-matrix':
                return <OnboardingMatrixSection projectId={ppmProject.id} />;
            case 'settings':
                return <ProjectSettingsSection />;
            default:
                return null;
        }
    };

    return (
        <div className="onboarding-dashboard page-enter">
            {/* Header */}
            <div className="dashboard-header">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="btn-icon"
                        onClick={() => navigate('/projects')}
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Onboarding - {ppmProject.name}</h1>
                        <div className="flex items-center gap-4 text-sm text-secondary mt-1">
                            <span className="flex items-center gap-1">
                                <Building size={14} />
                                {ppmProject.clientName}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin size={14} />
                                {ppmProject.location}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(ppmProject.startDate)} - {formatDate(ppmProject.endDate)}
                            </span>
                        </div>
                    </div>
                </div>
                <Badge variant="primary" className="ml-auto">Active</Badge>
            </div>

            <div className="dashboard-layout">
                {/* Side Panel */}
                <nav className="dashboard-sidebar">
                    <ul className="dashboard-nav">
                        {NAVIGATION_ITEMS.map(item => (
                            <li key={item.id}>
                                <button
                                    className={`dashboard-nav-item ${activeSection === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveSection(item.id)}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Key Members Quick View */}
                    <div className="sidebar-section">
                        <h4 className="sidebar-section-title">Key Members</h4>
                        <div className="key-members-sidebar">
                            {ppmProject.projectManager && (
                                <div className="sidebar-member">
                                    <User size={14} />
                                    <div>
                                        <div className="sidebar-member-name">{ppmProject.projectManager.name}</div>
                                        <div className="sidebar-member-role">Project Manager</div>
                                    </div>
                                </div>
                            )}
                            {ppmProject.siteLead && (
                                <div className="sidebar-member">
                                    <User size={14} />
                                    <div>
                                        <div className="sidebar-member-name">{ppmProject.siteLead.name}</div>
                                        <div className="sidebar-member-role">Site Lead</div>
                                    </div>
                                </div>
                            )}
                            {ppmProject.safetyLead && (
                                <div className="sidebar-member">
                                    <User size={14} />
                                    <div>
                                        <div className="sidebar-member-name">{ppmProject.safetyLead.name}</div>
                                        <div className="sidebar-member-role">Safety Lead</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="dashboard-content">
                    {renderSection()}
                </main>
            </div>
        </div>
    );
}
