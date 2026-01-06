import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    children: ReactNode;
    footer?: ReactNode;
}

export function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
    footer
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <>
            <div className="modal-backdrop" onClick={onClose} />
            <div
                ref={modalRef}
                className={`modal modal-${size}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="modal-header">
                    <h2 id="modal-title" className="modal-title">{title}</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="btn-icon"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </Button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </>,
        document.body
    );
}
