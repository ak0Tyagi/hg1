import React, { useMemo } from 'react';
import { Booking } from '../types';

interface HeaderProps {
    bookings: Booking[];
    currentSeason: string;
    setCurrentSeason: (season: string) => void;
}

const Header: React.FC<HeaderProps> = ({ bookings, currentSeason, setCurrentSeason }) => {
    const seasonBookingsCount = useMemo(() => {
        if (currentSeason === 'All') {
            return bookings.length;
        }
        return bookings.filter(b => b.season === currentSeason).length;
    }, [bookings, currentSeason]);

    const availableSeasons = useMemo(() => {
        const seasons = new Set(bookings.map(b => b.season));
        seasons.add('2024-25');
        seasons.add('2025-26');
        seasons.add('2026-27');
        return ['All', ...Array.from(seasons).sort()];
    }, [bookings]);

    return (
        <header className="bg-gradient-to-br from-[#8b4513] to-[#d2691e] p-4 sm:p-6 md:p-8 rounded-2xl mb-5 sm:mb-8 border-4 border-[#cd853f] shadow-2xl text-center text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-shadow-lg tracking-wide">Heritage Grand</h1>
            <p className="text-md sm:text-xl italic mt-2 opacity-95">Where Memories Are Made</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-8 mt-4 text-sm opacity-90">
                <span>📞 +91 98765 43210</span>
                <span>✉️ info@heritagegrand.com</span>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3 bg-white/10 p-4 rounded-xl border-2 border-white/20">
                <span className="text-lg font-bold opacity-90">🌟 Season:</span>
                <select 
                    value={currentSeason} 
                    onChange={(e) => setCurrentSeason(e.target.value)}
                    className="py-2 px-3 rounded-lg border-2 border-[#cd853f] font-bold bg-white text-[#8b4513] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#cd853f]"
                >
                    {availableSeasons.map(season => (
                        <option key={season} value={season}>{season === 'All' ? 'All Seasons' : season}</option>
                    ))}
                </select>
                <span className="py-1 px-3 rounded-lg border border-white/20 bg-white/15 text-sm">
                    {seasonBookingsCount} bookings
                </span>
            </div>
        </header>
    );
};

export default Header;
