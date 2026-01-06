import { ReactNode } from 'react';
import {
    Circle,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import type { TaskStatus } from '../../types';

interface StatusIndicatorProps {
    status: TaskStatus;
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
}

const statusConfig: Record<TaskStatus, {
    icon: ReactNode;
    className: string;
    label: string;
}> = {
    NOT_STARTED: {
        icon: <Circle size={14} />,
        className: 'status-not-started',
        label: 'Not Started',
    },
    IN_PROGRESS: {
        icon: <Clock size={14} />,
        className: 'status-in-progress',
        label: 'In Progress',
    },
    COMPLETED: {
        icon: <CheckCircle2 size={14} />,
        className: 'status-completed',
        label: 'Completed',
    },
    BLOCKED: {
        icon: <XCircle size={14} />,
        className: 'status-blocked',
        label: 'Blocked',
    },
    WAIVED: {
        icon: <AlertTriangle size={14} />,
        className: 'status-waived',
        label: 'Waived',
    },
};

export function StatusIndicator({ status, showTooltip = true }: StatusIndicatorProps) {
    const config = statusConfig[status];

    return (
        <div
            className={`status-indicator ${config.className} ${showTooltip ? 'tooltip' : ''}`}
            data-tooltip={showTooltip ? config.label : undefined}
        >
            {config.icon}
        </div>
    );
}

export function getStatusLabel(status: TaskStatus): string {
    return statusConfig[status]?.label || status;
}
