import React from 'react';
import { Listing } from '../types';

interface Props {
  listing: Listing;
  onBack: () => void;
  similarListings: Listing[];
  onListingClick: (listing: Listing) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBook: (listing: Listing, details: any) => void;
}

export default function ListingDetails({ listing, onBack, onBook }: Props) {
  const images = listing.images || [listing.imageUrl];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:underline">&larr; Back to Search</button>
      <h1 className="text-3xl font-extrabold mb-4">{listing.title}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {images.map((url, i) => {
          const isImage = url.match(/\.(jpeg|jpg|gif|png|svg)$/i) != null || url.includes('image');
          const isVideo = url.match(/\.(mp4|webm|ogg)$/i) != null || url.includes('video');
          const isAudio = url.match(/\.(mp3|wav|ogg)$/i) != null || url.includes('audio');
          
          if (isImage) {
            return <img key={i} src={url} alt={`Property ${i}`} className="w-full h-64 object-cover rounded-lg shadow-md" />;
          } else if (isVideo) {
            return <video key={i} src={url} controls className="w-full h-64 object-cover rounded-lg shadow-md" />;
          } else if (isAudio) {
            return <audio key={i} src={url} controls className="w-full mt-4" />;
          } else {
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full h-64 bg-gray-100 rounded-lg shadow-md text-blue-600 hover:underline p-4 text-center break-all">
                View Document: {url.split('/').pop()}
              </a>
            );
          }
        })}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Description</h2>
        <p className="text-gray-700 leading-relaxed">{listing.description || 'No description available.'}</p>
      </div>

      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Price</p>
          <p className="text-3xl font-extrabold text-gray-900">{listing.currency}{listing.price} <span className="text-lg font-medium text-gray-500">/ {listing.period}</span></p>
        </div>
        <button 
          onClick={() => onBook(listing, { moveInDate: new Date().toISOString(), configuration: 'Standard', name: 'Guest', phone: '1234567890', totalRent: listing.price })}
          className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
