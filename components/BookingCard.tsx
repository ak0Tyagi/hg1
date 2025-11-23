import React from 'react';
import { Booking } from '../types';

interface BookingCardProps {
    booking: Booking;
    actions?: React.ReactNode;
    onClick?: () => void;
}

const statusStyles: { [key: string]: string } = {
    Upcoming: 'bg-yellow-200 text-yellow-800 border-yellow-400',
    Completed: 'bg-green-200 text-green-800 border-green-400',
    Cancelled: 'bg-red-200 text-red-800 border-red-400',
};

const tierStyles: { [key: string]: string } = {
    Silver: 'bg-gray-200 text-gray-800 border-gray-400',
    Gold: 'bg-yellow-200 text-yellow-800 border-yellow-400',
    Diamond: 'bg-blue-200 text-blue-800 border-blue-400',
};

const DetailItem: React.FC<{ icon: string; label: string; value: string | number; valueClassName?: string }> = ({ icon, label, value, valueClassName = "" }) => (
    <div>
        <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="text-xs uppercase text-gray-500 font-bold">{label}</span>
        </div>
        <span className={`text-base text-gray-800 font-bold pl-8 ${valueClassName}`}>{value}</span>
    </div>
);

const BookingCard: React.FC<BookingCardProps> = ({ booking, actions, onClick }) => {
    const rateAfterDiscount = booking.rate - (booking.discount || 0);
    
    const totalPaid = booking.payments.reduce((sum, p) => {
        return sum + (p.type === 'Received' ? p.amount : -p.amount);
    }, 0);

    let profit: number;
    if (booking.status === 'Cancelled') {
        profit = totalPaid - booking.expenses - (booking.refundAmount || 0);
    } else {
        profit = rateAfterDiscount - booking.expenses;
    }
    const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        });
    };
    
    const balance = rateAfterDiscount - totalPaid;

    const cardContent = (
         <div className="bg-white p-5 rounded-2xl border-l-8 border-[#cd853f] shadow-lg transition-all duration-300 hover:shadow-xl hover:border-l-[#8b4513] hover:translate-x-1 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                <h3 className="text-xl font-bold text-[#8b4513] flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    {booking.clientName} ({booking.bookingId})
                </h3>
                <div className="flex gap-2 flex-wrap">
                    <span className={`badge ${statusStyles[booking.status]}`}>{booking.status}</span>
                    <span className={`badge ${tierStyles[booking.tier]}`}>{booking.tier}</span>
                    <span className="badge bg-[#f4f1eb] text-[#8b4513] border-[#cd853f]">{booking.season}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 mb-4">
                <DetailItem icon="📅" label="Event Date" value={formatDate(booking.eventDate)} />
                <DetailItem icon="📞" label="Contact" value={booking.contact} />
                <DetailItem icon="🎉" label="Event Type" value={booking.eventType} />
                <DetailItem icon="👥" label="Guests" value={booking.guests} />
                <DetailItem icon="💰" label="Rate" value={`₹${booking.rate.toLocaleString('en-IN')}`} />
                <DetailItem icon="💳" label="Paid" value={`₹${totalPaid.toLocaleString('en-IN')}`} />
                {booking.status === 'Cancelled' ? (
                    <DetailItem icon="↩️" label="Refunded" value={`₹${(booking.refundAmount || 0).toLocaleString('en-IN')}`} />
                ) : (
                    <DetailItem icon="⏳" label="Balance" value={`₹${balance.toLocaleString('en-IN')}`} />
                )}
                <DetailItem icon="📈" label="Net Profit" value={`₹${profit.toLocaleString('en-IN')}`} valueClassName={profitClass} />
            </div>
            
            {actions && (
                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t-2 border-gray-100">
                    {actions}
                </div>
            )}
        </div>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className="w-full text-left">
                {cardContent}
            </button>
        )
    }

    return cardContent;
};

export default BookingCard;