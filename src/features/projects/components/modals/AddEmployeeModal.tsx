import { useState } from 'react';
import { X, Search, User, Building, Mail, Phone, MapPin, UserCheck, UserX, Plus, Check } from 'lucide-react';
import { Button, Badge, Card, CardBody } from '../../../../components/ui';
import { searchEmployees, searchExEmployees, mockEmployees, mockExEmployees } from '../../../../data';
import type { Employee } from '../../../../types';

interface AddEmployeeModalProps {
    onClose: () => void;
    onAddEmployee: (employee: Employee, isExEmployee: boolean) => void;
}

export function AddEmployeeModal({ onClose, onAddEmployee }: AddEmployeeModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedIsExEmployee, setSelectedIsExEmployee] = useState(false);
    const [activeTab, setActiveTab] = useState<'employees' | 'ex-employees'>('employees');
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set()); // Track already added

    const filteredEmployees = searchQuery.length > 0
        ? searchEmployees(searchQuery)
        : mockEmployees;

    const filteredExEmployees = searchQuery.length > 0
        ? searchExEmployees(searchQuery)
        : mockExEmployees;

    const handleSelectEmployee = (emp: Employee, isExEmployee: boolean) => {
        setSelectedEmployee(emp);
        setSelectedIsExEmployee(isExEmployee);
    };

    const handleAddAndContinue = () => {
        if (selectedEmployee) {
            onAddEmployee(selectedEmployee, selectedIsExEmployee);
            // Mark as added
            setAddedIds(prev => new Set(prev).add(selectedEmployee.id));
            // Clear selection so user can pick another
            setSelectedEmployee(null);
            setSelectedIsExEmployee(false);
        }
    };

    const handleAddAndClose = () => {
        if (selectedEmployee) {
            onAddEmployee(selectedEmployee, selectedIsExEmployee);
        }
        onClose();
    };

    const isAlreadyAdded = (empId: string) => addedIds.has(empId);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Employee or Ex-Employee</h2>
                    <Button variant="ghost" size="sm" className="btn-icon" onClick={onClose}>
                        <X size={18} />
                    </Button>
                </div>

                <div className="modal-body">
                    {/* Added count indicator */}
                    {addedIds.size > 0 && (
                        <div className="added-count-banner">
                            <Check size={16} />
                            <span>{addedIds.size} worker{addedIds.size > 1 ? 's' : ''} added to team</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Search by name, email, or number</label>
                        <div className="input-with-icon">
                            <Search size={16} className="input-icon" />
                            <input
                                type="text"
                                className="input"
                                placeholder="Search employees or ex-employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tabs for Employees / Ex-Employees */}
                    <div className="employee-tabs">
                        <button
                            className={`employee-tab ${activeTab === 'employees' ? 'active' : ''}`}
                            onClick={() => setActiveTab('employees')}
                        >
                            <UserCheck size={16} />
                            Employees
                            <Badge variant="secondary">{filteredEmployees.length}</Badge>
                        </button>
                        <button
                            className={`employee-tab ${activeTab === 'ex-employees' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ex-employees')}
                        >
                            <UserX size={16} />
                            Ex-Employees
                            <Badge variant="warning">{filteredExEmployees.length}</Badge>
                        </button>
                    </div>

                    <div className="employee-list">
                        {activeTab === 'employees' && (
                            <>
                                {filteredEmployees.map(emp => {
                                    const added = isAlreadyAdded(emp.id);
                                    return (
                                        <button
                                            key={emp.id}
                                            className={`employee-item ${selectedEmployee?.id === emp.id && !selectedIsExEmployee ? 'selected' : ''} ${added ? 'already-added' : ''}`}
                                            onClick={() => !added && handleSelectEmployee(emp, false)}
                                            disabled={added}
                                        >
                                            <div className="employee-avatar">
                                                <User size={20} />
                                            </div>
                                            <div className="employee-info">
                                                <div className="employee-name">
                                                    {emp.firstName} {emp.lastName}
                                                    {added && <Badge variant="success" className="ml-2">Added</Badge>}
                                                </div>
                                                <div className="employee-meta">
                                                    <span>{emp.employeeNumber}</span>
                                                    <span>{emp.position}</span>
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{emp.department}</Badge>
                                        </button>
                                    );
                                })}
                                {filteredEmployees.length === 0 && (
                                    <div className="empty-search">
                                        <p>No employees found</p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'ex-employees' && (
                            <>
                                {filteredExEmployees.map(emp => {
                                    const added = isAlreadyAdded(emp.id);
                                    return (
                                        <button
                                            key={emp.id}
                                            className={`employee-item ex-employee ${selectedEmployee?.id === emp.id && selectedIsExEmployee ? 'selected' : ''} ${added ? 'already-added' : ''}`}
                                            onClick={() => !added && handleSelectEmployee(emp, true)}
                                            disabled={added}
                                        >
                                            <div className="employee-avatar ex">
                                                <User size={20} />
                                            </div>
                                            <div className="employee-info">
                                                <div className="employee-name">
                                                    {emp.firstName} {emp.lastName}
                                                    {added ? (
                                                        <Badge variant="success" className="ml-2">Added</Badge>
                                                    ) : (
                                                        <Badge variant="warning" className="ml-2">Ex-Employee</Badge>
                                                    )}
                                                </div>
                                                <div className="employee-meta">
                                                    <span>{emp.employeeNumber}</span>
                                                    <span>{emp.position}</span>
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{emp.department}</Badge>
                                        </button>
                                    );
                                })}
                                {filteredExEmployees.length === 0 && (
                                    <div className="empty-search">
                                        <p>No ex-employees found</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {selectedEmployee && (
                        <Card className="selected-employee-card">
                            <CardBody>
                                <h4>
                                    Selected {selectedIsExEmployee ? 'Ex-Employee' : 'Employee'}
                                    {selectedIsExEmployee && <Badge variant="warning" className="ml-2">Rehire</Badge>}
                                </h4>
                                <div className="employee-details">
                                    <div className="detail-row">
                                        <User size={14} />
                                        <span>{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Mail size={14} />
                                        <span>{selectedEmployee.email}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Phone size={14} />
                                        <span>{selectedEmployee.phone}</span>
                                    </div>
                                    <div className="detail-row">
                                        <MapPin size={14} />
                                        <span>{selectedEmployee.location}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Building size={14} />
                                        <span>{selectedEmployee.department} - {selectedEmployee.position}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>

                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose}>
                        {addedIds.size > 0 ? 'Done' : 'Cancel'}
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={!selectedEmployee}
                        onClick={handleAddAndContinue}
                        leftIcon={<Plus size={16} />}
                    >
                        Add & Continue
                    </Button>
                    <Button
                        variant="primary"
                        disabled={!selectedEmployee}
                        onClick={handleAddAndClose}
                    >
                        Add to Team
                    </Button>
                </div>
            </div>
        </div>
    );
}
