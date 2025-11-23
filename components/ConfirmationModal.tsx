import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
    
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal
            title={title}
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            footer={
                <>
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-danger" onClick={handleConfirm}>✅ Yes, Confirm</button>
                </>
            }
        >
            <div className="text-center text-gray-600">
                {children}
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
