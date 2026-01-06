
import { Plus, Trash2, Layers } from 'lucide-react';
import type { EligibilityRuleGroup, EligibilityRuleItem, EligibilityRule, CustomSQLRule } from '../../../types';
import { EligibilityRuleRow } from './EligibilityRuleRow';
import { SQLRuleEditor } from './SQLRuleEditor';
import { generateId } from '../../../data';

interface EligibilityRuleGroupProps {
    group: EligibilityRuleGroup;
    onChange: (group: EligibilityRuleGroup) => void;
    onDelete?: () => void;
    isRoot?: boolean;
    depth?: number;
}

/**
 * Container for multiple rules with AND/OR logic
 * Supports nested groups for complex conditions
 */
export function EligibilityRuleGroupComponent({
    group,
    onChange,
    onDelete,
    isRoot = false,
    depth = 0,
}: EligibilityRuleGroupProps) {
    // Toggle logic between AND/OR
    const handleLogicToggle = () => {
        onChange({
            ...group,
            logic: group.logic === 'AND' ? 'OR' : 'AND',
        });
    };

    // Update a specific rule
    const handleRuleChange = (index: number, updatedRule: EligibilityRuleItem) => {
        const newRules = [...group.rules];
        newRules[index] = updatedRule;
        onChange({ ...group, rules: newRules });
    };

    // Delete a specific rule
    const handleRuleDelete = (index: number) => {
        const newRules = group.rules.filter((_, i) => i !== index);
        onChange({ ...group, rules: newRules });
    };

    // Add a new field rule
    const handleAddRule = () => {
        const newRule: EligibilityRule = {
            id: generateId('rule'),
            type: 'FIELD_RULE',
            fieldId: '',
            operator: 'equals',
            value: null,
        };
        onChange({ ...group, rules: [...group.rules, newRule] });
    };

    // Add a nested group
    const handleAddGroup = () => {
        const newGroup: EligibilityRuleGroup = {
            id: generateId('group'),
            type: 'GROUP',
            logic: group.logic === 'AND' ? 'OR' : 'AND', // Default to opposite logic
            rules: [],
        };
        onChange({ ...group, rules: [...group.rules, newGroup] });
    };

    // Add a SQL rule
    const handleAddSQLRule = () => {
        const newSQLRule: CustomSQLRule = {
            id: generateId('sql'),
            type: 'SQL_RULE',
            name: 'New SQL Rule',
            description: '',
            sqlQuery: '',
        };
        onChange({ ...group, rules: [...group.rules, newSQLRule] });
    };

    // Render a single rule item based on its type
    const renderRuleItem = (rule: EligibilityRuleItem, index: number) => {
        const isFirst = index === 0;

        if (rule.type === 'GROUP') {
            return (
                <div key={rule.id} className="eligibility-nested-group">
                    {!isFirst && (
                        <span className="eligibility-rule-logic eligibility-group-logic">
                            {group.logic}
                        </span>
                    )}
                    <EligibilityRuleGroupComponent
                        group={rule}
                        onChange={(updated) => handleRuleChange(index, updated)}
                        onDelete={() => handleRuleDelete(index)}
                        depth={depth + 1}
                    />
                </div>
            );
        }

        if (rule.type === 'SQL_RULE') {
            return (
                <div key={rule.id} className="eligibility-sql-rule-wrapper">
                    {!isFirst && (
                        <span className="eligibility-rule-logic">
                            {group.logic}
                        </span>
                    )}
                    <SQLRuleEditor
                        rule={rule}
                        onChange={(updated: CustomSQLRule) => handleRuleChange(index, updated)}
                        onDelete={() => handleRuleDelete(index)}
                    />
                </div>
            );
        }

        // FIELD_RULE
        return (
            <EligibilityRuleRow
                key={rule.id}
                rule={rule}
                onChange={(updated) => handleRuleChange(index, updated)}
                onDelete={() => handleRuleDelete(index)}
                isFirst={isFirst}
                parentLogic={group.logic}
            />
        );
    };

    return (
        <div className={`eligibility-rule-group ${isRoot ? 'eligibility-rule-group-root' : ''} eligibility-depth-${Math.min(depth, 3)}`}>
            {/* Group Header */}
            <div className="eligibility-group-header">
                <button
                    type="button"
                    className={`eligibility-logic-toggle ${group.logic === 'AND' ? 'logic-and' : 'logic-or'}`}
                    onClick={handleLogicToggle}
                    title={`Click to switch to ${group.logic === 'AND' ? 'OR' : 'AND'}`}
                >
                    <span className="logic-option">AND</span>
                    <span className="logic-option">OR</span>
                    <span className="logic-slider" />
                </button>

                {!isRoot && onDelete && (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={onDelete}
                        title="Remove group"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Rules */}
            <div className="eligibility-group-rules">
                {group.rules.length === 0 ? (
                    <div className="eligibility-group-empty">
                        <p>No rules defined. Add a rule to get started.</p>
                    </div>
                ) : (
                    group.rules.map((rule, index) => renderRuleItem(rule, index))
                )}
            </div>

            {/* Add Buttons */}
            <div className="eligibility-group-actions">
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddRule}
                >
                    <Plus size={14} />
                    Add Rule
                </button>
                <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleAddGroup}
                >
                    <Layers size={14} />
                    Add Nested Group
                </button>
                <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleAddSQLRule}
                >
                    <Plus size={14} />
                    Add SQL Rule
                </button>
            </div>
        </div>
    );
}
