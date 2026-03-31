import React from 'react';

export default function FilterBar() {
  return (
    <div className="sticky top-20 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 overflow-x-auto hide-scrollbar">
      <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:border-black transition-colors whitespace-nowrap">
        <span>Filters</span>
      </button>
      <div className="flex gap-4">
        {['Apartments', 'Houses', 'Villas', 'Cabins', 'Beachfront'].map((category) => (
          <button key={category} className="px-4 py-2 rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap font-medium text-gray-600 hover:text-black">
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
