import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
    badge?: React.ReactNode;
}

export function CollapsibleSection({
    title,
    icon,
    defaultOpen = true,
    children,
    badge
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="collapsible-section">
            <button
                type="button"
                className="collapsible-section-header"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {icon && <span className="collapsible-section-icon">{icon}</span>}
                    <span className="collapsible-section-title">{title}</span>
                    {badge && <span className="ml-2">{badge}</span>}
                </div>
            </button>
            <div className={`collapsible-section-content ${isOpen ? 'open' : ''}`}>
                {children}
            </div>
        </div>
    );
}
