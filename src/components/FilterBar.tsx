import React from 'react';
import { motion } from 'motion/react';
import { Home, Building2, Warehouse, TreePine, Palmtree, SlidersHorizontal, Sparkles, Waves, Mountain, Tent, Castle } from 'lucide-react';

const CATEGORIES = [
  { id: 'apartments', label: 'Apartments', icon: Building2 },
  { id: 'houses', label: 'Houses', icon: Home },
  { id: 'villas', label: 'Villas', icon: Warehouse },
  { id: 'cabins', label: 'Cabins', icon: TreePine },
  { id: 'beachfront', label: 'Beachfront', icon: Palmtree },
  { id: 'luxe', label: 'Luxe', icon: Sparkles },
  { id: 'islands', label: 'Islands', icon: Waves },
  { id: 'arctic', label: 'Arctic', icon: Mountain },
  { id: 'camping', label: 'Camping', icon: Tent },
  { id: 'castles', label: 'Castles', icon: Castle },
];

export default function FilterBar(): React.ReactElement {
  const [activeCategory, setActiveCategory] = React.useState('apartments');

  return (
    <div className="sticky top-20 z-40 bg-white/60 backdrop-blur-2xl border-b border-gray-100/50 px-4 md:px-8 py-4 flex items-center gap-6 overflow-x-auto scrollbar-hide">
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-brand/30 transition-all duration-300 whitespace-nowrap font-black text-[10px] uppercase tracking-widest group"
      >
        <SlidersHorizontal className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700 text-brand" />
        <span>Filters</span>
      </motion.button>
      
      <div className="h-8 w-px bg-gray-200/50 mx-2 hidden md:block" />

      <div className="flex gap-10">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center gap-2.5 group transition-all relative pb-3 min-w-[64px] ${isActive ? 'text-brand' : 'text-gray-400 hover:text-gray-900'}`}
            >
              <div className={`relative p-1 transition-transform duration-500 group-hover:-translate-y-1 ${isActive ? 'scale-110' : 'scale-100'}`}>
                <Icon className={`w-6 h-6 transition-colors duration-500 ${isActive ? 'text-brand' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {isActive && (
                    <motion.div 
                        layoutId="activeGlow"
                        className="absolute inset-0 bg-brand/10 blur-xl rounded-full -z-10"
                    />
                )}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-60 group-hover:opacity-100'}`}>
                {cat.label}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="activeUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
