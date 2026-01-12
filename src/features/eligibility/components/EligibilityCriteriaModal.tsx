import { useState, useEffect } from 'react';
import { X, Save, Filter, Link, FileText, Trash2, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { EligibilityCriteria, EligibilityCriteriaContext, EligibilityRuleGroup } from '../../../types';
import { EligibilityCriteriaBuilder } from './EligibilityCriteriaBuilder';
import { Button } from '../../../components/ui';
import { eligibilityApi } from '../../../services/api';

interface EligibilityCriteriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (criteria: EligibilityCriteria) => void;
    onRemove?: () => void; // Optional callback to remove eligibility
    criteria?: EligibilityCriteria;
    context: EligibilityCriteriaContext;
    entityName?: string; // Name of the template/task group/task
    isNamedRule?: boolean; // If true, this is for creating/editing named rules in the library
}

type LocalRuleMode = 'SELECT' | 'CREATE';

// API list item type (simplified)
interface NamedRuleListItem {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    ruleCount: number;
}

/**
 * Check if the given criteria is from the named rules library
 */
const isFromLibrary = (criteria: EligibilityCriteria | undefined, namedRules: NamedRuleListItem[]): boolean => {
    if (!criteria) return false;
    return namedRules.some(r => r.id === criteria.id);
};

/**
 * Modal wrapper for the eligibility criteria builder
 * Supports both named rules (from library) and local rules (for template/task group/task)
 */
