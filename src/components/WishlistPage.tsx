import React from 'react';
import { Listing } from '../types';
import ListingCard from './ListingCard';

interface Props {
  favorites: Listing[];
  onBack: () => void;
  onListingClick: (listing: Listing) => void;
  onToggleFavorite: (listing: Listing) => void;
}

export default function WishlistPage({ favorites, onBack, onListingClick, onToggleFavorite }: Props): React.ReactElement {
  return (
    <div className="max-w-7xl mx-auto p-6 mt-8">
      <button onClick={onBack} className="mb-6 text-blue-600 hover:underline font-medium">&larr; Back to Search</button>
      <h1 className="text-4xl font-extrabold mb-8">Your Wishlist</h1>
      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <p className="text-xl text-gray-500">Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map(f => (
            <ListingCard 
              key={f.id} 
              listing={f} 
              onHover={() => {}} 
              onClick={onListingClick} 
              isFavorite={true} 
              onToggleFavorite={onToggleFavorite} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
