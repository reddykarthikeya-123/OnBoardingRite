import { useState } from 'react';
import { X, CheckCircle, Rocket, Sparkles } from 'lucide-react';
import { Button } from '../../../../components/ui';

interface InitiateOnboardingModalProps {
    memberCount: number;
    onConfirm: () => void;
    onClose: () => void;
}

export function InitiateOnboardingModal({ memberCount, onConfirm, onClose }: InitiateOnboardingModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const handleConfirm = async () => {
        setIsProcessing(true);

        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsProcessing(false);
        setIsComplete(true);

        // Auto-close after success
        setTimeout(() => {
            onConfirm();
        }, 1500);
    };

    return (
        <div className="modal-overlay" onClick={isProcessing || isComplete ? undefined : onClose}>
            <div className="modal initiate-modal" onClick={e => e.stopPropagation()}>
                {!isProcessing && !isComplete && (
                    <>
                        <div className="modal-header">
                            <h2>Initiate Onboarding</h2>
                            <Button variant="ghost" size="sm" className="btn-icon" onClick={onClose}>
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="modal-body initiate-body">
                            <div className="initiate-icon">
                                <Rocket size={48} />
                            </div>
                            <h3>Ready to Begin?</h3>
                            <p>
                                You are about to initiate the onboarding process for
                                <strong> {memberCount} member{memberCount !== 1 ? 's' : ''}</strong>.
                            </p>
                            <div className="initiate-info">
                                <div className="info-item">
                                    <CheckCircle size={16} />
                                    <span>Members will receive onboarding notifications</span>
                                </div>
                                <div className="info-item">
                                    <CheckCircle size={16} />
                                    <span>Tasks will be assigned based on checklist configuration</span>
                                </div>
                                <div className="info-item">
                                    <CheckCircle size={16} />
                                    <span>You can track progress from the Overview</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <Button variant="secondary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleConfirm}>
                                <Rocket size={16} />
                                Start Onboarding
                            </Button>
                        </div>
                    </>
                )}

                {isProcessing && (
                    <div className="modal-body processing-state">
                        <div className="processing-animation">
                            <div className="processing-spinner"></div>
                            <Rocket size={32} className="processing-icon" />
                        </div>
                        <h3>Initiating Onboarding...</h3>
                        <p>Setting up tasks and notifications for {memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                    </div>
                )}

                {isComplete && (
                    <div className="modal-body success-state">
                        <div className="success-animation">
                            <div className="success-circle">
                                <CheckCircle size={48} />
                            </div>
                            <Sparkles className="sparkle sparkle-1" size={20} />
                            <Sparkles className="sparkle sparkle-2" size={16} />
                            <Sparkles className="sparkle sparkle-3" size={24} />
                        </div>
                        <h3>Onboarding Initiated!</h3>
                        <p>Successfully started onboarding for {memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
