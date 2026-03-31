import React from 'react';
import { Listing } from '../types';
import ListingCard from './ListingCard';

interface Props {
  reservations: Listing[];
  onBack: () => void;
  onListingClick: (listing: Listing) => void;
}

export default function ReservationsPage({ reservations, onBack, onListingClick }: Props) {
  return (
    <div className="max-w-7xl mx-auto p-6 mt-8">
      <button onClick={onBack} className="mb-6 text-blue-600 hover:underline font-medium">&larr; Back to Search</button>
      <h1 className="text-4xl font-extrabold mb-8">Your Reservations</h1>
      {reservations.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <p className="text-xl text-gray-500">You have no reservations yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reservations.map(r => (
            <ListingCard 
              key={r.id} 
              listing={r} 
              onHover={() => {}} 
              onClick={onListingClick} 
              isFavorite={false} 
              onToggleFavorite={() => {}} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
