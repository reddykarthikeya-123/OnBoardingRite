import { ReactNode, CSSProperties } from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
    icon?: ReactNode;
    style?: CSSProperties;
}

export function Badge({ children, variant = 'secondary', className = '', icon, style }: BadgeProps) {
    return (
        <span className={`badge badge-${variant} ${className}`} style={style}>
            {icon}
            {children}
        </span>
    );
}
