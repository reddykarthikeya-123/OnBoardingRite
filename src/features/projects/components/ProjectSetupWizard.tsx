import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, FileCheck, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button, Stepper } from '../../../components/ui';
import type { StepperStep } from '../../../components/ui';
import { PPMProjectSelectionStep } from './wizard/PPMProjectSelectionStep';
import { TemplateSelectionStep } from './wizard/TemplateSelectionStep';
import { projectsApi } from '../../../services/api';
import type { ProjectContact } from '../../../types';

const WIZARD_STEPS: StepperStep[] = [
    { id: 'ppm-project', label: 'Select Project', icon: <Building size={16} /> },
    { id: 'template', label: 'Select Template', icon: <FileCheck size={16} /> },
];

export interface ProjectFormData {
    // PPM Project Selection
    ppmProjectId: string;

    // Derived from PPM Project
    name: string;
    description: string;
    clientId: string;
    clientName: string;
    location: string;
    startDate: string;
    endDate: string;
    isDOD: boolean;
    isODRISA: boolean;

    // Team Contacts (from PPM)
    projectManager: ProjectContact | null;
    safetyLead: ProjectContact | null;
    siteContact: ProjectContact | null;

    // Template Selection
    templateId: string;
    templateName: string;
    sourceProjectId?: string;
    taskGroups: Array<{ id: string; name: string; tasks: string[] }>;
}

const initialFormData: ProjectFormData = {
    ppmProjectId: '',
    name: '',
    description: '',
    clientId: '',
    clientName: '',
    location: '',
    startDate: '',
    endDate: '',
    isDOD: false,
    isODRISA: false,
    projectManager: null,
    safetyLead: null,
    siteContact: null,
    templateId: '',
    templateName: '',
    sourceProjectId: undefined,
    taskGroups: [],
};

export function ProjectSetupWizard() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateFormData = (data: Partial<ProjectFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const handleNext = () => {
        if (currentStep < WIZARD_STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleStepClick = (stepIndex: number) => {
        if (stepIndex < currentStep) {
            setCurrentStep(stepIndex);
        }
    };

    const handleFinish = async () => {
        setIsSubmitting(true);

        try {
            // Call API to create the project
            const projectPayload = {
                name: formData.name,
                description: formData.description,
                client_id: formData.clientId,
                client_name: formData.clientName,
                location: formData.location,
                start_date: formData.startDate,
                end_date: formData.endDate || null,
                is_dod: formData.isDOD,
                is_odrisa: formData.isODRISA,
                template_id: formData.templateId || null,
                source_project_id: formData.sourceProjectId || null,
                ppm_project_id: formData.ppmProjectId,
                project_manager: formData.projectManager,
                safety_lead: formData.safetyLead,
                site_contact: formData.siteContact,
                task_groups: formData.taskGroups
            };

            const result = await projectsApi.create(projectPayload);
            const newProjectId = result.id;

            navigate(`/projects/${newProjectId}/dashboard`);
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 0:
                return !!formData.ppmProjectId;
            case 1:
                // Enable if: template selected, blank template confirmed (empty name), or copying from project
                return !!formData.templateId || formData.templateName === '' || !!formData.sourceProjectId;
            default:
                return false;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <PPMProjectSelectionStep data={formData} onUpdate={updateFormData} />;
            case 1:
                return <TemplateSelectionStep data={formData} onUpdate={updateFormData} />;
            default:
                return null;
        }
    };

    return (
        <div className="wizard page-enter">
            <div className="wizard-header">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="btn-icon"
                        onClick={() => navigate('/projects')}
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Create Onboarding Project</h1>
                        <p className="text-secondary text-sm">
                            Set up an onboarding project for a PPM project
                        </p>
                    </div>
                </div>
                <Stepper
                    steps={WIZARD_STEPS}
                    currentStep={currentStep}
                    onStepClick={handleStepClick}
                />
            </div>

            <div className="wizard-body">
                <div className="wizard-step-content">{renderStep()}</div>
            </div>

            <div className="wizard-footer">
                <Button
                    variant="secondary"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                >
                    Back
                </Button>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => navigate('/projects')}>
                        Cancel
                    </Button>
                    {currentStep === WIZARD_STEPS.length - 1 ? (
                        <Button
                            variant="primary"
                            onClick={handleFinish}
                            disabled={!canProceed() || isSubmitting}
                        >
                            <CheckCircle size={16} />
                            {isSubmitting ? 'Creating...' : 'Finish'}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleNext}
                            disabled={!canProceed()}
                        >
                            Continue
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
