
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
    SearchIcon, HeartIcon, UserIcon, MenuIcon, CalendarIcon, 
    NavigationIcon, MapIcon, XIcon, PhoneIcon, MailIcon, 
    HouseIcon, LogInIcon 
} from './Icons';

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

  const suggestions = inputValue.trim() === '' 
    ? POPULAR_CITIES 
    : POPULAR_CITIES.filter(city => city.toLowerCase().includes(inputValue.toLowerCase()));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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
      options: { redirectTo: window.location.origin }
    });
    if (error) console.error('Login error:', error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDesktopMenuOpen(false);
    navigate('/');
  };

  const handleSubmit = (e: React.FormEvent, cityOverride?: string) => {
    e.preventDefault();
    const cityToSearch = cityOverride || inputValue;
    if (cityToSearch.trim()) {
      onSearch(cityToSearch);
      setInputValue(cityToSearch);
      setIsFocused(false);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled ? 'py-3' : 'py-5'}`}>
        <div className={`max-w-[1920px] mx-auto px-4 md:px-8 transition-all duration-500 ${isScrolled ? 'scale-[0.98]' : 'scale-100'}`}>
            <div className={`relative flex items-center justify-between h-20 px-6 rounded-[2.5rem] transition-all duration-500 ${isScrolled ? 'glass shadow-2xl shadow-black/5' : 'bg-white/50 backdrop-blur-sm'}`}>
                
                {/* Brand Logo */}
                <div onClick={() => navigate('/')} className="cursor-pointer flex flex-col justify-center leading-none select-none group shrink-0">
                    <div className="flex items-baseline gap-0.5">
                        <span className="font-black text-2xl tracking-tighter text-gray-900 group-hover:text-brand transition-colors duration-300">ENCHO</span>
                        <div className="w-2 h-2 bg-brand rounded-full mb-1 animate-pulse"></div>
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.4em] text-gray-400 uppercase ml-0.5 group-hover:text-gray-600 transition-colors">Space</span>
                </div>

                {/* Desktop Search Bar */}
                <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
                    <form 
                        ref={searchRef}
                        onSubmit={handleSubmit}
                        className={`flex items-center bg-white border border-gray-100 rounded-full shadow-sm hover:shadow-md transition-all duration-300 group ${isFocused ? 'w-[450px] ring-4 ring-brand/10 border-brand/20' : 'w-[320px]'}`}
                    >
                        <div className="flex-1 px-6 py-3 flex items-center gap-3">
                            {isFocused && <SearchIcon className="w-4 h-4 text-gray-400 animate-in fade-in zoom-in duration-300" />}
                            <input 
                                type="text" 
                                placeholder="Search destinations..." 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                className="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-400"
                            />
                        </div>
                        <button type="submit" className="mr-2 p-2.5 bg-brand text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20">
                            <SearchIcon className="w-4 h-4" />
                        </button>

                        {/* Search Suggestions */}
                        <AnimatePresence>
                            {isFocused && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden py-3 z-50"
                                >
                                    <div className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Popular Destinations</div>
                                    <div className="px-2 space-y-1">
                                        {suggestions.map((city) => (
                                            <button 
                                                key={city}
                                                onClick={(e) => handleSubmit(e, city)}
                                                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                                    <MapIcon className="w-5 h-5" />
                                                </div>
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    <button 
                        onClick={() => navigate('/host')}
                        className="hidden md:block px-5 py-2.5 rounded-full hover:bg-gray-100 text-sm font-bold text-gray-700 transition-all active:scale-95"
                    >
                        Host your Space
                    </button>
                    
                    <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-full border border-gray-200/50">
                        <button 
                            onClick={onWishlistClick}
                            className={`relative p-2.5 rounded-full transition-all duration-300 ${highlightWishlist ? 'bg-brand text-white scale-110 shadow-lg shadow-brand/30' : 'hover:bg-white text-gray-600'}`}
                        >
                            <HeartIcon className={`w-5 h-5 ${wishlistCount > 0 && !highlightWishlist ? 'fill-brand text-brand' : ''}`} />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>
                        
                        <button 
                            onClick={onReservesClick}
                            className={`relative p-2.5 rounded-full transition-all duration-300 ${highlightReserves ? 'bg-brand text-white scale-110 shadow-lg shadow-brand/30' : 'hover:bg-white text-gray-600'}`}
                        >
                            <CalendarIcon className="w-5 h-5" />
                            {reservesCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                    {reservesCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={desktopMenuRef}>
                        <button 
                            onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                            className="flex items-center gap-3 p-1.5 pl-4 bg-white border border-gray-200 rounded-full hover:shadow-md transition-all active:scale-95 group"
                        >
                            <MenuIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-900" />
                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border border-gray-100 group-hover:border-brand/30 transition-colors">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-5 h-5" />
                                )}
                            </div>
                        </button>

                        <AnimatePresence>
                            {isDesktopMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-72 glass rounded-[2rem] shadow-2xl shadow-black/10 overflow-hidden py-3"
                                >
                                    {user ? (
                                        <>
                                            <div className="px-6 py-4 border-b border-gray-100 mb-2">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                                                <p className="font-bold text-gray-900 truncate">{user.email}</p>
                                            </div>
                                            <div className="px-2 space-y-1">
                                                <button onClick={() => { navigate('/admin'); setIsDesktopMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors">
                                                    <NavigationIcon className="w-4 h-4 text-brand" /> Admin Dashboard
                                                </button>
                                                <button onClick={() => { navigate('/host'); setIsDesktopMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors">
                                                    <MapIcon className="w-4 h-4 text-blue-500" /> Host your Space
                                                </button>
                                                <div className="h-px bg-gray-100 mx-4 my-2" />
                                                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 text-sm font-bold text-red-600 transition-colors">
                                                    <LogInIcon className="w-4 h-4 rotate-180" /> Log out
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="px-4 py-2 space-y-2">
                                            <button onClick={handleLogin} className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg">
                                                Log in / Sign up
                                            </button>
                                            <div className="h-px bg-gray-100 mx-4 my-2" />
                                            <button onClick={() => { navigate('/host'); setIsDesktopMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors">
                                                Host your Space
                                            </button>
                                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors">
                                                Help Center
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
                    />
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-[120] shadow-2xl flex flex-col"
                    >
                        <div className="p-6 flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-baseline gap-0.5">
                                <span className="font-black text-xl tracking-tighter">ENCHO</span>
                                <div className="w-1.5 h-1.5 bg-brand rounded-full mb-1"></div>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Main Menu</h4>
                                <nav className="space-y-2">
                                    <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 text-lg font-bold text-gray-800 transition-all">
                                        <MapIcon className="w-6 h-6 text-brand" /> Explore
                                    </button>
                                    <button onClick={() => { onWishlistClick(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 text-lg font-bold text-gray-800 transition-all">
                                        <HeartIcon className="w-6 h-6 text-red-500" /> Wishlist
                                    </button>
                                    <button onClick={() => { onReservesClick(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 text-lg font-bold text-gray-800 transition-all">
                                        <CalendarIcon className="w-6 h-6 text-blue-500" /> Reservations
                                    </button>
                                </nav>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hosting</h4>
                                <button onClick={() => { navigate('/host'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-black text-white font-bold shadow-xl shadow-black/10">
                                    <LogInIcon className="w-6 h-6" /> Host your Space
                                </button>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                    <UserIcon className="w-6 h-6 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Welcome to ENCHO</p>
                                    <p className="text-sm text-gray-500 font-medium">Sign in for the best experience</p>
                                </div>
                            </div>
                            <button onClick={handleLogin} className="w-full btn-primary">
                                Log in / Sign up
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    </header>
  );
};

export default Header;
