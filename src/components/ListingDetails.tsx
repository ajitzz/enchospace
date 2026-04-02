import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Listing } from '../types';
import { 
    Heart, Share2, MapPin, Star, Shield, Clock, Info, 
    CheckCircle2, Music, FileText, Video, ChevronLeft, 
    ChevronRight, Play, Maximize2, Users, Bed, Bath, 
    Wifi, Coffee, Car, Wind, Tv, Waves
} from 'lucide-react';

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const images = listing.images || [listing.imageUrl];

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const amenityIcons: Record<string, any> = {
    'Wifi': Wifi,
    'Kitchen': Coffee,
    'Free parking': Car,
    'Pool': Waves,
    'Air conditioning': Wind,
    'Tv': Tv,
    'Dedicated workspace': Bed,
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImageIndex}
            src={images[activeImageIndex]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

        {/* Navigation Controls */}
        <div className="absolute inset-0 flex items-center justify-between px-4 md:px-8 pointer-events-none">
            <button onClick={prevImage} className="p-4 glass-dark rounded-full text-white hover:bg-white hover:text-black transition-all pointer-events-auto active:scale-90">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextImage} className="p-4 glass-dark rounded-full text-white hover:bg-white hover:text-black transition-all pointer-events-auto active:scale-90">
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
            <button onClick={onBack} className="glass-dark px-6 py-3 rounded-full text-white font-bold flex items-center gap-2 hover:bg-white hover:text-black transition-all active:scale-95">
                <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <div className="flex items-center gap-3">
                <button className="glass-dark p-3 rounded-full text-white hover:bg-white hover:text-black transition-all active:scale-95">
                    <Share2 className="w-5 h-5" />
                </button>
                <button onClick={() => onToggleFavorite(listing)} className={`glass-dark p-3 rounded-full transition-all active:scale-95 ${isFavorite ? 'bg-brand text-white' : 'text-white hover:bg-white hover:text-black'}`}>
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-white">
            <div className="max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap items-center gap-3 mb-6"
                >
                    <div className="bg-brand px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20">
                        {listing.type}
                    </div>
                    {listing.isVerified && (
                        <div className="glass-dark px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Verified Listing
                        </div>
                    )}
                </motion.div>
                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-7xl font-black tracking-tighter mb-6 max-w-4xl leading-[0.95]"
                >
                    {listing.title}
                </motion.h1>
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center gap-6 text-sm font-bold uppercase tracking-widest text-white/80"
                >
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-white text-lg">{listing.rating || '5.0'}</span>
                        <span className="text-white/40">·</span>
                        <span className="underline cursor-pointer hover:text-white transition-colors">12 Reviews</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-brand" />
                        <span className="underline cursor-pointer hover:text-white transition-colors">{listing.location}</span>
                    </div>
                </motion.div>
            </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-12">
                
                {/* Quick Stats */}
                <div className="glass p-8 rounded-[2.5rem] shadow-xl shadow-black/5 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Guests</span>
                        </div>
                        <p className="text-xl font-black text-gray-900">{listing.details?.maxGuests || 4} People</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Bed className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Bedrooms</span>
                        </div>
                        <p className="text-xl font-black text-gray-900">{listing.details?.bedrooms || 2} Rooms</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Bath className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Bathrooms</span>
                        </div>
                        <p className="text-xl font-black text-gray-900">{listing.details?.bathrooms || 1} Baths</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Maximize2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Size</span>
                        </div>
                        <p className="text-xl font-black text-gray-900">{listing.size || 85} m²</p>
                    </div>
                </div>

                {/* Description */}
                <section className="space-y-6">
                    <h2 className="text-3xl font-black tracking-tight text-gray-900">About this space</h2>
                    <p className="text-xl text-gray-600 leading-relaxed font-medium">
                        {listing.description || 'Welcome to this stunning property. Experience luxury and comfort in every corner of this meticulously designed space.'}
                    </p>
                    <button className="text-brand font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:gap-3 transition-all">
                        Read more <ChevronRight className="w-4 h-4" />
                    </button>
                </section>

                {/* Amenities */}
                <section className="space-y-8">
                    <h2 className="text-3xl font-black tracking-tight text-gray-900">What this place offers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(listing.details?.amenities || ['Wifi', 'Kitchen', 'Free parking', 'Pool', 'Air conditioning', 'Tv']).map((amenity: string) => {
                            const Icon = amenityIcons[amenity] || CheckCircle2;
                            return (
                                <div key={amenity} className="flex items-center gap-4 p-6 bg-white rounded-3xl border border-gray-100 hover:border-brand/20 transition-colors group">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-gray-700 capitalize">{amenity.replace('-', ' ')}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button className="btn-secondary w-full md:w-auto">Show all 45 amenities</button>
                </section>

                {/* Safety & Protection */}
                <div className="bg-black rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                    <div className="relative z-10 max-w-lg">
                        <Shield className="w-12 h-12 text-brand mb-6" />
                        <h3 className="text-3xl font-black tracking-tight mb-4 leading-none">ENCHO Protection</h3>
                        <p className="text-white/60 text-lg font-medium mb-8">Every booking includes free protection from Host cancellations, listing inaccuracies, and other issues like trouble checking in.</p>
                        <button className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all active:scale-95">
                            Learn more
                        </button>
                    </div>
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand/20 rounded-full blur-[100px]" />
                </div>
            </div>

            {/* Right Column: Booking Card */}
            <div className="lg:col-span-1">
                <div className="sticky top-32 glass p-8 rounded-[2.5rem] shadow-2xl shadow-black/10 border-white/40">
                    <div className="flex items-baseline justify-between mb-8">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl font-black text-gray-900 tracking-tighter">{listing.currency}{listing.price}</span>
                            <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">/ {listing.period}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-black text-gray-900">{listing.rating || '5.0'}</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Check-in</span>
                                <p className="font-bold text-gray-900">Add date</p>
                            </div>
                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Checkout</span>
                                <p className="font-bold text-gray-900">Add date</p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Guests</span>
                            <p className="font-bold text-gray-900">1 guest</p>
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
                        className="w-full btn-primary py-5 text-xl shadow-2xl shadow-brand/40 mb-6"
                    >
                        Reserve Now
                    </button>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span>{listing.currency}{listing.price} x 5 nights</span>
                            <span>{listing.currency}{listing.price * 5}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span>Cleaning fee</span>
                            <span>{listing.currency}45</span>
                        </div>
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span>Service fee</span>
                            <span>{listing.currency}82</span>
                        </div>
                        <div className="h-px bg-gray-100 my-4" />
                        <div className="flex justify-between text-gray-900 font-black text-xl">
                            <span>Total</span>
                            <span>{listing.currency}{listing.price * 5 + 127}</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Shield className="w-5 h-5 text-brand" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 leading-tight uppercase tracking-widest">Secure Payment Guaranteed</p>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
