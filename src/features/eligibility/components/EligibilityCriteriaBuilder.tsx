import { useState, useEffect } from 'react';
import type { EligibilityCriteria, EligibilityRuleGroup, EligibilityCriteriaContext } from '../../../types';
import { EligibilityRuleGroupComponent } from './EligibilityRuleGroup';
import { generateId, createEmptyRuleGroup } from '../../../data';

interface EligibilityCriteriaBuilderProps {
    criteria?: EligibilityCriteria;
    context: EligibilityCriteriaContext;
    onChange: (criteria: EligibilityCriteria) => void;
    showNameDescription?: boolean; // If false, hide name/description fields (for local rules)
}

/**
 * Main component for building eligibility criteria
 * Orchestrates the criteria name, description, and rule groups
 */
export function EligibilityCriteriaBuilder({
    criteria: initialCriteria,
    context,
    onChange,
    showNameDescription = true,
}: EligibilityCriteriaBuilderProps) {
    // Initialize or use existing criteria
    const [criteria, setCriteria] = useState<EligibilityCriteria>(() => {
        if (initialCriteria) return initialCriteria;

        return {
            id: generateId('criteria'),
            name: '',
            description: '',
            isActive: true,
            rootGroup: createEmptyRuleGroup(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });

    // Propagate changes to parent
    useEffect(() => {
        onChange(criteria);
    }, [criteria, onChange]);

    // Handle name change
    const handleNameChange = (name: string) => {
        setCriteria(prev => ({
            ...prev,
            name,
            updatedAt: new Date().toISOString(),
        }));
    };

    // Handle description change
    const handleDescriptionChange = (description: string) => {
        setCriteria(prev => ({
            ...prev,
            description,
            updatedAt: new Date().toISOString(),
        }));
    };

    // Handle active toggle
    const handleActiveToggle = () => {
        setCriteria(prev => ({
            ...prev,
            isActive: !prev.isActive,
            updatedAt: new Date().toISOString(),
        }));
    };

    // Handle root group change
    const handleRootGroupChange = (rootGroup: EligibilityRuleGroup) => {
        setCriteria(prev => ({
            ...prev,
            rootGroup,
            updatedAt: new Date().toISOString(),
        }));
    };

    // Get context label
    const getContextLabel = () => {
        switch (context) {
            case 'TEMPLATE':
                return 'Template';
            case 'TASK_GROUP':
                return 'Task Group';
            case 'TASK':
                return 'Task';
            default:
                return '';
        }
    };

    return (
        <div className="eligibility-builder">
            {/* Form Section - Only show for named rules */}
            {showNameDescription && (
                <div className="eligibility-form-section">
                    <div className="eligibility-form-section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        Criteria Details
                    </div>

                    {/* Name */}
                    <div className="eligibility-form-group">
                        <label htmlFor="criteria-name" className="eligibility-form-label">
                            Criteria Name <span className="required">*</span>
                        </label>
                        <input
                            id="criteria-name"
                            type="text"
                            className="eligibility-input"
                            placeholder="e.g., DOD Project Requirements"
                            value={criteria.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                        />
                        <div className="eligibility-form-hint">
                            Give your criteria a descriptive name for easy identification
                        </div>
                    </div>

                    {/* Description */}
                    <div className="eligibility-form-group">
                        <label htmlFor="criteria-description" className="eligibility-form-label">
                            Description
                        </label>
                        <textarea
                            id="criteria-description"
                            className="eligibility-textarea"
                            placeholder="Optional description of what this criteria is for..."
                            value={criteria.description || ''}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="form-group form-group-inline">
                        <label className="form-checkbox">
                            <input
                                type="checkbox"
                                checked={criteria.isActive}
                                onChange={handleActiveToggle}
                            />
                            <span className="form-checkbox-label">Active</span>
                        </label>
                        <span className="eligibility-form-hint" style={{ marginTop: 0 }}>
                            Inactive criteria will be saved but not applied
                        </span>
                    </div>
                </div>
            )}

            {/* Rules Section */}
            <div className="eligibility-builder-rules">
                <div className="eligibility-builder-rules-header">
                    <h4 className="eligibility-builder-rules-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        Eligibility Rules
                    </h4>
                    <span className="eligibility-builder-rules-count">
                        {countRules(criteria.rootGroup)} {countRules(criteria.rootGroup) === 1 ? 'rule' : 'rules'}
                    </span>
                </div>
                <EligibilityRuleGroupComponent
                    group={criteria.rootGroup}
                    onChange={handleRootGroupChange}
                    isRoot
                />
            </div>

            {/* Summary */}
            <div className="eligibility-builder-summary">
                <div className="eligibility-summary-card">
                    <span className="eligibility-summary-label">Total Rules</span>
                    <span className="eligibility-summary-value">
                        {countRules(criteria.rootGroup)}
                    </span>
                </div>
                <div className="eligibility-summary-card">
                    <span className="eligibility-summary-label">Status</span>
                    <span className={`eligibility-summary-value ${criteria.isActive ? 'text-success' : 'text-muted'}`}>
                        {criteria.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Helper function to count rules recursively
function countRules(group: EligibilityRuleGroup): number {
    return group.rules.reduce((count, rule) => {
        if (rule.type === 'GROUP') {
            return count + countRules(rule);
        }
        return count + 1;
    }, 0);
}
