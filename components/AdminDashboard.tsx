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
  SparklesIcon,
  BarChart3Icon,
  PieChartIcon,
  ActivityIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Listing, AdminStats } from '../types';
import { generateListingDescription } from '../services/geminiService';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings' | 'stats' | 'users' | 'payments'>('stats');
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');

  const [newListing, setNewListing] = useState<Partial<Listing>>({
    title: '',
    price: 0,
    type: 'APARTMENT',
    city: '',
    address: '',
    description: '',
    imageUrl: 'https://picsum.photos/seed/admin/1200/800',
    currency: '€',
    period: 'month',
    amenities: ['Wifi', 'Kitchen'],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    size: 50
  });

  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
  ];

  const propertyTypeData = [
    { name: 'Apartments', value: 400 },
    { name: 'Rooms', value: 300 },
    { name: 'Studios', value: 300 },
  ];

  const COLORS = ['#E31C5F', '#000000', '#717171', '#FFBB28', '#FF8042'];

  useEffect(() => {
    fetchData();
    checkRole();
  }, [activeTab]);

  const checkRole = async () => {
    if (!auth.currentUser) return;
    const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
    if (!userSnap.empty) {
        setUserRole(userSnap.docs[0].data().role);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings') {
        const q = userRole === 'super_admin' 
          ? query(collection(db, 'listings'))
          : query(collection(db, 'listings'), where('ownerId', '==', auth.currentUser?.uid));
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        setListings(data);
      } else if (activeTab === 'bookings' || activeTab === 'payments') {
        const response = await fetch('/api/reservations');
        const data = await response.json();
        setBookings(data);
      } else if (activeTab === 'users') {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } else if (activeTab === 'stats') {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        setStats(data);
      }
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
        ...(editingListing || newListing),
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        rating: 4.5,
        reviewCount: 0,
        isVerified: true,
        imageCount: 5
      };
      
      if (editingListing) {
        // Update Postgres
        await fetch(`/api/listings/${editingListing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(listingData)
        });
        // Update Firestore
        await updateDoc(doc(db, 'listings', editingListing.id), listingData);
      } else {
        // Save to Postgres via API
        const res = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(listingData)
        });
        const savedListing = await res.json();

        // Save to Firestore for real-time sync (using same ID if possible or just add)
        await addDoc(collection(db, 'listings'), { ...listingData, postgresId: savedListing.id });
      }
      
      setShowAddModal(false);
      setEditingListing(null);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'listings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      // Delete from Postgres
      await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      // Delete from Firestore
      await deleteDoc(doc(db, 'listings', id));
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'listings');
    }
  };

  const handleUpdateUserRole = async (uid: string, role: string) => {
    try {
      await fetch(`/api/users/${uid}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      // Update Firestore role as well
      await updateDoc(doc(db, 'users', uid), { role });
      fetchData();
    } catch (e) {
      console.error("Update Role Error:", e);
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (e) {
      console.error("Update Booking Error:", e);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const handleGenerateDescription = async () => {
    const current = editingListing || newListing;
    if (!current.title || !current.city) return;
    setIsGenerating(true);
    try {
      const desc = await generateListingDescription({
        title: current.title,
        type: current.type || 'APARTMENT',
        city: current.city,
        amenities: current.amenities || []
      });
      if (editingListing) {
        setEditingListing({ ...editingListing, description: desc });
      } else {
        setNewListing({ ...newListing, description: desc });
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
    } finally {
      setIsGenerating(false);
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
            { label: 'Total Revenue', value: stats ? `€${stats.totalRevenue.toLocaleString()}` : '...', icon: DollarSignIcon, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Active Listings', value: stats ? stats.totalListings : '...', icon: HomeIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Bookings', value: stats ? stats.totalReservations : '...', icon: TrendingUpIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Total Users', value: stats ? stats.activeUsers : '...', icon: UsersIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
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
          {['stats', 'listings', 'bookings', 'users', 'payments'].filter(tab => {
            if (tab === 'users') return userRole === 'super_admin';
            return true;
          }).map((tab) => (
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
          {activeTab === 'bookings' && (
            <motion.div 
              key="bookings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Guest</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Property</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Move In</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Amount</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                            {booking.user_id.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm">Guest ID: {booking.user_id.substring(0, 8)}</p>
                            <p className="text-xs text-gray-400">Verified</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <img src={booking.listing_image} className="w-10 h-10 rounded-lg object-cover" />
                          <p className="font-bold text-sm">{booking.listing_title}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-sm">{new Date(booking.move_in_date).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-sm">€{booking.total_rent}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {booking.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                              className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                              title="Confirm Booking"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Cancel Booking"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold">No bookings found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black tracking-tight">Revenue Trends</h3>
                    <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                        <TrendingUpIcon className="w-5 h-5" />
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#E31C5F" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#E31C5F" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#999'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#999'}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 700 }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#E31C5F" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black tracking-tight">Property Distribution</h3>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <PieChartIcon className="w-5 h-5" />
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={propertyTypeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {propertyTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">User</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Email</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Role</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          {user.photo_url ? (
                            <img src={user.photo_url} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                              {user.display_name?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                          )}
                          <p className="font-bold text-sm">{user.display_name || 'Anonymous'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          value={user.role || 'user'}
                          onChange={(e) => handleUpdateUserRole(user.uid, e.target.value)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-none focus:ring-2 ring-black/5 outline-none cursor-pointer ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-600' : 
                            user.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

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
                        <button 
                          onClick={() => {
                            setEditingListing(listing);
                            setShowAddModal(true);
                          }}
                          className="p-3 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-black transition-colors"
                        >
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
          {activeTab === 'payments' && (
            <motion.div 
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Transaction ID</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Property</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Amount</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Date</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-mono text-xs font-bold text-gray-400">TXN-{booking.id.substring(0, 8).toUpperCase()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-sm">{booking.listing_title}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-sm text-green-600">€{booking.total_rent}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-500">{new Date(booking.move_in_date).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <h2 className="text-2xl font-black tracking-tight">{editingListing ? 'Edit Property' : 'Add New Property'}</h2>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingListing(null);
                  }}
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
                      value={editingListing ? editingListing.title : newListing.title}
                      onChange={(e) => editingListing ? setEditingListing({...editingListing, title: e.target.value}) : setNewListing({...newListing, title: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium"
                      placeholder="Modern Penthouse"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price per Month</label>
                    <input 
                      type="number" 
                      value={editingListing ? editingListing.price : newListing.price}
                      onChange={(e) => editingListing ? setEditingListing({...editingListing, price: Number(e.target.value)}) : setNewListing({...newListing, price: Number(e.target.value)})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium"
                      placeholder="1200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Property Type</label>
                    <select 
                      value={editingListing ? editingListing.type : newListing.type}
                      onChange={(e) => editingListing ? setEditingListing({...editingListing, type: e.target.value as any}) : setNewListing({...newListing, type: e.target.value as any})}
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
                      value={editingListing ? editingListing.city : newListing.city}
                      onChange={(e) => editingListing ? setEditingListing({...editingListing, city: e.target.value}) : setNewListing({...newListing, city: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Address</label>
                  <input 
                    type="text" 
                    value={editingListing ? editingListing.address : newListing.address}
                    onChange={(e) => editingListing ? setEditingListing({...editingListing, address: e.target.value}) : setNewListing({...newListing, address: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium"
                    placeholder="123 Luxury Ave, Berlin"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                    <button 
                      onClick={handleGenerateDescription}
                      disabled={isGenerating}
                      className="text-[10px] font-black text-[#E31C5F] uppercase tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2Icon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                  <textarea 
                    value={editingListing ? editingListing.description : newListing.description}
                    onChange={(e) => editingListing ? setEditingListing({...editingListing, description: e.target.value}) : setNewListing({...newListing, description: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-black/5 outline-none font-medium min-h-[120px] resize-none"
                    placeholder="Tell us about your space..."
                  />
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex items-center justify-end gap-4">
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingListing(null);
                  }}
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
                    editingListing ? 'Update Listing' : 'Publish Listing'
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
