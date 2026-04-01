
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SearchIcon, HeartIcon, UserIcon, MenuIcon, CalendarIcon, NavigationIcon, MapIcon, XIcon, PhoneIcon, MessageCircleIcon, MailIcon, HouseIcon, LogInIcon } from './Icons';

interface HeaderProps {
  onSearch: (city: string) => void;
  currentCity: string;
  onWishlistClick: () => void;
  onReservesClick: () => void;
  highlightReserves?: boolean;
  highlightWishlist?: boolean;
  reservesCount: number;
  wishlistCount: number;
}

const POPULAR_CITIES = ['Berlin', 'London', 'Paris', 'New York', 'Tokyo', 'Barcelona', 'Amsterdam', 'Munich'];

const Header: React.FC<HeaderProps> = ({ 
    onSearch, 
    currentCity, 
    onWishlistClick, 
    onReservesClick, 
    highlightReserves, 
    highlightWishlist,
    reservesCount,
    wishlistCount
}) => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState(currentCity);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const searchRef = useRef<HTMLFormElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const suggestions = inputValue.trim() === '' 
    ? POPULAR_CITIES 
    : POPULAR_CITIES.filter(city => city.toLowerCase().includes(inputValue.toLowerCase()));

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) {
          setIsDesktopMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Login error:', error.message);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error.message);
  };

  const handleSubmit = (e: React.FormEvent, cityOverride?: string) => {
    e.preventDefault();
    const cityToSearch = cityOverride || inputValue;
    if (cityToSearch.trim()) {
      onSearch(cityToSearch);
      setInputValue(cityToSearch);
      setIsFocused(false);
      // Ensure dropdown closes
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  return (
    <header 
      className={`
        sticky top-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm' 
          : 'bg-white border-b border-transparent'}
      `}
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-3 md:gap-4 relative">
        
        {/* 1. Brand: ENCHO Space */}
        <div 
          onClick={() => {
              setInputValue('');
              onSearch('Berlin'); // Reset to default/home
              navigate('/');
          }}
          className="flex flex-col justify-center leading-none cursor-pointer group shrink-0 select-none md:min-w-[120px]"
        >
             <div className="flex items-baseline gap-0.5">
                 <span className="font-black text-xl md:text-2xl tracking-tighter text-gray-900 group-hover:text-[#E31C5F] transition-colors">ENCHO</span>
                 <div className="w-1.5 h-1.5 bg-[#E31C5F] rounded-full mb-1"></div>
             </div>
             <span className="text-[8px] md:text-[9px] font-bold tracking-[0.35em] text-gray-400 uppercase ml-0.5 group-hover:text-gray-600 transition-colors">Space</span>
        </div>

        {/* 2. Search Bar - Modern Capsule with Dropdown */}
        <div className="flex-1 flex justify-center max-w-2xl relative">
          <form 
            ref={searchRef}
            onSubmit={handleSubmit} 
            className={`
              relative w-full flex items-center bg-white border rounded-full transition-all duration-300 group z-50
              ${isFocused 
                ? 'h-14 shadow-lg border-gray-300 ring-4 ring-[#E31C5F]/10 scale-[1.02]' 
                : 'h-12 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-gray-200 hover:shadow-md hover:border-gray-300'}
            `}
          >
              <div className="flex-1 pl-5 md:pl-7 flex items-center">
                {/* Visual Icon inside Input */}
                {isFocused && (
                     <SearchIcon className="w-4 h-4 text-gray-400 mr-3 animate-fade-in" />
                )}
                
                <input
                    type="text"
                    value={inputValue}
                    onFocus={() => setIsFocused(true)}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-transparent border-none text-sm md:text-base font-medium text-gray-900 placeholder-gray-500 focus:ring-0 outline-none truncate"
                    placeholder="Search destinations"
                />
                
                {/* Clear Button */}
                {inputValue && isFocused && (
                    <button 
                        type="button" 
                        onClick={() => setInputValue('')}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 mr-2"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                )}
              </div>
              
              {/* Search Button / Controls */}
              <div className="pr-1.5 flex items-center gap-2">
                  <button
                    type="submit"
                    className={`
                      bg-[#E31C5F] hover:bg-[#C90E4F] text-white rounded-full 
                      transition-all duration-300 shadow-sm active:scale-95 flex items-center justify-center
                      ${isFocused ? 'p-3' : 'p-2.5'}
                    `}
                  >
                    <SearchIcon className={isFocused ? 'w-5 h-5' : 'w-4 h-4'} />
                  </button>
              </div>

              {/* SEARCH DROPDOWN - The Core of the Redesign */}
              {isFocused && (
                  <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden animate-fade-in-up origin-top">
                      <div className="p-2">
                          
                          {/* Section: Nearby (Only when input is empty) */}
                          {inputValue.trim() === '' && (
                            <div className="mb-2">
                                <div 
                                    onClick={(e) => handleSubmit(e, 'Nearby')}
                                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer group transition-colors"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-700 group-hover:bg-black group-hover:text-white transition-colors">
                                        <NavigationIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">Explore nearby</div>
                                        <div className="text-xs text-gray-500">Based on your current location</div>
                                    </div>
                                </div>
                            </div>
                          )}

                          {/* Section: Suggestions */}
                          <div className="pb-2">
                              <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                  {inputValue.trim() === '' ? 'Popular Destinations' : 'Similar Places'}
                              </div>
                              
                              {suggestions.map((city) => (
                                  <div 
                                    key={city}
                                    onClick={(e) => handleSubmit(e, city)}
                                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer group transition-colors"
                                  >
                                      <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-gray-900 transition-all border border-transparent group-hover:border-gray-100">
                                          <MapIcon className="w-5 h-5" />
                                      </div>
                                      <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                          {city}
                                      </div>
                                  </div>
                              ))}

                              {suggestions.length === 0 && (
                                  <div className="p-4 text-center text-gray-500 text-sm">
                                      No places found for "{inputValue}"
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </form>
          
          {/* Overlay to dim background when focused */}
          {isFocused && (
            <div className="fixed inset-0 top-20 bg-white/60 backdrop-blur-sm z-[-1] animate-fade-in"></div>
          )}
        </div>

        {/* 3. Right Actions: Wishlist, Reserves & Accounts */}
        <div className="flex items-center justify-end gap-2 shrink-0 md:min-w-[120px]">
          
          {/* Reserves - Hidden on Mobile */}
          <button 
            onClick={onReservesClick}
            className={`
                relative hidden md:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-500
                ${highlightReserves 
                    ? 'text-[#E31C5F] bg-pink-100 scale-105 shadow-md ring-2 ring-pink-200' 
                    : 'text-gray-500 hover:text-[#E31C5F] hover:bg-pink-50'}
            `}
          >
              <CalendarIcon className={`w-5 h-5 transition-transform duration-500 ${highlightReserves ? 'animate-bounce' : ''}`} />
              <span className="hidden lg:inline">Reserves</span>
              {reservesCount > 0 && (
                  <span className={`absolute top-1 right-2 lg:top-0 lg:right-0 bg-[#E31C5F] text-white text-[10px] font-bold px-1.5 h-4 rounded-full flex items-center justify-center transition-transform ${highlightReserves ? 'scale-125' : 'scale-100'}`}>
                      {reservesCount}
                  </span>
              )}
          </button>

          {/* Wishlist - Hidden on Mobile */}
          <button 
            onClick={onWishlistClick}
            className={`
                relative hidden md:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300
                ${highlightWishlist 
                    ? 'text-pink-600 bg-pink-50 scale-105 shadow-sm' 
                    : 'text-gray-500 hover:text-[#E31C5F] hover:bg-pink-50'}
            `}
          >
              <HeartIcon className={`w-5 h-5 transition-transform duration-500 ${highlightWishlist ? 'fill-current animate-pulse' : ''}`} />
              <span className="hidden lg:inline">Wishlist</span>
              {wishlistCount > 0 && (
                  <span className={`absolute top-1 right-2 lg:top-0 lg:right-0 bg-pink-500 text-white text-[10px] font-bold px-1.5 h-4 rounded-full flex items-center justify-center transition-transform ${highlightWishlist ? 'scale-125' : 'scale-100'}`}>
                      {wishlistCount}
                  </span>
              )}
          </button>

          {/* Mobile Menu Icon - Trigger for Side Drawer */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`
                md:hidden relative p-2 rounded-full transition-all duration-500
                ${(highlightReserves || highlightWishlist) ? 'bg-pink-50 text-[#E31C5F] scale-110 shadow-md' : 'text-gray-900 hover:bg-gray-100'}
            `}
          >
              <MenuIcon className={`w-6 h-6 transition-transform duration-500 ${(highlightReserves || highlightWishlist) ? 'rotate-12' : ''}`} />
              {(reservesCount + wishlistCount) > 0 && (
                   <span className="absolute top-1.5 right-1.5 bg-[#E31C5F] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                      {reservesCount + wishlistCount}
                   </span>
              )}
          </button>

          {/* Desktop Account Dropdown */}
          <div ref={desktopMenuRef} className="relative hidden md:block">
            <div 
                onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                className="flex items-center gap-2 border border-gray-200 rounded-full p-1 pl-3 hover:shadow-md transition-all cursor-pointer bg-white ml-1"
            >
                <div className="w-4 h-4 text-gray-600">
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{display: 'block', height: '16px', width: '16px', fill: 'none', stroke: 'currentColor', strokeWidth: 3}}><g><path d="m2 16h28"></path><path d="m2 24h28"></path><path d="m2 8h28"></path></g></svg>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full text-white flex items-center justify-center overflow-hidden">
                   <UserIcon className="w-5 h-5" />
                </div>
            </div>

            {/* Desktop Menu Dropdown */}
            {isDesktopMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right z-50">
                    <div className="p-2 border-b border-gray-100">
                        {user ? (
                          <>
                            <div className="p-3 font-semibold text-gray-900 rounded-xl">Hi, {user.email?.split('@')[0]}</div>
                            <div onClick={handleLogout} className="p-3 font-medium text-gray-700 hover:bg-gray-50 rounded-xl cursor-pointer">Log out</div>
                          </>
                        ) : (
                          <>
                            <div onClick={handleLogin} className="p-3 font-semibold text-gray-900 hover:bg-gray-50 rounded-xl cursor-pointer">Log in</div>
                            <div onClick={handleLogin} className="p-3 font-medium text-gray-700 hover:bg-gray-50 rounded-xl cursor-pointer">Sign up</div>
                          </>
                        )}
                    </div>
                    <div className="p-2 border-b border-gray-100">
                         <div onClick={() => navigate('/host')} className="p-3 font-medium text-gray-700 hover:bg-gray-50 rounded-xl cursor-pointer">Host your space</div>
                         <div onClick={() => navigate('/admin')} className="p-3 font-medium text-gray-700 hover:bg-gray-50 rounded-xl cursor-pointer">Admin Panel</div>
                         <div className="p-3 font-medium text-gray-700 hover:bg-gray-50 rounded-xl cursor-pointer">Help Center</div>
                    </div>
                    <div className="p-2">
                        <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Us</div>
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                            <MessageCircleIcon className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Live Chat</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                            <PhoneIcon className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Call Support</span>
                        </div>
                         <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                            <MailIcon className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Email</span>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE SIDE DRAWER (Advanced UI) */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              ></div>
              
              {/* Drawer Panel */}
              <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-white shadow-2xl animate-slide-in-right flex flex-col">
                  
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      <div className="flex flex-col justify-center leading-none select-none">
                        <div className="flex items-baseline gap-0.5">
                            <span className="font-black text-xl tracking-tighter text-gray-900">ENCHO</span>
                            <div className="w-1.5 h-1.5 bg-[#E31C5F] rounded-full mb-1"></div>
                        </div>
                        <span className="text-[8px] font-bold tracking-[0.35em] text-gray-400 uppercase ml-0.5">Space</span>
                     </div>
                     <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                     >
                         <XIcon className="w-5 h-5 text-gray-600" />
                     </button>
                  </div>

                  {/* Drawer Body - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                      
                      {/* Account Actions */}
                      {user ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 bg-black rounded-full text-white flex items-center justify-center">
                              <UserIcon className="w-5 h-5" />
                            </div>
                            <div className="font-bold text-gray-900 text-sm truncate">{user.email?.split('@')[0]}</div>
                          </div>
                          <button onClick={handleLogout} className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm active:scale-95 transition-transform">
                            <LogInIcon className="w-5 h-5" />
                            Log out
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleLogin} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 border border-gray-100 active:scale-95 transition-transform">
                                <LogInIcon className="w-6 h-6 text-gray-700 mb-2" />
                                <span className="font-bold text-gray-900 text-sm">Log in</span>
                            </button>
                            <button onClick={handleLogin} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-900 text-white active:scale-95 transition-transform shadow-md">
                                <UserIcon className="w-6 h-6 mb-2" />
                                <span className="font-bold text-sm">Sign up</span>
                            </button>
                        </div>
                      )}

                      {/* Hero: Become a Host */}
                      <div onClick={() => { setIsMobileMenuOpen(false); navigate('/host'); }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E31C5F] to-orange-500 text-white p-6 shadow-lg active:scale-[0.98] transition-transform cursor-pointer">
                          <div className="relative z-10">
                              <h3 className="font-bold text-xl mb-1">Become a Host</h3>
                              <p className="text-white/90 text-sm font-medium mb-3">Earn extra income by renting out your space.</p>
                              <div className="bg-white/20 backdrop-blur-md self-start inline-block px-3 py-1.5 rounded-lg text-xs font-bold">List your space</div>
                          </div>
                          <HouseIcon className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
                      </div>

                      {/* Admin Link */}
                      <div onClick={() => { setIsMobileMenuOpen(false); navigate('/admin'); }} className="relative overflow-hidden rounded-2xl bg-black text-white p-6 shadow-lg active:scale-[0.98] transition-transform cursor-pointer">
                          <div className="relative z-10">
                              <h3 className="font-bold text-xl mb-1">Admin Panel</h3>
                              <p className="text-white/90 text-sm font-medium mb-3">Manage properties and users.</p>
                          </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="space-y-1">
                          <div 
                             onClick={() => { setIsMobileMenuOpen(false); onReservesClick(); }}
                             className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                          >
                              <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-[#E31C5F]">
                                  <CalendarIcon className="w-5 h-5" />
                              </div>
                              <span className="font-semibold text-gray-700">Reservations</span>
                          </div>
                          <div 
                             onClick={() => { setIsMobileMenuOpen(false); onWishlistClick(); }}
                             className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                          >
                              <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-[#E31C5F]">
                                  <HeartIcon className="w-5 h-5" />
                              </div>
                              <span className="font-semibold text-gray-700">Wishlist</span>
                          </div>
                      </div>

                      {/* Contact Section */}
                      <div className="mt-auto pt-6 border-t border-gray-100">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact & Support</h4>
                          <div className="space-y-3">
                              <button className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                                  <MessageCircleIcon className="w-5 h-5" />
                                  <div className="flex flex-col items-start">
                                      <span className="text-xs font-semibold opacity-70">Live Chat</span>
                                      <span className="font-bold">+1 234 567 890</span>
                                  </div>
                              </button>
                              <div className="grid grid-cols-2 gap-3">
                                  <button className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors">
                                      <PhoneIcon className="w-4 h-4" />
                                      <span className="font-semibold text-sm">Call</span>
                                  </button>
                                  <button className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors">
                                      <MailIcon className="w-4 h-4" />
                                      <span className="font-semibold text-sm">Email</span>
                                  </button>
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      )}

    </header>
  );
};

export default Header;
