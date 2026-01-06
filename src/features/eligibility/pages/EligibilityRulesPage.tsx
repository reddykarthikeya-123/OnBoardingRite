import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Pencil, Trash2, Copy, Loader2 } from 'lucide-react';
import { Card, Button, Badge } from '../../../components/ui';
import { EligibilityCriteriaModal } from '../components';
import type { EligibilityCriteria } from '../../../types';
import { eligibilityApi } from '../../../services/api';

// API List item type (simplified)
interface EligibilityListItem {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    ruleCount: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Eligibility Rules page - manages named, reusable eligibility rules
 */
export function EligibilityRulesPage() {
    const [rules, setRules] = useState<EligibilityListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<EligibilityCriteria | undefined>(undefined);

    // Load rules from API
    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            setIsLoading(true);
            const data = await eligibilityApi.list();
            setRules(data || []);
        } catch (error) {
            console.error('Failed to load eligibility rules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter rules by search (client-side for quick filter)
    const filteredRules = rules.filter(rule =>
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Open modal to create new rule
    const handleCreateNew = () => {
        setEditingRule(undefined);
        setShowModal(true);
    };

    // Open modal to edit existing rule - fetch full details
    const handleEdit = async (rule: EligibilityListItem) => {
        try {
            const fullRule = await eligibilityApi.get(rule.id);
            setEditingRule(fullRule);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to load rule details:', error);
            alert('Failed to load rule details.');
        }
    };

    // Save rule (create or update)
    const handleSave = async (criteria: EligibilityCriteria) => {
        try {
            if (editingRule) {
                // Update existing
                await eligibilityApi.update(criteria.id, {
                    name: criteria.name,
                    description: criteria.description,
                    isActive: criteria.isActive,
                    rootGroup: criteria.rootGroup
                });
            } else {
                // Create new
                await eligibilityApi.create({
                    name: criteria.name,
                    description: criteria.description,
                    rootGroup: criteria.rootGroup
                });
            }
            setShowModal(false);
            setEditingRule(undefined);
            loadRules(); // Refresh list
        } catch (error) {
            console.error('Failed to save rule:', error);
            alert('Failed to save rule.');
        }
    };

    // Delete rule
    const handleDelete = async (ruleId: string) => {
        if (confirm('Are you sure you want to delete this rule?')) {
            try {
                await eligibilityApi.delete(ruleId);
                loadRules(); // Refresh list
            } catch (error) {
                console.error('Failed to delete rule:', error);
                alert('Failed to delete rule.');
            }
        }
    };

    // Duplicate rule - fetch full, create copy
    const handleDuplicate = async (rule: EligibilityListItem) => {
        try {
            const fullRule = await eligibilityApi.get(rule.id);
            await eligibilityApi.create({
                name: `${fullRule.name} (Copy)`,
                description: fullRule.description,
                rootGroup: fullRule.rootGroup
            });
            loadRules(); // Refresh list
        } catch (error) {
            console.error('Failed to duplicate rule:', error);
            alert('Failed to duplicate rule.');
        }
    };

    if (isLoading) {
        return (
            <div className="page-enter flex items-center justify-center" style={{ minHeight: '400px' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="page-enter">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-top">
                    <div>
                        <h1 className="page-title">Eligibility Rules</h1>
                        <p className="page-description">
                            Create and manage reusable eligibility rules that can be applied to templates, task groups, and tasks.
                        </p>
                    </div>
                    <div className="page-actions">
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={16} />}
                            onClick={handleCreateNew}
                        >
                            Create Rule
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="search-input-wrapper" style={{ maxWidth: '400px' }}>
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search rules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Rules Grid */}
            {filteredRules.length === 0 ? (
                <Card>
                    <div className="p-12 text-center">
                        <div className="mb-4">
                            <Filter size={48} className="text-muted mx-auto" style={{ opacity: 0.3 }} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No eligibility rules yet</h3>
                        <p className="text-muted mb-4">
                            Create reusable rules to control who can access templates, tasks, and task groups.
                        </p>
                        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleCreateNew}>
                            Create Your First Rule
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="eligibility-rules-grid">
                    {filteredRules.map((rule) => (
                        <Card key={rule.id} className="eligibility-rule-card">
                            <div className="eligibility-rule-card-header">
                                <div className="eligibility-rule-card-icon">
                                    <Filter size={18} />
                                </div>
                                <div className="eligibility-rule-card-actions">
                                    <button
                                        className="btn-icon-sm"
                                        onClick={() => handleEdit(rule)}
                                        title="Edit"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        className="btn-icon-sm"
                                        onClick={() => handleDuplicate(rule)}
                                        title="Duplicate"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        className="btn-icon-sm btn-danger-ghost"
                                        onClick={() => handleDelete(rule.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="eligibility-rule-card-body">
                                <h3 className="eligibility-rule-card-title">{rule.name}</h3>
                                {rule.description && (
                                    <p className="eligibility-rule-card-desc">{rule.description}</p>
                                )}
                                <div className="eligibility-rule-card-meta">
                                    <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                                        {rule.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <span className="eligibility-rule-card-count">
                                        {rule.ruleCount} {rule.ruleCount === 1 ? 'rule' : 'rules'}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal for Creating/Editing Rules */}
            <EligibilityCriteriaModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingRule(undefined); }}
                onSave={handleSave}
                criteria={editingRule}
                context="TEMPLATE"
                entityName={editingRule ? editingRule.name : 'New Rule'}
                isNamedRule={true}
            />
        </div>
    );
}
