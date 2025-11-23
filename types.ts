
export type Tab = 'dashboard' | 'bookings' | 'new-booking' | 'calendar' | 'expenses' | 'analytics' | 'control-center' | 'accounts';

export type BookingStatus = 'Upcoming' | 'Completed' | 'Cancelled';
export type BookingTier = 'Silver' | 'Gold' | 'Diamond';
export type Shift = 'Day' | 'Night';

// --- Auth & User Roles ---
export type UserRole = 'admin' | 'manager' | 'receptionist' | 'viewer';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: string;
    lastLogin?: string;
}

// --- Core Data ---

export interface Payment {
    id: string;
    date: string; // ISO string "YYYY-MM-DD"
    amount: number;
    method: PaymentMethod;
    type: 'Received' | 'Reverted';
    notes?: string;
    recordedBy?: string; // UID of user who recorded it
}

export interface Booking {
    bookingId: string; // Firestore Doc ID or Custom ID like HG/2025/001
    clientName: string;
    status: BookingStatus;
    tier: BookingTier;
    season: string;
    eventDate: string; // Stored as ISO string "YYYY-MM-DD"
    contact: string;
    rate: number;
    payments: Payment[];
    discount?: number;
    expenses: number;
    eventType: string;
    guests: number;
    shift: Shift;
    services: Record<string, boolean | string | number>;
    refundAmount?: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
}

export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Bank';

export interface ExpenseCategory {
    id: string;
    name: string;
    requiresManpower: boolean;
}

export interface Vendor {
    id: string;
    name: string;
    categoryId: string; // Links vendor to an expense category
}

export interface Expense {
    id: string;
    bookingId?: string; // Optional: Links to a booking if it's not a general expense
    expenseDate: string; // ISO string "YYYY-MM-DD"
    category: string;
    vendor: string;
    amount: number;
    paymentMethod: PaymentMethod;
    type: 'Paid' | 'Reverted';
    notes?: string; // Reason for revert
    manpowerCount?: number;
    ratePerPerson?: number;
    recordedBy?: string;
}

export interface Transaction {
    date: string;
    description: string;
    bookingId?: string;
    type: 'Income' | 'Expense';
    amount: number;
    paymentMethod?: PaymentMethod;
    vendor?: string;
    category?: string;
}

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

export interface Service {
    id: string;
    name: string;
    type: 'checkbox' | 'dropdown' | 'number';
    options?: string[];
    min?: number;
    max?: number;
}

export type ServiceUIType = keyof ServiceConfig;

export interface ServiceConfig {
    infrastructure: Service[];
    decoration: Service[];
    labour: Service[];
    halwai: Service[];
    extra: Service[];
}

export interface Package {
    id: string;
    name: string;
    price: number;
    services: Record<string, boolean | string | number>;
}

export interface AuditLog {
    id: string;
    action: 'create' | 'update' | 'delete' | 'login' | 'logout';
    targetCollection: 'bookings' | 'expenses' | 'settings' | 'auth';
    targetId?: string; 
    performedBy: string; // User UID
    timestamp: string;
    details: string;
    oldValue?: any;
    newValue?: any;
}