
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Booking, Toast as ToastType, Package, ServiceConfig, Expense, Transaction, Payment, ExpenseCategory, Vendor, Tab } from '../types';
import { SAMPLE_BOOKINGS, DEFAULT_PACKAGES, DEFAULT_SERVICES_CONFIG, SAMPLE_EXPENSES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_VENDORS } from '../constants';
import { FirestoreService } from '../services/firestore.service';

// Helper to load from localStorage with fallback
const loadFromStorage = <T,>(key: string, fallback: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
        console.warn(`Failed to load ${key} from storage`, e);
        return fallback;
    }
};

export const useHeritageData = () => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    
    // Data State with Persistence
    // In production, these would be loaded via FirestoreService inside a useEffect.
    // For now, we use localStorage to simulate database persistence so added items remain.
    const [bookings, setBookings] = useState<Booking[]>(() => loadFromStorage('hg_bookings', SAMPLE_BOOKINGS));
    const [packages, setPackages] = useState<Package[]>(() => loadFromStorage('hg_packages', DEFAULT_PACKAGES));
    const [servicesConfig, setServicesConfig] = useState<ServiceConfig>(() => loadFromStorage('hg_servicesConfig', DEFAULT_SERVICES_CONFIG));
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => loadFromStorage('hg_expenseCategories', DEFAULT_EXPENSE_CATEGORIES));
    const [vendors, setVendors] = useState<Vendor[]>(() => loadFromStorage('hg_vendors', DEFAULT_VENDORS));
    const [allExpenses, setAllExpenses] = useState<Expense[]>(() => loadFromStorage('hg_allExpenses', SAMPLE_EXPENSES));
    
    const [toasts, setToasts] = useState<ToastType[]>([]);
    const [currentSeason, setCurrentSeason] = useState('2025-26');
    
    // UI State
    const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
    const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
    const [bookingToPreselect, setBookingToPreselect] = useState<string | null>(null);
    const [bookingToPreselectInAccounts, setBookingToPreselectInAccounts] = useState<string | null>(null);
    const [preselectedDateForBooking, setPreselectedDateForBooking] = useState<string | null>(null);
    const [bookingFilterToPreselect, setBookingFilterToPreselect] = useState<Record<string, string> | null>(null);

    // --- Persistence Effects ---
    // These effects simulate the auto-save behavior of a real database connection
    useEffect(() => { localStorage.setItem('hg_bookings', JSON.stringify(bookings)); }, [bookings]);
    useEffect(() => { localStorage.setItem('hg_packages', JSON.stringify(packages)); }, [packages]);
    useEffect(() => { localStorage.setItem('hg_servicesConfig', JSON.stringify(servicesConfig)); }, [servicesConfig]);
    useEffect(() => { localStorage.setItem('hg_expenseCategories', JSON.stringify(expenseCategories)); }, [expenseCategories]);
    useEffect(() => { localStorage.setItem('hg_vendors', JSON.stringify(vendors)); }, [vendors]);
    useEffect(() => { localStorage.setItem('hg_allExpenses', JSON.stringify(allExpenses)); }, [allExpenses]);


    // Business Logic: Recalculate Booking Expenses
    useEffect(() => {
        const expenseMap = allExpenses
            .filter(e => e.bookingId)
            .reduce((acc, exp) => {
                const amount = exp.type === 'Paid' ? exp.amount : -exp.amount;
                acc[exp.bookingId!] = (acc[exp.bookingId!] || 0) + amount;
                return acc;
            }, {} as Record<string, number>);

        setBookings(prevBookings => prevBookings.map(b => ({
            ...b,
            expenses: expenseMap[b.bookingId] || 0
        })));
    }, [allExpenses]);

    // Derived Data: All Transactions for Accounting
    const allTransactions = useMemo((): Transaction[] => {
        const paymentTransactions: Transaction[] = bookings.flatMap(b =>
            b.payments.map(p => {
                let description = p.type === 'Received' 
                    ? `Payment from ${b.clientName}` 
                    : `Payment Reverted to ${b.clientName}`;
                
                if (p.type === 'Reverted' && p.notes) {
                    description += ` (Reason: ${p.notes})`;
                }

                return {
                    date: p.date,
                    description,
                    bookingId: b.bookingId,
                    type: p.type === 'Received' ? 'Income' : 'Expense',
                    amount: p.amount,
                    paymentMethod: p.method,
                };
            })
        );
        
        const expenseTransactions: Transaction[] = allExpenses.map(e => {
            let description = `${e.category}: ${e.vendor}`;
            if (e.type === 'Reverted' && e.notes) {
                description += ` (Revert Reason: ${e.notes})`;
            }
            return {
                date: e.expenseDate,
                description,
                bookingId: e.bookingId,
                type: e.type === 'Paid' ? 'Expense' : 'Income',
                amount: e.amount,
                paymentMethod: e.paymentMethod,
                vendor: e.vendor,
                category: e.category,
            }
        });
    
        return [...paymentTransactions, ...expenseTransactions]
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [bookings, allExpenses]);

    const availableSeasons = useMemo(() => {
        const seasons = new Set(bookings.map(b => b.season));
        seasons.add('2024-25');
        seasons.add('2025-26');
        seasons.add('2026-27');
        return ['All', ...Array.from(seasons).sort()];
    }, [bookings]);

    // --- Actions ---

    const addToast = useCallback((message: string, type: ToastType['type']) => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    }, []);
    
    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const handleAddBooking = async (newBooking: Booking) => {
        // Sync with Service Layer
        await FirestoreService.bookings.create(newBooking);
        await FirestoreService.audit.logAction({
            action: 'create',
            targetCollection: 'bookings',
            targetId: newBooking.bookingId,
            performedBy: 'current-user-id', // In production, get from AuthContext
            details: `Created booking for ${newBooking.clientName}`
        });

        // Update Local State
        setBookings(prev => [newBooking, ...prev]);
    };

    const handleUpdateBooking = async (updatedBooking: Booking) => {
        // Sync with Service Layer
        await FirestoreService.bookings.update(updatedBooking.bookingId, updatedBooking);
        
        // Update Local State
        setBookings(prev => prev.map(b => b.bookingId === updatedBooking.bookingId ? updatedBooking : b));
        setBookingToEdit(null);
    };

    const handleEditBooking = (booking: Booking) => {
        setBookingToEdit(booking);
        setActiveTab('new-booking');
    };
    
    const handleClearEdit = () => setBookingToEdit(null);
    
    const handleViewBooking = (booking: Booking, focusPayment: boolean = false) => {
        setViewingBooking(booking);
    };
    
    const handleAddPayment = async (bookingId: string, payment: Payment) => {
        // In production, payments might be a sub-collection, handled by FirestoreService.bookings.addPayment(bookingId, payment)
        
        setBookings(prev => prev.map(b => {
            if (b.bookingId === bookingId) {
                const updatedBooking = { ...b, payments: [...b.payments, payment] };
                if (viewingBooking?.bookingId === bookingId) {
                    setViewingBooking(updatedBooking);
                }
                // Sync update
                FirestoreService.bookings.update(bookingId, { payments: updatedBooking.payments });
                return updatedBooking;
            }
            return b;
        }));
        addToast(`Payment of ₹${payment.amount.toLocaleString('en-IN')} added successfully!`, 'success');
    };

    const handleRevertPayment = (bookingId: string, payment: Payment) => {
        setBookings(prev => prev.map(b => {
            if (b.bookingId === bookingId) {
                const updatedBooking = { ...b, payments: [...b.payments, payment] };
                if (viewingBooking?.bookingId === bookingId) {
                    setViewingBooking(updatedBooking);
                }
                FirestoreService.bookings.update(bookingId, { payments: updatedBooking.payments });
                return updatedBooking;
            }
            return b;
        }));
        addToast(`Payment of ₹${payment.amount.toLocaleString('en-IN')} reverted successfully.`, 'warning');
    };
    
    const handleAddExpense = async (expense: Expense, newVendorCategoryId?: string) => {
        // Sync with Service Layer
        await FirestoreService.finance.addExpense(expense);

        setAllExpenses(prev => [...prev, expense]);
        if (!vendors.some(v => v.name.toLowerCase() === expense.vendor.toLowerCase())) {
            const newVendor: Vendor = {
                id: `v-${Date.now()}`,
                name: expense.vendor,
                categoryId: newVendorCategoryId || expenseCategories.find(c => c.name === 'Other')?.id || 'other',
            };
            setVendors(prev => [...prev, newVendor]);
            addToast(`New vendor "${expense.vendor}" added to category.`, 'info');
        }
        addToast('Expense added successfully!', 'success');
    };
    
    const handleRevertExpense = async (revertedExpense: Expense) => {
        await FirestoreService.finance.addExpense(revertedExpense); // Adding the revert entry
        setAllExpenses(prev => [...prev, revertedExpense]);
        addToast(`Expense of ₹${revertedExpense.amount.toLocaleString('en-IN')} reverted successfully.`, 'warning');
    };

    const handleGoToExpenses = (bookingId: string) => {
        setBookingToPreselect(bookingId);
        setActiveTab('expenses');
    };

    const handleGoToAccounts = (bookingId: string) => {
        setBookingToPreselectInAccounts(bookingId);
        setActiveTab('accounts');
    };

    const handleGoToNewBookingWithDate = (date: string) => {
        setPreselectedDateForBooking(date);
        setActiveTab('new-booking');
    };
    
    const handleGoToBookingsWithFilter = (filter: Record<string, string>) => {
        setBookingFilterToPreselect(filter);
        setActiveTab('bookings');
    };

    return {
        activeTab, setActiveTab,
        bookings, setBookings,
        packages, setPackages,
        servicesConfig, setServicesConfig,
        expenseCategories, setExpenseCategories,
        vendors, setVendors,
        allExpenses, setAllExpenses,
        toasts, removeToast, addToast,
        currentSeason, setCurrentSeason,
        bookingToEdit, setBookingToEdit,
        viewingBooking, setViewingBooking,
        bookingToPreselect, setBookingToPreselect,
        bookingToPreselectInAccounts, setBookingToPreselectInAccounts,
        preselectedDateForBooking, setPreselectedDateForBooking,
        bookingFilterToPreselect, setBookingFilterToPreselect,
        allTransactions, availableSeasons,
        handleAddBooking, handleUpdateBooking, handleEditBooking,
        handleClearEdit, handleViewBooking, handleAddPayment,
        handleRevertPayment, handleAddExpense, handleRevertExpense,
        handleGoToExpenses, handleGoToAccounts, handleGoToNewBookingWithDate,
        handleGoToBookingsWithFilter
    };
};
