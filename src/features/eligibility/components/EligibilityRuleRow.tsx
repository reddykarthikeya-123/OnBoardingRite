
import { Trash2 } from 'lucide-react';
import type { EligibilityRule, EligibilityOperator, EligibilityFieldDefinition } from '../../../types';
import {
    ELIGIBILITY_FIELDS,
    ELIGIBILITY_OPERATORS,
    getFieldById,
    getOperatorInfo,
    FIELD_CATEGORY_LABELS,
} from '../../../data';

interface EligibilityRuleRowProps {
    rule: EligibilityRule;
    onChange: (rule: EligibilityRule) => void;
    onDelete: () => void;
    isFirst?: boolean;
    parentLogic?: 'AND' | 'OR';
}

/**
 * Single rule row with field selector, operator dropdown, and value input
 */
export function EligibilityRuleRow({
    rule,
    onChange,
    onDelete,
    isFirst = false,
    parentLogic = 'AND',
}: EligibilityRuleRowProps) {
    const field = getFieldById(rule.fieldId);
    const operatorInfo = getOperatorInfo(rule.operator);

    // Get available operators for the selected field
    const getAvailableOperators = () => {
        if (!field) return ELIGIBILITY_OPERATORS;
        return ELIGIBILITY_OPERATORS.filter(op => field.operators.includes(op.value));
    };

    // Handle field change
    const handleFieldChange = (fieldId: string) => {
        const newField = getFieldById(fieldId);
        const availableOps = newField?.operators || [];
        onChange({
            ...rule,
            fieldId,
            // Reset operator if current one isn't valid for new field
            operator: availableOps.includes(rule.operator) ? rule.operator : (availableOps[0] || 'equals'),
            value: null,
            valueEnd: undefined,
        });
    };

    // Handle operator change
    const handleOperatorChange = (operator: EligibilityOperator) => {
        const opInfo = getOperatorInfo(operator);
        onChange({
            ...rule,
            operator,
            // Clear value if operator doesn't require it
            value: opInfo?.requiresValue ? rule.value : null,
            valueEnd: opInfo?.requiresSecondValue ? rule.valueEnd : undefined,
        });
    };

    // Render value input based on field type and operator
    const renderValueInput = () => {
        if (!operatorInfo?.requiresValue) {
            return <span className="eligibility-rule-no-value">No value needed</span>;
        }

        // Handle 'in' and 'not_in' operators (multi-select)
        if (rule.operator === 'in' || rule.operator === 'not_in') {
            if (field?.options) {
                return (
                    <select
                        className="eligibility-select eligibility-rule-value"
                        multiple
                        value={Array.isArray(rule.value) ? rule.value.map(String) : []}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            onChange({ ...rule, value: selected });
                        }}
                    >
                        {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            }
            // Free-text multi-value input
            return (
                <input
                    type="text"
                    className="eligibility-input eligibility-rule-value"
                    placeholder="Value1, Value2, Value3"
                    value={Array.isArray(rule.value) ? rule.value.join(', ') : (rule.value as string || '')}
                    onChange={(e) => {
                        const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                        onChange({ ...rule, value: values });
                    }}
                />
            );
        }

        // Handle 'between' operator
        if (rule.operator === 'between') {
            const inputType = field?.dataType === 'DATE' ? 'date' : 'text';
            return (
                <div className="eligibility-rule-between">
                    <input
                        type={inputType}
                        className="eligibility-input eligibility-rule-value"
                        placeholder="From"
                        value={(rule.value as string) || ''}
                        onChange={(e) => onChange({ ...rule, value: e.target.value })}
                    />
                    <span className="eligibility-rule-between-sep">and</span>
                    <input
                        type={inputType}
                        className="eligibility-input eligibility-rule-value"
                        placeholder="To"
                        value={rule.valueEnd as string || ''}
                        onChange={(e) => onChange({ ...rule, valueEnd: e.target.value })}
                    />
                </div>
            );
        }

        // Single value input
        if (field?.options) {
            return (
                <select
                    className="eligibility-select eligibility-rule-value"
                    value={(rule.value as string) || ''}
                    onChange={(e) => onChange({ ...rule, value: e.target.value })}
                >
                    <option value="">Select value...</option>
                    {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        // Input type based on field data type
        let inputType = 'text';
        if (field?.dataType === 'NUMBER') inputType = 'number';
        if (field?.dataType === 'DATE') inputType = 'date';

        return (
            <input
                type={inputType}
                className="eligibility-input eligibility-rule-value"
                placeholder={field?.placeholder || 'Enter value'}
                value={(rule.value as string) ?? ''}
                onChange={(e) => onChange({ ...rule, value: e.target.value })}
            />
        );
    };

    // Group fields by category for the dropdown
    const groupedFields = ELIGIBILITY_FIELDS.reduce((acc, f) => {
        const category = f.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(f);
        return acc;
    }, {} as Record<string, EligibilityFieldDefinition[]>);

    return (
        <div className="eligibility-rule-row">
            {!isFirst && (
                <span className="eligibility-rule-logic">
                    {parentLogic}
                </span>
            )}

            <div className="eligibility-rule-content">
                {/* Field Selector */}
                <select
                    className="eligibility-select eligibility-rule-field"
                    value={rule.fieldId}
                    onChange={(e) => handleFieldChange(e.target.value)}
                >
                    <option value="">Select field...</option>
                    {Object.entries(groupedFields).map(([category, fields]) => (
                        <optgroup key={category} label={FIELD_CATEGORY_LABELS[category as keyof typeof FIELD_CATEGORY_LABELS]}>
                            {fields.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>

                {/* Operator Selector */}
                <select
                    className="eligibility-select eligibility-rule-operator"
                    value={rule.operator}
                    onChange={(e) => handleOperatorChange(e.target.value as EligibilityOperator)}
                    disabled={!rule.fieldId}
                >
                    {getAvailableOperators().map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                </select>

                {/* Value Input */}
                {renderValueInput()}

                {/* Delete Button */}
                <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-icon eligibility-rule-delete"
                    onClick={onDelete}
                    title="Remove rule"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
