
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useHeritageData } from './hooks/useHeritageData';
import { TABS } from './constants';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import Dashboard from './tabs/Dashboard';
import Bookings from './tabs/Bookings';
import NewBooking from './tabs/NewBooking';
import Calendar from './tabs/Calendar';
import Expenses from './tabs/Expenses';
import Analytics from './tabs/Analytics';
import ControlCenter from './tabs/ControlCenter';
import Accounts from './tabs/Accounts';
import ToastContainer from './components/ToastContainer';
import BookingDetailModal from './components/BookingDetailModal';
import LoginScreen from './components/LoginScreen';

const MainApp: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const data = useHeritageData();

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    const renderContent = () => {
        switch (data.activeTab) {
            case 'dashboard':
                return <Dashboard bookings={data.bookings} allExpenses={data.allExpenses} currentSeason={data.currentSeason} setActiveTab={data.setActiveTab} onViewBooking={data.handleViewBooking} />;
            case 'bookings':
                return <Bookings 
                    bookings={data.bookings} 
                    addToast={data.addToast} 
                    setBookings={data.setBookings} 
                    setAllExpenses={data.setAllExpenses}
                    onEditBooking={data.handleEditBooking}
                    onViewBooking={data.handleViewBooking}
                    servicesConfig={data.servicesConfig}
                    onGoToExpenses={data.handleGoToExpenses}
                    onGoToAccounts={data.handleGoToAccounts}
                    bookingFilterToPreselect={data.bookingFilterToPreselect}
                    onClearBookingFilter={() => data.setBookingFilterToPreselect(null)}
                />;
            case 'new-booking':
                return <NewBooking 
                    packages={data.packages} 
                    servicesConfig={data.servicesConfig} 
                    setServicesConfig={data.setServicesConfig}
                    addToast={data.addToast} 
                    setActiveTab={data.setActiveTab}
                    onAddBooking={data.handleAddBooking}
                    onUpdateBooking={data.handleUpdateBooking}
                    bookingToEdit={data.bookingToEdit}
                    onClearEdit={data.handleClearEdit}
                    // Removed data.preselectedDateForBooking from key to prevent unmounting loop
                    key={data.bookingToEdit?.bookingId || 'new'}
                    bookings={data.bookings}
                    currentSeason={data.currentSeason}
                    preselectedDate={data.preselectedDateForBooking}
                    onClearPreselectedDate={() => data.setPreselectedDateForBooking(null)}
                />;
            case 'calendar':
                return <Calendar 
                    bookings={data.bookings} 
                    setActiveTab={data.setActiveTab} 
                    currentSeason={data.currentSeason}
                    availableSeasons={data.availableSeasons}
                    addToast={data.addToast}
                    onViewBooking={data.handleViewBooking}
                    onGoToNewBookingWithDate={data.handleGoToNewBookingWithDate}
                />;
            case 'expenses':
                return <Expenses 
                    bookings={data.bookings} 
                    allExpenses={data.allExpenses}
                    addToast={data.addToast} 
                    bookingToPreselect={data.bookingToPreselect}
                    onClearPreselect={() => data.setBookingToPreselect(null)}
                    onAddExpense={data.handleAddExpense}
                    onRevertExpense={data.handleRevertExpense}
                    expenseCategories={data.expenseCategories}
                    vendors={data.vendors}
                    onViewBooking={data.handleViewBooking}
                />;
            case 'analytics':
                return <Analytics 
                    bookings={data.bookings} 
                    allExpenses={data.allExpenses} 
                    addToast={data.addToast} 
                    setActiveTab={data.setActiveTab}
                    onGoToBookingsWithFilter={data.handleGoToBookingsWithFilter}
                />;
            case 'control-center':
                if (user?.role !== 'admin') return <div className="text-center p-10 text-red-500">Access Denied. Admin only.</div>;
                return <ControlCenter 
                    packages={data.packages} 
                    setPackages={data.setPackages} 
                    servicesConfig={data.servicesConfig} 
                    setServicesConfig={data.setServicesConfig}
                    expenseCategories={data.expenseCategories}
                    setExpenseCategories={data.setExpenseCategories}
                    vendors={data.vendors}
                    setVendors={data.setVendors}
                    addToast={data.addToast}
                />;
            case 'accounts':
                if (user?.role !== 'admin' && user?.role !== 'manager') return <div className="text-center p-10 text-red-500">Access Denied. Manager/Admin only.</div>;
                return <Accounts 
                    transactions={data.allTransactions} 
                    expenseCategories={data.expenseCategories}
                    vendors={data.vendors}
                    currentSeason={data.currentSeason}
                    availableSeasons={data.availableSeasons}
                    bookings={data.bookings}
                    onViewBooking={data.handleViewBooking}
                    bookingToPreselect={data.bookingToPreselectInAccounts}
                    onClearPreselect={() => data.setBookingToPreselectInAccounts(null)}
                />;
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-2 md:p-5">
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-bold text-gray-500">Logged in as: {user?.displayName} ({user?.role})</span>
                <button onClick={logout} className="text-xs text-red-600 hover:underline">Logout</button>
            </div>
            <Header bookings={data.bookings} currentSeason={data.currentSeason} setCurrentSeason={data.setCurrentSeason} />
            <TabNavigation tabs={TABS} activeTab={data.activeTab} setActiveTab={data.setActiveTab} />
            <main className="bg-white p-4 sm:p-8 rounded-2xl border-2 border-[#cd853f] shadow-lg min-h-[400px]">
                {renderContent()}
            </main>
            <ToastContainer toasts={data.toasts} removeToast={data.removeToast} />
            {data.viewingBooking && (
                <BookingDetailModal
                    booking={data.viewingBooking}
                    isOpen={!!data.viewingBooking}
                    onClose={() => data.setViewingBooking(null)}
                    servicesConfig={data.servicesConfig}
                    onAddPayment={data.handleAddPayment}
                    onRevertPayment={data.handleRevertPayment}
                />
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    );
};

export default App;
