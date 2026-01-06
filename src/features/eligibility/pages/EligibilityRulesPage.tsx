import { useState } from 'react';
import { Plus, Search, Filter, Pencil, Trash2, Copy } from 'lucide-react';
import { Card, Button, Badge } from '../../../components/ui';
import { EligibilityCriteriaModal } from '../components';
import type { EligibilityCriteria } from '../../../types';
import { mockEligibilityCriteria, generateId } from '../../../data';

/**
 * Eligibility Rules page - manages named, reusable eligibility rules
 */
export function EligibilityRulesPage() {
    const [rules, setRules] = useState<EligibilityCriteria[]>([...mockEligibilityCriteria]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<EligibilityCriteria | undefined>(undefined);

    // Filter rules by search
    const filteredRules = rules.filter(rule =>
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Count rules recursively
    const countRules = (group: typeof rules[0]['rootGroup']): number => {
        return group.rules.reduce((count, rule) => {
            if (rule.type === 'GROUP') {
                return count + countRules(rule);
            }
            return count + 1;
        }, 0);
    };

    // Open modal to create new rule
    const handleCreateNew = () => {
        setEditingRule(undefined);
        setShowModal(true);
    };

    // Open modal to edit existing rule
    const handleEdit = (rule: EligibilityCriteria) => {
        setEditingRule(rule);
        setShowModal(true);
    };

    // Save rule (create or update)
    const handleSave = (criteria: EligibilityCriteria) => {
        if (editingRule) {
            // Update existing
            setRules(prev => prev.map(r => r.id === criteria.id ? criteria : r));
        } else {
            // Add new
            setRules(prev => [...prev, { ...criteria, id: generateId('rule') }]);
        }
        setShowModal(false);
        setEditingRule(undefined);
    };

    // Delete rule
    const handleDelete = (ruleId: string) => {
        if (confirm('Are you sure you want to delete this rule?')) {
            setRules(prev => prev.filter(r => r.id !== ruleId));
        }
    };

    // Duplicate rule
    const handleDuplicate = (rule: EligibilityCriteria) => {
        const duplicated: EligibilityCriteria = {
            ...rule,
            id: generateId('rule'),
            name: `${rule.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setRules(prev => [...prev, duplicated]);
    };

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
                                        {countRules(rule.rootGroup)} {countRules(rule.rootGroup) === 1 ? 'rule' : 'rules'}
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
