import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Transaction, ExpenseCategory, Vendor } from '../types';
import EmptyState from '../components/EmptyState';
import { downloadAsCSV, printToPDF } from '../utils/download';

interface AccountsProps {
    transactions: Transaction[];
    expenseCategories: ExpenseCategory[];
    vendors: Vendor[];
    currentSeason: string;
    availableSeasons: string[];
    bookings: Booking[];
    onViewBooking: (booking: Booking) => void;
    bookingToPreselect: string | null;
    onClearPreselect: () => void;
}

type AccountsView = 'daybook' | 'cashbook' | 'bankbook' | 'category-vendor';
type LedgerTransaction = Transaction & { runningBalance: number };

const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

const TransactionTable: React.FC<{ 
    transactions: LedgerTransaction[]; 
    title: string; 
    onDownload: (format: 'csv' | 'pdf') => void;
    bookings: Booking[];
    onViewBooking: (booking: Booking) => void;
}> = ({ transactions, title, onDownload, bookings, onViewBooking }) => (
    <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-xl font-bold text-[#8b4513]">{title}</h3>
            {transactions.length > 0 && (
                <div className="flex gap-2">
                    <button onClick={() => onDownload('csv')} className="btn-secondary">📄 Excel</button>
                    <button onClick={() => onDownload('pdf')} className="btn-secondary">🖨️ PDF</button>
                </div>
            )}
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-100">
                    <tr className="text-left font-bold text-gray-600">
                        <th className="p-3">Date</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Income (₹)</th>
                        <th className="p-3">Expense (₹)</th>
                        <th className="p-3">Balance (₹)</th>
                        <th className="p-3">Payment</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t, i) => (
                        <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">{formatDate(t.date)}</td>
                            <td className="p-3">
                                {t.description}
                                {t.bookingId && <button onClick={() => {
                                    const booking = bookings.find(b => b.bookingId === t.bookingId);
                                    if(booking) onViewBooking(booking);
                                }} className="text-xs text-blue-600 block hover:underline"> (Ref: {t.bookingId})</button>}
                            </td>
                            <td className="p-3 text-green-600 font-medium">{t.type === 'Income' ? t.amount.toLocaleString('en-IN') : '-'}</td>
                            <td className="p-3 text-red-600 font-medium">{t.type === 'Expense' ? t.amount.toLocaleString('en-IN') : '-'}</td>
                            <td className="p-3 font-bold">{t.runningBalance.toLocaleString('en-IN')}</td>
                            <td className="p-3">{t.paymentMethod}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {transactions.length === 0 && <EmptyState icon="🧾" title="No Transactions" description="No financial records found for the selected filters." />}
        </div>
    </div>
);

const Accounts: React.FC<AccountsProps> = ({ transactions, expenseCategories, vendors, currentSeason, availableSeasons, bookings, onViewBooking, bookingToPreselect, onClearPreselect }) => {
    const [view, setView] = useState<AccountsView>('daybook');
    const [filterBy, setFilterBy] = useState<'category' | 'vendor'>('category');
    const [selectedItem, setSelectedItem] = useState<string>('');
    const [seasonFilter, setSeasonFilter] = useState(currentSeason);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setSeasonFilter(currentSeason);
    }, [currentSeason]);

    useEffect(() => {
        if (bookingToPreselect) {
            setSearchTerm(bookingToPreselect);
            setView('daybook');
            onClearPreselect();
        }
    }, [bookingToPreselect, onClearPreselect]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            
            let inSeason = true;
            if (seasonFilter !== 'All') {
                // Season filter logic (assuming financial year April-March)
                const [startYear] = seasonFilter.split('-').map(Number);
                const seasonStartDate = new Date(`${startYear}-04-01T00:00:00.000Z`);
                const seasonEndDate = new Date(`${startYear + 1}-03-31T23:59:59.999Z`);
                inSeason = transactionDate >= seasonStartDate && transactionDate <= seasonEndDate;
            }

            // Date range filter
            const inDateRange = 
                (!dateFrom || transactionDate >= new Date(dateFrom)) &&
                (!dateTo || transactionDate <= new Date(dateTo));

            // Search Term Filter
            const searchMatch = !searchTerm ||
                (t.bookingId && t.bookingId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                t.description.toLowerCase().includes(searchTerm.toLowerCase());

            return inSeason && inDateRange && searchMatch;
        });
    }, [transactions, seasonFilter, dateFrom, dateTo, searchTerm]);


    const daybookData = useMemo((): LedgerTransaction[] => {
        let balance = 0;
        return filteredTransactions.map(t => {
            balance += t.type === 'Income' ? t.amount : -t.amount;
            return { ...t, runningBalance: balance };
        });
    }, [filteredTransactions]);

    const cashbookData = useMemo((): LedgerTransaction[] => {
        let balance = 0;
        const cashTransactions = filteredTransactions.filter(t => t.paymentMethod === 'Cash');
        return cashTransactions.map(t => {
                balance += t.type === 'Income' ? t.amount : -t.amount;
                return { ...t, runningBalance: balance };
            });
    }, [filteredTransactions]);

    const bankbookData = useMemo((): LedgerTransaction[] => {
        let balance = 0;
        const bankTransactions = filteredTransactions.filter(t => t.paymentMethod !== 'Cash');
        return bankTransactions.map(t => {
                balance += t.type === 'Income' ? t.amount : -t.amount;
                return { ...t, runningBalance: balance };
            });
    }, [filteredTransactions]);

    const filteredLedgerData = useMemo(() => {
        if (!selectedItem) return [];
        if (filterBy === 'category') {
            return filteredTransactions.filter(t => t.category === selectedItem && t.type === 'Expense');
        }
        return filteredTransactions.filter(t => t.vendor === selectedItem && t.type === 'Expense');
    }, [filteredTransactions, selectedItem, filterBy]);

    const totalFilteredPayment = useMemo(() => {
        return filteredLedgerData.reduce((sum, t) => sum + (t.type === 'Expense' ? t.amount : -t.amount), 0);
    }, [filteredLedgerData]);
    
    const handleDownload = (format: 'csv' | 'pdf', ledger: AccountsView) => {
        let title = '';
        let headers: string[] = [];
        let data: (string|number|undefined)[][] = [];

        if (ledger === 'category-vendor') {
            title = `Ledger for ${filterBy}: ${selectedItem}`;
            headers = ['Date', 'Description', 'Amount', 'Payment Method', 'Booking ID'];
            data = filteredLedgerData.map(t => [formatDate(t.date), t.description, t.amount, t.paymentMethod, t.bookingId || 'N/A']);
        } else {
            const ledgerMap = { daybook: daybookData, cashbook: cashbookData, bankbook: bankbookData };
            const ledgerData = ledgerMap[ledger as keyof typeof ledgerMap];
            if (!ledgerData) return;
            title = `${ledger.charAt(0).toUpperCase() + ledger.slice(1)}`;
            headers = ['Date', 'Description', 'Income', 'Expense', 'Balance', 'Payment Method', 'Booking ID'];
            data = ledgerData.map(t => [
                formatDate(t.date),
                t.description,
                t.type === 'Income' ? t.amount : 0,
                t.type === 'Expense' ? t.amount : 0,
                t.runningBalance,
                t.paymentMethod,
                t.bookingId || 'N/A'
            ]);
        }
        
        if (format === 'csv') {
            downloadAsCSV(headers, data, title.replace(/ /g, '_'));
        } else {
            printToPDF(title, headers, data);
        }
    };
    
    const clearFilters = () => {
        setSeasonFilter(currentSeason);
        setDateFrom('');
        setDateTo('');
        setSearchTerm('');
    };

    const renderContent = () => {
        switch (view) {
            case 'daybook':
                return <TransactionTable transactions={daybookData} title="Daybook" onDownload={(f) => handleDownload(f, 'daybook')} bookings={bookings} onViewBooking={onViewBooking} />;
            case 'cashbook':
                return <TransactionTable transactions={cashbookData} title="Cashbook" onDownload={(f) => handleDownload(f, 'cashbook')} bookings={bookings} onViewBooking={onViewBooking} />;
            case 'bankbook':
                return <TransactionTable transactions={bankbookData} title="Bank Book" onDownload={(f) => handleDownload(f, 'bankbook')} bookings={bookings} onViewBooking={onViewBooking} />;
            case 'category-vendor':
                return (
                    <div>
                        <div className="flex justify-between items-start bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-6 flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-auto">
                                <label className="block text-lg font-bold text-blue-800 mb-2">Generate Ledger</label>
                                <div className="flex items-center gap-4 mb-2">
                                    <label className="flex items-center gap-1"><input type="radio" name="filterBy" value="category" checked={filterBy === 'category'} onChange={() => { setFilterBy('category'); setSelectedItem(''); }} /> Category</label>
                                    <label className="flex items-center gap-1"><input type="radio" name="filterBy" value="vendor" checked={filterBy === 'vendor'} onChange={() => { setFilterBy('vendor'); setSelectedItem(''); }} /> Vendor</label>
                                </div>
                                <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="form-input w-full md:w-auto">
                                    <option value="">-- Choose an option --</option>
                                    {filterBy === 'category' ? 
                                        expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>) :
                                        [...new Set(vendors.map(v => v.name))].sort().map(name => <option key={name} value={name}>{name}</option>)
                                    }
                                </select>
                            </div>
                             {selectedItem && (
                                <div className="flex gap-2 self-end">
                                    <button onClick={() => handleDownload('csv', 'category-vendor')} className="btn-secondary">📄 Excel</button>
                                    <button onClick={() => handleDownload('pdf', 'category-vendor')} className="btn-secondary">🖨️ PDF</button>
                                </div>
                            )}
                        </div>
                        {selectedItem && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100"><tr className="text-left font-bold text-gray-600"><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3 text-right">Amount (₹)</th><th className="p-3">Payment</th></tr></thead>
                                    <tbody>
                                        {filteredLedgerData.map((t, i) => (
                                            <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="p-3">{formatDate(t.date)}</td>
                                                <td className="p-3">{t.description}{t.bookingId && <span className="text-xs text-blue-600 block"> (Ref: {t.bookingId})</span>}</td>
                                                <td className={`p-3 font-medium text-right ${t.type === 'Expense' ? 'text-red-600' : 'text-green-600'}`}>{t.amount.toLocaleString('en-IN')}</td>
                                                <td className="p-3">{t.paymentMethod}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-100 font-bold">
                                            <td colSpan={2} className="p-3 text-right">Total Expenses:</td>
                                            <td className="p-3 text-right">{totalFilteredPayment.toLocaleString('en-IN')}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                                {filteredLedgerData.length === 0 && <EmptyState icon="🤷" title="No Transactions" description={`No expenses found for ${selectedItem}.`} />}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-[#8b4513]">Accounts & Ledgers</h2>
                <div className="flex gap-2 p-1 bg-gray-200 rounded-lg flex-wrap">
                    {(['daybook', 'cashbook', 'bankbook', 'category-vendor'] as AccountsView[]).map(v => (
                        <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-sm font-bold rounded-md transition capitalize ${view === v ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>{v.replace('book', ' Book').replace('category-vendor', 'Category & Vendors')}</button>
                    ))}
                </div>
            </div>

            {/* Filters Section */}
            <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="text-sm font-bold text-gray-700">Filter by Season</label>
                        <select value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)} className="form-input mt-1">
                            {availableSeasons.map(s => <option key={s} value={s}>{s === 'All' ? 'All Seasons' : s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-bold text-gray-700">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="form-input mt-1" />
                    </div>
                     <div>
                        <label className="text-sm font-bold text-gray-700">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="form-input mt-1" />
                    </div>
                     <div className="lg:col-span-1">
                        <label className="text-sm font-bold text-gray-700">Search Ref/Description</label>
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input mt-1" placeholder="e.g., HG-2025-001" />
                    </div>
                    <button onClick={clearFilters} className="btn-secondary h-11">Clear Filters</button>
                </div>
            </div>

            <div className="p-4 sm:p-6 bg-white rounded-xl border-2 border-[#f0e6d2] shadow-lg">
                {renderContent()}
            </div>
             <style>{`.form-input { width: 100%; padding: 0.6rem 0.8rem; border: 2px solid #ddd; border-radius: 0.5rem; font-size: 0.9em; background: white; transition: all 0.3s ease; } .form-input:focus { outline: none; border-color: #cd853f; }`}</style>
        </div>
    );
};

export default Accounts;
