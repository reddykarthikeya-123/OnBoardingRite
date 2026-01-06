interface CheckboxProps {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    label?: string;
}

export function Checkbox({ checked, onChange, disabled = false, label }: CheckboxProps) {
    return (
        <label className={`checkbox-wrapper ${disabled ? 'disabled' : ''}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="checkbox-input"
            />
            <span className="checkbox-custom">
                {checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                            d="M2 6L5 9L10 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </span>
            {label && <span className="checkbox-label">{label}</span>}
        </label>
    );
}
