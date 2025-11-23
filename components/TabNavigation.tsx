import React from 'react';
import { Tab } from '../types';

interface TabNavigationProps {
    tabs: { id: Tab; label: string; icon: string }[];
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, setActiveTab }) => {
    return (
        <nav className="flex flex-wrap gap-2 bg-white p-3 rounded-2xl border-2 border-[#cd853f] shadow-lg mb-5 sm:mb-8">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-grow px-4 py-3 border-2 border-transparent rounded-xl font-bold cursor-pointer transition-all duration-300 ease-in-out text-sm sm:text-base
                        ${activeTab === tab.id
                            ? 'bg-gradient-to-br from-[#8b4513] to-[#d2691e] text-white shadow-md'
                            : 'bg-gradient-to-br from-[#f8f5f0] to-[#e8dcc6] text-[#8b4513] border-[#cd853f] hover:bg-gradient-to-br hover:from-[#8b4513] hover:to-[#d2691e] hover:text-white hover:-translate-y-0.5 hover:shadow-lg'
                        }`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </nav>
    );
};

export default TabNavigation;
