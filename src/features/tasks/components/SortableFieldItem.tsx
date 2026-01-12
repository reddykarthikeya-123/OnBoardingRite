import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { FormField } from '../../../types';

interface SortableFieldItemProps {
    field: FormField;
    index: number;
    totalFields: number;
    isSelected: boolean;
    config: { icon: React.ReactNode; label: string };
    onSelect: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
}

export function SortableFieldItem({
    field,
    index,
    totalFields,
    isSelected,
    config,
    onSelect,
    onMoveUp,
    onMoveDown,
    onRemove
}: SortableFieldItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`field-list-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
            onClick={onSelect}
        >
            <div
                className="field-list-item-drag"
                {...attributes}
                {...listeners}
                style={{ cursor: 'grab' }}
            >
                <GripVertical size={14} />
            </div>
            <div className="field-list-item-icon">
                {config.icon}
            </div>
            <div className="field-list-item-content">
                <div className="field-list-item-label">{field.label}</div>
                <div className="field-list-item-type">{config.label}</div>
            </div>
            <div className="field-list-item-badges">
                {field.required && (
                    <Badge variant="danger">Required</Badge>
                )}
            </div>
            <div className="field-list-item-actions">
                <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                    disabled={index === 0}
                >
                    <ChevronUp size={14} />
                </button>
                <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                    disabled={index === totalFields - 1}
                >
                    <ChevronDown size={14} />
                </button>
                <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm field-delete-btn"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
