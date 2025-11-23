import React, { useEffect, useState } from 'react';
import { Toast as ToastType } from '../types';

interface ToastProps {
    toast: ToastType;
    onClose: () => void;
}

const toastStyles = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-500',
        icon: '✅',
        iconColor: 'text-green-500',
        progress: 'bg-green-500',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-500',
        icon: '❌',
        iconColor: 'text-red-500',
        progress: 'bg-red-500',
    },
    warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-500',
        icon: '⚠️',
        iconColor: 'text-yellow-500',
        progress: 'bg-yellow-500',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        icon: 'ℹ️',
        iconColor: 'text-blue-500',
        progress: 'bg-blue-500',
    },
};

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            handleClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);
    
    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    const styles = toastStyles[toast.type];

    return (
        <div className={`relative w-full ${styles.bg} rounded-xl shadow-lg border-l-4 ${styles.border} p-4 flex items-start gap-4 overflow-hidden transition-all duration-300 ease-in-out ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className={`text-xl ${styles.iconColor}`}>{styles.icon}</div>
            <div className="flex-1">
                <p className="font-bold text-sm text-gray-800">{toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}</p>
                <p className="text-sm text-gray-600">{toast.message}</p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
            <div
                className={`absolute bottom-0 left-0 h-1 ${styles.progress} animate-toast-progress`}
                style={{ animationDuration: '3s' }}
            ></div>
            <style>{`
                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-toast-progress {
                    animation: toast-progress linear forwards;
                }
            `}</style>
        </div>
    );
};

export default Toast;