export function EligibilityCriteriaModal({
    isOpen,
    onClose,
    onSave,
    onRemove,
    criteria: initialCriteria,
    context,
    entityName,
    isNamedRule = false,
}: EligibilityCriteriaModalProps) {
    const [criteria, setCriteria] = useState<EligibilityCriteria | undefined>(initialCriteria);
    const [errors, setErrors] = useState<string[]>([]);
    const [localMode, setLocalMode] = useState<LocalRuleMode>('SELECT');
    const [selectedNamedRuleId, setSelectedNamedRuleId] = useState<string>('');
    const [namedRuleSearch, setNamedRuleSearch] = useState('');
    const [namedRules, setNamedRules] = useState<NamedRuleListItem[]>([]);
    const [_isLoadingRules, setIsLoadingRules] = useState(false);

    // Load named rules from API
    useEffect(() => {
        if (isOpen && !isNamedRule) {
            loadNamedRules();
        }
    }, [isOpen, isNamedRule]);

    const loadNamedRules = async () => {
        try {
            setIsLoadingRules(true);
            const data = await eligibilityApi.list();
            setNamedRules(data || []);
        } catch (error) {
            console.error('Failed to load named rules:', error);
        } finally {
            setIsLoadingRules(false);
        }
    };
    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCriteria(initialCriteria);
            setErrors([]);
            setNamedRuleSearch('');

            // Determine the correct mode based on whether criteria exists and if it's from library
            if (initialCriteria) {
                if (isFromLibrary(initialCriteria, namedRules)) {
                    // This is a named rule from the library
                    setLocalMode('SELECT');
                    setSelectedNamedRuleId(initialCriteria.id);
                } else {
                    // This is a local rule
                    setLocalMode('CREATE');
                    setSelectedNamedRuleId('');
                }
            } else {
                // No criteria - default to SELECT mode
                setLocalMode('SELECT');
                setSelectedNamedRuleId('');
            }
        }
    }, [isOpen, initialCriteria]);

    // Don't render if not open
    if (!isOpen) return null;

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

    // Filter named rules by search
    const filteredNamedRules = namedRules.filter(rule =>
        rule.name.toLowerCase().includes(namedRuleSearch.toLowerCase()) ||
        (rule.description || '').toLowerCase().includes(namedRuleSearch.toLowerCase())
    );

    // Validate criteria before saving
    const validateCriteria = (): boolean => {
        const newErrors: string[] = [];

        // For named rules, name is required
        if (isNamedRule && criteria && !criteria.name.trim()) {
            newErrors.push('Criteria name is required');
        }

        if (localMode === 'SELECT') {
            if (!selectedNamedRuleId) {
                newErrors.push('Please select a rule from the library');
            }
        } else {
            if (!criteria) {
                newErrors.push('No criteria defined');
                setErrors(newErrors);
                return false;
            }

            if (criteria.rootGroup.rules.length === 0) {
                newErrors.push('At least one rule is required');
            }

            // Check for empty field selections in rules
            const hasEmptyFields = checkForEmptyFields(criteria.rootGroup);
            if (hasEmptyFields) {
                newErrors.push('All rules must have a field selected');
            }
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    // Check recursively for empty field selections
    const checkForEmptyFields = (group: EligibilityRuleGroup): boolean => {
        for (const rule of group.rules) {
            if (rule.type === 'FIELD_RULE' && !rule.fieldId) {
                return true;
            }
            if (rule.type === 'GROUP' && checkForEmptyFields(rule)) {
                return true;
            }
            if (rule.type === 'SQL_RULE' && !rule.sqlQuery.trim()) {
                return true;
            }
        }
        return false;
    };

    // Handle save
    const handleSave = async () => {
        if (!validateCriteria()) return;

        if (localMode === 'SELECT' && selectedNamedRuleId) {
            // Fetch the full selected named rule and use it
            try {
                const namedRule = await eligibilityApi.get(selectedNamedRuleId);
                if (namedRule) {
                    onSave(namedRule);
                    onClose();
                }
            } catch (error) {
                console.error('Failed to load rule details:', error);
                setErrors(['Failed to load rule details']);
            }
        } else if (criteria) {
            // For local rules without a name, generate a default name
            const finalCriteria = {
                ...criteria,
                name: criteria.name || `Local Rule`,
            };
            onSave(finalCriteria);
            onClose();
        }
    };

    // Handle remove (no confirmation - parent shows toast with undo)
    const handleRemove = () => {
        if (onRemove) {
            onRemove();
            onClose();
        }
    };

    // Handle criteria change from builder
    const handleCriteriaChange = (updated: EligibilityCriteria) => {
        setCriteria(updated);
        // Clear errors when user makes changes
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    // Handle named rule selection
    const handleSelectNamedRule = (ruleId: string) => {
        setSelectedNamedRuleId(ruleId);
        setErrors([]);
    };

    const modalContent = (
        <>
            <div className="modal-backdrop" onClick={onClose} />
            <div
                className="modal modal-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="eligibility-modal-title"
            >
                <div className="modal-header">
                    <div className="modal-header-content">
                        <div className="modal-header-icon">
                            <Filter size={22} />
                        </div>
                        <div>
                            <h2 id="eligibility-modal-title" className="modal-title">
                                {isNamedRule ? 'Eligibility Rule' : 'Eligibility Criteria'}
                            </h2>
                            {entityName && !isNamedRule && (
                                <p className="modal-subtitle">
                                    {getContextLabel()}: {entityName}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="btn-icon"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </Button>
                </div>

                <div className="modal-body eligibility-modal-body">
                    {errors.length > 0 && (
                        <div className="eligibility-errors">
                            {errors.map((error, index) => (
                                <div key={index} className="eligibility-error">
                                    {error}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mode selector for local rules (not named rules) */}
                    {!isNamedRule && (
                        <div className="eligibility-mode-selector">
                            <button
                                type="button"
                                className={`eligibility-mode-option ${localMode === 'SELECT' ? 'active' : ''}`}
                                onClick={() => setLocalMode('SELECT')}
                            >
                                <div className="eligibility-mode-icon">
                                    <Link size={20} />
                                </div>
                                <div className="eligibility-mode-content">
                                    <div className="eligibility-mode-title">Use Named Rule</div>
                                    <div className="eligibility-mode-desc">Select from your saved rules library</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                className={`eligibility-mode-option ${localMode === 'CREATE' ? 'active' : ''}`}
                                onClick={() => setLocalMode('CREATE')}
                            >
                                <div className="eligibility-mode-icon">
                                    <FileText size={20} />
                                </div>
                                <div className="eligibility-mode-content">
                                    <div className="eligibility-mode-title">Create Local Rule</div>
                                    <div className="eligibility-mode-desc">Build a rule specific to this {getContextLabel().toLowerCase()}</div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Named rule selector */}
                    {!isNamedRule && localMode === 'SELECT' && (
                        <div className="eligibility-named-rule-list">
                            <div className="eligibility-named-rule-header">
                                <h4>Select a Named Rule</h4>
                                <span className="eligibility-named-rule-count">
                                    {filteredNamedRules.length} of {namedRules.length} rules
                                </span>
                            </div>

                            {/* Search input for named rules */}
                            <div className="eligibility-named-rule-search">
                                <Search size={16} className="eligibility-named-rule-search-icon" />
                                <input
                                    type="text"
                                    className="eligibility-named-rule-search-input"
                                    placeholder="Search rules..."
                                    value={namedRuleSearch}
                                    onChange={(e) => setNamedRuleSearch(e.target.value)}
                                />
                            </div>

                            <div className="eligibility-named-rule-grid">
                                {filteredNamedRules.length === 0 ? (
                                    <div className="eligibility-named-rule-empty">
                                        No rules match your search
                                    </div>
                                ) : (
                                    filteredNamedRules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            className={`eligibility-named-rule-card ${selectedNamedRuleId === rule.id ? 'selected' : ''}`}
                                            onClick={() => handleSelectNamedRule(rule.id)}
                                        >
                                            <div className="eligibility-named-rule-card-icon">
                                                <Filter size={16} />
                                            </div>
                                            <div className="eligibility-named-rule-card-content">
                                                <div className="eligibility-named-rule-card-title">{rule.name}</div>
                                                {rule.description && (
                                                    <div className="eligibility-named-rule-card-desc">{rule.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Builder for local rules or named rules */}
                    {(isNamedRule || localMode === 'CREATE') && (
                        <EligibilityCriteriaBuilder
                            criteria={initialCriteria}
                            context={context}
                            onChange={handleCriteriaChange}
                            showNameDescription={isNamedRule} // Only show name/desc for named rules
                        />
                    )}
                </div>

                <div className="modal-footer">
                    {/* Remove button - only show if there's existing criteria and onRemove callback */}
                    {initialCriteria && onRemove && !isNamedRule && (
                        <Button
                            variant="ghost"
                            onClick={handleRemove}
                            className="btn-danger-text"
                            style={{ marginRight: 'auto' }}
                        >
                            <Trash2 size={16} />
                            Remove
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        <Save size={16} />
                        {localMode === 'SELECT' && !isNamedRule ? 'Apply Rule' : 'Save Criteria'}
                    </Button>
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
}
