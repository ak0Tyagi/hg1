import React from 'react';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => {
    return (
        <div className="text-center p-16">
            <div className="text-6xl text-gray-400 opacity-50 mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">{title}</h3>
            <p className="text-gray-500">{description}</p>
        </div>
    );
};

export default EmptyState;
