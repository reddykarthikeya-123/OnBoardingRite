import React from 'react';
import { Check } from 'lucide-react';

export interface StepperStep {
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
}

export interface StepperProps {
    steps: StepperStep[];
    currentStep: number;
    onStepClick?: (stepIndex: number) => void;
    className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className = '' }: StepperProps) {
    return (
        <div className={`stepper ${className}`}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                const isClickable = onStepClick && index <= currentStep;

                return (
                    <React.Fragment key={step.id}>
                        <div
                            className={`stepper-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isClickable ? 'clickable' : ''}`}
                            onClick={() => isClickable && onStepClick?.(index)}
                        >
                            <div className="stepper-indicator">
                                {isCompleted ? (
                                    <Check size={16} strokeWidth={3} />
                                ) : step.icon ? (
                                    step.icon
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </div>
                            <div className="stepper-content">
                                <div className="stepper-label">{step.label}</div>
                                {step.description && (
                                    <div className="stepper-description">{step.description}</div>
                                )}
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`stepper-connector ${isCompleted ? 'completed' : ''}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
