import React from 'react';
import { Listing } from '../types';
import { Heart, Share2, MapPin, Star, Shield, Clock, Info, CheckCircle2, Music, FileText } from 'lucide-react';

interface Props {
  listing: Listing;
  onBack: () => void;
  similarListings: Listing[];
  onListingClick: (listing: Listing) => void;
  isFavorite: boolean;
  onToggleFavorite: (listing: Listing) => void;
  onBook: (data: any) => void;
}

export default function ListingDetails({ listing, onBack, isFavorite, onToggleFavorite, onBook }: Props) {
  const images = listing.images || [listing.imageUrl];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 bg-white min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-600 hover:text-black font-medium transition-colors"
        >
          <span className="text-xl">←</span> Back to Search
        </button>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onToggleFavorite(listing)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">{listing.title}</h1>
      
      <div className="flex items-center gap-4 mb-8 text-sm font-medium">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-black" />
          <span>{listing.rating || '5.0'}</span>
          <span className="text-gray-400 underline cursor-pointer">12 reviews</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="underline cursor-pointer">{listing.location || 'Location not specified'}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 rounded-3xl overflow-hidden shadow-2xl">
        {images.map((url, i) => {
          const isImage = url.match(/\.(jpeg|jpg|gif|png|svg)$/i) != null || url.includes('image');
          const isVideo = url.match(/\.(mp4|webm|ogg)$/i) != null || url.includes('video');
          const isAudio = url.match(/\.(mp3|wav|ogg)$/i) != null || url.includes('audio');
          
          if (isImage) {
            return <img key={i} src={url} alt={`Property ${i}`} className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />;
          } else if (isVideo) {
            return <video key={i} src={url} controls className="w-full h-[400px] object-cover bg-black" />;
          } else if (isAudio) {
            return (
              <div key={i} className="w-full h-[400px] flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8">
                <Music className="w-16 h-16 text-gray-400 mb-4" />
                <audio src={url} controls className="w-full" />
              </div>
            );
          } else {
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-full h-[400px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-blue-600 hover:bg-blue-50 transition-colors text-center group">
                <FileText className="w-16 h-16 text-gray-400 mb-4 group-hover:text-blue-500 transition-colors" />
                <span className="font-bold text-lg">View Document</span>
                <span className="text-sm text-gray-500 mt-1 truncate max-w-xs">{url.split('/').pop()}</span>
              </a>
            );
          }
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="mb-10 pb-10 border-b border-gray-100">
            <h2 className="text-2xl font-bold mb-4">About this space</h2>
            {listing.details && (
              <div className="flex flex-wrap gap-4 mb-6 text-gray-700 font-medium">
                {listing.details.maxGuests && <span>{listing.details.maxGuests} guests</span>}
                {listing.details.maxGuests && <span>·</span>}
                {listing.details.bedrooms && <span>{listing.details.bedrooms} bedrooms</span>}
                {listing.details.bedrooms && <span>·</span>}
                {listing.details.bathrooms && <span>{listing.details.bathrooms} baths</span>}
              </div>
            )}
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
              {listing.description || 'No description available for this property.'}
            </p>
          </div>

          <div className="mb-10 pb-10 border-b border-gray-100">
            <h2 className="text-2xl font-bold mb-6">What this place offers</h2>
            <div className="grid grid-cols-2 gap-4">
              {(listing.details?.amenities || ['Wifi', 'Kitchen', 'Free parking', 'Pool', 'Air conditioning', 'Dedicated workspace']).map((amenity: string) => (
                <div key={amenity} className="flex items-center gap-3 text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="capitalize">{amenity.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-2xl">
            <Shield className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-bold text-blue-900">Protected by NestGuard</h3>
              <p className="text-sm text-blue-700 mt-1">Every booking includes free protection from Host cancellations, listing inaccuracies, and other issues like trouble checking in.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 p-8 bg-white rounded-3xl border border-gray-200 shadow-2xl">
            <div className="flex items-baseline justify-between mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900">{listing.currency}{listing.price}</span>
                <span className="text-gray-500 font-medium">/ {listing.period}</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold">
                <Star className="w-4 h-4 fill-black" />
                <span>{listing.rating || '5.0'}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 text-gray-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Check-in</span>
                </div>
                <p className="font-medium">Flexible after 3:00 PM</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 text-gray-600 mb-2">
                  <Info className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Cancellation</span>
                </div>
                <p className="font-medium">Free cancellation for 48 hours</p>
              </div>
            </div>

            <button 
              onClick={() => onBook({ 
                moveInDate: new Date().toISOString(), 
                configuration: 'Standard', 
                name: 'Guest', 
                phone: '1234567890', 
                totalRent: listing.price 
              })}
              className="w-full bg-black text-white py-5 rounded-2xl font-bold text-xl hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-black/10"
            >
              Reserve Now
            </button>
            <p className="text-center text-gray-500 text-sm mt-4 font-medium">You won't be charged yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
