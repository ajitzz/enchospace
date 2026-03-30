import React, { useState, useEffect, useRef } from 'react';
import { Listing, NearbyPoint, User } from '../types';
import { ChevronLeft, StarIcon, ShieldCheck, HeartIcon, MapIcon, ChevronRight, PhoneIcon, MessageCircleIcon, WifiIcon, GymIcon, TrainIcon, ShoppingBagIcon, TreeIcon, CoffeeIcon, ChevronDown, XIcon, CalendarIcon } from './Icons';
import ListingCard from './ListingCard';

interface ListingDetailsProps {
  listing: Listing;
  onBack: () => void;
  onListingClick: (listing: Listing) => void;
  similarListings: Listing[];
  isFavorite: boolean;
  onToggleFavorite: (listing: Listing) => void;
  onBook?: (data: any) => void;
  user?: User | null;
}

// Helper to map amenities to icons
const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return <WifiIcon className="w-5 h-5" />;
    if (lower.includes('gym') || lower.includes('fitness')) return <GymIcon className="w-5 h-5" />;
    if (lower.includes('kitchen')) return <div className="w-5 h-5 flex items-center justify-center font-bold text-xs border border-current rounded">K</div>;
    return <ShieldCheck className="w-5 h-5" />;
};

// --- Helpers for Date & Availability ---

