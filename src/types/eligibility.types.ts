// Eligibility Criteria Types
// Comprehensive type definitions for the eligibility criteria system

/**
 * Field Categories representing different data sources
 */
export type EligibilityFieldCategory =
    | 'PPM_PROJECT'
    | 'EMPLOYEE_CANDIDATE'
    | 'ASSIGNMENT'
    | 'CUSTOM_SQL';

/**
 * Data types for eligibility fields
 */
export type EligibilityFieldDataType =
    | 'STRING'
    | 'NUMBER'
    | 'DATE'
    | 'BOOLEAN'
    | 'ARRAY';

/**
 * Operators available for eligibility rules
 */
export type EligibilityOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'starts_with'
    | 'ends_with'
    | 'in'
    | 'not_in'
    | 'greater_than'
    | 'less_than'
    | 'greater_than_or_equal'
    | 'less_than_or_equal'
    | 'between'
    | 'is_empty'
    | 'is_not_empty';

/**
 * Operator display information
 */
export interface OperatorInfo {
    value: EligibilityOperator;
    label: string;
    requiresValue: boolean;
    requiresSecondValue?: boolean; // For 'between' operator
}

/**
 * Field definition for the UI
 */
export interface EligibilityFieldDefinition {
    id: string;
    name: string;
    category: EligibilityFieldCategory;
    dataType: EligibilityFieldDataType;
    operators: EligibilityOperator[];
    options?: { value: string; label: string }[]; // For dropdown fields
    placeholder?: string;
    description?: string;
}

/**
 * Individual eligibility rule
 */
export interface EligibilityRule {
    id: string;
    type: 'FIELD_RULE';
    fieldId: string;
    operator: EligibilityOperator;
    value: string | string[] | number | boolean | null;
    valueEnd?: string | number; // For 'between' operator
}

/**
 * Custom SQL Rule
 */
export interface CustomSQLRule {
    id: string;
    type: 'SQL_RULE';
    name: string;
    description: string;
    sqlQuery: string;
}

/**
 * Rule Group with AND/OR logic - supports nesting
 */
export interface EligibilityRuleGroup {
    id: string;
    type: 'GROUP';
    logic: 'AND' | 'OR';
    rules: EligibilityRuleItem[];
}

/**
 * Union type for all possible rule items (supports nesting)
 */
export type EligibilityRuleItem = EligibilityRule | CustomSQLRule | EligibilityRuleGroup;

/**
 * Complete Eligibility Criteria configuration
 */
export interface EligibilityCriteria {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    rootGroup: EligibilityRuleGroup;
    createdAt: string;
    updatedAt: string;
}

/**
 * DTO for creating eligibility criteria
 */
export interface CreateEligibilityCriteriaDTO {
    name: string;
    description?: string;
    rootGroup: EligibilityRuleGroup;
}

/**
 * DTO for updating eligibility criteria
 */
export interface UpdateEligibilityCriteriaDTO {
    name?: string;
    description?: string;
    isActive?: boolean;
    rootGroup?: EligibilityRuleGroup;
}

/**
 * Context for where eligibility criteria is applied
 */
export type EligibilityCriteriaContext = 'TEMPLATE' | 'TASK_GROUP' | 'TASK';
