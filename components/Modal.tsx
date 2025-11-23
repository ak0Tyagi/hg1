import React, { useEffect } from 'react';

interface ModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children, footer, size = 'md' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses: Record<string, string> = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-2xl border-4 border-[#cd853f] shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh] transform transition-transform duration-300 scale-95 animate-modal-pop-in`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b-2 border-gray-100">
                    <h2 className="text-2xl font-bold text-[#8b4513]">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="p-5 border-t-2 border-gray-100 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes modal-pop-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-modal-pop-in {
                    animation: modal-pop-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Modal;