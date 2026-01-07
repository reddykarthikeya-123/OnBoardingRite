
import { Filter, ChevronRight } from 'lucide-react';
import type { EligibilityCriteria } from '../../../types';

interface EligibilityCriteriaBadgeProps {
    criteriaId?: string;
    criteria?: EligibilityCriteria;
    onClick?: (e?: React.MouseEvent) => void;
    showDetails?: boolean;
}

/**
 * Compact badge display for eligibility criteria
 * Shows criteria name and rule count, clickable to edit
 * 
 * Note: Criteria should be passed directly via the `criteria` prop.
 * If only `criteriaId` is provided without `criteria`, an empty badge is shown.
 */
export function EligibilityCriteriaBadge({
    criteriaId,
    criteria,
    onClick,
    showDetails = false,
}: EligibilityCriteriaBadgeProps) {
    if (!criteria) {
        return (
            <button
                className="eligibility-badge eligibility-badge-empty"
                onClick={onClick}
                type="button"
            >
                <Filter size={14} />
                <span>Add Eligibility</span>
            </button>
        );
    }

    // Count total rules (including nested)
    const countRules = (group: typeof criteria.rootGroup): number => {
        return group.rules.reduce((count, rule) => {
            if (rule.type === 'GROUP') {
                return count + countRules(rule);
            }
            return count + 1;
        }, 0);
    };

    const ruleCount = countRules(criteria.rootGroup);

    return (
        <button
            className={`eligibility-badge ${criteria.isActive ? 'eligibility-badge-active' : 'eligibility-badge-inactive'}`}
            onClick={onClick}
            type="button"
            title={criteria.description || criteria.name}
        >
            <Filter size={14} />
            <span className="eligibility-badge-name">{criteria.name}</span>
            <span className="eligibility-badge-count">{ruleCount} rule{ruleCount !== 1 ? 's' : ''}</span>
            {onClick && <ChevronRight size={14} className="eligibility-badge-arrow" />}
        </button>
    );
}
