import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusIcon, 
  TrashIcon, 
  EditIcon, 
  TrendingUpIcon, 
  UsersIcon, 
  HomeIcon, 
  DollarSignIcon,
  SearchIcon,
  XIcon,
  CheckCircleIcon,
  Loader2Icon,
  SparklesIcon
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Listing, AdminStats } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings' | 'stats'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [newListing, setNewListing] = useState<Partial<Listing>>({
    title: '',
    price: 0,
    currency: '€',
    period: 'month',
    type: 'APARTMENT',
    city: 'Berlin',
    address: '',
    description: '',
    amenities: ['Wifi', 'Kitchen'],
    imageUrl: 'https://picsum.photos/seed/new/800/600'
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/listings');
      const data = await res.json();
      // Filter by current user if needed, or backend can do it
      const userListings = data.filter((l: any) => l.host_id === auth.currentUser?.uid);
      setListings(userListings);
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddListing = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const listingData = {
        title: newListing.title,
        description: newListing.description,
        property_type: newListing.type,
        price_per_night: newListing.price,
        location_city: newListing.city,
        amenities: newListing.amenities,
        images: [newListing.imageUrl],
        host_id: auth.currentUser.uid,
      };
      
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData)
      });
      
      if (res.ok) {
        setShowAddModal(false);
        fetchListings();
      }
    } catch (e) {
      console.error("Create Error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteDoc(doc(db, 'listings', id));
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'listings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-8 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-2 rounded-xl">
            <HomeIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Property Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="text-sm font-bold text-gray-600 hover:text-black transition-colors"
          >
            Back to Site
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#E31C5F] hover:bg-[#C90E4F] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-pink-200"
          >
            <PlusIcon className="w-4 h-4" />
            Add Property
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Revenue', value: '€12,450', icon: DollarSignIcon, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Active Listings', value: listings.length, icon: HomeIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Bookings', value: '48', icon: TrendingUpIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Total Users', value: '1,240', icon: UsersIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5"
            >
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-gray-200">
          {['listings', 'bookings', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'listings' && (
            <motion.div 
              key="listings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2Icon className="w-10 h-10 animate-spin text-gray-300" />
                  <p className="text-gray-400 font-medium">Loading your properties...</p>
                </div>
              ) : listings.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                    <HomeIcon className="w-10 h-10 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">No properties yet</h3>
                    <p className="text-gray-500">Start by adding your first rental property.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="mt-2 bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                  >
                    Add Property
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-gray-200 transition-all">
                      <img 
                        src={listing.imageUrl} 
                        alt={listing.title} 
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{listing.title}</h3>
                          {listing.isVerified && <CheckCircleIcon className="w-4 h-4 text-blue-500" />}
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-1">{listing.address}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-gray-900">{listing.currency}{listing.price}/{listing.period}</span>
                          <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-md uppercase tracking-wider text-gray-500">{listing.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-3 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-black transition-colors">
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(listing.id)}
                          className="p-3 hover:bg-red-50 rounded-xl text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Add New Property</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Property Title</label>
                    <input 
                      type="text" 
                      value={newListing.title}
                      onChange={(e) => setNewListing({...newListing, title: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium"
                      placeholder="Modern Penthouse"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price per Month</label>
                    <input 
                      type="number" 
                      value={newListing.price}
                      onChange={(e) => setNewListing({...newListing, price: Number(e.target.value)})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium"
                      placeholder="1200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Property Type</label>
                    <select 
                      value={newListing.type}
                      onChange={(e) => setNewListing({...newListing, type: e.target.value as any})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium"
                    >
                      <option value="APARTMENT">Apartment</option>
                      <option value="ROOM">Private Room</option>
                      <option value="STUDIO">Studio</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">City</label>
                    <input 
                      type="text" 
                      value={newListing.city}
                      onChange={(e) => setNewListing({...newListing, city: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Address</label>
                  <input 
                    type="text" 
                    value={newListing.address}
                    onChange={(e) => setNewListing({...newListing, address: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium"
                    placeholder="123 Luxury Ave, Berlin"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                    <button className="text-[10px] font-black text-[#E31C5F] uppercase tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity">
                      <SparklesIcon className="w-3 h-3" />
                      Generate with AI
                    </button>
                  </div>
                  <textarea 
                    value={newListing.description}
                    onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium min-h-[120px] resize-none"
                    placeholder="Tell us about your space..."
                  />
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex items-center justify-end gap-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddListing}
                  disabled={isSaving}
                  className="bg-black text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <><Loader2Icon className="w-5 h-5 animate-spin" /> Saving...</>
                  ) : (
                    'Publish Listing'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
