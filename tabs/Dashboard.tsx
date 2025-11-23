import React, { useMemo } from 'react';
import { Booking, Expense, Tab } from '../types';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/EmptyState';

interface DashboardProps {
    bookings: Booking[];
    allExpenses: Expense[];
    currentSeason: string;
    setActiveTab: (tab: Tab) => void;
    onViewBooking: (booking: Booking) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: string; valueClassName?: string; onClick?: () => void }> = ({ title, value, icon, valueClassName = "", onClick }) => (
    <button 
        onClick={onClick}
        className="bg-gradient-to-br from-[#f8f5f0] to-[#e8dcc6] p-6 rounded-xl border-2 border-[#cd853f] text-center shadow transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!onClick}
    >
        <h3 className="text-lg font-bold text-[#8b4513] mb-2 flex items-center justify-center gap-2">{icon} {title}</h3>
        <p className={`text-3xl font-bold text-gray-800 text-center ${valueClassName}`}>{value}</p>
    </button>
);

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const Dashboard: React.FC<DashboardProps> = ({ bookings, allExpenses, currentSeason, setActiveTab, onViewBooking }) => {
    const stats = useMemo(() => {
        const seasonBookings = currentSeason === 'All'
            ? bookings
            : bookings.filter(b => b.season === currentSeason);
        
        const activeBookings = seasonBookings.filter(b => b.status !== 'Cancelled');
        const upcomingBookings = seasonBookings.filter(b => b.status === 'Upcoming');

        const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.rate - (b.discount || 0)), 0);
        
        const totalPaid = activeBookings.flatMap(b => b.payments).reduce((sum, p) => {
            return sum + (p.type === 'Received' ? p.amount : -p.amount);
        }, 0);

        const pendingBalance = totalRevenue - totalPaid;
        
        const seasonBookingIds = new Set(seasonBookings.map(b => b.bookingId));
        const seasonExpenses = allExpenses.filter(e => {
            if (e.bookingId) return seasonBookingIds.has(e.bookingId);
            if (currentSeason === 'All') return true;
            const expenseYear = new Date(e.expenseDate).getFullYear();
            const [startYear] = currentSeason.split('-').map(Number);
            // Simple check: if expense is in the season start year or the next.
            return expenseYear === startYear || expenseYear === startYear + 1;
        });
        
        const totalSeasonExpenses = seasonExpenses.reduce((sum, exp) => {
            return sum + (exp.type === 'Paid' ? exp.amount : -exp.amount);
        }, 0);

        const netProfit = totalRevenue - totalSeasonExpenses;

        return {
            totalBookings: seasonBookings.length,
            upcomingCount: upcomingBookings.length,
            totalRevenue,
            pendingBalance,
            totalExpenses: totalSeasonExpenses,
            netProfit,
        };
    }, [bookings, allExpenses, currentSeason]);

    const recentBookings = useMemo(() => {
        return [...bookings]
            .filter(b => currentSeason === 'All' || b.season === currentSeason)
            .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
            .slice(0, 3);
    }, [bookings, currentSeason]);
    
    const upcomingSoonBookings = useMemo(() => {
        return bookings
            .filter(b => b.status === 'Upcoming' && (currentSeason === 'All' || b.season === currentSeason))
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
            .slice(0, 2);
    }, [bookings, currentSeason]);

    return (
        <div className="space-y-8">
            <div>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-[#8b4513]">Dashboard (Season: {currentSeason === 'All' ? 'All Seasons' : currentSeason})</h2>
                    <button onClick={() => setActiveTab('new-booking')} className="btn-primary">
                        ➕ New Booking
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Total Bookings" value={stats.totalBookings} icon="📊" onClick={() => setActiveTab('bookings')} />
                    <StatCard title="Upcoming Events" value={stats.upcomingCount} icon="⏳" onClick={() => setActiveTab('bookings')} />
                    <StatCard title="Pending Balance" value={formatCurrency(stats.pendingBalance)} icon="⏰" onClick={() => setActiveTab('accounts')} />
                    <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon="💰" onClick={() => setActiveTab('accounts')} />
                    <StatCard title="Total Expenses" value={formatCurrency(stats.totalExpenses)} icon="💸" onClick={() => setActiveTab('expenses')} />
                    <StatCard 
                        title="Net Profit" 
                        value={formatCurrency(stats.netProfit)} 
                        icon="📈" 
                        valueClassName={stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} 
                        onClick={() => setActiveTab('analytics')}
                    />
                </div>
            </div>

            <div className="p-2 sm:p-6 bg-white rounded-xl border-2 border-[#f0e6d2] shadow-lg space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-[#8b4513] mb-4 pb-2 border-b border-orange-200 flex items-center gap-2">
                        🎯 Recent Bookings
                    </h3>
                    <div className="space-y-4">
                        {recentBookings.length > 0 ? (
                            recentBookings.map(booking => <BookingCard key={booking.bookingId} booking={booking} onClick={() => onViewBooking(booking)} />)
                        ) : (
                            <EmptyState icon="📋" title="No Recent Bookings" description="No bookings found for the selected season." />
                        )}
                    </div>
                </div>
                
                <div>
                     <h3 className="text-xl font-bold text-[#8b4513] mb-4 pb-2 border-b border-orange-200 flex items-center gap-2">
                        🌟 Coming Up Soon
                    </h3>
                    <div className="space-y-4">
                         {upcomingSoonBookings.length > 0 ? (
                            upcomingSoonBookings.map(booking => <BookingCard key={booking.bookingId} booking={booking} onClick={() => onViewBooking(booking)} />)
                        ) : (
                            <EmptyState icon="📅" title="No Upcoming Events" description="No upcoming events scheduled for this season." />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
