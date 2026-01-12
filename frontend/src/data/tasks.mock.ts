import type { Task } from '../types';

export const mockTasks: Task[] = [
    // Forms
    {
        id: 'task-001',
        name: 'W-4 Tax Withholding',
        description: 'Complete federal tax withholding form',
        type: 'REDIRECT',
        category: 'FORMS',
        required: true,
        configuration: {
            estimatedTime: 10,
            redirectUrl: 'https://oracle.example.com/w4',
            externalSystemName: 'Oracle HCM',
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-002',
        name: 'Background Authorization',
        description: 'Authorize background check processing',
        type: 'CUSTOM_FORM',
        category: 'FORMS',
        required: true,
        configuration: {
            estimatedTime: 5,
            formFields: [
                { id: 'signature', name: 'signature', label: 'Digital Signature', type: 'SIGNATURE', required: true },
                { id: 'acknowledgment', name: 'acknowledgment', label: 'I authorize the background check', type: 'CHECKBOX', required: true },
            ],
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-003',
        name: 'Per Diem Acknowledgment',
        description: 'Review and acknowledge per diem policy',
        type: 'CUSTOM_FORM',
        category: 'FORMS',
        required: true,
        configuration: {
            estimatedTime: 5,
            instructions: 'Please review the per diem policy and acknowledge understanding',
            formFields: [
                {
                    id: 'residence', name: 'residence', label: 'State of Residence', type: 'SELECT', required: true, options: [
                        { value: 'TX', label: 'Texas' },
                        { value: 'LA', label: 'Louisiana' },
                        { value: 'OK', label: 'Oklahoma' },
                        { value: 'OTHER', label: 'Other' },
                    ]
                },
                { id: 'distance', name: 'distance', label: 'Distance from Site (miles)', type: 'NUMBER', required: true },
                { id: 'acknowledgment', name: 'acknowledgment', label: 'I acknowledge the per diem policy', type: 'CHECKBOX', required: true },
            ],
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-004',
        name: 'Emergency Contact Form',
        description: 'Provide emergency contact information',
        type: 'CUSTOM_FORM',
        category: 'FORMS',
        required: true,
        configuration: {
            estimatedTime: 5,
            formFields: [
                { id: 'contactName', name: 'contactName', label: 'Emergency Contact Name', type: 'TEXT', required: true },
                { id: 'contactPhone', name: 'contactPhone', label: 'Contact Phone', type: 'PHONE', required: true },
                {
                    id: 'relationship', name: 'relationship', label: 'Relationship', type: 'SELECT', required: true, options: [
                        { value: 'SPOUSE', label: 'Spouse' },
                        { value: 'PARENT', label: 'Parent' },
                        { value: 'SIBLING', label: 'Sibling' },
                        { value: 'OTHER', label: 'Other' },
                    ]
                },
            ],
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-005',
        name: 'Direct Deposit Setup',
        description: 'Set up direct deposit for payroll',
        type: 'REDIRECT',
        category: 'FORMS',
        required: true,
        configuration: {
            estimatedTime: 10,
            redirectUrl: 'https://oracle.example.com/pay-election',
            externalSystemName: 'Oracle HCM',
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },

    // Documents
    {
        id: 'task-010',
        name: 'Driver\'s License',
        description: 'Upload a valid driver\'s license (front and back)',
        type: 'DOCUMENT_UPLOAD',
        category: 'DOCUMENTS',
        required: true,
        configuration: {
            estimatedTime: 5,
            allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
            maxFileSize: 10,
            requiresFrontBack: true,
            capturesExpiry: true,
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-011',
        name: 'TWIC Card',
        description: 'Upload Transportation Worker Identification Credential',
        type: 'DOCUMENT_UPLOAD',
        category: 'CERTIFICATIONS',
        required: true,
        configuration: {
            estimatedTime: 5,
            allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
            maxFileSize: 10,
            requiresFrontBack: true,
            capturesExpiry: true,
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-012',
        name: 'Safety Council Card',
        description: 'Upload valid safety council training card',
        type: 'DOCUMENT_UPLOAD',
        category: 'CERTIFICATIONS',
        required: true,
        configuration: {
            estimatedTime: 5,
            allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
            maxFileSize: 10,
            capturesExpiry: true,
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-013',
        name: 'Passport or Birth Certificate',
        description: 'Upload ID document for I-9 verification',
        type: 'DOCUMENT_UPLOAD',
        category: 'DOCUMENTS',
        required: true,
        configuration: {
            estimatedTime: 5,
            allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
            maxFileSize: 10,
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-014',
        name: 'DOT Medical Card',
        description: 'Upload current DOT medical examiner certificate',
        type: 'DOCUMENT_UPLOAD',
        category: 'CERTIFICATIONS',
        required: false,
        configuration: {
            estimatedTime: 5,
            allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
            maxFileSize: 10,
            capturesExpiry: true,
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },

    // Compliance - REST API
    {
        id: 'task-020',
        name: 'Drug Test',
        description: 'Complete pre-employment drug screening',
        type: 'REST_API',
        category: 'COMPLIANCE',
        required: true,
        configuration: {
            estimatedTime: 60,
            endpoint: '/api/disa/drug-test',
            method: 'POST',
            checkExisting: true,
            pollForResults: true,
            instructions: 'Report to the designated collection site for drug screening',
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-021',
        name: 'Background Check',
        description: 'Pre-employment background verification',
        type: 'REST_API',
        category: 'COMPLIANCE',
        required: true,
        configuration: {
            estimatedTime: 180,
            endpoint: '/api/disa/background-check',
            method: 'POST',
            checkExisting: true,
            pollForResults: true,
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-022',
        name: 'I-9 Verification',
        description: 'Complete I-9 employment eligibility verification',
        type: 'CUSTOM_FORM',
        category: 'COMPLIANCE',
        required: true,
        configuration: {
            estimatedTime: 15,
            instructions: 'Complete Section 1 of the I-9 form. An HR representative will schedule Section 2 verification.',
            formFields: [
                {
                    id: 'citizenship', name: 'citizenship', label: 'Citizenship Status', type: 'RADIO', required: true, options: [
                        { value: 'CITIZEN', label: 'A citizen of the United States' },
                        { value: 'NONCITIZEN_NATIONAL', label: 'A noncitizen national of the United States' },
                        { value: 'PERMANENT_RESIDENT', label: 'A lawful permanent resident' },
                        { value: 'AUTHORIZED_ALIEN', label: 'An alien authorized to work' },
                    ]
                },
            ],
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },

    // Trainings
    {
        id: 'task-030',
        name: 'OSHA 10-Hour Safety',
        description: 'Complete OSHA 10-hour safety training',
        type: 'REDIRECT',
        category: 'TRAININGS',
        required: true,
        configuration: {
            estimatedTime: 600,
            redirectUrl: 'https://safety-council.example.com/osha10',
            externalSystemName: 'Safety Council',
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-031',
        name: 'H2S Awareness Training',
        description: 'Complete Hydrogen Sulfide safety awareness training',
        type: 'REDIRECT',
        category: 'TRAININGS',
        required: true,
        configuration: {
            estimatedTime: 120,
            redirectUrl: 'https://safety-council.example.com/h2s',
            externalSystemName: 'Safety Council',
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-032',
        name: 'Confined Space Entry',
        description: 'Confined space entry awareness and safety training',
        type: 'REDIRECT',
        category: 'TRAININGS',
        required: false,
        configuration: {
            estimatedTime: 180,
            redirectUrl: 'https://safety-council.example.com/confined-space',
            externalSystemName: 'Safety Council',
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-033',
        name: 'Fall Protection Training',
        description: 'Fall protection and prevention training',
        type: 'REDIRECT',
        category: 'TRAININGS',
        required: true,
        configuration: {
            estimatedTime: 120,
            redirectUrl: 'https://safety-council.example.com/fall-protection',
            externalSystemName: 'Safety Council',
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },

    // Integration
    {
        id: 'task-040',
        name: 'Oracle Activation',
        description: 'Activate employee record in Oracle HCM',
        type: 'REST_API',
        category: 'INTEGRATION',
        required: true,
        configuration: {
            estimatedTime: 5,
            endpoint: '/api/oracle/activate',
            method: 'POST',
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'task-041',
        name: 'Badge Request',
        description: 'Submit site access badge request',
        type: 'CUSTOM_FORM',
        category: 'INTEGRATION',
        required: true,
        configuration: {
            estimatedTime: 10,
            formFields: [
                { id: 'badgePhoto', name: 'badgePhoto', label: 'Badge Photo', type: 'FILE', required: true },
                { id: 'vehicleInfo', name: 'vehicleInfo', label: 'Vehicle Make/Model', type: 'TEXT', required: false },
                { id: 'licensePlate', name: 'licensePlate', label: 'License Plate', type: 'TEXT', required: false },
            ],
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
];

export const getTaskById = (id: string): Task | undefined => {
    return mockTasks.find(task => task.id === id);
};

export const getTasksByCategory = (category: string): Task[] => {
    return mockTasks.filter(task => task.category === category);
};

export const getTasksByType = (type: string): Task[] => {
    return mockTasks.filter(task => task.type === type);
};
