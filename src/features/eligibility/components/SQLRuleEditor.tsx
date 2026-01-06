import { useState } from 'react';
import { Trash2, Code2, HelpCircle } from 'lucide-react';
import type { CustomSQLRule } from '../../../types';

interface SQLRuleEditorProps {
    rule: CustomSQLRule;
    onChange: (rule: CustomSQLRule) => void;
    onDelete: () => void;
}

/**
 * SQL query editor for custom rules
 * Provides a simple code editor interface for SQL queries
 */
export function SQLRuleEditor({
    rule,
    onChange,
    onDelete,
}: SQLRuleEditorProps) {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <div className="eligibility-sql-editor">
            <div className="eligibility-sql-header">
                <div className="eligibility-sql-title">
                    <Code2 size={16} className="eligibility-sql-icon" />
                    <input
                        type="text"
                        className="form-input eligibility-sql-name"
                        placeholder="Rule name"
                        value={rule.name}
                        onChange={(e) => onChange({ ...rule, name: e.target.value })}
                    />
                </div>
                <div className="eligibility-sql-actions">
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => setShowHelp(!showHelp)}
                        title="Show help"
                    >
                        <HelpCircle size={16} />
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={onDelete}
                        title="Remove SQL rule"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="eligibility-sql-description">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Description (optional)"
                    value={rule.description}
                    onChange={(e) => onChange({ ...rule, description: e.target.value })}
                />
            </div>

            {showHelp && (
                <div className="eligibility-sql-help">
                    <h4>Available Placeholders</h4>
                    <ul>
                        <li><code>:worker_id</code> - The employee/candidate ID</li>
                        <li><code>:project_id</code> - The current project ID</li>
                        <li><code>:template_id</code> - The template ID</li>
                        <li><code>:assignment_id</code> - The assignment ID</li>
                    </ul>
                    <h4>Example Query</h4>
                    <pre>{`SELECT 1 FROM worker_certifications wc
WHERE wc.worker_id = :worker_id
AND wc.certification_type = 'OSHA_10'
AND wc.expiry_date > CURRENT_DATE`}</pre>
                    <p className="text-sm text-muted">
                        The query should return at least one row for the rule to pass.
                    </p>
                </div>
            )}

            <div className="eligibility-sql-query">
                <textarea
                    className="form-textarea eligibility-sql-textarea"
                    placeholder={`Enter SQL query...

Example:
SELECT 1 FROM employees e
WHERE e.id = :worker_id
AND e.years_experience >= 5`}
                    value={rule.sqlQuery}
                    onChange={(e) => onChange({ ...rule, sqlQuery: e.target.value })}
                    rows={8}
                    spellCheck={false}
                />
            </div>

            {rule.sqlQuery && (
                <div className="eligibility-sql-preview">
                    <span className="text-sm text-muted">
                        Query will be validated at runtime. Ensure proper syntax and placeholder usage.
                    </span>
                </div>
            )}
        </div>
    );
}
