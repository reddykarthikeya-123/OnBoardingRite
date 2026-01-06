import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'elevated' | 'glass' | 'interactive';
    onClick?: () => void;
}

export function Card({ children, className = '', variant = 'default', onClick }: CardProps) {
    const variantClass = variant === 'default' ? '' : `card-${variant}`;

    return (
        <div
            className={`card ${variantClass} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
    return <div className={`card-header ${className}`}>{children}</div>;
}

interface CardBodyProps {
    children: ReactNode;
    className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
    return <div className={`card-body ${className}`}>{children}</div>;
}

interface CardFooterProps {
    children: ReactNode;
    className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
    return <div className={`card-footer ${className}`}>{children}</div>;
}
