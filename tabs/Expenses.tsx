import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Expense, PaymentMethod, ExpenseCategory, Vendor } from '../types';
import EmptyState from '../components/EmptyState';
import { downloadAsCSV, printToPDF } from '../utils/download';
import Modal from '../components/Modal';

interface ExpensesProps {
    bookings: Booking[];
    allExpenses: Expense[];
    addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    bookingToPreselect: string | null;
    onClearPreselect: () => void;
    onAddExpense: (expense: Expense, newVendorCategoryId?: string) => void;
    onRevertExpense: (expense: Expense) => void;
    expenseCategories: ExpenseCategory[];
    vendors: Vendor[];
    onViewBooking: (booking: Booking) => void;
}

type ExpenseView = 'booking' | 'general';
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Card', 'UPI', 'Bank'];

// --- MODALS ---

const AddExpenseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (expense: Omit<Expense, 'id' | 'type'>, newVendorCategoryId?: string) => void;
    bookingId?: string;
    categories: ExpenseCategory[];
    vendors: Vendor[];
}> = ({ isOpen, onClose, onAdd, bookingId, categories, vendors }) => {
    const [category, setCategory] = useState('');
    const [vendor, setVendor] = useState('');
    const [amount, setAmount] = useState(0);
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
    const [manpowerCount, setManpowerCount] = useState(0);
    const [ratePerPerson, setRatePerPerson] = useState(0);

    const selectedCategory = useMemo(() => {
        return categories.find(c => c.name === category);
    }, [category, categories]);
    
    const filteredVendors = useMemo(() => {
        if (!selectedCategory) return vendors;
        return vendors.filter(v => v.categoryId === selectedCategory.id);
    }, [selectedCategory, vendors]);

    const isManpower = selectedCategory?.requiresManpower || false;

    useEffect(() => {
        if (isManpower) {
            setAmount(manpowerCount * ratePerPerson);
        }
    }, [manpowerCount, ratePerPerson, isManpower]);

    const handleSubmit = () => {
        if (!category || !vendor || amount <= 0) {
            alert('Please fill all required fields.');
            return;
        }
        onAdd({
            bookingId,
            expenseDate,
            category,
            vendor,
            amount,
            paymentMethod,
            manpowerCount: isManpower ? manpowerCount : undefined,
            ratePerPerson: isManpower ? ratePerPerson : undefined,
        }, selectedCategory?.id);
        onClose();
    };
    
    // Reset form on close
    useEffect(() => {
        if (!isOpen) {
            setCategory(''); setVendor(''); setAmount(0);
            setExpenseDate(new Date().toISOString().split('T')[0]);
            setPaymentMethod('Cash'); setManpowerCount(0); setRatePerPerson(0);
        }
    }, [isOpen]);

    return (
        <Modal title="Add New Expense" isOpen={isOpen} onClose={onClose} footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-success" onClick={handleSubmit}>Add Expense</button></>}>
            <div className="space-y-4">
                <div className="form-group">
                    <label>Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="form-input">
                        <option value="">-- Select a Category --</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                {isManpower && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-md">
                        <div className="form-group"><label>Manpower Count</label><input type="number" value={manpowerCount} onChange={e => setManpowerCount(Number(e.target.value))} className="form-input" /></div>
                        <div className="form-group"><label>Rate Per Person</label><input type="number" value={ratePerPerson} onChange={e => setRatePerPerson(Number(e.target.value))} className="form-input" /></div>
                    </div>
                )}
                <div className="form-group">
                    <label>Vendor/Item</label>
                    <input list="vendors-list" type="text" value={vendor} onChange={e => setVendor(e.target.value)} className="form-input" placeholder="Select or type to add new vendor" disabled={!category} />
                    <datalist id="vendors-list">
                        {filteredVendors.map(v => <option key={v.id} value={v.name} />)}
                    </datalist>
                </div>
                <div className="form-group"><label>Amount (₹)</label><input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} className="form-input" readOnly={isManpower} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-group"><label>Date</label><input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="form-input" /></div>
                    <div className="form-group"><label>Payment Method</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="form-input">{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
                </div>
            </div>
             <style>{`.form-group { display: flex; flex-direction: column; gap: 0.5rem; } .form-group label { font-weight: bold; color: #333; font-size: 0.85em; } .form-input { width: 100%; padding: 0.6rem 0.8rem; border: 2px solid #ddd; border-radius: 0.5rem; }`}</style>
        </Modal>
    );
};

const RevertExpenseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    expense: Expense;
    onRevert: (revertedExpense: Expense) => void;
}> = ({ isOpen, onClose, expense, onRevert }) => {
    const [amount, setAmount] = useState(0);
    const [notes, setNotes] = useState('');

    const handleRevert = () => {
        if (amount <= 0 || amount > expense.amount) {
            alert(`Revert amount must be between 0 and ${expense.amount}`);
            return;
        }
        onRevert({
            ...expense,
            id: `rev-${Date.now()}`,
            expenseDate: new Date().toISOString().split('T')[0],
            amount,
            type: 'Reverted',
            notes,
        });
        onClose();
    };

    return (
         <Modal title="Revert Expense" isOpen={isOpen} onClose={onClose} footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-danger" onClick={handleRevert}>Confirm Revert</button></>}>
             <p>Reverting expense for <strong>{expense.vendor}</strong>.</p>
             <p className="font-bold">Original Amount: ₹{expense.amount.toLocaleString('en-IN')}</p>
             <div className="mt-4 space-y-4">
                 <div><label className="font-bold text-sm">Revert Amount</label><input type="number" value={amount} onChange={e => setAmount(Math.min(expense.amount, Number(e.target.value)))} className="form-input mt-1" /></div>
                 <div><label className="font-bold text-sm">Reason for Revert</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input mt-1" rows={2} placeholder="e.g., incorrect charge, service cancelled"></textarea></div>
             </div>
             <style>{`.form-input { width: 100%; padding: 0.6rem 0.8rem; border: 2px solid #ddd; border-radius: 0.5rem; }`}</style>
        </Modal>
    );
};


