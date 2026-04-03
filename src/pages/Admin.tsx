import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Shield, Trash2, Edit, Plus, Users, Home, CreditCard, TrendingUp, Calendar, MapPin, DollarSign, Activity, Search as SearchIcon, Phone as PhoneIcon, LayoutDashboard, Settings, LogOut, BarChart3, Layers, Zap, Sparkles, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

export default function Admin() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalProperties: 0, totalBookings: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propsData, statsData, bookingsData, usersData] = await Promise.all([
        fetchApi('/api/properties'),
        fetchApi('/api/admin/stats'),
        fetchApi('/api/admin/bookings'),
        fetchApi('/api/admin/users')
      ]);
      setProperties(propsData || []);
      setStats(statsData || { totalProperties: 0, totalBookings: 0, totalRevenue: 0 });
      setBookings(bookingsData || []);
      setUsers(usersData || []);
    } catch (err: any) {
      console.error('Admin data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await fetchApi(`/api/properties/${id}`, { method: 'DELETE' });
      setProperties(prev => prev.filter((p: any) => p.id !== id));
      setStats(prev => ({ ...prev, totalProperties: Math.max(0, prev.totalProperties - 1) }));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error deleting property');
    }
  };

  const updateBookingStatus = async (id: number, status: string) => {
    try {
      await fetchApi(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setBookings(prev => prev.map((b: any) => b.id === id ? { ...b, status } : b));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error updating booking');
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

    fetchData();
  }, [navigate]);

  const filteredBookings = bookings.filter((b: any) => {
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesSearch = b.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.property_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredUsers = users.filter((u: any) => 
    u.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.user_phone.includes(searchTerm)
  );

  const filteredProperties = properties.filter((p: any) => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, trend, color = "brand" }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-xl shadow-black/5 relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700`} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 bg-gray-900 text-white rounded-2xl shadow-lg shadow-black/20 group-hover:bg-${color} transition-colors duration-500`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className="flex items-center text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
              <TrendingUp className="w-3 h-3 mr-1" /> {trend}
            </span>
          )}
        </div>
        <h3 className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2">{title}</h3>
        <p className="text-4xl font-black tracking-tighter text-gray-900">{value}</p>
      </div>
    </motion.div>
  );

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'properties', label: 'PROPERTIES', icon: Home },
    { id: 'bookings', label: 'BOOKINGS', icon: Calendar },
    { id: 'users', label: 'USERS', icon: Users },
    { id: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
    { id: 'settings', label: 'SYSTEM', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand selection:text-white">
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
      
      <div className="flex max-w-[1920px] mx-auto pt-12 px-6 md:px-12 gap-12">
        {/* Admin Sidebar */}
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <div className="sticky top-32 bg-gray-50 rounded-[3rem] border-2 border-gray-100 p-8 shadow-xl shadow-black/5">
            <div className="flex items-center gap-4 mb-12 px-2">
              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-black/30">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-xl tracking-tighter uppercase leading-none">COMMAND</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Central Interface</p>
              </div>
            </div>
            
            <nav className="space-y-3">
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all relative group ${activeTab === item.id ? 'bg-gray-900 text-white shadow-2xl shadow-black/20' : 'text-gray-400 hover:bg-white hover:text-gray-900'}`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-brand' : 'group-hover:text-brand'} transition-colors`} />
                  {item.label}
                  {activeTab === item.id && (
                    <motion.div 
                        layoutId="activeTab"
                        className="absolute left-0 w-1.5 h-6 bg-brand rounded-full -ml-0.75"
                    />
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-20 pt-8 border-t-2 border-gray-200/50">
                <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-red-400 hover:bg-red-50 transition-all">
                    <LogOut className="w-5 h-5" />
                    TERMINATE SESSION
                </button>
            </div>
          </div>
        </aside>

        {/* Admin Content */}
        <main className="flex-1 pb-32">
          <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-brand uppercase tracking-widest">System Operational</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                {activeTab === 'dashboard' && 'OVERVIEW'}
                {activeTab === 'properties' && 'INVENTORY'}
                {activeTab === 'bookings' && 'TRANSACTIONS'}
                {activeTab === 'users' && 'POPULATION'}
                {activeTab === 'analytics' && 'INTELLIGENCE'}
                {activeTab === 'settings' && 'PROTOCOLS'}
              </h1>
              <p className="text-gray-400 font-medium mt-4 max-w-md">Real-time data synchronization with global property network.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <motion.button 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                onClick={fetchData}
                disabled={loading}
                className="p-4 bg-white border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-xl shadow-black/5 active:scale-95 disabled:opacity-50"
              >
                <Activity className={`w-6 h-6 text-gray-900 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              {activeTab === 'properties' && (
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/host')} 
                    className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-2xl shadow-black/20"
                >
                  <Plus className="w-5 h-5 text-brand" /> ADD ASSET
                </motion.button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-50 rounded-[2.5rem] animate-pulse border-2 border-gray-100"></div>)}
              </div>
              <div className="h-[30rem] bg-gray-50 rounded-[3rem] w-full animate-pulse border-2 border-gray-100"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {(activeTab === 'dashboard' || activeTab === 'properties') && (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} trend="+12.5%" color="brand" />
                    <StatCard title="Active Assets" value={stats.totalProperties} icon={Layers} trend="+4.2%" color="blue-500" />
                    <StatCard title="Total Bookings" value={stats.totalBookings} icon={Zap} trend="+18.1%" color="yellow-500" />
                  </div>

                  {/* Properties Table */}
                  <div className="bg-white rounded-[3rem] shadow-2xl shadow-black/5 border-2 border-gray-100 overflow-hidden">
                    <div className="p-10 border-b-2 border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-50 rounded-2xl">
                              <Home className="w-6 h-6 text-gray-900" />
                          </div>
                          <h3 className="font-black text-2xl tracking-tighter uppercase">ASSET REPOSITORY</h3>
                      </div>
                      <div className="relative w-full md:w-80">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="SCAN DATABASE..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-brand transition-all"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50">
                            <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Asset Identification</th>
                            <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Geographic Data</th>
                            <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Valuation</th>
                            <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Status</th>
                            <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest text-right">Operations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProperties.map((prop: any) => (
                            <tr key={prop.id} className="border-b-2 border-gray-50 hover:bg-gray-50/30 transition-colors group">
                              <td className="py-8 px-10">
                                <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                    <img src={prop.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} alt={prop.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <div className="font-black text-lg tracking-tighter text-gray-900 uppercase">{prop.title}</div>
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">UUID: {prop.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-8 px-10">
                                <div className="flex items-center text-gray-600 text-xs font-bold uppercase tracking-tight">
                                  <MapPin className="w-4 h-4 mr-2 text-brand" /> {prop.location}
                                </div>
                              </td>
                              <td className="py-8 px-10">
                                  <div className="flex items-baseline gap-1">
                                      <span className="text-xl font-black text-gray-900">${prop.price}</span>
                                      <span className="text-[10px] font-black text-gray-400 uppercase">/ CYCLE</span>
                                  </div>
                              </td>
                              <td className="py-8 px-10">
                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${prop.status === 'available' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${prop.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                  {prop.status}
                                </span>
                              </td>
                              <td className="py-8 px-10 text-right">
                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-xl transition-colors border border-transparent hover:border-brand/10"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </motion.button>
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => deleteProperty(prop.id)}
                                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </motion.button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredProperties.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-32 text-center text-gray-500">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                  <Home className="w-10 h-10 text-gray-300" />
                                </div>
                                <p className="font-black text-2xl tracking-tighter uppercase text-gray-900">No assets detected</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Adjust scan parameters or initialize new asset.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'bookings' && (
                <motion.div 
                  key="bookings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[3rem] shadow-2xl shadow-black/5 border-2 border-gray-100 overflow-hidden"
                >
                  <div className="p-10 border-b-2 border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-2xl">
                            <Calendar className="w-6 h-6 text-gray-900" />
                        </div>
                        <h3 className="font-black text-2xl tracking-tighter uppercase">TRANSACTION LOGS</h3>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="relative flex-1 md:w-80">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="SEARCH LOGS..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-brand transition-all"
                        />
                      </div>
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand transition-all"
                      >
                        <option value="all">ALL STATUS</option>
                        <option value="pending">PENDING</option>
                        <option value="confirmed">CONFIRMED</option>
                        <option value="cancelled">CANCELLED</option>
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Client Entity</th>
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Asset Reference</th>
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Temporal Range</th>
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Value</th>
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Status</th>
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest text-right">Operations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking: any) => (
                          <tr key={booking.id} className="border-b-2 border-gray-50 hover:bg-gray-50/30 transition-colors">
                            <td className="py-8 px-10">
                              <div className="font-black text-gray-900 uppercase tracking-tight">{booking.user_name}</div>
                              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{booking.user_phone}</div>
                            </td>
                            <td className="py-8 px-10 text-xs font-bold text-gray-600 uppercase tracking-tight">{booking.property_title}</td>
                            <td className="py-8 px-10 text-xs font-bold text-gray-600 uppercase tracking-tight">
                              {new Date(booking.start_date).toLocaleDateString()} — {new Date(booking.end_date).toLocaleDateString()}
                            </td>
                            <td className="py-8 px-10 font-black text-gray-900">${booking.total_price}</td>
                            <td className="py-8 px-10">
                              <select 
                                value={booking.status}
                                onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border-2 outline-none cursor-pointer transition-all ${
                                  booking.status === 'confirmed' ? 'bg-green-50 text-green-600 border-green-100' : 
                                  booking.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                                  'bg-yellow-50 text-yellow-600 border-yellow-100'
                                }`}
                              >
                                <option value="pending">PENDING</option>
                                <option value="confirmed">CONFIRMED</option>
                                <option value="cancelled">CANCELLED</option>
                              </select>
                            </td>
                            <td className="py-8 px-10 text-right">
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => window.open(`tel:${booking.user_phone.replace(/\D/g, '')}`, '_self')}
                                className="p-3 text-brand hover:bg-brand/5 rounded-xl transition-colors border border-transparent hover:border-brand/10"
                                title="Call Customer"
                              >
                                <PhoneIcon className="w-5 h-5" />
                              </motion.button>
                            </td>
                          </tr>
                        ))}
                        {filteredBookings.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-32 text-center text-gray-500">No transaction records detected</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div 
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[3rem] shadow-2xl shadow-black/5 border-2 border-gray-100 overflow-hidden"
                >
                  <div className="p-10 border-b-2 border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-2xl">
                            <Users className="w-6 h-6 text-gray-900" />
                        </div>
                        <h3 className="font-black text-2xl tracking-tighter uppercase">POPULATION INDEX</h3>
                    </div>
                    <div className="relative w-full md:w-80">
                      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="SCAN ENTITIES..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-brand transition-all"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Entity Name</th>
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Contact Protocol</th>
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest">Registry Date</th>
                          <th className="py-6 px-10 font-black text-gray-400 text-[10px] uppercase tracking-widest text-right">Operations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u: any, i: number) => (
                          <tr key={i} className="border-b-2 border-gray-50 hover:bg-gray-50/30 transition-colors group">
                            <td className="py-8 px-10">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-xs font-black text-brand shadow-lg">
                                  {u.user_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="font-black text-gray-900 uppercase tracking-tight text-lg">{u.user_name}</div>
                              </div>
                            </td>
                            <td className="py-8 px-10 text-xs font-bold text-gray-600 uppercase tracking-widest">{u.user_phone}</td>
                            <td className="py-8 px-10 text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="py-8 px-10 text-right">
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.open(`tel:${u.user_phone.replace(/\D/g, '')}`, '_self')}
                                className="px-6 py-3 bg-gray-50 text-[10px] font-black text-gray-900 uppercase tracking-widest rounded-xl border border-gray-100 hover:bg-brand hover:text-white hover:border-brand transition-all flex items-center justify-center gap-2 ml-auto"
                              >
                                <PhoneIcon className="w-4 h-4" /> CALL ENTITY
                              </motion.button>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-32 text-center text-gray-500">No entities detected in current sector</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
