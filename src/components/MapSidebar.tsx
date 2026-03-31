import React from 'react';
import { Listing } from '../types';

interface Props {
  listings: Listing[];
  highlightedId: string | null;
  className?: string;
}

export default function MapSidebar({ listings, highlightedId, className }: Props) {
  return (
    <div className={`bg-gray-100 flex items-center justify-center rounded-2xl overflow-hidden shadow-inner ${className || ''}`}>
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
        </div>
        <h3 className="text-lg font-bold text-gray-700">Map View</h3>
        <p className="text-gray-500">{listings.length} properties available</p>
      </div>
    </div>
  );
}
