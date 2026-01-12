interface ProgressProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger';
    showLabel?: boolean;
    className?: string;
}

export function Progress({
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    className = '',
}: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const sizeClass = size === 'sm' ? 'progress-sm' : size === 'lg' ? 'progress-lg' : '';
    const barVariantClass = variant === 'default' ? '' : `progress-bar-${variant}`;

    // Auto-determine variant based on percentage if default
    const autoVariant = variant === 'default'
        ? percentage >= 100
            ? 'progress-bar-success'
            : percentage >= 50
                ? ''
                : percentage >= 25
                    ? 'progress-bar-warning'
                    : 'progress-bar-danger'
        : barVariantClass;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`progress ${sizeClass} flex-1`}>
                <div
                    className={`progress-bar ${autoVariant}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-medium text-secondary" style={{ minWidth: '36px' }}>
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    );
}
