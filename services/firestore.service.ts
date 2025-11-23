import { 
    Booking, 
    Expense, 
    ServiceConfig, 
    Package, 
    UserProfile,
    AuditLog 
} from '../types';
import { COLLECTIONS } from './firebase';

// Mocking Firestore functions for prototype -> production transition
// In production, import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';

export const FirestoreService = {
    
    // --- Bookings Collection ---
    bookings: {
        getAll: async (season?: string): Promise<Booking[]> => {
            console.log(`[Firestore] Fetching bookings for season: ${season || 'All'}`);
            // Production: 
            // const q = season ? query(collection(db, 'bookings'), where('season', '==', season)) : collection(db, 'bookings');
            // return (await getDocs(q)).docs.map(doc => ({ ...doc.data(), bookingId: doc.id } as Booking));
            return []; // Returns empty array for now, logic handled in hook for prototype
        },

        create: async (booking: Booking): Promise<string> => {
            console.log('[Firestore] Creating booking:', booking);
            // Production: await addDoc(collection(db, 'bookings'), booking);
            return booking.bookingId;
        },

        update: async (bookingId: string, data: Partial<Booking>): Promise<void> => {
            console.log(`[Firestore] Updating booking ${bookingId}:`, data);
            // Production: await updateDoc(doc(db, 'bookings', bookingId), data);
        }
    },

    // --- Financial Records (Day/Cash/Bank Book) ---
    finance: {
        addExpense: async (expense: Expense): Promise<string> => {
            console.log('[Firestore] Adding expense:', expense);
            // Production: await addDoc(collection(db, 'expenses'), expense);
            return expense.id;
        },

        getTransactions: async (startDate: string, endDate: string): Promise<any[]> => {
            console.log(`[Firestore] Fetching transactions from ${startDate} to ${endDate}`);
            return [];
        }
    },

    // --- Configuration (Services, Packages, Vendors) ---
    config: {
        getServices: async (): Promise<ServiceConfig | null> => {
            // Production: (await getDoc(doc(db, 'config', 'services'))).data();
            return null; 
        },
        
        updateServices: async (config: ServiceConfig): Promise<void> => {
            console.log('[Firestore] Updating service config');
        }
    },

    // --- Audit Logs ---
    audit: {
        logAction: async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
            const entry = { ...log, timestamp: new Date().toISOString() };
            console.log('[Audit Log]', entry);
            // Production: await addDoc(collection(db, 'audit_logs'), entry);
        }
    }
};