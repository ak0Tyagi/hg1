import React from 'react';
import { Toast as ToastType } from '../types';
import Toast from './Toast';

interface ToastContainerProps {
    toasts: ToastType[];
    removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-80">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

export default ToastContainer;
