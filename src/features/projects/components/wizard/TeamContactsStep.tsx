import { User, Phone, Mail, Briefcase } from 'lucide-react';
import type { ProjectFormData } from '../ProjectSetupWizard';
import type { ProjectContact } from '../../../../types';

interface TeamContactsStepProps {
    data: ProjectFormData;
    onUpdate: (data: Partial<ProjectFormData>) => void;
}

interface ContactFieldsProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    contact: ProjectContact | null;
    onChange: (contact: ProjectContact | null) => void;
}

function ContactFields({ title, description, icon, contact, onChange }: ContactFieldsProps) {
    const handleChange = (field: keyof ProjectContact, value: string) => {
        const updated = contact ? { ...contact, [field]: value } : {
            name: '',
            email: '',
            phone: '',
            role: title,
            [field]: value
        };
        onChange(updated);
    };

    return (
        <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--color-border-light)', backgroundColor: 'var(--color-neutral-50)' }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary-100)' }}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-xs text-muted">{description}</p>
                </div>
            </div>

            <div className="grid gap-3">
                <div className="input-group">
                    <label className="input-label flex items-center gap-2">
                        <User size={14} className="text-muted" />
                        Full Name
                    </label>
                    <input
                        type="text"
                        className="input"
                        placeholder="John Smith"
                        value={contact?.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />
                </div>

                <div className="form-row form-row-2">
                    <div className="input-group">
                        <label className="input-label flex items-center gap-2">
                            <Mail size={14} className="text-muted" />
                            Email
                        </label>
                        <input
                            type="email"
                            className="input"
                            placeholder="john@company.com"
                            value={contact?.email || ''}
                            onChange={(e) => handleChange('email', e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label flex items-center gap-2">
                            <Phone size={14} className="text-muted" />
                            Phone
                        </label>
                        <input
                            type="tel"
                            className="input"
                            placeholder="(555) 123-4567"
                            value={contact?.phone || ''}
                            onChange={(e) => handleChange('phone', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TeamContactsStep({ data, onUpdate }: TeamContactsStepProps) {
    return (
        <div>
            <div className="form-section">
                <h2 className="form-section-title">Key Personnel</h2>
                <p className="text-sm text-secondary mb-6">
                    Add contact information for key project personnel. All fields are optional but recommended.
                </p>

                <div className="flex flex-col gap-4">
                    <ContactFields
                        title="Project Manager"
                        description="Primary point of contact for project decisions"
                        icon={<Briefcase size={18} className="text-primary" style={{ color: 'var(--color-primary-600)' }} />}
                        contact={data.projectManager}
                        onChange={(contact) => onUpdate({ projectManager: contact })}
                    />

                    <ContactFields
                        title="Safety Lead"
                        description="Responsible for on-site safety compliance"
                        icon={<User size={18} style={{ color: 'var(--color-secondary-600)' }} />}
                        contact={data.safetyLead}
                        onChange={(contact) => onUpdate({ safetyLead: contact })}
                    />

                    <ContactFields
                        title="Site Contact"
                        description="On-site representative for daily operations"
                        icon={<User size={18} style={{ color: 'var(--color-accent-600)' }} />}
                        contact={data.siteContact}
                        onChange={(contact) => onUpdate({ siteContact: contact })}
                    />
                </div>
            </div>
        </div>
    );
}
