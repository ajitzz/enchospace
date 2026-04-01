import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Shield, Trash2, Edit, Plus, Users, Home, CreditCard, TrendingUp, Calendar, MapPin, DollarSign, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function Admin() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({ totalProperties: 0, totalBookings: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('properties');

  const deleteProperty = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProperties(prev => prev.filter((p: any) => p.id !== id));
        setStats(prev => ({ ...prev, totalProperties: Math.max(0, prev.totalProperties - 1) }));
      } else {
        alert('Failed to delete property');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting property');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/');
      } else {
        setUser(session.user);
      }
    });

    Promise.all([
      fetch('/api/properties').then(res => res.json()),
      fetch('/api/admin/stats').then(res => res.json())
    ])
    .then(([propsData, statsData]) => {
      setProperties(propsData);
      setStats(statsData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [navigate]);

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-black text-white rounded-2xl">
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" /> {trend}
            </span>
          )}
        </div>
        <h3 className="text-gray-500 font-medium mb-1">{title}</h3>
        <p className="text-3xl font-extrabold tracking-tight">{value}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header 
        onSearch={() => {}} 
        currentCity="Berlin" 
        onWishlistClick={() => {}}
        onReservesClick={() => {}}
        highlightReserves={false}
        highlightWishlist={false}
        reservesCount={0}
        wishlistCount={0}
      />
      
      <div className="flex max-w-[1920px] mx-auto pt-6 px-4 md:px-8 gap-8">
        {/* Admin Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-xl tracking-tight">Admin Panel</h2>
            </div>
            
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Activity className="w-5 h-5" /> Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('properties')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'properties' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Home className="w-5 h-5" /> Properties
              </button>
              <button 
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'bookings' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Calendar className="w-5 h-5" /> Bookings
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'users' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Users className="w-5 h-5" /> Users
              </button>
            </nav>
          </div>
        </aside>

        {/* Admin Content */}
        <main className="flex-1 pb-24">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                {activeTab === 'dashboard' && 'Overview'}
                {activeTab === 'properties' && 'Manage Properties'}
                {activeTab === 'bookings' && 'Recent Bookings'}
                {activeTab === 'users' && 'User Management'}
              </h1>
              <p className="text-gray-500">Welcome back, here's what's happening today.</p>
            </div>
            {activeTab === 'properties' && (
              <button onClick={() => navigate('/host')} className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-md">
                <Plus className="w-5 h-5" /> Add Property
              </button>
            )}
          </div>

          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-3xl"></div>)}
              </div>
              <div className="h-96 bg-gray-200 rounded-3xl w-full"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {(activeTab === 'dashboard' || activeTab === 'properties') && (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} trend="+12.5%" />
                    <StatCard title="Active Properties" value={stats.totalProperties} icon={Home} trend="+4.2%" />
                    <StatCard title="Total Bookings" value={stats.totalBookings} icon={Calendar} trend="+18.1%" />
                  </div>

                  {/* Properties Table */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Property Listings</h3>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Filter</button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Export</button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50">
                            <th className="py-4 px-6 font-bold text-gray-500 text-xs uppercase tracking-wider">Property</th>
                            <th className="py-4 px-6 font-bold text-gray-500 text-xs uppercase tracking-wider">Location</th>
                            <th className="py-4 px-6 font-bold text-gray-500 text-xs uppercase tracking-wider">Price</th>
                            <th className="py-4 px-6 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="py-4 px-6 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {properties.map((prop: any) => (
                            <tr key={prop.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                    <img src={prop.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} alt={prop.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900">{prop.title}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {prop.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center text-gray-600 text-sm">
                                  <MapPin className="w-4 h-4 mr-1.5 text-gray-400" /> {prop.location}
                                </div>
                              </td>
                              <td className="py-4 px-6 font-bold text-gray-900">${prop.price}<span className="text-sm font-normal text-gray-500">/nt</span></td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${prop.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${prop.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                  {prop.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteProperty(prop.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {properties.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-16 text-center text-gray-500">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Home className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="font-medium text-lg">No properties found</p>
                                <p className="text-sm mt-1">Get started by adding your first property.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab !== 'dashboard' && activeTab !== 'properties' && (
                <motion.div 
                  key="coming-soon"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center"
                >
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    {activeTab === 'bookings' ? <Calendar className="w-10 h-10 text-gray-400" /> : <Users className="w-10 h-10 text-gray-400" />}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                  <p className="text-gray-500 max-w-md mx-auto">This section is currently under development. Check back later for updates.</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
