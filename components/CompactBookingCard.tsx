import React from 'react';
import { Booking } from '../types';

interface CompactBookingCardProps {
    booking: Booking;
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
    <div className="text-left">
        <div className="flex items-center gap-1 text-xs uppercase text-gray-500 font-bold">
            <span className="text-sm">{icon}</span>
            <span>{label}</span>
        </div>
        <span className={`text-base text-gray-800 font-bold ${valueClassName}`}>{value}</span>
    </div>
);


const CompactBookingCard: React.FC<CompactBookingCardProps> = ({ booking, onClick }) => {
    const rateAfterDiscount = booking.rate - (booking.discount || 0);
    const totalPaid = booking.payments.reduce((sum, p) => {
        return sum + (p.type === 'Received' ? p.amount : -p.amount);
    }, 0);

    const eventDate = new Date(booking.eventDate);
    const day = eventDate.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'UTC' });
    const month = eventDate.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
    const year = eventDate.toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'UTC' });

    const balance = rateAfterDiscount - totalPaid;
    
    const cardContent = (
        <div className="bg-white p-4 rounded-2xl border-l-8 border-[#cd853f] shadow-md w-full transition-all duration-300 hover:shadow-lg hover:border-l-[#8b4513]">
            <div className="flex justify-between items-start gap-3 mb-4">
                <div className="flex items-start gap-2">
                    <span className="text-2xl mt-1">👤</span>
                    <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-[#8b4513] leading-tight">{booking.clientName}</h3>
                        <p className="text-sm text-gray-600">({booking.bookingId})</p>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                    <span className={`badge !px-3 !py-1 ${statusStyles[booking.status]}`}>{booking.status}</span>
                    <span className={`badge !px-3 !py-1 ${tierStyles[booking.tier]}`}>{booking.tier}</span>
                    <span className="badge !px-3 !py-1 bg-[#f4f1eb] text-[#8b4513] border-[#cd853f]">{booking.season}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                {/* Date in first column */}
                <div className="col-span-1 text-center border-r border-gray-200 pr-2 flex flex-col justify-center">
                    <div className="flex items-center justify-center gap-1 text-xs uppercase text-gray-500 font-bold">
                        <span className="text-sm">📅</span>
                        <span>EVENT DATE</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{day}</p>
                    <p className="text-sm font-semibold text-gray-600 -mt-1">{month}</p>
                    <p className="text-xs text-gray-500">{year}</p>
                </div>

                {/* Other details in the next 2 columns */}
                <div className="col-span-2 grid grid-cols-2 gap-y-4 pl-2">
                    <DetailItem icon="📞" label="Contact" value={booking.contact} />
                    <DetailItem icon="🎉" label="Event Type" value={booking.eventType} />
                </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-3 gap-2 text-center mt-4 pt-4 border-t border-gray-200">
                 <DetailItem icon="💰" label="Rate" value={`₹${booking.rate.toLocaleString('en-IN')}`} />
                <DetailItem icon="💳" label="Paid" value={`₹${totalPaid.toLocaleString('en-IN')}`} />
                {booking.status === 'Cancelled' ? (
                    <DetailItem icon="↩️" label="Refunded" value={`₹${(booking.refundAmount || 0).toLocaleString('en-IN')}`} />
                ) : (
                    <DetailItem icon="⏳" label="Balance" value={`₹${balance.toLocaleString('en-IN')}`} />
                )}
            </div>
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

export default CompactBookingCard;