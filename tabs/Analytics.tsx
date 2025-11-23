import React, { useMemo } from 'react';
import { Booking, Expense, Tab } from '../types';
import { downloadAsCSV, printToPDF } from '../utils/download';

interface AnalyticsProps {
    bookings: Booking[];
    allExpenses: Expense[];
    addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    setActiveTab: (tab: Tab) => void;
    onGoToBookingsWithFilter: (filter: Record<string, string>) => void;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: string; onClick?: () => void }> = ({ label, value, icon, onClick }) => (
    <div onClick={onClick} className={`bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl border-2 border-[#f0e6d2] text-center shadow transition hover:shadow-lg hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}>
        <div className="text-3xl mb-2">{icon}</div>
        <p className="text-3xl font-bold text-[#8b4513]">{value}</p>
        <p className="text-sm uppercase font-bold text-gray-500">{label}</p>
    </div>
);

const Analytics: React.FC<AnalyticsProps> = ({ bookings, allExpenses, addToast, setActiveTab, onGoToBookingsWithFilter }) => {
    const analytics = useMemo(() => {
        const validBookings = bookings.filter(b => b.status !== 'Cancelled');
        const revenue = validBookings.reduce((sum, b) => sum + (b.rate - (b.discount || 0)), 0);
        
        const bookingExpenses = allExpenses
            .filter(e => e.bookingId)
            .reduce((sum, e) => sum + (e.type === 'Paid' ? e.amount : -e.amount), 0);
            
        const generalExpenses = allExpenses
            .filter(e => !e.bookingId)
            .reduce((sum, e) => sum + (e.type === 'Paid' ? e.amount : -e.amount), 0);

        const totalExpenses = bookingExpenses + generalExpenses;

        const profit = revenue - totalExpenses;
        const avgBookingValue = validBookings.length > 0 ? revenue / validBookings.length : 0;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        const bookingsByTier = validBookings.reduce((acc, b) => {
            acc[b.tier] = (acc[b.tier] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalBookings: bookings.length,
            revenue,
            profit,
            generalExpenses,
            avgBookingValue,
            profitMargin,
            bookingsByTier,
        };
    }, [bookings, allExpenses]);
    
    const handleExport = (format: 'csv' | 'pdf') => {
        addToast('Exporting report...', 'info');
        const title = 'Analytics_Summary';
        const headers = ['Metric', 'Value'];
        const data = [
            ['Total Bookings', analytics.totalBookings],
            ['Total Revenue (INR)', analytics.revenue],
            ['General Expenses (INR)', analytics.generalExpenses],
            ['Net Profit (INR)', analytics.profit],
            ['Avg Booking Value (INR)', analytics.avgBookingValue.toFixed(2)],
            ['Profit Margin (%)', analytics.profitMargin.toFixed(2)],
        ];
    
        if (format === 'csv') {
            downloadAsCSV(headers, data, title);
            addToast('CSV file downloaded.', 'success');
        } else {
            printToPDF('Analytics Summary', headers, data);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[#8b4513]">Analytics & Reports</h2>

            <div className="p-4 sm:p-6 bg-green-50 rounded-xl border-2 border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-4">📈 Business Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Bookings" value={analytics.totalBookings} icon="📊" onClick={() => setActiveTab('bookings')} />
                    <StatCard label="Total Revenue" value={`₹${(analytics.revenue / 100000).toFixed(2)}L`} icon="💰" onClick={() => setActiveTab('accounts')} />
                    <StatCard label="General Expenses" value={`₹${(analytics.generalExpenses / 1000).toFixed(1)}K`} icon="🏢" onClick={() => setActiveTab('expenses')} />
                    <StatCard label="Net Profit" value={`₹${(analytics.profit / 100000).toFixed(2)}L`} icon="📈" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-4 sm:p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                    <h3 className="text-xl font-bold text-yellow-800 mb-4">💎 Bookings by Tier</h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.bookingsByTier).map(([tier, count]) => (
                             <button key={tier} className="w-full text-left p-2 rounded-lg hover:bg-yellow-100 transition" onClick={() => onGoToBookingsWithFilter({ tier: tier })}>
                                <div className="flex justify-between font-bold text-sm mb-1"><p>{tier}</p><p>{count} Bookings</p></div>
                                <div className="w-full bg-yellow-200 rounded-full h-4">
                                    <div className="bg-yellow-500 h-4 rounded-full" style={{ width: `${(count / bookings.length) * 100}%` }}></div>
                                </div>
                            </button>
                        ))}
                         {Object.keys(analytics.bookingsByTier).length === 0 && <p className="text-sm text-center text-yellow-700 py-4">No booking data available for this analysis.</p>}
                    </div>
                </div>
                <div className="p-4 sm:p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                     <h3 className="text-xl font-bold text-blue-800 mb-4">📋 Reports & Exports</h3>
                     <p className="text-blue-700 mb-4">Download your data for accounting and analysis.</p>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => handleExport('csv')} className="btn-primary w-full justify-center">📄 Export as Excel</button>
                        <button onClick={() => handleExport('pdf')} className="btn-secondary w-full justify-center">🖨️ Export as PDF</button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;