const getFutureDate = (daysToAdd: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    // Format to YYYY-MM-DD local time to avoid timezone issues with inputs
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const dateOptions = [
    { label: 'Today', value: getFutureDate(0) },
    { label: 'Tomorrow', value: getFutureDate(1) },
    { label: 'Next Week', value: getFutureDate(7) },
    { label: 'Next Month', value: getFutureDate(30) },
];

interface ConfigOption {
    label: string;
    type: string;
}

const configOptions: ConfigOption[] = [
    { label: '1 BHK Apartment', type: '1BHK' },
    { label: '2 BHK Apartment', type: '2BHK' },
    { label: '3 BHK Apartment', type: '3BHK' },
    { label: 'Studio', type: 'STUDIO' },
];

// Mock availability check based on date and type
const checkAvailability = (type: string, date: string): { status: 'AVAILABLE' | 'SOLD_OUT'; label: string } => {
    if (!date) return { status: 'AVAILABLE', label: 'Check Date' };
    
    // Parse date parts to avoid timezone shifts (YYYY-MM-DD)
    const parts = date.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
    const dayOfMonth = parseInt(parts[2], 10);
    const dt = new Date(year, month, dayOfMonth);
    
    const dayOfWeek = dt.getDay(); // 0 = Sunday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Logic: 
    // - Studios unavailable on weekends
    // - 3BHK unavailable on even numbered days
    // - Others random based on date string hash
    
    const dateHash = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    if (type === 'STUDIO' && isWeekend) return { status: 'SOLD_OUT', label: 'Sold Out' };
    if (type === '3BHK' && dayOfMonth % 2 === 0) return { status: 'SOLD_OUT', label: 'Sold Out' };
    
    // Random fallback for others
    if (type === '2BHK' && dateHash % 3 === 0) return { status: 'SOLD_OUT', label: 'Sold Out' };

    return { status: 'AVAILABLE', label: 'Available' };
};


const NearbyCategorySection = ({ type, points }: { type: string; points: NearbyPoint[] }) => {
    const [expanded, setExpanded] = useState(false);
    
    if (!points || points.length === 0) return null;

    const topPoint = points[0];
    const otherPoints = points.slice(1);
    const hasMore = otherPoints.length > 0;
    
    let Icon = MapIcon;
    if (type === 'TRANSPORT') Icon = TrainIcon;
    else if (type === 'GROCERY') Icon = ShoppingBagIcon;
    else if (type === 'PARK') Icon = TreeIcon;
    else if (type === 'CAFE') Icon = CoffeeIcon;
    else if (type === 'GYM') Icon = GymIcon;

    return (
        <div className="border-b border-gray-100 last:border-0 py-4">
            <div 
                className={`flex items-start gap-4 ${hasMore ? 'cursor-pointer group' : ''}`}
                onClick={() => hasMore && setExpanded(!expanded)}
            >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 flex-shrink-0 group-hover:bg-gray-100 transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-900 truncate pr-2">{topPoint.name}</span>
                        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{topPoint.distance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">{type}</span>
                         {hasMore && !expanded && (
                             <span className="text-xs text-gray-400 font-medium">+ {otherPoints.length} more</span>
                         )}
                    </div>
                </div>

                {/* Right Arrow */}
                {hasMore && (
                    <div className="pt-1 pl-2 text-gray-400 group-hover:text-black transition-colors">
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                )}
            </div>

            {/* Expandable Section */}
            {hasMore && expanded && (
                <div className="pl-[3.5rem] mt-3 space-y-3 animate-fade-in">
                    {otherPoints.map((point, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm pl-0">
                            <span className="text-gray-600 truncate pr-2">{point.name}</span>
                            <span className="text-gray-500 whitespace-nowrap">{point.distance}</span>
                        </div>
                    ))}
                    <button 
                        onClick={() => setExpanded(false)}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 mt-2 uppercase tracking-wide"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

const ListingDetails: React.FC<ListingDetailsProps> = ({ listing, onBack, similarListings, onListingClick, isFavorite, onToggleFavorite, onBook, user }) => {
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);
  
  // Booking State
  const [bookingStep, setBookingStep] = useState<'AVAILABILITY' | 'CONTACT'>('AVAILABILITY');
  const [moveInDate, setMoveInDate] = useState(getFutureDate(0)); // Default to today
  const [config, setConfig] = useState('1 BHK Apartment');
  const [minDate, setMinDate] = useState('');
  
  // User Details (Pre-filled from user if available)
  const [guestName, setGuestName] = useState(user?.displayName || '');
  const [guestPhone, setGuestPhone] = useState(''); // Phone is not in User interface, but we can pre-fill name

  // Update name if user logs in while on this page
  useEffect(() => {
    if (user?.displayName && !guestName) {
        setGuestName(user.displayName);
    }
  }, [user, guestName]);

  // UI State for Custom Dropdowns
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isMobileConfigOpen, setIsMobileConfigOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const configDropdownRef = useRef<HTMLDivElement>(null);

  // Mobile Booking Sheet State
  const [showMobileBooking, setShowMobileBooking] = useState(false);

  // Generate deterministic images based on the listing ID
  const images = Array.from({ length: 5 }).map(
    (_, i) => `${listing.imageUrl}?random=${i + 10}`
  );

  // Group nearby points by type
  const nearbyByType = listing.nearby?.reduce((acc, point) => {
      if (!acc[point.type]) acc[point.type] = [];
      acc[point.type].push(point);
      return acc;
  }, {} as Record<string, NearbyPoint[]>) || {};

  // Scroll listener for auto-hiding navbar
  useEffect(() => {
    // Set min date to today
    setMinDate(getFutureDate(0));

    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY.current && currentScrollY > 50) { 
          // Scroll down & passed top threshold -> Hide
          setShowNav(false);
        } else { 
          // Scroll up -> Show
          setShowNav(true);
        }
        
        lastScrollY.current = currentScrollY;
      }
    };
    
    // Close dropdowns on click outside
    const handleClickOutside = (event: MouseEvent) => {
        if (configDropdownRef.current && !configDropdownRef.current.contains(event.target as Node)) {
            setIsConfigOpen(false);
        }
    };

    window.addEventListener('scroll', controlNavbar);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBookingAction = () => {
      setBookingError(null);
      
      if (!moveInDate) {
          setBookingError("Please select a move-in date.");
          return;
      }

      if (bookingStep === 'AVAILABILITY') {
          const currentType = configOptions.find(o => o.label === config)?.type || '1BHK';
          const availability = checkAvailability(currentType, moveInDate);
          
          if (availability.status === 'SOLD_OUT') {
              // In an industrial app, we might show a "Waitlist" option or similar
              // For now, we'll just warn the user in the UI
              setBookingError("This configuration is currently sold out for the selected date.");
              return;
          }

          // Move to contact form step with animation
          setBookingStep('CONTACT');
      } else {
          // Perform booking
          if (!guestName || !guestPhone) {
              setBookingError("Please fill in your name and phone number.");
              return;
          }
          
          if (onBook) {
              const maintenanceFee = Math.round(listing.price * 0.10);
              onBook({
                  moveInDate,
                  configuration: config,
                  name: guestName,
                  phone: guestPhone,
                  totalRent: listing.price + maintenanceFee
              });
          }
      }
  };

  const handleMobileReserve = () => {
    setBookingError(null);
    
    if (!moveInDate) {
        setBookingError("Please select a move-in date.");
        return;
    }
    
    const currentType = configOptions.find(o => o.label === config)?.type || '1BHK';
    const availability = checkAvailability(currentType, moveInDate);
    
    if (availability.status === 'SOLD_OUT') {
         setBookingError("Sold out for the selected date.");
         return;
    }

    if (!guestName || !guestPhone) {
        setBookingError("Please enter your details.");
        setShowMobileBooking(true); // Ensure sheet is open
        return;
    }

    if (onBook) {
        const maintenanceFee = Math.round(listing.price * 0.10);
        onBook({
            moveInDate,
            configuration: config,
            name: guestName,
            phone: guestPhone,
            totalRent: listing.price + maintenanceFee
        });
    }
  };

  // Calculations for rent breakdown
  const maintenanceFee = Math.round(listing.price * 0.10); // 10% maintenance
  const totalRent = listing.price + maintenanceFee;
  const deposit = listing.price * 3; // 3 months deposit

  // Render Custom Configuration Dropdown
  const renderConfigDropdown = () => {
      return (
          <div className="relative" ref={configDropdownRef}>
              <div 
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className={`
                    w-full flex items-center justify-between bg-white text-gray-900 text-sm rounded-xl px-4 py-3.5 
                    cursor-pointer transition-all border
                    ${isConfigOpen ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-black'}
                  `}
              >
                  <span className="font-bold">{config}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {isConfigOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                      {configOptions.map((opt) => {
                          const avail = checkAvailability(opt.type, moveInDate);
                          const isAvailable = avail.status === 'AVAILABLE';
                          
                          return (
                              <div 
                                  key={opt.label}
                                  onClick={() => {
                                      setConfig(opt.label);
                                      setIsConfigOpen(false);
                                  }}
                                  className={`
                                      flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 transition-colors cursor-pointer
                                      ${config === opt.label ? 'bg-gray-50' : 'hover:bg-gray-50'}
                                  `}
                              >
                                  <span className={`font-medium ${config === opt.label ? 'text-black' : 'text-gray-600'}`}>
                                      {opt.label}
                                  </span>
                                  {/* Availability Badge - Modern Black & White */}
                                  <span className={`
                                      text-[10px] font-bold px-2 py-0.5 rounded border tracking-wide uppercase
                                      ${isAvailable 
                                        ? 'bg-black text-white border-black' 
                                        : 'bg-white text-gray-500 border-gray-200'}
                                  `}>
                                      {avail.label}
                                  </span>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="bg-white min-h-screen animate-fade-in pb-32">
      
      {/* Floating Scroll-Aware Header */}
      <header 
        className={`
            fixed top-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-md border-b border-gray-100 
            px-4 md:px-8 h-16 flex items-center justify-between 
            transition-transform duration-300 shadow-sm
            ${showNav ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
         <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-gray-600 hover:text-black hover:bg-gray-100/50 px-3 py-1.5 rounded-full transition-all group"
         >
            <div className="p-1.5 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="font-medium text-sm hidden sm:inline">Back to search</span>
         </button>

         <div className="flex gap-2 sm:gap-3">
             <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100/50 rounded-full text-sm font-medium transition-colors text-gray-700">
                <div className="w-4 h-4"><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'currentcolor', strokeWidth: 2, overflow: 'visible'}}><g fill="none"><path d="M27 18v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9"></path><path d="M16 3v23V3z"></path><path d="M6 13l9.293-9.293a1 1 0 0 1 1.414 0L26 13"></path></g></svg></div>
                <span className="hidden sm:inline">Share</span>
             </button>
             <button 
                onClick={() => onToggleFavorite(listing)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors 
                    ${isFavorite ? 'bg-pink-50 text-[#E31C5F]' : 'hover:bg-gray-100/50 text-gray-700'}`}
             >
                <HeartIcon className="w-4 h-4" filled={isFavorite} />
                <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
             </button>
         </div>
      </header>

      {/* Main Content Container - Added pt-20 to compensate for fixed header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20">
        
        {/* Gallery Grid (Airbnb/Zumper style) */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-1 md:grid-rows-2 gap-2 h-[320px] md:h-[450px] rounded-2xl overflow-hidden mb-8 relative group">
            <div className="md:col-span-2 md:row-span-2 relative h-full">
                <img src={images[0]} className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer" alt="Main" />
                {listing.isVerified && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold tracking-wide text-gray-900 uppercase">Verified Plus</span>
                    </div>
                )}
                {/* Mobile Photo Count Badge */}
                <div className="absolute bottom-4 right-4 md:hidden bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-white text-xs font-medium">
                    1 / 5 Photos
                </div>
            </div>
            <div className="hidden md:block"><img src={images[1]} className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer" alt="Detail 1" /></div>
            <div className="hidden md:block"><img src={images[2]} className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer" alt="Detail 2" /></div>
            <div className="hidden md:block"><img src={images[3]} className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer" alt="Detail 3" /></div>
            <div className="hidden md:block relative">
                <img src={images[4]} className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer" alt="Detail 4" />
                <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:bg-gray-50 transition-transform active:scale-95">
                    Show all photos
                </button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
            
            {/* Left Column: Details */}
            <div className="flex-1 min-w-0">
                
                {/* Header Info */}
                <div className="border-b border-gray-200 pb-6 mb-8">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-gray-600 mb-4 text-sm md:text-base">
                        <StarIcon className="w-4 h-4 text-gray-900 fill-current" />
                        <span className="font-semibold text-gray-900">{listing.rating}</span>
                        <span>·</span>
                        <span className="underline cursor-pointer hover:text-black">{listing.reviewCount} reviews</span>
                        <span>·</span>
                        <span className="underline cursor-pointer hover:text-black">{listing.address || "Berlin, Germany"}</span>
                    </div>
                </div>

                {/* About Section */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">About this home</h2>
                    <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                        {listing.description || "Experience the best of city living in this beautifully furnished apartment. Located in a vibrant neighborhood, you'll have easy access to local cafes, restaurants, and public transport. The space features modern amenities, high-speed Wi-Fi, and a fully equipped kitchen, making it perfect for both short and long-term stays."}
                    </p>
                    <button className="mt-4 font-semibold underline text-gray-900 hover:text-gray-700">Show more</button>
                </div>

                {/* Redesigned Amenities Section */}
                <div className="mb-10 py-8 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">What this place offers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listing.amenities?.map((amenity, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div className="text-gray-700">
                                    {getAmenityIcon(amenity)}
                                </div>
                                <span className="font-medium text-gray-700">{amenity}</span>
                            </div>
                        ))}
                    </div>
                    <button className="mt-6 w-full md:w-auto border border-gray-900 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                        Show all {listing.amenities?.length || 10} amenities
                    </button>
                </div>

                {/* Redesigned Location / Nearby Section with Collapsible Categories */}
                <div className="mb-10 py-8 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Nearby</h2>
                    {/* Grouped Nearby List */}
                    <div className="space-y-2">
                        <NearbyCategorySection type="TRANSPORT" points={nearbyByType['TRANSPORT']} />
                        <NearbyCategorySection type="GROCERY" points={nearbyByType['GROCERY']} />
                        <NearbyCategorySection type="PARK" points={nearbyByType['PARK']} />
                        <NearbyCategorySection type="CAFE" points={nearbyByType['CAFE']} />
                        <NearbyCategorySection type="GYM" points={nearbyByType['GYM']} />
                    </div>
                </div>

                {/* Map Section */}
                <div className="mb-10 pt-4 pb-8 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Where you’ll be</h2>
                     <div className="relative w-full h-64 md:h-80 bg-gray-100 rounded-2xl overflow-hidden shadow-sm group">
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.address || listing.title + " " + (listing.city || ""))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        ></iframe>
                         <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-sm text-sm font-semibold text-gray-800 border border-gray-100 max-w-[80%] truncate">
                             {listing.address || "Berlin, Germany"}
                         </div>
                    </div>
                     <div className="mt-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{listing.address || "Berlin, Germany"}</h3>
                        <p className="text-gray-600 text-sm">
                            We will send you the exact location once your booking is confirmed.
                        </p>
                    </div>
                </div>

            </div>

            {/* Right Column: Sticky Booking Card - Redesigned for Long Term Rent */}
            <div className="hidden lg:block w-[34%] relative">
                <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-[0_6px_16px_rgba(0,0,0,0.08)] p-6 overflow-hidden">
                    
                    {/* Header: Price & Rating */}
                    <div className="flex justify-between items-baseline mb-6">
                        <div>
                            <span className="text-2xl font-bold text-gray-900">{listing.currency}{listing.price.toLocaleString()}</span>
                            <span className="text-gray-500"> /mo</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold">
                            <StarIcon className="w-3 h-3 fill-current" />
                            {listing.rating} · <span className="text-gray-500 underline">{listing.reviewCount} reviews</span>
                        </div>
                    </div>

                    {/* Rental Inputs / Form */}
                    <div className="space-y-6 mb-6 relative">
                        {/* Animated overlay for inputs when contacting */}
                         <div className={`transition-all duration-500 ease-in-out ${bookingStep === 'CONTACT' ? 'opacity-50 pointer-events-none scale-95 origin-top' : 'opacity-100'}`}>
                            
                            {/* Plan to move in */}
                            <div className="relative">
                                <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-2">Move-in Date</label>
                                
                                {/* Quick Date Chips - Modern B&W */}
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                                    {dateOptions.map((opt) => (
                                        <button 
                                            key={opt.label}
                                            onClick={() => setMoveInDate(opt.value)}
                                            className={`
                                                whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                                                ${moveInDate === opt.value 
                                                    ? 'bg-black text-white border-black shadow-md' 
                                                    : 'bg-white text-gray-900 border-gray-200 hover:border-black'}
                                            `}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative group">
                                    <input 
                                        type="date" 
                                        value={moveInDate}
                                        min={minDate}
                                        onChange={(e) => setMoveInDate(e.target.value)}
                                        className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all font-bold appearance-none cursor-pointer placeholder-gray-400 group-hover:border-gray-400"
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900">
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Select BHK - Custom Dropdown */}
                            <div className="relative mt-4">
                                <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-2">Configuration</label>
                                {renderConfigDropdown()}
                            </div>
                        </div>
                        
                        {/* Contact Form Expansion */}
                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${bookingStep === 'CONTACT' ? 'max-h-80 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                            <div className="space-y-4 pt-2">
                                <h3 className="text-sm font-bold text-gray-900">Your Details</h3>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none font-medium"
                                        autoFocus={bookingStep === 'CONTACT'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                                    <input 
                                        type="tel" 
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        placeholder="Enter your phone"
                                        className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {bookingError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-shake">
                            <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">!</div>
                            {bookingError}
                        </div>
                    )}

                    {/* CTA Button */}
                    <button 
                        onClick={handleBookingAction}
                        className="w-full bg-[#E31C5F] text-white font-bold text-lg py-4 rounded-xl hover:bg-[#D01755] transition-all active:scale-[0.98] mb-4 shadow-lg hover:shadow-xl relative overflow-hidden group"
                    >
                        <span className="relative z-10 transition-transform duration-300">
                            {bookingStep === 'AVAILABILITY' ? 'Check availability' : 'Reserve'}
                        </span>
                    </button>

                    <div className="text-center text-sm text-gray-500 mb-6 font-medium">
                        {bookingStep === 'AVAILABILITY' ? "You won't be charged yet" : "Complete details to request booking"}
                    </div>

                    {/* Detailed Cost Breakdown */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span className="underline decoration-gray-300 decoration-dotted cursor-help">Monthly Rent</span>
                            <span>{listing.currency}{listing.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span className="underline decoration-gray-300 decoration-dotted cursor-help">Maintenance Fee</span>
                            <span>{listing.currency}{maintenanceFee.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between text-gray-600 text-sm">
                            <span className="underline decoration-gray-300 decoration-dotted cursor-help">Security Deposit</span>
                            <span>{listing.currency}{deposit.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-900 pt-4 border-t border-gray-100 items-center">
                            <span className="font-bold text-lg">Total Rent /mo</span>
                            <span className="font-extrabold text-xl">{listing.currency}{totalRent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* Agent/Host Card */}
                 <div className="mt-6 bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl border border-gray-100">
                        👮
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-sm">Hosted by {listing.provider}</div>
                        <div className="text-xs text-gray-500">Superhost · 5 years hosting</div>
                    </div>
                 </div>
            </div>
        </div>

        {/* Nearby Places Slider */}
        <div className="mt-12 mb-8 pt-10 border-t border-gray-100">
             <h2 className="text-2xl font-bold text-gray-900 mb-6">Nearby places to stay</h2>
             <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory">
                {similarListings.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => onListingClick(item)}
                        className="min-w-[260px] md:min-w-[300px] snap-start group cursor-pointer"
                    >
                        <div className="aspect-[20/19] relative rounded-xl overflow-hidden bg-gray-100 mb-3 isolate shadow-sm">
                            <img 
                                src={item.imageUrl} 
                                alt={item.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <button 
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-90"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onToggleFavorite(item);
                                }}
                            >
                                <HeartIcon className="w-5 h-5" filled={false} />
                            </button>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-gray-900 truncate pr-2">{item.title}</h3>
                                <div className="flex items-center gap-1 text-sm">
                                    <StarIcon className="w-3.5 h-3.5 fill-current" />
                                    <span>{item.rating}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">{item.type === 'APARTMENT' ? 'Entire apartment' : 'Private room'}</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="font-bold text-gray-900">{item.currency}{item.price}</span>
                                <span className="text-gray-900 text-sm"> {item.period === 'month' ? 'month' : 'night'}</span>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
        </div>

      </div>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 z-50 flex items-center gap-3 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-pb">
          <button className="flex-shrink-0 w-12 h-12 flex items-center justify-center border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              <PhoneIcon className="w-5 h-5" />
          </button>
          <button className="flex-shrink-0 w-12 h-12 flex items-center justify-center border border-gray-300 rounded-xl text-green-600 hover:bg-gray-50 transition-colors">
               <MessageCircleIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowMobileBooking(true)}
            className="flex-1 h-12 bg-[#E31C5F] text-white font-bold rounded-xl text-base hover:bg-[#D01755] transition-colors shadow-sm"
          >
              Check availability
          </button>
      </div>

      {/* Mobile Booking Sheet / Modal */}
      {showMobileBooking && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center lg:hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setShowMobileBooking(false)}
            ></div>
            
            {/* Sheet Content */}
            <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-6 pb-10 animate-slide-up max-h-[90vh] overflow-y-auto">
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Plan your move</h2>
                    <button onClick={() => setShowMobileBooking(false)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                     <div>
                        <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-2">Move-in Date</label>
                        
                         {/* Quick Date Chips Mobile */}
                         <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                            {dateOptions.map((opt) => (
                                <button 
                                    key={opt.label}
                                    onClick={() => setMoveInDate(opt.value)}
                                    className={`
                                        whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                                        ${moveInDate === opt.value 
                                            ? 'bg-black text-white border-black' 
                                            : 'bg-white text-gray-900 border-gray-200 hover:border-black'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <input 
                                type="date" 
                                value={moveInDate}
                                min={minDate}
                                onChange={(e) => setMoveInDate(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-gray-900 text-base rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-black outline-none font-bold appearance-none"
                                required
                            />
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900">
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-2">Configuration</label>
                        
                        {/* Mobile Configuration Dropdown (Collapsible) */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                             {/* Header / Trigger */}
                             <div 
                                onClick={() => setIsMobileConfigOpen(!isMobileConfigOpen)}
                                className={`
                                    flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors cursor-pointer
                                    ${isMobileConfigOpen ? 'border-b border-gray-100' : ''}
                                `}
                             >
                                 <span className="font-bold text-gray-900">{config}</span>
                                 <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isMobileConfigOpen ? 'rotate-180' : ''}`} />
                             </div>

                             {/* Options List */}
                             {isMobileConfigOpen && (
                                 <div className="bg-gray-50 animate-fade-in">
                                     {configOptions.map((opt) => {
                                         const avail = checkAvailability(opt.type, moveInDate);
                                         const isAvailable = avail.status === 'AVAILABLE';
                                         const isSelected = config === opt.label;

                                         return (
                                            <div 
                                                key={opt.label}
                                                onClick={() => {
                                                    setConfig(opt.label);
                                                    setIsMobileConfigOpen(false);
                                                }}
                                                className={`
                                                    flex items-center justify-between px-4 py-3.5 border-b border-gray-100 last:border-0 transition-all cursor-pointer
                                                    ${isSelected ? 'bg-white' : ''}
                                                    ${!isAvailable ? 'opacity-90' : 'active:bg-white'}
                                                `}
                                            >
                                                <span className={`font-medium ${isSelected ? 'text-black font-bold' : 'text-gray-600'}`}>
                                                    {opt.label}
                                                </span>
                                                <span className={`
                                                    text-[10px] font-bold px-2 py-0.5 rounded border tracking-wide uppercase
                                                    ${isAvailable 
                                                        ? 'bg-black text-white border-black' 
                                                        : 'bg-white text-gray-500 border-gray-200'}
                                                `}>
                                                    {avail.label}
                                                </span>
                                            </div>
                                         )
                                     })}
                                 </div>
                             )}
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Your Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                                <input 
                                    type="text" 
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="Full Name"
                                    className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-black outline-none font-medium"
                                />
                            </div>
                            <div>
                                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                                 <input 
                                    type="tel" 
                                    value={guestPhone}
                                    onChange={(e) => setGuestPhone(e.target.value)}
                                    placeholder="Phone Number"
                                    className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-black outline-none font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100 mt-2">
                        <span className="font-bold text-gray-700">Total /mo</span>
                        <span className="font-extrabold text-xl text-gray-900">{listing.currency}{totalRent.toLocaleString()}</span>
                    </div>

                    {/* Error Message Mobile */}
                    {bookingError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-shake">
                            <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">!</div>
                            {bookingError}
                        </div>
                    )}

                    <button 
                        onClick={handleMobileReserve}
                        className="w-full bg-[#E31C5F] text-white font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform mt-2"
                    >
                        Reserve
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ListingDetails;