import { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Building, User, Phone, Mail, Search, ChevronDown, Check } from 'lucide-react';
import { Card, CardBody, Badge } from '../../../../components/ui';
import { mockPPMProjects } from '../../../../data';
import type { ProjectFormData } from '../ProjectSetupWizard';
import type { PPMProject } from '../../../../types';

interface PPMProjectSelectionStepProps {
    data: ProjectFormData;
    onUpdate: (data: Partial<ProjectFormData>) => void;
}

export function PPMProjectSelectionStep({ data, onUpdate }: PPMProjectSelectionStepProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedProject = mockPPMProjects.find(p => p.id === data.ppmProjectId);

    const filteredProjects = mockPPMProjects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleProjectSelect = (project: PPMProject) => {
        onUpdate({
            ppmProjectId: project.id,
            name: `Onboarding - ${project.name}`,
            description: project.description,
            clientId: project.clientId,
            clientName: project.clientName,
            location: project.location,
            startDate: project.startDate,
            endDate: project.endDate,
            projectManager: project.projectManager ? {
                name: project.projectManager.name,
                email: project.projectManager.email,
                phone: project.projectManager.phone,
                role: project.projectManager.title
            } : null,
            safetyLead: project.safetyLead ? {
                name: project.safetyLead.name,
                email: project.safetyLead.email,
                phone: project.safetyLead.phone,
                role: project.safetyLead.title
            } : null,
            siteContact: project.siteLead ? {
                name: project.siteLead.name,
                email: project.siteLead.email,
                phone: project.siteLead.phone,
                role: project.siteLead.title
            } : null,
        });
        setIsOpen(false);
        setSearchQuery('');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatShortDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="ppm-project-selection">
            <div className="form-section">
                <h2 className="form-section-title">Select Project</h2>
                <p className="text-sm text-secondary mb-4">
                    Choose a project to create an onboarding project for. The project details will be synced automatically.
                </p>

                <div className="form-group">
                    <label className="form-label">Project</label>

                    {/* Modern Searchable Dropdown */}
                    <div className="project-search-dropdown" ref={dropdownRef}>
                        <button
                            type="button"
                            className={`project-dropdown-trigger ${isOpen ? 'open' : ''} ${selectedProject ? 'has-value' : ''}`}
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {selectedProject ? (
                                <div className="selected-project-preview">
                                    <div className="selected-project-main">
                                        <span className="selected-project-name">{selectedProject.name}</span>
                                        <Badge variant="secondary">{selectedProject.clientName}</Badge>
                                    </div>
                                    <div className="selected-project-meta">
                                        <span><MapPin size={12} /> {selectedProject.location}</span>
                                        <span><Calendar size={12} /> {formatShortDate(selectedProject.startDate)}</span>
                                    </div>
                                </div>
                            ) : (
                                <span className="placeholder">Search or select a project...</span>
                            )}
                            <ChevronDown size={18} className={`dropdown-icon ${isOpen ? 'rotated' : ''}`} />
                        </button>

                        {isOpen && (
                            <div className="project-dropdown-menu">
                                <div className="project-search-input-wrapper">
                                    <Search size={16} className="search-icon" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="project-search-input"
                                        placeholder="Search by name, client, or location..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="project-options-list">
                                    {filteredProjects.length > 0 ? (
                                        filteredProjects.map(project => (
                                            <button
                                                key={project.id}
                                                type="button"
                                                className={`project-option ${project.id === data.ppmProjectId ? 'selected' : ''}`}
                                                onClick={() => handleProjectSelect(project)}
                                            >
                                                <div className="project-option-content">
                                                    <div className="project-option-row1">
                                                        <span className="project-option-name">{project.name}</span>
                                                        <Badge variant="secondary">{project.clientName}</Badge>
                                                    </div>
                                                    <div className="project-option-row2">
                                                        <span className="project-option-meta">
                                                            <MapPin size={12} />
                                                            {project.location}
                                                        </span>
                                                        <span className="project-option-meta">
                                                            <Calendar size={12} />
                                                            {formatShortDate(project.startDate)} - {formatShortDate(project.endDate)}
                                                        </span>
                                                        <span className="project-option-meta">
                                                            <User size={12} />
                                                            {project.projectManager?.name || 'No PM assigned'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {project.id === data.ppmProjectId && (
                                                    <Check size={18} className="project-option-check" />
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="project-no-results">
                                            <Search size={24} />
                                            <p>No projects found</p>
                                            <span>Try a different search term</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedProject && (
                <div className="form-section">
                    <h3 className="form-section-title">Project Details</h3>
                    <p className="text-sm text-secondary mb-4">
                        The following details are synced from the system and will be used for the onboarding project.
                    </p>

                    <Card className="ppm-project-details-card">
                        <CardBody>
                            <div className="ppm-project-header">
                                <div className="ppm-project-title">
                                    <h4>{selectedProject.name}</h4>
                                    <span className="ppm-project-client">
                                        <Building size={14} />
                                        {selectedProject.clientName}
                                    </span>
                                </div>
                            </div>

                            <p className="ppm-project-description">{selectedProject.description}</p>

                            <div className="ppm-project-meta">
                                <div className="ppm-meta-item">
                                    <MapPin size={16} />
                                    <span>{selectedProject.location}</span>
                                </div>
                                <div className="ppm-meta-item">
                                    <Calendar size={16} />
                                    <span>{formatDate(selectedProject.startDate)} - {formatDate(selectedProject.endDate)}</span>
                                </div>
                            </div>

                            <div className="ppm-key-members">
                                <h5>Key Members</h5>
                                <div className="ppm-members-grid">
                                    {selectedProject.projectManager && (
                                        <div className="ppm-member-card">
                                            <div className="ppm-member-role">Project Manager</div>
                                            <div className="ppm-member-name">
                                                <User size={14} />
                                                {selectedProject.projectManager.name}
                                            </div>
                                            <div className="ppm-member-contact">
                                                <span><Mail size={12} /> {selectedProject.projectManager.email}</span>
                                                <span><Phone size={12} /> {selectedProject.projectManager.phone}</span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedProject.siteLead && (
                                        <div className="ppm-member-card">
                                            <div className="ppm-member-role">Site Lead</div>
                                            <div className="ppm-member-name">
                                                <User size={14} />
                                                {selectedProject.siteLead.name}
                                            </div>
                                            <div className="ppm-member-contact">
                                                <span><Mail size={12} /> {selectedProject.siteLead.email}</span>
                                                <span><Phone size={12} /> {selectedProject.siteLead.phone}</span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedProject.safetyLead && (
                                        <div className="ppm-member-card">
                                            <div className="ppm-member-role">Safety Lead</div>
                                            <div className="ppm-member-name">
                                                <User size={14} />
                                                {selectedProject.safetyLead.name}
                                            </div>
                                            <div className="ppm-member-contact">
                                                <span><Mail size={12} /> {selectedProject.safetyLead.email}</span>
                                                <span><Phone size={12} /> {selectedProject.safetyLead.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
}
