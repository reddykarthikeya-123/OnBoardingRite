import type { ProjectFormData } from '../ProjectSetupWizard';

interface ProjectDetailsStepProps {
    data: ProjectFormData;
    onUpdate: (data: Partial<ProjectFormData>) => void;
}

const CLIENTS = [
    { id: 'client-001', name: 'Marathon Petroleum' },
    { id: 'client-002', name: 'ExxonMobil' },
    { id: 'client-003', name: 'US Navy' },
    { id: 'client-004', name: 'Shell' },
    { id: 'client-005', name: 'Chevron' },
    { id: 'client-006', name: 'Phillips 66' },
    { id: 'client-007', name: 'Valero' },
];

export function ProjectDetailsStep({ data, onUpdate }: ProjectDetailsStepProps) {
    const handleClientChange = (clientId: string) => {
        const client = CLIENTS.find((c) => c.id === clientId);
        onUpdate({
            clientId,
            clientName: client?.name || '',
        });
    };

    return (
        <div className="form-section">
            <h2 className="form-section-title">Project Information</h2>

            <div className="input-group mb-4">
                <label className="input-label" htmlFor="name">
                    Project Name <span className="text-danger">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    className="input"
                    placeholder="e.g., Marathon Galveston Turnaround"
                    value={data.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                />
            </div>

            <div className="input-group mb-4">
                <label className="input-label" htmlFor="description">
                    Description
                </label>
                <textarea
                    id="description"
                    className="input textarea"
                    placeholder="Brief description of the project scope and objectives..."
                    value={data.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    rows={3}
                />
            </div>

            <div className="form-row form-row-2">
                <div className="input-group">
                    <label className="input-label" htmlFor="client">
                        Client <span className="text-danger">*</span>
                    </label>
                    <select
                        id="client"
                        className="input select"
                        value={data.clientId}
                        onChange={(e) => handleClientChange(e.target.value)}
                    >
                        <option value="">Select a client...</option>
                        {CLIENTS.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="location">
                        Location <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        id="location"
                        className="input"
                        placeholder="City, State"
                        value={data.location}
                        onChange={(e) => onUpdate({ location: e.target.value })}
                    />
                </div>
            </div>

            <div className="form-row form-row-2">
                <div className="input-group">
                    <label className="input-label" htmlFor="startDate">
                        Start Date <span className="text-danger">*</span>
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        className="input"
                        value={data.startDate}
                        onChange={(e) => onUpdate({ startDate: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="endDate">
                        End Date
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        className="input"
                        value={data.endDate}
                        onChange={(e) => onUpdate({ endDate: e.target.value })}
                    />
                </div>
            </div>

            <div className="form-section mt-6">
                <h2 className="form-section-title">Project Flags</h2>
                <p className="text-sm text-secondary mb-4">
                    Select applicable compliance requirements for this project
                </p>

                <div className="flex gap-6">
                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={data.isDOD}
                            onChange={(e) => onUpdate({ isDOD: e.target.checked })}
                        />
                        <div>
                            <span className="font-medium">DOD Project</span>
                            <p className="text-xs text-muted mt-1">
                                Requires additional security clearance and compliance
                            </p>
                        </div>
                    </label>

                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={data.isODRISA}
                            onChange={(e) => onUpdate({ isODRISA: e.target.checked })}
                        />
                        <div>
                            <span className="font-medium">ODRISA Compliance</span>
                            <p className="text-xs text-muted mt-1">
                                Owner Drug & Alcohol testing requirements
                            </p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
