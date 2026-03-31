import React from 'react';
import { Listing } from '../types';
import { Heart, MapPin, FileText, Video, Music } from 'lucide-react';

interface Props {
  listing: Listing;
  onHover: (id: string | null) => void;
  onClick: (listing: Listing) => void;
  isFavorite: boolean;
  onToggleFavorite: (listing: Listing) => void;
}

export const ListingCard: React.FC<Props> = ({ listing, onHover, onClick, isFavorite, onToggleFavorite }) => {
  const isImage = listing.imageUrl.match(/\.(jpeg|jpg|gif|png|svg)$/i) != null || listing.imageUrl.includes('image');
  const isVideo = listing.imageUrl.match(/\.(mp4|webm|ogg)$/i) != null || listing.imageUrl.includes('video');
  const isAudio = listing.imageUrl.match(/\.(mp3|wav|ogg)$/i) != null || listing.imageUrl.includes('audio');

  return (
    <div 
      className="group relative flex flex-col gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(listing)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-sm group-hover:shadow-xl transition-all duration-500">
        {isImage ? (
          <img 
            src={listing.imageUrl} 
            alt={listing.title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
        ) : isVideo ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
            <Video className="w-12 h-12 opacity-50" />
          </div>
        ) : isAudio ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">
            <Music className="w-12 h-12 opacity-50" />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">
            <FileText className="w-12 h-12 opacity-50" />
          </div>
        )}
        
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(listing); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-white transition-all shadow-sm active:scale-90 z-10"
        >
          <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-[15px] text-gray-900 line-clamp-1 group-hover:text-black transition-colors">{listing.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm font-bold">★</span>
            <span className="text-sm font-medium">{listing.rating || '5.0'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{listing.location || 'Location not specified'}</span>
        </div>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-extrabold text-gray-900 text-base">{listing.currency}{listing.price}</span>
          <span className="text-gray-500 text-sm font-medium">/ {listing.period}</span>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
