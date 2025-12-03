import React from 'react';
import { ChevronDown, FilterIcon } from './Icons';

const FilterChip = ({ label, active = false, hasDropdown = false }: { label: string; active?: boolean, hasDropdown?: boolean }) => (
  <button className={`
    group flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border select-none
    ${active 
        ? 'bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200' 
        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-sm active:bg-gray-50'}
  `}>
    {label}
    {hasDropdown && (
      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
    )}
  </button>
);

const FilterBar: React.FC = () => {
  return (
    <div className="sticky top-20 z-40 bg-white/85 backdrop-blur-xl border-b border-gray-100 py-3 md:py-4 transition-all duration-300">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 flex items-center justify-between">
        
        {/* Scrollable Filter List */}
        <div className="flex-1 flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide mask-fade-right pr-6 -mr-4 md:mr-0">
            <FilterChip label="All homes" active />
            <div className="h-6 w-px bg-gray-200 mx-1 flex-shrink-0"></div>
            <FilterChip label="Price" hasDropdown />
            <FilterChip label="Property type" hasDropdown />
            <FilterChip label="Amenities" hasDropdown />
            <FilterChip label="More filters" hasDropdown />
            <div className="h-6 w-px bg-gray-200 mx-1 flex-shrink-0"></div>
            <FilterChip label="Instant Book" />
            <FilterChip label="Free cancellation" />
            <FilterChip label="Verified Plus" />
        </div>

        {/* Right Toggle / Action - Hidden on mobile to save space */}
        <div className="hidden xl:flex items-center gap-6 flex-shrink-0 pl-6 border-l border-gray-100">
             <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <FilterIcon className="w-4 h-4" />
                <span>Filters</span>
             </button>
             
             <div className="flex items-center gap-3 text-sm font-medium text-gray-600 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                <span>Total price</span>
                <div className="w-9 h-5 bg-gray-200 rounded-full relative transition-colors hover:bg-gray-300">
                    <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transform transition-transform"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;