import React from 'react';
import { Home, Building2, Warehouse, TreePine, Palmtree, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  { id: 'apartments', label: 'Apartments', icon: Building2 },
  { id: 'houses', label: 'Houses', icon: Home },
  { id: 'villas', label: 'Villas', icon: Warehouse },
  { id: 'cabins', label: 'Cabins', icon: TreePine },
  { id: 'beachfront', label: 'Beachfront', icon: Palmtree },
];

export default function FilterBar() {
  const [activeCategory, setActiveCategory] = React.useState('apartments');

  return (
    <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex items-center gap-6 overflow-x-auto scrollbar-hide">
      <button className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border border-gray-200 hover:border-black hover:bg-gray-50 transition-all duration-300 whitespace-nowrap font-bold text-sm shadow-sm group">
        <SlidersHorizontal className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
        <span>Filters</span>
      </button>
      
      <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block" />

      <div className="flex gap-8">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center gap-2 group transition-all relative pb-2 ${isActive ? 'text-black' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Icon className={`w-6 h-6 transition-transform group-hover:-translate-y-0.5 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className={`text-xs font-bold tracking-tight whitespace-nowrap ${isActive ? 'opacity-100' : 'opacity-80'}`}>{cat.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
