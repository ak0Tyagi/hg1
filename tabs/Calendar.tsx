
import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Tab } from '../types';
import CompactBookingCard from '../components/CompactBookingCard';
import { downloadAsCSV, printHtmlAsPDF } from '../utils/download';

interface CalendarProps {
    bookings: Booking[];
    setActiveTab: (tab: Tab) => void;
    currentSeason: string;
    availableSeasons: string[];
    addToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
    onViewBooking: (booking: Booking) => void;
    onGoToNewBookingWithDate: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ bookings, setActiveTab, currentSeason, availableSeasons, addToast, onViewBooking, onGoToNewBookingWithDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [seasonFilter, setSeasonFilter] = useState(currentSeason);

    useEffect(() => {
        setSeasonFilter(currentSeason);
    }, [currentSeason]);
    
    const seasonBookings = useMemo(() => {
        if (seasonFilter === 'All') return bookings;
        return bookings.filter(b => b.season === seasonFilter);
    }, [bookings, seasonFilter]);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startingDay = firstDayOfMonth.getDay();

    const daysInMonth = useMemo(() => {
        const days = [];
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            // Create dates in Local Time, not UTC
            days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
        }
        return days;
    }, [currentDate, startingDay, lastDayOfMonth]);

    const bookingsByDate = useMemo(() => {
        const map = new Map<string, Booking[]>();
        seasonBookings.forEach(booking => {
            if (booking.status === 'Cancelled') return;
            // Booking.eventDate is already YYYY-MM-DD string
            const dateStr = booking.eventDate;
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            const dayBookings = map.get(dateStr)!;
            dayBookings.push(booking);
            dayBookings.sort((a, b) => a.shift === 'Day' ? -1 : 1);
            map.set(dateStr, dayBookings);
        });
        return map;
    }, [seasonBookings]);

    const nextUpcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        return bookings
            .filter(b => {
                if (b.status !== 'Upcoming') return false;
                const eventDate = new Date(b.eventDate); // This is treated as UTC
                return eventDate >= today;
            })
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
            .slice(0, 8); // Get the next 8 events
    }, [bookings]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
        setSelectedDate(null);
    };

    // Helper to get YYYY-MM-DD from a local Date object without timezone shift
    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const selectedDayBookings = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = getLocalDateString(selectedDate);
        return bookingsByDate.get(dateStr) || [];
    }, [selectedDate, bookingsByDate]);
    
    const handleDayClick = (day: Date) => {
      setSelectedDate(day);
    }
    
    const handleUpcomingEventClick = (booking: Booking) => {
        const eventDate = new Date(booking.eventDate);
        setCurrentDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
        // Note: Booking dates are stored as YYYY-MM-DD. When converting to Date object, 
        // we need to be careful. However, for highlighting the calendar month, standard Date is fine.
        setSelectedDate(eventDate);
    };
    
    const handleCreateBookingForDate = (date: Date | null) => {
        if (date) {
            // FIX: Use manual string construction to guarantee local date matches visual selection
            // This prevents "previous day" bugs caused by UTC timezone conversion
            const localDateString = getLocalDateString(date);
            
            onGoToNewBookingWithDate(localDateString);
        } else {
            addToast('Please select a date first.', 'warning');
        }
    };

    // Formatter for displaying dates in the UI
    const formatSelectedDate = (date: Date) => {
        // Since selectedDate is a Local Date object (from grid click), we format it normally
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateStr = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
             weekday: undefined,
             year: 'numeric',
             month: 'short',
             day: 'numeric',
             timeZone: 'UTC' // Booking strings are UTC-based
        });
    };
    
    // --- DOWNLOAD FUNCTIONALITY ---

    const handleDownloadEventsCSV = () => {
        addToast('Generating CSV...', 'info');
        const headers = ['Event Date', 'Client Name', 'Event Type', 'Shift', 'Status', 'Booking ID'];
        const data = seasonBookings
            .filter(b => b.status !== 'Cancelled')
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
            .map(b => [b.eventDate, b.clientName, b.eventType, b.shift, b.status, b.bookingId]);
        
        downloadAsCSV(headers, data, `Calendar_Events_${seasonFilter}`);
    };

    const generateMonthHTML = (date: Date) => {
        const monthName = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        const firstDay = new Date(year, date.getMonth(), 1).getDay();
        const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
    
        let dayCells = '';
        for (let i = 0; i < firstDay; i++) {
            dayCells += '<td></td>';
        }
    
        for (let i = 1; i <= daysInMonth; i++) {
            if ((i + firstDay - 1) % 7 === 0) {
                dayCells += '</tr><tr>';
            }
            const dayDate = new Date(year, date.getMonth(), i);
            const dateStr = getLocalDateString(dayDate);
            const bookingsOnDay = bookingsByDate.get(dateStr) || [];
            
            let cellContent = `<div class="day-number">${i}</div>`;
            if (bookingsOnDay.length > 0) {
                cellContent += bookingsOnDay.map(b => `<div class="event">${b.shift === 'Day' ? '☀️' : '🌙'} ${b.clientName}</div>`).join('');
            }
    
            let cellClass = 'day';
            if (bookingsOnDay.length === 1) cellClass += ' partial';
            if (bookingsOnDay.length >= 2) cellClass += ' full';
    
            dayCells += `<td class="${cellClass}">${cellContent}</td>`;
        }
    
        return `
            <div class="month-container">
                <h2>${monthName} ${year}</h2>
                <table>
                    <thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead>
                    <tbody><tr>${dayCells}</tr></tbody>
                </table>
            </div>
        `;
    };

    const handleDownloadMonthPDF = () => {
        addToast('Generating PDF...', 'info');
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        const year = currentDate.getFullYear();
        const monthHTML = generateMonthHTML(currentDate);

        const fullHTML = `
            <html>
            <head>
                <title>Calendar - ${monthName} ${year}</title>
                <style>
                    @page { size: A4 landscape; margin: 1cm; }
                    body { font-family: sans-serif; }
                    h1 { text-align: center; color: #8b4513; }
                    .month-container h2 { text-align: center; font-size: 1.5em; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; width: 14.28%; height: 50px; vertical-align: top; padding: 4px; }
                    th { background-color: #f4f1eb; font-size: 0.8em; }
                    .day-number { font-weight: bold; font-size: 0.9em; }
                    .event { font-size: 0.6em; line-height: 1.2; background-color: #f0f0f0; border-radius: 3px; padding: 2px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    td.partial { background-color: #fffbe6; }
                    td.full { background-color: #ffebee; }
                </style>
            </head>
            <body>
                <h1>Heritage Grand - Monthly Calendar</h1>
                ${monthHTML}
            </body>
            </html>
        `;
        printHtmlAsPDF(fullHTML, `Calendar_${monthName}_${year}`);
    };

    const handleDownloadYearPDF = () => {
        addToast('Generating Annual PDF... This may take a moment.', 'info');
        const year = currentDate.getFullYear();
        let yearHTML = '';
        for (let i = 0; i < 12; i++) {
            yearHTML += generateMonthHTML(new Date(year, i, 1));
        }

        const fullHTML = `
            <html>
            <head>
                <title>Annual Calendar - ${year}</title>
                 <style>
                    @page { size: A4 portrait; margin: 1cm; }
                    body { font-family: sans-serif; }
                    h1 { text-align: center; color: #8b4513; }
                    .year-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
                    .month-container { break-inside: avoid; }
                    .month-container h2 { text-align: center; font-size: 1em; margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                    th, td { border: 1px solid #ddd; text-align: center; padding: 1px; font-size: 6pt; }
                    th { background-color: #f4f1eb; }
                    .day-number { font-weight: bold; }
                    .event { display: none; } /* Hide event details for year view */
                    td.partial { background-color: #fffbe6 !important; }
                    td.full { background-color: #ffebee !important; }
                </style>
            </head>
            <body>
                <h1>Heritage Grand - Annual Calendar ${year}</h1>
                <div class="year-grid">${yearHTML}</div>
            </body>
            </html>
        `;
        printHtmlAsPDF(fullHTML, `Annual_Calendar_${year}`);
    };

    const renderSidePanel = () => {
        return (
            <div className="flex flex-col h-full space-y-4">
                {/* Partition 1: Selected Day Details */}
                <div className="p-4 bg-white rounded-xl border-2 border-[#f0e6d2] shadow-lg flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-[#8b4513] mb-3 pb-2 border-b border-orange-200">
                        Details for {selectedDate ? formatSelectedDate(selectedDate) : '...'}
                    </h3>
                    <div className="flex-grow">
                        {selectedDate ? (
                            selectedDayBookings.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedDayBookings.map(b => (
                                        <CompactBookingCard 
                                            key={b.bookingId} 
                                            booking={b} 
                                            onClick={() => onViewBooking(b)} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-6">
                                    <p className="font-semibold text-gray-700">✨ This day is available!</p>
                                    <button onClick={() => handleCreateBookingForDate(selectedDate)} className="btn-success mt-4">➕ Book for this Date</button>
                                </div>
                            )
                        ) : (
                            <div className="text-center text-gray-500 p-6">
                                <p>Select a day on the calendar to see details.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Partition 2: Upcoming Events */}
                <div className="p-4 bg-white rounded-xl border-2 border-[#f0e6d2] shadow-lg flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-[#8b4513] mb-3 pb-2 border-b border-orange-200">
                        Next Upcoming Events
                    </h3>
                    <div className="overflow-y-auto flex-grow">
                        {nextUpcomingEvents.length > 0 ? (
                            <div className="space-y-2">
                                {nextUpcomingEvents.map(b => (
                                    <button key={b.bookingId} onClick={() => handleUpcomingEventClick(b)} className="w-full text-left p-2 rounded-lg hover:bg-gray-100 transition">
                                        <p className="font-bold text-sm text-gray-800">{b.clientName}</p>
                                        <p className="text-xs text-gray-500">{formatDateStr(b.eventDate)}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 p-6">
                                <p>No upcoming events scheduled.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Calendar Main Section */}
            <div className="lg:col-span-2 p-2 sm:p-6 bg-white rounded-xl border-2 border-[#f0e6d2] shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 flex-wrap gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#8b4513]">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => changeMonth(-1)} className="btn-secondary">← Prev</button>
                        <button onClick={() => changeMonth(1)} className="btn-secondary">Next →</button>
                    </div>
                </div>

                 {/* Filters and Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg border mb-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="season-filter" className="font-bold text-sm">Season:</label>
                        <select id="season-filter" value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)} className="py-1 px-2 text-sm rounded-md border-gray-300 border">
                            {availableSeasons.map(s => <option key={s} value={s}>{s === 'All' ? 'All Seasons' : s}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                        <button onClick={handleDownloadEventsCSV} className="btn-secondary text-sm !py-1.5">📄 Events (Excel)</button>
                        <button onClick={handleDownloadMonthPDF} className="btn-secondary text-sm !py-1.5">🖨️ Month (PDF)</button>
                        <button onClick={handleDownloadYearPDF} className="btn-secondary text-sm !py-1.5">🖨️ Year (PDF)</button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-600 text-xs sm:text-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`} className="border rounded-lg bg-gray-50 aspect-square"></div>;

                        // FIX: Use manual local date string construction for lookup key
                        const dateStr = getLocalDateString(day);
                        
                        const dayBookings = bookingsByDate.get(dateStr) || [];
                        const isSelected = selectedDate && day.getTime() === selectedDate.getTime();
                        
                        let cellClass = 'border-gray-200 hover:border-blue-400';
                        if (dayBookings.length === 1) cellClass = 'bg-yellow-100 border-yellow-300 hover:border-yellow-500';
                        if (dayBookings.length >= 2) cellClass = 'bg-red-100 border-red-300 hover:border-red-500';
                        if (isSelected) cellClass += ' ring-2 ring-blue-500 ring-offset-2';

                        return (
                            <div key={day.toString()} onClick={() => handleDayClick(day)} className={`p-1 sm:p-1.5 border rounded-lg aspect-square transition cursor-pointer text-xs ${cellClass}`}>
                                <div className="font-bold text-gray-800 text-center text-xs sm:text-base">{day.getDate()}</div>
                                <div className="space-y-0.5 mt-1 overflow-hidden hidden sm:block">
                                    {dayBookings.map(b => (
                                        <div key={b.bookingId} className="text-[10px] leading-tight font-semibold p-0.5 rounded bg-white/60 truncate">
                                            {b.shift === 'Day' ? '☀️' : '🌙'} {b.clientName}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Side Panel */}
            <div className="lg:col-span-1">
                {renderSidePanel()}
            </div>
        </div>
    );
};

export default Calendar;
