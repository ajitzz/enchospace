import React from 'react';
import { motion } from 'motion/react';
import { Listing } from '../types';
import { Map as MapIcon, Navigation, Target, Layers } from 'lucide-react';

interface Props {
  listings: Listing[];
  highlightedId: string | null;
  className?: string;
}

export default function MapSidebar({ listings, highlightedId, className }: Props) {
  return (
    <div className={`relative bg-gray-900 flex items-center justify-center rounded-[2.5rem] overflow-hidden shadow-2xl ${className || ''}`}>
      {/* High-tech Grid Background */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#E31C5F 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-brand/10" />
      
      {/* Animated Scan Line */}
      <motion.div 
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-brand/30 blur-sm z-10"
      />

      <div className="relative z-20 text-center p-12">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-32 h-32 mx-auto mb-8"
        >
            <div className="absolute inset-0 bg-brand/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-0 border-2 border-brand/30 rounded-full animate-spin-slow" />
            <div className="absolute inset-2 border border-brand/20 rounded-full animate-reverse-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
                <MapIcon className="w-12 h-12 text-brand" />
            </div>
        </motion.div>

        <h3 className="text-3xl font-black text-white tracking-tighter mb-2 leading-none uppercase">Interactive Map</h3>
        <p className="text-brand font-bold uppercase tracking-[0.3em] text-[10px] mb-8">Real-time Property Tracking</p>
        
        <div className="flex flex-wrap justify-center gap-4">
            <div className="glass-dark px-6 py-3 rounded-2xl border-white/10 flex items-center gap-3">
                <Target className="w-4 h-4 text-brand" />
                <span className="text-sm font-bold text-white">{listings.length} Active Nodes</span>
            </div>
            <div className="glass-dark px-6 py-3 rounded-2xl border-white/10 flex items-center gap-3">
                <Layers className="w-4 h-4 text-brand" />
                <span className="text-sm font-bold text-white">3 Layers Active</span>
            </div>
        </div>

        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-12 px-10 py-4 bg-brand text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-brand/40 hover:bg-brand/90 transition-all flex items-center gap-3 mx-auto"
        >
            <Navigation className="w-4 h-4" />
            Initialize Map View
        </motion.button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-8 left-8 flex flex-col gap-1">
        <div className="w-12 h-1 bg-brand/40 rounded-full" />
        <div className="w-8 h-1 bg-brand/20 rounded-full" />
      </div>
      <div className="absolute bottom-8 right-8 text-right">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em]">System Status: Optimal</p>
          <p className="text-[8px] font-black text-brand/40 uppercase tracking-[0.5em]">Lat: 52.5200° N | Lon: 13.4050° E</p>
      </div>
    </div>
  );
}
