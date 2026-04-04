import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { fetchApi } from '../lib/api';
import { CreditCard, Lock, CheckCircle, ArrowLeft, Sparkles, ShieldCheck, Zap, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { Listing } from '../types';
import { logger } from '../lib/logger';

interface PaymentState {
  listing: Listing;
  bookingDetails: {
    name: string;
    phone: string;
    moveInDate: string;
    moveOutDate: string;
    totalRent: number;
    configuration: string;
  };
}

export default function Payment(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PaymentState | null;
  const { listing, bookingDetails } = state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we returned from Stripe checkout
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 4000);
    }
    if (query.get('canceled')) {
      logger.info('Payment was canceled by user');
    }
  }, [navigate]);

  if (!listing || !bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 bg-gray-50 rounded-[3rem] border-2 border-gray-100"
        >
          <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase">No booking details found</h2>
          <button 
            onClick={() => navigate('/')} 
            className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
          >
            Return to Network
          </button>
        </motion.div>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const booking = await fetchApi<{ id: number }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          property_id: parseInt(listing.id),
          user_name: bookingDetails.name,
          user_phone: bookingDetails.phone,
          start_date: bookingDetails.moveInDate,
          end_date: bookingDetails.moveOutDate,
          total_price: bookingDetails.totalRent,
        }),
      });

      const { url } = await fetchApi<{ url: string }>('/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          property_id: parseInt(listing.id),
          title: listing.title,
          user_name: bookingDetails.name,
          total_price: bookingDetails.totalRent,
          booking_id: booking.id,
        }),
      });
      
      if (url) {
        window.location.href = url;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      logger.error('Payment failed', { error: errorMessage });
      alert(errorMessage || 'Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand selection:text-white">
      <Header 
        onSearch={() => {}} 
        currentCity="Berlin" 
        onWishlistClick={() => {}}
        onReservesClick={() => {}}
        highlightReserves={false}
        highlightWishlist={false}
        reservesCount={0}
        wishlistCount={0}
      />
      
      <main className="max-w-6xl mx-auto pt-16 px-6 pb-32">
        <motion.button 
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)} 
            className="flex items-center gap-3 text-gray-400 hover:text-brand font-black uppercase tracking-widest text-[10px] mb-12 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sanctuary
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Payment Form */}
          <div className="lg:col-span-7">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3.5rem] border-2 border-gray-100 p-10 md:p-14 shadow-2xl shadow-black/5 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <ShieldCheck className="w-40 h-40" />
                </div>

                <div className="flex items-center gap-6 mb-12">
                    <div className="w-16 h-16 bg-brand rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-brand/20">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">SECURE CHECKOUT</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Encrypted Transaction Protocol</p>
                    </div>
                </div>

                {success ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-brand/5 rounded-[3rem] border-2 border-brand/10"
                >
                    <div className="w-24 h-24 bg-brand rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand/40">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter mb-4 leading-none uppercase">TRANSACTION COMPLETE</h2>
                    <p className="text-gray-600 font-medium">Your booking is confirmed. Redirecting to dashboard...</p>
                </motion.div>
                ) : (
                <form onSubmit={handlePayment} className="space-y-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl border-2 border-gray-100">
                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                <Zap className="w-6 h-6 text-brand" />
                            </div>
                            <div>
                                <p className="font-black text-gray-900 uppercase tracking-tighter">Instant Confirmation</p>
                                <p className="text-xs text-gray-500 font-medium">Powered by Stripe Secure Gateway</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed px-2">
                            You will be redirected to the secure Stripe portal to finalize your payment. Your data is protected by military-grade encryption.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={isProcessing}
                            className="w-full bg-gray-900 text-white font-black py-6 rounded-[2rem] hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl shadow-black/20 uppercase tracking-widest text-xs"
                        >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                INITIALIZING GATEWAY...
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" /> PAY ${bookingDetails.totalRent} SECURELY
                            </>
                        )}
                        </motion.button>

                        <div className="flex items-center justify-center gap-8 opacity-40 grayscale">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
                            <div className="h-4 w-px bg-gray-300" />
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">PCI-DSS Compliant</span>
                            </div>
                        </div>
                    </div>
                </form>
                )}
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-50 rounded-[3.5rem] p-10 border-2 border-gray-100 sticky top-32 shadow-xl shadow-black/5"
            >
              <div className="flex items-center gap-3 mb-10">
                  <Sparkles className="w-5 h-5 text-brand" />
                  <h3 className="text-2xl font-black tracking-tighter uppercase">ORDER SUMMARY</h3>
              </div>
              
              <div className="flex gap-6 mb-10 pb-10 border-b-2 border-gray-200/50">
                <div className="relative group">
                    <img src={listing.images && listing.images[0] ? listing.images[0] : listing.imageUrl} alt={listing.title} className="w-32 h-32 object-cover rounded-[2rem] shadow-lg group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-black/10" />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-xl font-black tracking-tighter text-gray-900 leading-tight mb-2">{listing.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <Globe className="w-3 h-3" />
                      {listing.location}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {[
                    { label: 'Arrival Date', value: bookingDetails.moveInDate },
                    { label: 'Departure Date', value: bookingDetails.moveOutDate },
                    { label: 'Configuration', value: bookingDetails.configuration },
                    { label: 'Base Rent', value: `$${bookingDetails.totalRent}`, highlight: true }
                ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                        <span className={`font-bold ${item.highlight ? 'text-brand text-lg' : 'text-gray-900'}`}>{item.value}</span>
                    </div>
                ))}
                
                <div className="pt-8 mt-4 border-t-2 border-gray-200/50">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL PAYABLE</p>
                            <p className="text-4xl font-black tracking-tighter text-gray-900 leading-none">${bookingDetails.totalRent}</p>
                        </div>
                        <div className="bg-brand/10 px-4 py-2 rounded-xl">
                            <span className="text-[10px] font-black text-brand uppercase tracking-widest">USD</span>
                        </div>
                    </div>
                </div>
              </div>

              <div className="mt-10 p-6 bg-white rounded-3xl border border-gray-100 flex items-start gap-4">
                  <div className="p-2 bg-green-50 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                      <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">ENCHO Protection Active</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-1">Your payment is held in escrow until 24h after check-in.</p>
                  </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
