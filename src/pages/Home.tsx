
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../components/Header';
import FilterBar from '../components/FilterBar';
import ListingCard from '../components/ListingCard';
import MapSidebar from '../components/MapSidebar';
import ListingDetails from '../components/ListingDetails';
import WishlistPage from '../components/WishlistPage';
import BookingPage from '../components/BookingPage';
import ReservationsPage from '../components/ReservationsPage';
import FlyToAnimation from '../components/FlyToAnimation';
import { fetchListingsForCity } from '../services/geminiService';
import { fetchApi } from '../lib/api';
import { logger } from '../lib/logger';
import { Listing, Reservation } from '../types';
import { Sparkles, Map as MapIconLucide, LayoutGrid } from 'lucide-react';

type ViewState = 'SEARCH' | 'DETAILS' | 'WISHLIST' | 'BOOKING' | 'RESERVATIONS';

interface BookingData {
    moveInDate: string;
    moveOutDate: string;
    configuration: string;
    name: string;
    phone: string;
    totalRent: number;
}

interface FlyAnimationState {
    listing: Listing;
    target: 'RESERVES' | 'WISHLIST';
}

export default function Home(): React.ReactElement {
  const navigate = useNavigate();
  const [city, setCity] = useState('Berlin');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('SEARCH');
  
  // Animation & Data States
  const [flyAnimation, setFlyAnimation] = useState<FlyAnimationState | null>(null);
  const [highlightReserves, setHighlightReserves] = useState(false);
  const [highlightWishlist, setHighlightWishlist] = useState(false);
  
  const [lastBooking, setLastBooking] = useState<BookingData | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);

  useEffect(() => {
    handleSearch('Berlin');
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const data = await fetchApi<Reservation[]>('/api/admin/bookings'); // For now, just fetch all for demo
      setReservations(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Failed to fetch reservations", { error: message });
    }
  };

  const handleSearch = async (searchCity: string) => {
    setLoading(true);
    setCity(searchCity);
    setCurrentView('SEARCH');
    setSelectedListing(null);
    try {
        // Fetch from DB
        let dbListings: Listing[] = [];
        try {
            const dbData = await fetchApi<any[]>('/api/properties');
            dbListings = dbData.map((p) => ({
                id: p.id.toString(),
                title: p.title,
                price: parseFloat(p.price),
                currency: '$',
                period: 'night',
                type: (p.details?.propertyType?.toUpperCase() as Listing['type']) || 'APARTMENT',
                imageUrl: p.images?.[0] || `https://picsum.photos/seed/${p.id}/800/600`,
                images: p.images || [],
                imageCount: p.images?.length || 1,
                provider: 'Host',
                isVerified: true,
                location: p.location || 'Unknown',
                discount: 0,
                rating: 5.0,
                reviewCount: 0,
                amenities: p.details?.amenities || ['Wifi', 'Kitchen'],
                address: p.location,
                description: p.description,
                details: p.details || {},
            }));
        } catch (dbErr: unknown) {
            const message = dbErr instanceof Error ? dbErr.message : String(dbErr);
            logger.warn("Failed to fetch properties from DB, falling back to Gemini only", { error: message });
        }

        // Fetch from Gemini
        const data = await fetchListingsForCity(searchCity);
        setListings([...dbListings, ...data]);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        logger.error("Failed to load listings", { error: message });
    } finally {
        setTimeout(() => setLoading(false), 800); // Artificial delay for smooth transition
    }
  };

  const toggleFavorite = (listing: Listing) => {
      setFavorites((prev: Listing[]) => {
          const exists = prev.find(l => l.id === listing.id);
          if (exists) {
              return prev.filter(l => l.id !== listing.id);
          } else {
              // Trigger Animation on Add
              setFlyAnimation({ listing, target: 'WISHLIST' });
              return [...prev, listing];
          }
      });
  };

  const isFavorite = (id: string) => !!favorites.find(l => l.id === id);

  const handleListingClick = (listingOrId: Listing | string) => {
    const listing = typeof listingOrId === 'string' 
        ? listings.find(l => l.id === listingOrId) 
        : listingOrId;
        
    if (!listing) return;

    const detailedListing: Listing = {
        ...listing,
        description: listing.description || `Welcome to this stunning ${listing.type.toLowerCase()} in the heart of ${city}. This property offers a perfect blend of modern comfort and classic charm. High ceilings, large windows, and a spacious layout make this the ideal home for professionals or students.`,
        size: listing.size || Math.floor(Math.random() * 80) + 40,
        floor: Math.floor(Math.random() * 5) + 1,
        maxGuests: Math.floor(Math.random() * 3) + 1,
        address: `${listing.title}, ${city}`,
        rooms: listing.rooms || [
            { id: 'r1', name: 'Master Bedroom', price: Math.floor(listing.price * 0.6), sqft: 20, isAvailable: true, features: ['King Bed', 'En-suite', 'Balcony'] },
            { id: 'r2', name: 'Standard Room', price: Math.floor(listing.price * 0.4), sqft: 14, isAvailable: false, features: ['Double Bed', 'Desk'] }
        ],
        nearby: listing.nearby || [
            { name: 'Central Station', type: 'TRANSPORT', distance: '5 min walk', minutes: 5 },
            { name: 'Organic Market', type: 'GROCERY', distance: '2 min walk', minutes: 2 },
            { name: 'City Park', type: 'PARK', distance: '10 min walk', minutes: 10 },
            { name: 'Coffee Lab', type: 'CAFE', distance: '1 min walk', minutes: 1 },
            { name: 'FitFirst Gym', type: 'GYM', distance: '3 min walk', minutes: 3 },
        ]
    };
    setSelectedListing(detailedListing);
    setCurrentView('DETAILS');
    window.scrollTo(0, 0);
  };

  const handleBooking = (data: BookingData) => {
      if (!selectedListing) return;
      setLastBooking(data);
      navigate('/payment', { state: { listing: selectedListing, bookingDetails: data } });
  };

  const handleAnimationComplete = () => {
      const target = flyAnimation?.target;
      setFlyAnimation(null);
      
      if (target === 'RESERVES') {
          setHighlightReserves(true);
          setTimeout(() => setHighlightReserves(false), 2000);
      } else if (target === 'WISHLIST') {
          setHighlightWishlist(true);
          setTimeout(() => setHighlightWishlist(false), 2000);
      }
  };

  const renderContent = () => {
    switch (currentView) {
        case 'DETAILS':
            return selectedListing && (
                <ListingDetails 
                    listing={selectedListing} 
                    onBack={() => setCurrentView('SEARCH')}
                    similarListings={listings.filter(l => l.id !== selectedListing.id)}
                    onListingClick={handleListingClick}
                    isFavorite={isFavorite(selectedListing.id)}
                    onToggleFavorite={toggleFavorite}
                    onBook={handleBooking}
                />
            );
        case 'WISHLIST':
            return (
                <WishlistPage 
                    favorites={favorites}
                    onBack={() => setCurrentView('SEARCH')}
                    onListingClick={handleListingClick}
                    onToggleFavorite={toggleFavorite}
                />
            );
        case 'RESERVATIONS':
            return (
                <ReservationsPage 
                    reservations={reservations}
                    onBack={() => setCurrentView('SEARCH')}
                    onListingClick={handleListingClick}
                />
            );
        case 'BOOKING':
            return selectedListing && lastBooking && (
                <BookingPage 
                    listing={selectedListing}
                    bookingDetails={lastBooking}
                    onBackToHome={() => {
                        setCurrentView('SEARCH');
                        setFlyAnimation({ listing: selectedListing, target: 'RESERVES' });
                    }}
                />
            );
        default:
            return (
                <div className="max-w-[1920px] mx-auto pt-6 px-4 md:px-8 relative">
                    {/* View Toggle Button (Mobile) */}
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] xl:hidden">
                        <button 
                            onClick={() => setShowMap(!showMap)}
                            className="bg-black text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-black uppercase tracking-widest text-xs transition-all duration-500 hover:scale-105 active:scale-95 border border-white/10"
                        >
                            {showMap ? (
                                <><LayoutGrid className="w-4 h-4" /> Show list</>
                            ) : (
                                <><MapIconLucide className="w-4 h-4" /> Show Map</>
                            )}
                        </button>
                    </div>

                    <div className="flex gap-12 items-start pb-24">
                        <div className={`flex-1 min-w-0 transition-all duration-500 ${showMap ? 'hidden opacity-0 xl:block xl:opacity-100' : 'block opacity-100'}`}>
                            {!loading && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 text-brand font-black uppercase tracking-[0.2em] text-[10px] mb-2">
                                            <Sparkles className="w-3 h-3" />
                                            Featured Stays
                                        </div>
                                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                                            Discover {city}
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-3 glass px-4 py-2 rounded-2xl border-white/40">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-black text-gray-900 tracking-tight">{listings.length}+ Stays Available</span>
                                    </div>
                                </motion.div>
                            )}

                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {[1, 2, 3, 4, 5, 6].map((n) => (
                                        <div key={n} className="flex flex-col gap-4">
                                            <div className="aspect-[4/3] shimmer-bg rounded-[2rem] w-full"></div>
                                            <div className="space-y-2">
                                                <div className="h-6 shimmer-bg rounded-full w-3/4"></div>
                                                <div className="h-4 shimmer-bg rounded-full w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div 
                                    layout
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {listings.map((listing) => (
                                            <ListingCard 
                                                key={listing.id} 
                                                listing={listing} 
                                                onHover={setHoveredListingId}
                                                onClick={handleListingClick}
                                                isFavorite={isFavorite(listing.id)}
                                                onToggleFavorite={toggleFavorite}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                            
                            {!loading && listings.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    className="mt-20 flex flex-col items-center gap-6 p-12 bg-gray-50 rounded-[3rem] border border-gray-100"
                                >
                                    <div className="text-center">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Continue exploring {city}</h3>
                                        <p className="text-gray-500 font-medium">We've found even more amazing places for you.</p>
                                    </div>
                                    <button className="btn-primary px-12 py-5 text-lg shadow-2xl shadow-brand/20">Show more results</button>
                                </motion.div>
                            )}
                        </div>

                        {/* Map Sidebar */}
                        <motion.div 
                            layout
                            className={`xl:block xl:sticky xl:top-32 xl:w-[45%] xl:h-[calc(100vh-160px)] xl:rounded-[2.5rem] xl:overflow-hidden xl:z-0 xl:shadow-2xl xl:shadow-black/5 border border-gray-100 ${showMap ? 'fixed inset-0 top-[130px] z-30 block w-full h-[calc(100vh-130px)] bg-gray-50' : 'hidden'}`}
                        >
                            <MapSidebar listings={listings} highlightedId={hoveredListingId} className="w-full h-full" />
                        </motion.div>
                    </div>
                </div>
            );
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-brand/20 selection:text-brand">
      {/* Global Fly Animation Overlay */}
      {flyAnimation && (
        <FlyToAnimation 
            listing={flyAnimation.listing} 
            target={flyAnimation.target}
            onComplete={handleAnimationComplete} 
        />
      )}

      <Header 
        onSearch={handleSearch} 
        currentCity={city} 
        onWishlistClick={() => setCurrentView('WISHLIST')}
        onReservesClick={() => setCurrentView('RESERVATIONS')}
        highlightReserves={highlightReserves}
        highlightWishlist={highlightWishlist}
        reservesCount={reservations.length}
        wishlistCount={favorites.length}
      />
      
      <FilterBar />

      <AnimatePresence mode="wait">
        <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
            {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
