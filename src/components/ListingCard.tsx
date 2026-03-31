import React from 'react';
import { Listing } from '../types';

interface Props {
  listing: Listing;
  onHover: (id: string | null) => void;
  onClick: (listing: Listing) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export default function ListingCard({ listing, onHover, onClick, isFavorite, onToggleFavorite }: Props) {
  const isImage = listing.imageUrl.match(/\.(jpeg|jpg|gif|png|svg)$/i) != null || listing.imageUrl.includes('image');

  return (
    <div 
      className="border border-gray-200 rounded-2xl p-4 cursor-pointer hover:shadow-xl transition-shadow bg-white"
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(listing)}
    >
      {isImage ? (
        <img src={listing.imageUrl} alt={listing.title} className="w-full h-48 object-cover rounded-xl mb-4" />
      ) : (
        <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-500 font-medium">
          Document / Media
        </div>
      )}
      <h3 className="font-bold text-lg text-gray-900 truncate">{listing.title}</h3>
      <p className="text-gray-500 text-sm mb-3 truncate">{listing.location || 'Location not specified'}</p>
      <div className="flex items-center justify-between">
        <p className="font-extrabold text-gray-900">{listing.currency}{listing.price} <span className="text-sm font-medium text-gray-500">/ {listing.period}</span></p>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(listing.id); }}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          {isFavorite ? <span className="text-red-500">♥</span> : <span className="text-gray-400">♡</span>}
        </button>
      </div>
    </div>
  );
}
