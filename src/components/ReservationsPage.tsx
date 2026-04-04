import React from 'react';
import { Reservation } from '../types';
import { Calendar, Clock } from 'lucide-react';

interface Props {
  reservations: Reservation[];
  onBack: () => void;
  onListingClick: (id: string) => void;
}

export default function ReservationsPage({ reservations, onBack, onListingClick }: Props): React.ReactElement {
  return (
    <div className="max-w-7xl mx-auto p-6 mt-8 font-sans">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-brand font-black uppercase tracking-widest text-[10px] transition-colors">
        <span className="text-lg">&larr;</span> Back to Search
      </button>
      
      <div className="flex items-baseline gap-4 mb-12">
        <h1 className="text-6xl font-black tracking-tighter uppercase text-gray-900">Reservations</h1>
        <div className="h-2 w-2 bg-brand rounded-full animate-pulse" />
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <p className="text-xl font-black text-gray-400 uppercase tracking-tighter">No active reservations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reservations.map(r => (
            <div 
              key={r.id} 
              className="group relative bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer"
              onClick={() => onListingClick(r.property_id.toString())}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter text-gray-900 uppercase group-hover:text-brand transition-colors">
                    {r.property_title || 'Property Booking'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      r.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-gray-900">${r.total_price}</div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Paid</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-brand transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check In</div>
                    <div className="text-sm font-bold text-gray-900">{new Date(r.start_date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-brand transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check Out</div>
                    <div className="text-sm font-bold text-gray-900">{new Date(r.end_date).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
                  <span className="text-lg">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
