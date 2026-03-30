import React from 'react';
import { ChevronLeft, ShieldCheck, CalendarIcon, SettingsIcon } from './Icons';

interface AdminControlPageProps {
  onBack: () => void;
}

const AdminControlPage: React.FC<AdminControlPageProps> = ({ onBack }) => {
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
          <h1 className="text-lg font-bold text-gray-900 hidden md:block">Admin control center</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Production operations panel scaffolded</h2>
          <p className="text-gray-600">
            This screen is intentionally aligned with your current visual quality while backend modules are connected.
            New backend contracts now support policy overrides, booking/payment modes, and audit trails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <ShieldCheck className="w-7 h-7 text-[#E31C5F] mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Moderation</h3>
            <p className="text-sm text-gray-600">Approve/reject listings, enforce quality and trust gates.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <CalendarIcon className="w-7 h-7 text-[#E31C5F] mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Bookings Ops</h3>
            <p className="text-sm text-gray-600">Investigate statuses, intervene on exceptions and disputes.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <SettingsIcon className="w-7 h-7 text-[#E31C5F] mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Policy Engine</h3>
            <p className="text-sm text-gray-600">Global defaults and per-listing override controls.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminControlPage;
