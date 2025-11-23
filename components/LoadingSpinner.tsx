import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
    return (
        <div className="text-center p-12">
            <div className="w-10 h-10 border-4 border-[#f3f3f3] border-t-4 border-t-[#8b4513] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#8b4513] text-lg">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
