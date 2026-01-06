import { X, FileText } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { mockRequisitions } from '../../../../data';

interface AddRequisitionModalProps {
    onClose: () => void;
}

export function AddRequisitionModal({ onClose }: AddRequisitionModalProps) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Requisition Line Item</h2>
                    <Button variant="ghost" size="sm" className="btn-icon" onClick={onClose}>
                        <X size={18} />
                    </Button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Select Requisition</label>
                        <select className="input">
                            <option value="">Choose a requisition...</option>
                            {mockRequisitions.map(req => (
                                <option key={req.id} value={req.id}>
                                    {req.requisitionNumber} - {req.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="info-box">
                        <FileText size={16} />
                        <p>
                            After selecting a requisition, its line items and candidates will appear
                            in the Requisitions table. You can then select candidates to add to your
                            onboarding member list.
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary">
                        Add Requisition
                    </Button>
                </div>
            </div>
        </div>
    );
}