const Expenses: React.FC<ExpensesProps> = ({ bookings, allExpenses, addToast, bookingToPreselect, onClearPreselect, onAddExpense, onRevertExpense, expenseCategories, vendors, onViewBooking }) => {
    const [expenseView, setExpenseView] = useState<ExpenseView>('booking');
    const [selectedBookingId, setSelectedBookingId] = useState<string>('');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [expenseToRevert, setExpenseToRevert] = useState<Expense | null>(null);

    useEffect(() => {
        if (bookingToPreselect) {
            setExpenseView('booking');
            setSelectedBookingId(bookingToPreselect);
            onClearPreselect();
        }
    }, [bookingToPreselect, onClearPreselect]);

    const selectedBooking = useMemo(() => {
        return bookings.find(b => b.bookingId === selectedBookingId);
    }, [bookings, selectedBookingId]);

    const filteredExpenses = useMemo(() => {
        const expenses = expenseView === 'booking'
            ? allExpenses.filter(e => e.bookingId === selectedBookingId)
            : allExpenses.filter(e => !e.bookingId);
        return expenses.sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
    }, [expenseView, selectedBookingId, allExpenses]);

    const totalExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, exp) => {
            return sum + (exp.type === 'Paid' ? exp.amount : -exp.amount);
        }, 0);
    }, [filteredExpenses]);

    const handleAdd = (expenseData: Omit<Expense, 'id' | 'type'>, newVendorCategoryId?: string) => {
        onAddExpense({ ...expenseData, id: `exp-${Date.now()}`, type: 'Paid' }, newVendorCategoryId);
    };

    const handleDownload = (format: 'csv' | 'pdf') => {
        const title = expenseView === 'booking' ? `Expenses for ${selectedBooking?.clientName}` : 'General Expenses';
        const headers = ['Date', 'Category', 'Vendor', 'Type', 'Amount', 'Method', 'Notes'];
        const data = filteredExpenses.map(e => [e.expenseDate, e.category, e.vendor, e.type, e.amount, e.paymentMethod, e.notes || '']);
        if (format === 'csv') downloadAsCSV(headers, data, title.replace(/ /g, '_')); else printToPDF(title, headers, data);
    };

    const renderExpenseTable = () => (
        <div className="p-4 sm:p-6 bg-white rounded-xl border-2 border-[#f0e6d2] shadow-lg mt-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-xl font-bold text-[#8b4513]">
                    {expenseView === 'general' ? 'All General Expenses' : 
                        selectedBooking ? (
                            <>
                                Expenses for <button onClick={() => onViewBooking(selectedBooking)} className="text-blue-600 hover:underline">{selectedBooking.clientName}</button>
                            </>
                        ) : 'Expenses'
                    }
                </h3>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleDownload('csv')} className="btn-secondary">📄 Excel</button>
                    <button onClick={() => handleDownload('pdf')} className="btn-secondary">🖨️ PDF</button>
                    <button onClick={() => setAddModalOpen(true)} className="btn-success" disabled={expenseView === 'booking' && !selectedBookingId}>➕ Add Expense</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr className="text-left font-bold text-gray-600"><th className="p-2">Date</th><th className="p-2">Category/Vendor</th><th className="p-2">Type</th><th className="p-2 text-right">Amount (₹)</th><th className="p-2">Method</th><th className="p-2 text-center">Action</th></tr></thead>
                    <tbody>
                        {filteredExpenses.map(exp => (
                            <React.Fragment key={exp.id}>
                            <tr className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="p-2">{new Date(exp.expenseDate).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</td>
                                <td className="p-2"><strong>{exp.category}</strong><br/>{exp.vendor}</td>
                                <td className={`p-2 font-bold ${exp.type === 'Paid' ? 'text-red-600' : 'text-green-600'}`}>{exp.type}</td>
                                <td className="p-2 text-right font-mono">{exp.amount.toLocaleString('en-IN')}</td>
                                <td className="p-2">{exp.paymentMethod}</td>
                                <td className="p-2 text-center">{exp.type === 'Paid' && <button onClick={() => setExpenseToRevert(exp)} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">Revert</button>}</td>
                            </tr>
                            {exp.notes && (
                                <tr className="bg-gray-50 border-b"><td colSpan={6} className="pt-0 pb-1 px-3 text-xs text-gray-600 italic">↳ Note: {exp.notes}</td></tr>
                            )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredExpenses.length === 0 && <EmptyState icon="💸" title="No Expenses Logged" description={expenseView === 'general' ? "Add your first general expense." : "Select a booking to see or add expenses."} />}
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200"><p className="text-lg font-bold text-yellow-800">Net Expenses: ₹{totalExpenses.toLocaleString('en-IN')}</p></div>
        </div>
    );
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-[#8b4513]">Expense Management</h2>
                <div className="flex gap-2 p-1 bg-gray-200 rounded-lg">
                    <button onClick={() => setExpenseView('booking')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${expenseView === 'booking' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>📋 Booking Expenses</button>
                    <button onClick={() => setExpenseView('general')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${expenseView === 'general' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>🏢 General Expenses</button>
                </div>
            </div>
            {expenseView === 'booking' ? (
                <>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                        <label htmlFor="booking-select" className="block text-lg font-bold text-blue-800 mb-2">Select Booking:</label>
                        <select id="booking-select" value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)} className="w-full md:w-1/2 p-2 border rounded-md">
                            <option value="">-- Choose a booking --</option>
                            {bookings.map(b => <option key={b.bookingId} value={b.bookingId}>{b.clientName} ({b.bookingId})</option>)}
                        </select>
                    </div>
                    {selectedBookingId && renderExpenseTable()}
                </>
            ) : renderExpenseTable()}

            <AddExpenseModal 
                isOpen={isAddModalOpen} 
                onClose={() => setAddModalOpen(false)} 
                onAdd={handleAdd} 
                bookingId={expenseView === 'booking' ? selectedBookingId : undefined}
                categories={expenseCategories}
                vendors={vendors}
            />
            {expenseToRevert && <RevertExpenseModal isOpen={!!expenseToRevert} onClose={() => setExpenseToRevert(null)} expense={expenseToRevert} onRevert={onRevertExpense} />}
        </div>
    );
};

export default Expenses;