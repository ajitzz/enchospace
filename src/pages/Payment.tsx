import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { CreditCard, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { listing, bookingDetails } = location.state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!listing || !bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No booking details found</h2>
          <button onClick={() => navigate('/')} className="text-blue-600 font-medium hover:underline">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property_id: listing.id,
            user_name: bookingDetails.name,
            user_phone: bookingDetails.phone,
            start_date: bookingDetails.moveInDate,
            end_date: bookingDetails.moveInDate, // Simplified for now
            total_price: bookingDetails.totalRent,
          }),
        });
        if (res.ok) {
          setSuccess(true);
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (err) {
        console.error('Payment failed', err);
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
      
      <main className="max-w-4xl mx-auto pt-12 px-4 pb-24">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Booking
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Payment Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
                <CreditCard className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Secure Payment</h1>
            </div>

            {success ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-gray-600">Your booking is confirmed. Redirecting...</p>
              </div>
            ) : (
              <form onSubmit={handlePayment} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Card Information</label>
                  <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-all">
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 border-b border-gray-200 outline-none"
                      placeholder="Card number"
                    />
                    <div className="flex">
                      <input 
                        required
                        type="text" 
                        className="w-1/2 px-4 py-3 border-r border-gray-200 outline-none"
                        placeholder="MM / YY"
                      />
                      <input 
                        required
                        type="text" 
                        className="w-1/2 px-4 py-3 outline-none"
                        placeholder="CVC"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Name on Card</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    'Processing...'
                  ) : (
                    <>
                      <Lock className="w-5 h-5" /> Pay ${bookingDetails.totalRent}
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Payments are secure and encrypted.
                </p>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:pl-8">
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200 sticky top-24">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>
              
              <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
                <img src={listing.images[0]} alt={listing.title} className="w-24 h-24 object-cover rounded-xl" />
                <div>
                  <h4 className="font-bold text-gray-900 line-clamp-2">{listing.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{listing.type} • {listing.size}m²</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Move-in Date</span>
                  <span className="font-medium text-gray-900">{bookingDetails.moveInDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Configuration</span>
                  <span className="font-medium text-gray-900">{bookingDetails.configuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent</span>
                  <span className="font-medium text-gray-900">${bookingDetails.totalRent}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900 text-lg">${bookingDetails.totalRent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
