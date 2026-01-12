import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui';

interface KeyValuePair {
    key: string;
    value: string;
}

interface KeyValueEditorProps {
    pairs: KeyValuePair[];
    onChange: (pairs: KeyValuePair[]) => void;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    label?: string;
}

export function KeyValueEditor({
    pairs,
    onChange,
    keyPlaceholder = 'Key',
    valuePlaceholder = 'Value',
    label
}: KeyValueEditorProps) {
    const addPair = () => {
        onChange([...pairs, { key: '', value: '' }]);
    };

    const updatePair = (index: number, field: 'key' | 'value', value: string) => {
        const updated = pairs.map((pair, i) =>
            i === index ? { ...pair, [field]: value } : pair
        );
        onChange(updated);
    };

    const removePair = (index: number) => {
        onChange(pairs.filter((_, i) => i !== index));
    };

    return (
        <div className="key-value-editor">
            {label && <label className="input-label">{label}</label>}
            <div className="key-value-list">
                {pairs.map((pair, index) => (
                    <div key={index} className="key-value-row">
                        <input
                            type="text"
                            className="input"
                            placeholder={keyPlaceholder}
                            value={pair.key}
                            onChange={(e) => updatePair(index, 'key', e.target.value)}
                        />
                        <input
                            type="text"
                            className="input"
                            placeholder={valuePlaceholder}
                            value={pair.value}
                            onChange={(e) => updatePair(index, 'value', e.target.value)}
                        />
                        <button
                            type="button"
                            className="btn btn-ghost btn-icon btn-sm key-value-remove"
                            onClick={() => removePair(index)}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={addPair}
            >
                Add {keyPlaceholder}
            </Button>
        </div>
    );
}
