import React, { useState, useMemo, useEffect } from 'react';
import { Booking, BookingStatus, BookingTier, Expense, ServiceConfig } from '../types';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { downloadAsCSV, printToPDF } from '../utils/download';

interface BookingsProps {
    bookings: Booking[];
    setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
    setAllExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    onEditBooking: (booking: Booking) => void;
    onViewBooking: (booking: Booking, focusPayment?: boolean) => void;
    onGoToExpenses: (bookingId: string) => void;
    onGoToAccounts: (bookingId: string) => void;
    servicesConfig: ServiceConfig;
    bookingFilterToPreselect: Record<string, string> | null;
    onClearBookingFilter: () => void;
}

const Bookings: React.FC<BookingsProps> = ({ bookings, setBookings, setAllExpenses, addToast, onEditBooking, onViewBooking, onGoToExpenses, onGoToAccounts, servicesConfig, bookingFilterToPreselect, onClearBookingFilter }) => {
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        tier: '',
    });
    const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
    const [refundAmount, setRefundAmount] = useState(0);

    useEffect(() => {
        if (bookingFilterToPreselect) {
            setFilters(prev => ({ ...prev, ...bookingFilterToPreselect }));
            onClearBookingFilter();
            addToast(`Filters applied from previous page.`, 'info');
        }
    }, [bookingFilterToPreselect, onClearBookingFilter, addToast]);

    const totalPaidForCancellation = useMemo(() => {
        if (!bookingToCancel) return 0;
        return bookingToCancel.payments.reduce((sum, p) => {
            return sum + (p.type === 'Received' ? p.amount : -p.amount);
        }, 0);
    }, [bookingToCancel]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ search: '', status: '', tier: '' });
    };

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            const searchMatch = filters.search.toLowerCase() === '' ||
                booking.clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
                booking.bookingId.toLowerCase().includes(filters.search.toLowerCase());
            const statusMatch = filters.status === '' || booking.status === filters.status;
            const tierMatch = filters.tier === '' || booking.tier === filters.tier;
            return searchMatch && statusMatch && tierMatch;
        });
    }, [bookings, filters]);
    
    const handleCancelClick = (booking: Booking) => {
        setRefundAmount(0); // Reset on open
        setBookingToCancel(booking);
    };

    const confirmCancellation = () => {
        if (!bookingToCancel) return;

        // Update booking status and refund amount
        setBookings(prev => prev.map(b => 
            b.bookingId === bookingToCancel.bookingId 
            ? { ...b, status: 'Cancelled', refundAmount: refundAmount } 
            : b
        ));

        // Create a refund expense if applicable
        if (refundAmount > 0) {
            const refundExpense: Expense = {
                id: `exp-refund-${Date.now()}`,
                bookingId: bookingToCancel.bookingId,
                expenseDate: new Date().toISOString().split('T')[0],
                category: 'Refund',
                vendor: `Refund to ${bookingToCancel.clientName}`,
                amount: refundAmount,
                paymentMethod: 'Bank',
                // FIX: Added missing 'type' property to satisfy the Expense interface.
                type: 'Paid',
            };
            setAllExpenses(prev => [...prev, refundExpense]);
        }
        
        addToast(`Booking for ${bookingToCancel.clientName} has been cancelled.`, 'success');
        setBookingToCancel(null);
    };

    const handleDownload = (format: 'csv' | 'pdf') => {
        const title = 'Bookings_Report';
        const headers = ['Booking ID', 'Client Name', 'Status', 'Tier', 'Event Date', 'Rate', 'Paid', 'Expenses', 'Refund'];
        const data = filteredBookings.map(b => {
            const totalPaid = b.payments.reduce((sum, p) => sum + (p.type === 'Received' ? p.amount : -p.amount), 0);
            return [
                b.bookingId,
                b.clientName,
                b.status,
                b.tier,
                b.eventDate,
                b.rate,
                totalPaid,
                b.expenses,
                b.refundAmount || 0
            ];
        });
    
        if (format === 'csv') {
            downloadAsCSV(headers, data, title);
            addToast('CSV file downloaded.', 'success');
        } else {
            printToPDF('Bookings Report', headers, data);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-[#8b4513] mb-6">All Bookings</h2>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 mb-6 space-y-4">
                 <div className="flex justify-between items-center flex-wrap gap-4">
                    <h4 className="text-lg font-bold text-blue-800">🔍 Advanced Search & Filters</h4>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleDownload('csv')} className="btn-secondary">📄 Excel</button>
                        <button onClick={() => handleDownload('pdf')} className="btn-secondary">🖨️ PDF</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        name="search"
                        placeholder="Search by client or ID..."
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="form-input"
                    />
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="form-input">
                        <option value="">All Statuses</option>
                        {(['Upcoming', 'Completed', 'Cancelled'] as BookingStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select name="tier" value={filters.tier} onChange={handleFilterChange} className="form-input">
                        <option value="">All Tiers</option>
                        {(['Silver', 'Gold', 'Diamond'] as BookingTier[]).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={clearFilters} className="btn-secondary">
                        🗑️ Clear Filters
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map(booking => (
                        <BookingCard 
                            key={booking.bookingId} 
                            booking={booking} 
                            actions={
                                <>
                                    <button onClick={() => onViewBooking(booking)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-transform transform hover:-translate-y-0.5">👁️ View</button>
                                    <button onClick={() => onEditBooking(booking)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-transform transform hover:-translate-y-0.5" disabled={booking.status !== 'Upcoming'}>✏️ Edit</button>
                                    <button onClick={() => onViewBooking(booking, true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-transform transform hover:-translate-y-0.5" disabled={booking.status === 'Cancelled'}>💰 Payment</button>
                                    <button onClick={() => onGoToExpenses(booking.bookingId)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-transform transform hover:-translate-y-0.5">💸 Expenses</button>
                                    <button onClick={() => onGoToAccounts(booking.bookingId)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-transform transform hover:-translate-y-0.5">🧾 Accounts</button>
                                    {booking.status === 'Upcoming' && (
                                         <button onClick={() => handleCancelClick(booking)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-transform transform hover:-translate-y-0.5">❌ Cancel</button>
                                    )}
                                </>
                            }
                        />
                    ))
                ) : (
                    <EmptyState 
                        icon="🔍"
                        title="No Bookings Found"
                        description="No bookings match your current filter criteria. Try adjusting your search."
                    />
                )}
            </div>
            
            <Modal
                title="Cancel Booking"
                isOpen={!!bookingToCancel}
                onClose={() => setBookingToCancel(null)}
                size="md"
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setBookingToCancel(null)}>Back</button>
                        <button className="btn-danger" onClick={confirmCancellation}>Confirm Cancellation</button>
                    </>
                }
            >
                <p className="mb-4">You are cancelling the booking for <strong className="text-[#8b4513]">{bookingToCancel?.clientName}</strong>.</p>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-bold">Total Paid: ₹{totalPaidForCancellation.toLocaleString('en-IN')}</p>
                    <div className="mt-4">
                        <label htmlFor="refundAmount" className="block font-bold text-sm mb-1">Enter Refund Amount (₹):</label>
                        <input
                            type="number"
                            id="refundAmount"
                            value={refundAmount}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setRefundAmount(Math.max(0, Math.min(totalPaidForCancellation, val)));
                            }}
                            className="w-full p-2 border-2 border-yellow-300 rounded-md focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                            max={totalPaidForCancellation}
                            min="0"
                        />
                         <p className="text-xs text-gray-500 mt-1">Enter the amount returned from the total payments received.</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Bookings;