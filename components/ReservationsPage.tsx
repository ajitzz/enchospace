
import React from 'react';
import { Listing } from '../types';
import { ChevronLeft, CalendarIcon, ChevronRight, PhoneIcon } from './Icons';

interface Reservation {
  id: string;
  listing: Listing;
  moveInDate: string;
  configuration: string;
  name: string;
  phone: string;
  totalRent: number;
  bookingDate: string;
}

interface ReservationsPageProps {
  reservations: Reservation[];
  onBack: () => void;
  onListingClick: (listing: Listing) => void;
}

const ReservationsPage: React.FC<ReservationsPageProps> = ({ reservations, onBack, onListingClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in font-sans">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-900 hover:bg-black/5 px-3 py-2 rounded-full transition-all group font-semibold"
            >
                <div className="p-1.5 rounded-full bg-gray-100 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-200 shadow-sm">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <span className="text-sm">Back</span>
            </button>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight hidden md:block">Your Reservations</h1>
            <div className="w-16"></div> {/* Spacer */}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="flex items-end justify-between mb-8">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bookings</h1>
                <p className="text-gray-500 mt-1 text-sm font-medium">{reservations.length} active {reservations.length === 1 ? 'reservation' : 'reservations'}</p>
            </div>
        </div>

        {reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300 ring-8 ring-gray-50/50">
                    <CalendarIcon className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No upcoming stays</h2>
                <p className="text-gray-400 max-w-xs mb-8 text-sm">Your confirmed bookings will appear here. Start exploring to find your next home.</p>
                <button 
                    onClick={onBack}
                    className="bg-black text-white px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform active:scale-95 shadow-lg"
                >
                    Start exploring
                </button>
            </div>
        ) : (
            <div className="flex flex-col gap-5">
                {reservations.map((reservation) => (
                    <div 
                        key={reservation.id} 
                        className="group relative bg-white rounded-[2rem] p-4 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:border-gray-200 transition-all duration-500 ease-out flex flex-col md:flex-row gap-6 items-start"
                    >
                        {/* Image Thumbnail with Hover Zoom */}
                        <div 
                            className="w-full md:w-48 aspect-[16/10] md:aspect-[4/3] flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100 cursor-pointer relative isolate"
                            onClick={() => onListingClick(reservation.listing)}
                        >
                            <img 
                                src={reservation.listing.imageUrl} 
                                alt={reservation.listing.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Inner Border for contrast */}
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl z-10"></div>
                            
                            {/* Mobile Status Overlay */}
                            <div className="absolute top-3 left-3 md:hidden">
                                <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wide">Confirmed</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0 w-full flex flex-col h-full justify-between">
                            <div>
                                {/* Top Row: Title & Price */}
                                <div className="flex justify-between items-start mb-1">
                                    <div className="min-w-0 mr-4">
                                         <h3 
                                            className="font-bold text-gray-900 text-lg md:text-xl leading-snug truncate cursor-pointer group-hover:text-[#E31C5F] transition-colors"
                                            onClick={() => onListingClick(reservation.listing)}
                                        >
                                            {reservation.listing.title}
                                        </h3>
                                        <p className="text-sm font-medium text-gray-500 truncate">{reservation.listing.address}</p>
                                    </div>
                                    {/* Price Pill */}
                                     <div className="text-right flex-shrink-0">
                                        <div className="font-extrabold text-gray-900 text-lg tracking-tight">{reservation.listing.currency}{reservation.totalRent.toLocaleString()}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">/month</div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px w-full border-t border-dashed border-gray-200 my-4"></div>

                                {/* Meta Grid */}
                                <div className="flex flex-wrap items-center gap-y-4 gap-x-8 md:gap-x-12 mb-5">
                                    {/* Date */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Move-in</span>
                                        <span className="text-sm font-semibold text-gray-800">
                                            {new Date(reservation.moveInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    {/* Config */}
                                     <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unit</span>
                                        <span className="text-sm font-semibold text-gray-800">{reservation.configuration}</span>
                                    </div>
                                    {/* Desktop Status Indicator */}
                                     <div className="hidden md:flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                                            </span>
                                            <span className="text-xs font-bold text-[#10B981] bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">Confirmed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Support & Actions Footer */}
                            <div className="mt-2 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-2 rounded-lg max-w-full sm:max-w-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0"></div>
                                    <span className="text-xs font-medium text-gray-600 leading-tight">Our team will reach out to you shortly for assistance.</span>
                                </div>
                                
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                     <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl transition-colors text-xs font-bold border border-gray-200 hover:border-gray-300">
                                        <PhoneIcon className="w-4 h-4" />
                                        <span>Call</span>
                                     </button>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default ReservationsPage;
