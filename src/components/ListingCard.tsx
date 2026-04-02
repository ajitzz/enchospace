import React from 'react';
import { motion } from 'motion/react';
import { Listing } from '../types';
import { Heart, MapPin, FileText, Video, Music, Star } from 'lucide-react';

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
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="group relative flex flex-col gap-4 cursor-pointer"
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(listing)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-gray-100 shadow-sm group-hover:shadow-2xl group-hover:shadow-black/10 transition-all duration-500">
        {isImage ? (
          <img 
            src={listing.imageUrl} 
            alt={listing.title} 
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
        ) : isVideo ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
            <Video className="w-12 h-12 opacity-50 animate-pulse" />
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
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
            {listing.isVerified && (
                <div className="glass px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    Verified
                </div>
            )}
            {listing.discount > 0 && (
                <div className="bg-brand text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">
                    -{listing.discount}% OFF
                </div>
            )}
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(listing); }}
          className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-xl transition-all duration-300 shadow-lg active:scale-75 z-10 ${isFavorite ? 'bg-brand text-white' : 'bg-white/80 hover:bg-white text-gray-600'}`}
        >
          <Heart className={`w-5 h-5 transition-transform duration-300 ${isFavorite ? 'fill-white scale-110' : 'group-hover:scale-110'}`} />
        </button>

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
            <div className="glass px-6 py-3 rounded-full text-sm font-bold text-gray-900 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
                View Details
            </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-lg text-gray-900 line-clamp-1 group-hover:text-brand transition-colors duration-300 tracking-tight">{listing.title}</h3>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                <MapPin className="w-3 h-3 text-brand" />
                <span className="truncate">{listing.location || 'Location not specified'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-black text-gray-900">{listing.rating || '5.0'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-1">
            <div className="flex items-baseline gap-1.5">
                <span className="font-black text-2xl text-gray-900 tracking-tighter">{listing.currency}{listing.price}</span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">/ {listing.period}</span>
            </div>
            <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-900 flex items-center justify-center text-[8px] font-black text-white">
                    +12
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;
