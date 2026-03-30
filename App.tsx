
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ListingCard from './components/ListingCard';
import MapSidebar from './components/MapSidebar';
import ListingDetails from './components/ListingDetails';
import WishlistPage from './components/WishlistPage';
import BookingPage from './components/BookingPage';
import ReservationsPage from './components/ReservationsPage';
import FlyToAnimation from './components/FlyToAnimation';
import AdminDashboard from './components/AdminDashboard';
import HostSpaceWizard from './components/HostSpaceWizard';
import PaymentSection from './components/PaymentSection';
import { MapIcon, ListIcon } from './components/Icons';
import { fetchListingsForCity } from './services/geminiService';
import { Listing, Room, NearbyPoint, User, Reservation } from './types';
import { syncUserToBackend } from './services/userService';

type ViewState = 'SEARCH' | 'DETAILS' | 'WISHLIST' | 'BOOKING' | 'RESERVATIONS' | 'ADMIN' | 'PAYMENT' | 'HOST_WIZARD';

interface BookingData {
    moveInDate: string;
    configuration: string;
    name: string;
    phone: string;
    totalRent: number;
}

interface FlyAnimationState {
    listing: Listing;
    target: 'RESERVES' | 'WISHLIST';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
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

  const persistUser = (nextUser: User | null) => {
    if (nextUser) {
      localStorage.setItem('enchospace_user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('enchospace_user');
    }
    setUser(nextUser);
  };

  const loginWithGoogle = async () => {
    const demoUser: User = {
      uid: `user_${Date.now()}`,
      email: 'guest@enchospace.app',
      displayName: 'Guest User',
      photoURL: null,
      role: 'user',
      favorites: [],
      createdAt: new Date().toISOString(),
    };
    persistUser(demoUser);
    await syncUserToBackend(demoUser);
    return demoUser;
  };

  const logout = () => {
    persistUser(null);
    setFavorites([]);
    setReservations([]);
  };

  // 1. Session bootstrap
  useEffect(() => {
    const raw = localStorage.getItem('enchospace_user');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as User;
        setUser(parsed);
      } catch {
        localStorage.removeItem('enchospace_user');
      }
    }
  }, []);

  // 2. Listings sync from backend first, Gemini fallback second
  useEffect(() => {
    const loadInitialListings = async () => {
      try {
        const response = await fetch('/api/listings');
        if (!response.ok) throw new Error(`Listings API failed (${response.status})`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setListings(data);
          return;
        }
      } catch (error) {
        console.error('Failed to load listings from backend:', error);
      }
      await handleSearch('Berlin');
    };

    loadInitialListings();
  }, []);

  // 3. Favorites + reservations sync
  useEffect(() => {
    if (!user) return;

    const rawFavorites = localStorage.getItem(`enchospace_favorites_${user.uid}`);
    const favoriteIds: string[] = rawFavorites ? JSON.parse(rawFavorites) : [];
    if (favoriteIds.length > 0) {
      setFavorites(listings.filter((listing) => favoriteIds.includes(listing.id)));
    } else {
      setFavorites([]);
    }

    const loadReservations = async () => {
      try {
        const response = await fetch(`/api/reservations?userId=${encodeURIComponent(user.uid)}`);
        if (!response.ok) throw new Error(`Reservations API failed (${response.status})`);
        const data = await response.json();
        setReservations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load reservations:', error);
        setReservations([]);
      }
    };

    loadReservations();
  }, [user, listings]);

  const handleSearch = async (searchCity: string) => {
    setLoading(true);
    setCity(searchCity);
    setCurrentView('SEARCH');
    setSelectedListing(null);
    try {
        const data = await fetchListingsForCity(searchCity);
        // In a real app, we might search Firestore here, but for now we use Gemini to populate the map
        setListings(data);
    } catch (e) {
        console.error("Failed to load listings", e);
    } finally {
        setLoading(false);
    }
  };

  const toggleFavorite = async (listing: Listing) => {
      if (!user) {
          await loginWithGoogle();
          return;
      }
      const isFav = favorites.find(l => l.id === listing.id);
      if (isFav) {
          const next = favorites.filter(l => l.id !== listing.id);
          setFavorites(next);
          localStorage.setItem(`enchospace_favorites_${user.uid}`, JSON.stringify(next.map(l => l.id)));
      } else {
          setFlyAnimation({ listing, target: 'WISHLIST' });
          const next = [...favorites, listing];
          setFavorites(next);
          localStorage.setItem(`enchospace_favorites_${user.uid}`, JSON.stringify(next.map(l => l.id)));
      }
  };

  const isFavorite = (id: string) => !!favorites.find(l => l.id === id);

  const handleListingClick = (listing: Listing) => {
    setSelectedListing(listing);
    setCurrentView('DETAILS');
    window.scrollTo(0, 0);
  };

  const handleBookingStart = (data: BookingData) => {
      if (!user) {
          loginWithGoogle();
          return;
      }
      setLastBooking(data);
      setCurrentView('PAYMENT');
      window.scrollTo(0, 0);
  };

  const handlePaymentSuccess = async (paymentId: string) => {
      if (!selectedListing || !user || !lastBooking) return;

      try {
          const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listingId: selectedListing.id,
              userId: user.uid,
              moveInDate: lastBooking.moveInDate,
              totalRent: lastBooking.totalRent,
              paymentId,
            }),
          });
          if (!response.ok) {
            throw new Error(`Create reservation failed (${response.status})`);
          }

          const refreshReservations = await fetch(`/api/reservations?userId=${encodeURIComponent(user.uid)}`);
          if (refreshReservations.ok) {
            const rows = await refreshReservations.json();
            setReservations(Array.isArray(rows) ? rows : []);
          }
          setCurrentView('BOOKING');
      } catch (e) {
          console.error('Failed to save reservation', e);
      }
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

  if (currentView === 'DETAILS' && selectedListing) {
      return (
         <>
         {flyAnimation && (
            <FlyToAnimation listing={flyAnimation.listing} target={flyAnimation.target} onComplete={handleAnimationComplete} />
         )}
         <ListingDetails 
            listing={selectedListing} 
            onBack={() => setCurrentView('SEARCH')}
            similarListings={listings.filter(l => l.id !== selectedListing.id)}
            onListingClick={handleListingClick}
            isFavorite={isFavorite(selectedListing.id)}
            onToggleFavorite={toggleFavorite}
            onBook={handleBookingStart}
            user={user}
         />
         </>
      );
  }

  if (currentView === 'ADMIN') {
      return <AdminDashboard onBack={() => setCurrentView('SEARCH')} />;
  }

  if (currentView === 'HOST_WIZARD') {
      return (
          <HostSpaceWizard 
            user={user} 
            onBack={() => setCurrentView('SEARCH')} 
            onSuccess={() => {
                setCurrentView('SEARCH');
                // Refresh listings or show success toast
            }}
          />
      );
  }

  if (currentView === 'PAYMENT' && selectedListing && lastBooking) {
      return (
          <PaymentSection 
            listing={selectedListing}
            totalAmount={lastBooking.totalRent}
            onSuccess={handlePaymentSuccess}
            onBack={() => setCurrentView('DETAILS')}
          />
      );
  }

  if (currentView === 'WISHLIST') {
      return (
          <WishlistPage 
            favorites={favorites}
            onBack={() => setCurrentView('SEARCH')}
            onListingClick={handleListingClick}
            onToggleFavorite={toggleFavorite}
          />
      );
  }

  if (currentView === 'RESERVATIONS') {
      return (
          <ReservationsPage 
            reservations={reservations}
            onBack={() => setCurrentView('SEARCH')}
            onListingClick={handleListingClick}
          />
      );
  }

  if (currentView === 'BOOKING' && selectedListing && lastBooking) {
      return (
          <BookingPage 
            listing={selectedListing}
            bookingDetails={lastBooking}
            onBackToHome={() => {
                setCurrentView('SEARCH');
                // Trigger fly-to-cart animation for the reservation
                setFlyAnimation({ listing: selectedListing, target: 'RESERVES' });
            }}
          />
      );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-[#E31C5F]/20 selection:text-[#E31C5F]">
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
        onAdminClick={() => setCurrentView('ADMIN')}
        onHostClick={() => {
            if (!user) {
                loginWithGoogle();
                return;
            }
            setCurrentView('HOST_WIZARD');
        }}
        onLogin={loginWithGoogle}
        onLogout={logout}
        user={user}
        highlightReserves={highlightReserves}
        highlightWishlist={highlightWishlist}
        reservesCount={reservations.length}
        wishlistCount={favorites.length}
      />
      <FilterBar />

      <main className="max-w-[1920px] mx-auto pt-6 px-4 md:px-6 relative">
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] xl:hidden">
            <button 
                onClick={() => setShowMap(!showMap)}
                className="bg-[#111111] hover:bg-black text-white px-6 py-3.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex items-center gap-2.5 font-bold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
            >
                {showMap ? (
                    <><span>Show list</span><ListIcon className="w-4 h-4" /></>
                ) : (
                    <><span>Map</span><MapIcon className="w-4 h-4" /></>
                )}
            </button>
        </div>

        <div className="flex gap-8 items-start pb-24 xl:pb-20">
          <div className={`flex-1 min-w-0 transition-opacity duration-300 ${showMap ? 'hidden opacity-0 xl:block xl:opacity-100' : 'block opacity-100'}`}>
             {!loading && (
                 <div className="mb-6 flex items-baseline gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Places to stay in {city}</h1>
                    <span className="text-gray-500 font-medium text-sm border-l border-gray-300 pl-3 ml-1">{listings.length}+ stays</span>
                 </div>
             )}

            {loading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="flex flex-col gap-3 animate-pulse">
                            <div className="aspect-[4/3] bg-gray-100 rounded-2xl w-full"></div>
                            <div className="h-4 bg-gray-100 rounded-full w-2/3 mt-2"></div>
                            <div className="h-4 bg-gray-100 rounded-full w-1/3"></div>
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-6 gap-y-10">
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
                </div>
            )}
            
             {!loading && (
                <div className="mt-12 flex flex-col items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900">Continue exploring {city}</h3>
                    <button className="px-8 py-3.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg">Show more</button>
                </div>
            )}
          </div>

          <div className={`xl:block xl:sticky xl:top-[160px] xl:w-[45%] xl:h-[calc(100vh-180px)] xl:rounded-2xl xl:overflow-hidden xl:z-0 xl:shadow-2xl ${showMap ? 'fixed inset-0 top-[130px] z-30 block w-full h-[calc(100vh-130px)] bg-gray-50' : 'hidden'}`}>
             <MapSidebar listings={listings} highlightedId={hoveredListingId} className="w-full h-full" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
