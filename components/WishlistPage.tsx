import React from 'react';
import { Listing } from '../types';
import ListingCard from './ListingCard';
import { ChevronLeft, HeartIcon } from './Icons';

interface WishlistPageProps {
  favorites: Listing[];
  onBack: () => void;
  onListingClick: (listing: Listing) => void;
  onToggleFavorite: (listing: Listing) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ favorites, onBack, onListingClick, onToggleFavorite }) => {
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-full transition-all group font-semibold"
            >
                <div className="p-1.5 rounded-full bg-gray-100 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-200">
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <span>Back to explore</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 hidden md:block">Your Wishlist</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Wishlist</h1>
            <p className="text-gray-500 text-lg">{favorites.length} {favorites.length === 1 ? 'home' : 'homes'} saved</p>
        </div>

        {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
                    <HeartIcon className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No saves yet</h2>
                <p className="text-gray-500 max-w-sm mb-8">As you search, click the heart icon to save your favorite places and they will appear here.</p>
                <button 
                    onClick={onBack}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform active:scale-95"
                >
                    Start exploring
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favorites.map((listing) => (
                    <ListingCard 
                        key={listing.id} 
                        listing={listing} 
                        onClick={onListingClick}
                        isFavorite={true}
                        onToggleFavorite={() => onToggleFavorite(listing)}
                    />
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default WishlistPage;