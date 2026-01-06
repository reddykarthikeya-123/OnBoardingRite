// PPM Project - Synced from external source
export interface PPMProject {
    id: string;
    name: string;
    description: string;
    clientId: string;
    clientName: string;
    location: string;
    startDate: string;
    endDate: string;

    // Key Members
    projectManager: PPMContact;
    siteLead?: PPMContact;
    safetyLead?: PPMContact;

    // Metadata
    syncedAt: string;
    externalId: string;
}

export interface PPMContact {
    id: string;
    name: string;
    email: string;
    phone: string;
    title: string;
}

// Requisition Types
export interface Requisition {
    id: string;
    ppmProjectId: string;
    requisitionNumber: string;
    title: string;
    department: string;
    status: 'OPEN' | 'FILLED' | 'CANCELLED';
    lineItems: RequisitionLineItem[];
    createdAt: string;
    updatedAt: string;
}

export interface RequisitionLineItem {
    id: string;
    requisitionId: string;
    positionTitle: string;
    trade: string;
    quantity: number;
    filledCount: number;
    candidates: Candidate[];
}

export interface Candidate {
    id: string;
    requisitionLineItemId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    trade: string;
    experience: string;
    availability: string;
    status: 'AVAILABLE' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN';
}

// Onboarding Member
export interface OnboardingMember {
    id: string;
    onboardingProjectId: string;
    sourceType: 'CANDIDATE' | 'EMPLOYEE' | 'EX_EMPLOYEE';
    sourceId: string; // Candidate ID or Employee ID
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    trade: string;
    status: 'PENDING' | 'ONBOARDING_INITIATED' | 'IN_PROGRESS' | 'COMPLETED';
    addedAt: string;
    onboardingInitiatedAt?: string;
}

// Employee for direct add
export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    department: string;
    position: string;
    employeeNumber: string;
}

// Project Settings Types
export interface PerDiemRules {
    enabled: boolean;
    maxEligiblePercentage: number; // Max % of workforce eligible for Per Diem
    notes?: string;
}

export type MileageRateType = 'IRS' | 'CUSTOM';

export interface MileageRules {
    enabled: boolean;
    // Eligibility
    minDistanceForEligibility?: number; // Minimum distance (miles) to trigger eligibility
    // Calculation fields
    rateType: MileageRateType;           // IRS standard or custom rate
    ratePerMile?: number;                 // Rate per mile (auto-filled if IRS, manual if custom)
    mileageToSubtract?: number;           // Miles to subtract in calculation (e.g., base commute)
    capAmount?: number;                   // Maximum reimbursement cap amount
    maxMilesPerDay?: number;              // Maximum miles allowed per day
    // Address calculation
    useAddressToAddress?: boolean;        // Calculate distance from home address to site
    siteAddress?: string;                 // Site address for calculation
    // Approval
    requiresApproval?: boolean;
    notes?: string;
}

export interface SiteContact {
    name: string;
    title: string;
    phone: string;
    email?: string;
    isPrimary?: boolean;
}

export interface DispatchSheet {
    // Site Information
    siteName: string;
    siteAddress: string;
    siteCity: string;
    siteState: string;
    siteZip: string;
    gateInstructions?: string;
    parkingInstructions?: string;
    plantLayoutImageUrl?: string;         // URL to plant layout/parking map image

    // Work Schedule
    reportingTime: string;                // e.g., "6:00 AM"
    shiftEndTime?: string;
    lunchBreakDuration?: number;          // in minutes
    workDays?: string[];                  // e.g., ["Monday", "Tuesday", ...]

    // Contacts
    siteContacts: SiteContact[];
    lateCallNumber?: string;              // Who to call if running late
    emergencyNumber?: string;

    // Requirements
    requiredPPE?: string[];               // e.g., ["Hard Hat", "Safety Glasses", "Steel Toe Boots"]
    siteRequirements?: string;            // Additional requirements text
    safetyNotes?: string;

    // Additional Info
    additionalNotes?: string;
}

export interface ProjectSettings {
    isDOD: boolean;                  // DOD project identifier
    isODRISA: boolean;               // ODRISA project (adds form to onboarding)
    disaOwnerId?: string;            // Site code for DISA API (defaults to TCC if empty)
    perDiemRules: PerDiemRules;
    mileageRules: MileageRules;
    dispatchSheet?: DispatchSheet;
}
