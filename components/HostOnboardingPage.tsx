import React from 'react';
import { ChevronLeft, HouseIcon, ShieldCheck, CalendarIcon, DollarIcon } from './Icons';

interface HostOnboardingPageProps {
  onBack: () => void;
}

const HostOnboardingPage: React.FC<HostOnboardingPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-full transition-all group font-semibold"
          >
            <div className="p-1.5 rounded-full bg-gray-100 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-200 shadow-sm">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-sm">Back to explore</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900 hidden md:block">Host your space</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E31C5F] via-[#D91B62] to-orange-500 text-white p-8 md:p-12 shadow-xl mb-8">
          <HouseIcon className="absolute right-6 bottom-4 w-24 h-24 text-white/15" />
          <p className="text-sm font-bold uppercase tracking-widest text-white/80 mb-3">ENCHO Host Network</p>
          <h2 className="text-3xl md:text-5xl font-black leading-tight mb-3">Turn your property into predictable income</h2>
          <p className="text-white/90 font-medium max-w-2xl">
            We have prepared enterprise-grade hosting infrastructure: listing controls, payment modes,
            booking models, and moderation quality gates. Start with individual hosting in a guided workflow.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <ShieldCheck className="w-7 h-7 text-[#E31C5F] mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Trust & Verification</h3>
            <p className="text-sm text-gray-600">KYC status, risk tiering, and admin review keep your listing credible.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <CalendarIcon className="w-7 h-7 text-[#E31C5F] mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Booking Modes</h3>
            <p className="text-sm text-gray-600">Choose Request-to-Book, Instant Book, or Manual Approval per listing.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <DollarIcon className="w-7 h-7 text-[#E31C5F] mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Flexible Payments</h3>
            <p className="text-sm text-gray-600">Full upfront, deposit + balance, or pay-later based on admin policy.</p>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Implementation status</h3>
          <p className="text-gray-600 mb-6">
            Production backend foundation and policy contracts are now added. Next iteration wires this screen
            to live onboarding APIs and document verification uploads.
          </p>
          <button className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95">
            Continue setup (API wiring next)
          </button>
        </section>
      </main>
    </div>
  );
};

export default HostOnboardingPage;
