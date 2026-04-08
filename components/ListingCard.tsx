import React, { useState, useRef } from 'react';
import { Listing } from '../types';
import { ChevronRight, ChevronLeft, ShieldCheck, StarIcon, HeartIcon, InfoIcon, MapIcon, EyeIcon } from './Icons';

interface ListingCardProps {
  listing: Listing;
  onHover?: (id: string | null) => void;
  onClick?: (listing: Listing) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (listing: Listing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onHover, onClick, isFavorite = false, onToggleFavorite }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  // Fix: Use ReturnType<typeof setInterval> instead of NodeJS.Timeout to avoid namespace error
  const slideInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Deterministic images
  const images = Array.from({ length: listing.imageCount }).map(
    (_, i) => `${listing.imageUrl}?random=${i}`
  );

  const startSlide = () => {
    slideInterval.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 2000); // Auto-slide every 2s on hover
  };

  const stopSlide = () => {
    if (slideInterval.current) clearInterval(slideInterval.current);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(listing.id);
    startSlide();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
    stopSlide();
    setCurrentImageIndex(0); // Reset on leave for cleanliness
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopSlide(); // Stop auto-slide if user manually interacts
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopSlide();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
        className="group flex flex-col cursor-pointer bg-white rounded-2xl transition-all duration-500 hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-1 relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onClick?.(listing)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 isolate">
        <img 
            src={images[currentImageIndex]} 
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            loading="lazy"
        />
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Favorite Button */}
        <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                onToggleFavorite?.(listing);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/10 hover:bg-white/20 backdrop-blur-md active:scale-90 transition-all z-20 group/heart"
        >
            <HeartIcon className={`w-5 h-5 transition-colors ${isFavorite ? 'text-[#E31C5F] fill-[#E31C5F]' : 'text-white group-hover/heart:scale-110'}`} filled={isFavorite} />
        </button>

        {/* Tags */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
            {listing.isVerified && (
                 <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 self-start">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span className="text-[10px] font-bold tracking-wider text-gray-800 uppercase">Verified</span>
                 </div>
            )}
            {listing.discount && (
                 <div className="bg-[#E31C5F]/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm text-white self-start">
                    <span className="text-[10px] font-bold tracking-wider uppercase">-{listing.discount}% Off</span>
                 </div>
            )}
        </div>

        {/* Navigation Arrows - Hidden on mobile, visible on group hover for desktop */}
        <div className={`hidden md:flex absolute inset-x-2 top-1/2 -translate-y-1/2 justify-between pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
             <button onClick={prevImage} className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto transform transition-transform hover:scale-110 active:scale-95">
                <ChevronLeft className="w-4 h-4 text-gray-900" />
             </button>
             <button onClick={nextImage} className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto transform transition-transform hover:scale-110 active:scale-95">
                <ChevronRight className="w-4 h-4 text-gray-900" />
             </button>
        </div>

        {/* Dots Pagination */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-20">
            {images.slice(0, 5).map((_, i) => (
                <div 
                    key={i} 
                    className={`
                        h-1.5 rounded-full shadow-sm transition-all duration-300 
                        ${i === (currentImageIndex % 5) ? 'bg-white w-4' : 'bg-white/50 w-1.5'}
                    `}
                />
            ))}
        </div>
      </div>

      {/* Content */}
      <div className="pt-4 px-1 pb-2 flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-900 truncate text-lg pr-2 leading-tight group-hover:text-[#E31C5F] transition-colors">
                {listing.title}
            </h3>
            <div className="flex items-center gap-1 text-sm font-semibold bg-gray-50 px-1.5 py-0.5 rounded-md">
                <StarIcon className="w-3.5 h-3.5 text-orange-400 fill-current" />
                <span>{listing.rating?.toFixed(1)}</span>
            </div>
        </div>
        
        <div className="text-gray-500 text-sm truncate flex items-center gap-2">
            <span>{listing.type}</span>
            <span className="w-0.5 h-0.5 bg-gray-400 rounded-full"></span>
            <span>{listing.amenities?.slice(0, 2).join(", ")}</span>
        </div>

        <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-bold text-gray-900 text-xl">
                {listing.currency}{listing.price.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm font-medium">
                /{listing.period}
            </span>
        </div>

        {/* CTA Bottom Bar - Appears on Hover (Desktop Only) */}
        {/* On mobile, this is hidden because hover doesn't exist. User taps card to view. */}
        <div className={`
            hidden md:flex mt-3 pt-3 border-t border-gray-100 items-center justify-between text-xs font-medium text-gray-600
            transition-all duration-300 overflow-hidden
            ${isHovered ? 'max-h-12 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}
        `}>
            <button className="flex flex-col items-center gap-1 hover:text-[#E31C5F] transition-colors p-1">
                <InfoIcon className="w-4 h-4" />
                <span>Info</span>
            </button>
            <button className="flex flex-col items-center gap-1 hover:text-[#E31C5F] transition-colors p-1">
                <MapIcon className="w-4 h-4" />
                <span>Map</span>
            </button>
            <button className="flex flex-col items-center gap-1 hover:text-[#E31C5F] transition-colors p-1">
                <EyeIcon className="w-4 h-4" />
                <span>Details</span>
            </button>
            <button 
                className="bg-[#E31C5F] hover:bg-[#C90E4F] text-white px-4 py-1.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(listing);
                }}
            >
                View
            </button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;