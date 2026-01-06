import { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
    icon?: ReactNode;
}

export function Badge({ children, variant = 'secondary', className = '', icon }: BadgeProps) {
    return (
        <span className={`badge badge-${variant} ${className}`}>
            {icon}
            {children}
        </span>
    );
}
