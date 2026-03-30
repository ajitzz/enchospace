import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCardIcon, 
  LockIcon, 
  CheckCircleIcon, 
  ShieldCheckIcon, 
  Loader2Icon, 
  ChevronRightIcon,
  ArrowLeftIcon
} from 'lucide-react';
import { Listing } from '../types';

interface PaymentSectionProps {
  listing: Listing;
  totalAmount: number;
  onSuccess: (paymentId: string) => void;
  onBack: () => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({ listing, totalAmount, onSuccess, onBack }) => {
  const [step, setStep] = useState<'info' | 'processing' | 'success'>('info');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const handlePayment = () => {
    setStep('processing');
    // Simulate network latency for industrial feel
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess('pay_' + Math.random().toString(36).substr(2, 9));
      }, 2000);
    }, 3500);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      <AnimatePresence mode="wait">
        {step === 'info' && (
          <motion.div 
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to details
            </button>

            <div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Secure Checkout</h2>
              <p className="text-gray-500 font-medium">Complete your reservation for <span className="text-black font-bold">{listing.title}</span></p>
            </div>

            {/* Price Summary Card */}
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total to pay</p>
                <p className="text-3xl font-black text-gray-900">{listing.currency}{totalAmount.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <ShieldCheckIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cardholder Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  value={cardData.name}
                  onChange={(e) => setCardData({...cardData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 ring-black/5 outline-none font-medium transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Card Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={cardData.number}
                    onChange={(e) => setCardData({...cardData, number: formatCardNumber(e.target.value)})}
                    className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 ring-black/5 outline-none font-medium transition-all pl-14"
                  />
                  <CreditCardIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expiry Date</label>
                  <input 
                    type="text" 
                    placeholder="MM / YY"
                    maxLength={5}
                    value={cardData.expiry}
                    onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                    className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 ring-black/5 outline-none font-medium transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">CVC</label>
                  <input 
                    type="password" 
                    placeholder="•••"
                    maxLength={3}
                    value={cardData.cvc}
                    onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                    className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 ring-black/5 outline-none font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={!cardData.number || !cardData.name}
              className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all active:scale-[0.98] shadow-2xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm & Pay
              <ChevronRightIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 text-gray-400">
              <LockIcon className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">AES-256 Encrypted Payment</span>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div 
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-black/5 rounded-full animate-ping" />
              <div className="relative w-24 h-24 bg-black rounded-full flex items-center justify-center">
                <Loader2Icon className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Authorizing Payment</h2>
            <p className="text-gray-500 font-medium">Please do not refresh the page while we communicate with your bank.</p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-200"
            >
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Successful</h2>
            <p className="text-gray-500 font-medium">Your reservation has been confirmed. Redirecting to your bookings...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentSection;
