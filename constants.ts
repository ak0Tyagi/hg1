
import { Tab, Booking, Package, ServiceConfig, Expense, PaymentMethod, ExpenseCategory, Vendor } from './types';

export const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'bookings', label: 'All Bookings', icon: '📋' },
    { id: 'new-booking', label: 'New Booking', icon: '➕' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'analytics', label: 'Analytics & Reports', icon: '📈' },
    { id: 'control-center', label: 'Control Center', icon: '⚙️' },
    { id: 'accounts', label: 'Accounts', icon: '🧾' },
];

export const SAMPLE_BOOKINGS: Booking[] = [];

export const SAMPLE_EXPENSES: Expense[] = [];


export const DEFAULT_SERVICES_CONFIG: ServiceConfig = {
    infrastructure: [
        { id: 'ac-hall', name: 'AC Hall', type: 'checkbox' },
        { id: 'indoor-stage', name: 'Indoor Stage', type: 'checkbox' },
        { id: 'coffee-machine', name: 'Coffee Machine', type: 'checkbox' },
        { id: 'generator-setup', name: 'Generator Setup', type: 'dropdown', options: ['None', '15 KVA Generator', '25 KVA Generator'] }
    ],
    decoration: [
        { id: 'flower-decoration', name: 'Flower Decoration', type: 'checkbox' },
        { id: 'lighting-decoration', name: 'Lighting Decoration', type: 'checkbox' },
        { id: 'natural-flower-decoration', name: 'Natural Flower Decoration', type: 'checkbox' }
    ],
    labour: [
        { id: 'service-manager-count', name: 'Service Manager', type: 'number', min: 0, max: 5 },
        { id: 'waiters-count', name: 'Waiters', type: 'number', min: 0, max: 20 }
    ],
    halwai: [
        { id: 'fruit-counter-count', name: 'Fruit Counter', type: 'number', min: 0, max: 10 },
        { id: 'main-course-counter-count', name: 'Main Course Counter', type: 'number', min: 0, max: 10 },
        { id: 'snacks-counter-count', name: 'Snacks Counter', type: 'number', min: 0, max: 10 }
    ],
    extra: [
        { id: 'dj-setup', name: 'DJ Setup', type: 'dropdown', options: ['None', 'Basic DJ Setup', 'Premium DJ Setup'] },
        { id: 'anar-matka', name: 'Anar Matka', type: 'checkbox' }
    ]
};

export const DEFAULT_PACKAGES: Package[] = [
    {
        id: 'pkg-silver',
        name: 'Silver Package',
        price: 110000,
        services: { 
            'ac-hall': true, 'flower-decoration': true, 'waiters-count': 5, 
            'generator-setup': '15kva', 'main-course-counter-count': 2
        }
    },
    {
        id: 'pkg-gold',
        name: 'Gold Package',
        price: 145000,
        services: { 
            'ac-hall': true, 'flower-decoration': true, 'lighting-decoration': true,
            'waiters-count': 8, 'service-manager-count': 1, 'generator-setup': '25kva',
            'main-course-counter-count': 3, 'dj-setup': 'basic'
        }
    },
    {
        id: 'pkg-diamond',
        name: 'Diamond Package',
        price: 180000,
        services: { 
            'ac-hall': true, 'natural-flower-decoration': true, 'lighting-decoration': true,
            'waiters-count': 12, 'service-manager-count': 2, 'generator-setup': '25kva',
            'main-course-counter-count': 4, 'dj-setup': 'premium'
        }
    }
];

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
    { id: 'catering', name: 'Catering', requiresManpower: false },
    { id: 'decoration', name: 'Decoration', requiresManpower: false },
    { id: 'staff', name: 'Staff', requiresManpower: true },
    { id: 'labour', name: 'Labour', requiresManpower: true },
    { id: 'av-equipment', name: 'AV Equipment', requiresManpower: false },
    { id: 'salary', name: 'Salary', requiresManpower: false },
    { id: 'utilities', name: 'Utilities', requiresManpower: false },
    { id: 'maintenance', name: 'Maintenance', requiresManpower: false },
    { id: 'marketing', name: 'Marketing', requiresManpower: false },
    { id: 'refund', name: 'Refund', requiresManpower: false },
    { id: 'other', name: 'Other', requiresManpower: false },
];

export const DEFAULT_VENDORS: Vendor[] = [];


export const SERVICE_CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    infrastructure: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', icon: '🏗️' },
    decoration: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', icon: '🎨' },
    labour: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', icon: '👥' },
    halwai: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', icon: '🍽️' },
    extra: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', icon: '⚡' }
};