import React, { useState, useEffect } from 'react';
import { Booking, Service, ServiceConfig, Payment, PaymentMethod } from '../types';
import Modal from './Modal';
import { SERVICE_CATEGORY_STYLES } from '../constants';

interface BookingDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    servicesConfig: ServiceConfig;
    onAddPayment: (bookingId: string, payment: Payment) => void;
    onRevertPayment: (bookingId: string, payment: Payment) => void;
}

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <p className="text-xs uppercase text-gray-500 font-bold">{label}</p>
        <div className="text-md text-gray-800 font-medium">{children}</div>
    </div>
);

const AddPaymentForm: React.FC<{ booking: Booking; onAddPayment: (bookingId: string, payment: Payment) => void }> = ({ booking, onAddPayment }) => {
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState<PaymentMethod>('Bank');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) return;
        onAddPayment(booking.bookingId, { id: `pay-${Date.now()}`, date, amount, method, type: 'Received' });
        setAmount(0); // Reset form
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-3 bg-gray-100 rounded-lg">
            <div className="sm:col-span-2 md:col-span-1">
                <label className="text-xs font-bold">Amount</label>
                <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} className="w-full p-2 border rounded-md text-sm" placeholder="Amount" />
            </div>
            <div>
                <label className="text-xs font-bold">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
            </div>
            <div>
                <label className="text-xs font-bold">Method</label>
                <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full p-2 border rounded-md text-sm">
                    {(['Bank', 'Cash', 'Card', 'UPI'] as PaymentMethod[]).map(m => <option key={m}>{m}</option>)}
                </select>
            </div>
            <button type="submit" className="btn-success !py-2 w-full">Add Payment</button>
        </form>
    );
};

const RevertPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    paymentToRevert: Payment;
    booking: Booking;
    onRevertPayment: (bookingId: string, payment: Payment) => void;
}> = ({ isOpen, onClose, paymentToRevert, booking, onRevertPayment }) => {
    const [amount, setAmount] = useState(0);
    const [date] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const handleRevert = () => {
        if (!notes.trim()) {
            alert('A reason for the reversion is required.');
            return;
        }
        if (amount <= 0 || amount > paymentToRevert.amount) {
            alert(`Revert amount must be between 0 and ${paymentToRevert.amount}`);
            return;
        }
        onRevertPayment(booking.bookingId, {
            id: `rev-${Date.now()}`,
            date,
            amount,
            method: paymentToRevert.method,
            type: 'Reverted',
            notes,
        });
        onClose();
    };
    
    // Reset state when modal opens
    useEffect(() => {
        if(isOpen) {
            setAmount(paymentToRevert.amount);
            setNotes('');
        }
    }, [isOpen, paymentToRevert]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Revert Payment"
            size="md"
            footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-danger" onClick={handleRevert}>Confirm Revert</button></>}
        >
            <p>Reverting payment received on {new Date(paymentToRevert.date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}.</p>
            <p className="font-bold">Original Amount: ₹{paymentToRevert.amount.toLocaleString('en-IN')}</p>
            <div className="mt-4 space-y-4">
                <div>
                    <label className="text-sm font-bold">Revert Amount (Max: {paymentToRevert.amount})</label>
                    <input type="number" value={amount} onChange={e => setAmount(Math.min(paymentToRevert.amount, parseFloat(e.target.value) || 0))} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="text-sm font-bold">Revert Date</label>
                    <p className="w-full p-2 border rounded-md bg-gray-100 text-gray-700">{new Date(date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</p>
                </div>
                 <div>
                    <label className="text-sm font-bold">Reason for Revert *</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded-md" rows={2} placeholder="e.g., Client request, booking change"></textarea>
                </div>
            </div>
        </Modal>
    );
};


const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ isOpen, onClose, booking, servicesConfig, onAddPayment, onRevertPayment }) => {
    
    const [paymentToRevert, setPaymentToRevert] = useState<Payment | null>(null);
    const allServices: Service[] = Object.values(servicesConfig).flat();
    
    const totalPaid = booking.payments.reduce((sum, p) => {
        return sum + (p.type === 'Received' ? p.amount : -p.amount);
    }, 0);

    const getServiceName = (id: string) => {
        return allServices.find(s => s.id === id)?.name || id;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        });
    };

    const rateAfterDiscount = booking.rate - (booking.discount || 0);

    let profit: number;
    if (booking.status === 'Cancelled') {
        profit = totalPaid - booking.expenses - (booking.refundAmount || 0);
    } else {
        profit = rateAfterDiscount - booking.expenses;
    }
    const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
    const balance = rateAfterDiscount - totalPaid;


    return (
        <>
            <Modal
                title={`Details for ${booking.bookingId}`}
                isOpen={isOpen}
                onClose={onClose}
                size="3xl"
                footer={<button className="btn-secondary" onClick={onClose}>Close</button>}
            >
                <div className="space-y-6">
                    {/* Client & Event Details */}
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-bold text-lg text-[#8b4513] mb-3">Client & Event Information</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label="Client Name">{booking.clientName}</DetailItem>
                            <DetailItem label="Contact">{booking.contact}</DetailItem>
                            <DetailItem label="Event Date">{formatDate(booking.eventDate)}</DetailItem>
                            <DetailItem label="Event Type">{booking.eventType}</DetailItem>
                            <DetailItem label="Guests">{booking.guests}</DetailItem>
                            <DetailItem label="Shift">{booking.shift}</DetailItem>
                        </div>
                    </div>
                    
                    {/* Payment History */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-bold text-lg text-green-800 mb-3">Payment History</h4>
                        <div className="max-h-40 overflow-y-auto mb-3 border-b border-t">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-green-100 z-10">
                                    <tr>
                                        <th className="p-2 text-left">Date</th>
                                        <th className="p-2 text-left">Type</th>
                                        <th className="p-2 text-left">Method</th>
                                        <th className="p-2 text-right">Amount (₹)</th>
                                        <th className="p-2 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {booking.payments.map((p) => (
                                        <React.Fragment key={p.id}>
                                            <tr className={`border-b last:border-b-0 ${p.type === 'Reverted' ? 'bg-red-50' : ''}`}>
                                                <td className="p-2">{formatDate(p.date)}</td>
                                                <td className={`p-2 font-bold ${p.type === 'Reverted' ? 'text-red-600' : 'text-green-600'}`}>{p.type}</td>
                                                <td className="p-2">{p.method}</td>
                                                <td className="p-2 text-right font-medium">{p.amount.toLocaleString('en-IN')}</td>
                                                <td className="p-2 text-center">
                                                    {p.type === 'Received' && (
                                                        <button onClick={() => setPaymentToRevert(p)} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">Revert</button>
                                                    )}
                                                </td>
                                            </tr>
                                            {p.type === 'Reverted' && p.notes && (
                                                <tr className="bg-red-50 border-b last:border-b-0">
                                                    <td colSpan={5} className="pt-0 pb-1 px-3 text-xs text-red-700 italic">
                                                        ↳ Reason: {p.notes}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            {booking.payments.length === 0 && <p className="text-center text-sm text-gray-500 py-4">No payments logged yet.</p>}
                        </div>
                        {booking.status !== 'Cancelled' && <AddPaymentForm booking={booking} onAddPayment={onAddPayment} />}
                    </div>


                    {/* Financial Summary */}
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-lg text-yellow-800 mb-3">Financial Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <DetailItem label="Total Rate"><span className="font-bold">₹{booking.rate.toLocaleString('en-IN')}</span></DetailItem>
                            <DetailItem label="Discount"><span className="text-orange-600">- ₹{(booking.discount || 0).toLocaleString('en-IN')}</span></DetailItem>
                            <DetailItem label="Total Paid"><span className="text-green-600">₹{totalPaid.toLocaleString('en-IN')}</span></DetailItem>
                            {booking.status === 'Cancelled' ? (
                                <DetailItem label="Amount Refunded"><span className="text-orange-600">₹{(booking.refundAmount || 0).toLocaleString('en-IN')}</span></DetailItem>
                            ) : (
                                <DetailItem label="Balance Due"><span className="text-red-600">₹{balance.toLocaleString('en-IN')}</span></DetailItem>
                            )}
                            <DetailItem label="Total Expenses"><span className="text-red-600">₹{booking.expenses.toLocaleString('en-IN')}</span></DetailItem>
                            <DetailItem label="Net Profit"><span className={`font-bold ${profitClass}`}>₹{profit.toLocaleString('en-IN')}</span></DetailItem>
                        </div>
                    </div>

                    {/* Included Services */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-lg text-blue-800 mb-3">Included Services & Amenities</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            {Object.entries(servicesConfig).map(([category, serviceList]) => {
                                const includedServices = serviceList.filter(s => {
                                    const value = booking.services[s.id];
                                    if (s.type === 'checkbox') return value === true;
                                    if (s.type === 'number') return typeof value === 'number' && value > 0;
                                    if (s.type === 'dropdown') return typeof value === 'string' && value !== 'None' && value !== s.options?.[0];
                                    return false;
                                });

                                if (includedServices.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h5 className={`font-bold text-md capitalize p-2 rounded-md ${SERVICE_CATEGORY_STYLES[category as keyof ServiceConfig].bg} ${SERVICE_CATEGORY_STYLES[category as keyof ServiceConfig].text}`}>
                                            {SERVICE_CATEGORY_STYLES[category as keyof ServiceConfig].icon} {category.replace('-', ' ')}
                                        </h5>
                                        <div className="mt-2 space-y-2 text-sm text-gray-700">
                                            {includedServices.map(s => {
                                                const value = booking.services[s.id];
                                                const serviceIcons = {
                                                    checkbox: '✅',
                                                    number: '🔢',
                                                    dropdown: '📋'
                                                };
                                                
                                                let displayValue = '';
                                                if (s.type === 'number') {
                                                    displayValue = `(${value})`;
                                                } else if (s.type === 'dropdown' && typeof value === 'string' && value) {
                                                    displayValue = `(${value})`;
                                                }

                                                return (
                                                    <div key={s.id} className="flex items-center justify-between bg-white/60 p-2 rounded-md shadow-sm">
                                                        <span className="flex items-center gap-2">
                                                            <span>{serviceIcons[s.type]}</span>
                                                            <span>{s.name}</span>
                                                        </span>
                                                        {displayValue && <span className="font-bold text-blue-800">{displayValue}</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Modal>
            {paymentToRevert && (
                <RevertPaymentModal
                    isOpen={!!paymentToRevert}
                    onClose={() => setPaymentToRevert(null)}
                    paymentToRevert={paymentToRevert}
                    booking={booking}
                    onRevertPayment={onRevertPayment}
                />
            )}
        </>
    );
};

export default BookingDetailModal;