
import React, { useState } from 'react';
import { Listing } from '../types';
import { StarIcon, HeartIcon } from './Icons';

interface MapSidebarProps {
  listings: Listing[];
  highlightedId: string | null;
  className?: string;
}

const MapSidebar: React.FC<MapSidebarProps> = ({ listings, highlightedId, className = "" }) => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  const isInteracting = (id: string) => activeMarkerId === id || highlightedId === id;

  return (
    <div className={`relative bg-gray-50 isolate overflow-hidden shadow-inner ${className}`}>
      
      {/* 1. Map Canvas */}
      <div className="absolute inset-0 bg-[#F3F4F6] w-full h-full">
         {/* Map Layer */}
         <div 
            className="w-full h-full opacity-100 bg-cover bg-center"
            style={{ 
                // High-res, clean light map style
                backgroundImage: "url('https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager/13/4400/2686.png')",
            }}
         />
         {/* Soft gradient overlay for depth */}
         <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
      </div>

      {/* 2. Top Floating Control: "Search as I move" */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-full flex justify-center px-4 pointer-events-none">
        <label className="pointer-events-auto flex items-center gap-3 bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 cursor-pointer hover:scale-105 transition-all active:scale-95 group select-none">
           <div className="relative flex items-center justify-center">
             <input type="checkbox" defaultChecked className="peer w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#E31C5F] checked:border-[#E31C5F] transition-all cursor-pointer" />
             <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
           </div>
           <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Search as I move</span>
        </label>
      </div>

      {/* 3. Floating Controls: Zoom */}
      <div className="absolute right-6 top-6 flex flex-col gap-2 z-30">
        <div className="flex flex-col bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 divide-y divide-gray-100/50 overflow-hidden">
            <button className="p-3.5 hover:bg-gray-50 text-gray-700 transition-colors active:bg-gray-100" title="Zoom in">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button className="p-3.5 hover:bg-gray-50 text-gray-700 transition-colors active:bg-gray-100" title="Zoom out">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
        </div>
      </div>

      {/* 4. Interactive Markers */}
      <div className="absolute inset-0 z-10">
      {listings.map((listing) => {
        const hash = listing.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const top = 20 + (hash % 60) + '%'; 
        const left = 15 + ((hash * 13) % 70) + '%';
        const isActive = isInteracting(listing.id);

        return (
            <div 
                key={listing.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                style={{ top, left, zIndex: isActive ? 100 : 20 }}
                onMouseEnter={() => setActiveMarkerId(listing.id)}
                onMouseLeave={() => setActiveMarkerId(null)}
            >
                {/* Popup Card */}
                <div 
                    className={`
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] 
                        bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-white/50
                        overflow-hidden transition-all duration-300 origin-bottom cubic-bezier(0.2, 0.8, 0.2, 1)
                        ${isActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4 pointer-events-none'}
                    `}
                >
                    <div className="aspect-[16/9] relative">
                         <img src={listing.imageUrl} className="w-full h-full object-cover" alt={listing.title} loading="lazy" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                         <div className="absolute bottom-3 left-3 text-white">
                            <div className="text-xs font-medium opacity-90">{listing.type}</div>
                            <div className="font-bold text-lg leading-none">{listing.currency}{listing.price}</div>
                         </div>
                    </div>
                    <div className="p-4 bg-white">
                         <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1 truncate">{listing.title}</h4>
                         <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                            <StarIcon className="w-3 h-3 text-orange-400 fill-current" />
                            {listing.rating} ({listing.reviewCount})
                         </div>
                    </div>
                </div>

                {/* Price Marker */}
                <button 
                    className={`
                        relative flex items-center justify-center rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] 
                        transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ring-1 ring-black/5
                        ${isActive 
                            ? 'bg-[#E31C5F] text-white px-5 py-2.5 scale-110 z-50' 
                            : 'bg-white text-gray-900 px-3.5 py-1.5 hover:scale-110 hover:shadow-xl'}
                    `}
                >
                    <span className={`font-bold whitespace-nowrap ${isActive ? 'text-sm' : 'text-xs'}`}>
                        {listing.currency}{listing.price}
                    </span>
                </button>
            </div>
        );
      })}
      </div>
    </div>
  );
};

export default MapSidebar;
