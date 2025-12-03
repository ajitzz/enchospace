
import React, { useEffect, useState } from 'react';
import { Listing } from '../types';
import { ShieldCheck } from './Icons';

interface Props {
    listing: Listing;
    onComplete: () => void;
}

const BookingSuccessAnimation: React.FC<Props> = ({ listing, onComplete }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 0, // Start invisible, fade in fast
        zIndex: 100,
    });

    useEffect(() => {
        // Initial fade in
        requestAnimationFrame(() => {
             setStyle(prev => ({ ...prev, opacity: 1 }));
             
             // Start movement after a brief pause
             setTimeout(() => {
                 const isMobile = window.innerWidth < 768;
                 
                 // Coordinates for the "Reserves" button (Desktop) or "Menu" (Mobile)
                 // These are approximate fixed positions relative to the viewport
                 // Desktop: Reserves button is roughly ~150px from right, ~40px from top
                 // Mobile: Menu button is ~24px from right, ~40px from top
                 const targetTop = 40; 
                 const targetRight = isMobile ? 30 : 180; 
                 const targetLeft = window.innerWidth - targetRight;

                 setStyle({
                     position: 'fixed',
                     top: `${targetTop}px`,
                     left: `${targetLeft}px`,
                     transform: 'translate(-50%, -50%) scale(0.05)',
                     opacity: 0,
                     zIndex: 100,
                     transition: 'all 1.0s cubic-bezier(0.16, 1, 0.3, 1)'
                 });
             }, 400); // Wait 400ms to show the card in center first
        });

        // Cleanup
        const timer = setTimeout(onComplete, 1400);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div 
            style={style}
            className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] border border-gray-100 w-64 pointer-events-none"
        >
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3">
                <img src={listing.imageUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-[#E31C5F]/80 backdrop-blur-[2px] flex items-center justify-center animate-pulse">
                    <ShieldCheck className="w-10 h-10 text-white" />
                </div>
            </div>
            <div className="w-full text-center">
                <div className="text-[#E31C5F] font-bold text-xs uppercase tracking-wider mb-1">Confirmed</div>
                <div className="text-gray-900 font-bold text-sm truncate">{listing.title}</div>
            </div>
        </div>
    );
};

export default BookingSuccessAnimation;
