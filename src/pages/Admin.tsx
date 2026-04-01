import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Shield, Trash2, Plus, Users, Home, TrendingUp, Calendar, MapPin, DollarSign, Activity, RefreshCcw, TimerReset, Database, Cloud } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function Admin() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalProperties: 0, totalBookings: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [infraStatus, setInfraStatus] = useState<any>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [propsRes, statsRes, healthRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/admin/stats'),
        fetch('/api/health'),
      ]);
      const [propsData, statsData, healthData] = await Promise.all([propsRes.json(), statsRes.json(), healthRes.json()]);
      setProperties(propsData);
      setStats(statsData);
      setInfraStatus(healthData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/');
    });
    refreshData();
  }, [navigate]);

  const deleteProperty = async (id: number) => {
    if (!window.confirm('Delete this property?')) return;
    const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    if (res.ok) refreshData();
  };

  const occupancyHealth = useMemo(() => {
    if (!properties.length) return 'No inventory yet';
    const listed = properties.filter((p) => p.status === 'available').length;
    return `${listed}/${properties.length} properties currently bookable`;
  }, [properties]);

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-black text-white rounded-2xl"><Icon className="w-5 h-5" /></div>
        {trend && <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1"><TrendingUp className="w-3 h-3" />{trend}</span>}
      </div>
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-3xl font-extrabold tracking-tight">{value}</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header onSearch={() => {}} currentCity="Berlin" onWishlistClick={() => {}} onReservesClick={() => {}} highlightReserves={false} highlightWishlist={false} reservesCount={0} wishlistCount={0} />

      <div className="flex max-w-[1920px] mx-auto pt-6 px-4 md:px-8 gap-8">
        <aside className="w-64 hidden lg:block">
          <div className="sticky top-24 bg-white rounded-3xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white"><Shield className="w-5 h-5" /></div><h2 className="font-bold text-xl">Admin Panel</h2></div>
            <div className="space-y-2">
              {['dashboard', 'properties', 'bookings', 'users'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-3 rounded-xl capitalize ${activeTab === tab ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{tab}</button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 pb-24 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{activeTab === 'dashboard' ? 'Operations Overview' : activeTab === 'properties' ? 'Property Inventory' : activeTab === 'bookings' ? 'Bookings' : 'Users'}</h1>
              <p className="text-gray-500">Production controls for listings, bookings, cache and uptime.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={refreshData} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white"><RefreshCcw className="w-4 h-4" />Refresh</button>
              <button onClick={() => navigate('/host')} className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold"><Plus className="w-5 h-5" />Add Property</button>
            </div>
          </div>

          {loading ? <div className="h-56 bg-gray-200 animate-pulse rounded-3xl" /> : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} trend="+12.5%" />
                <StatCard title="Active Properties" value={stats.totalProperties} icon={Home} trend="+4.2%" />
                <StatCard title="Total Bookings" value={stats.totalBookings} icon={Calendar} trend="+18.1%" />
              </div>

              <section className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><Database className="w-5 h-5" />Serverless data reliability plan</h3>
                <p className="text-sm text-gray-600">If Supabase/DB sleeps on low traffic, keep `/api/cron/keepalive` scheduled via Vercel cron every 10 minutes and keep Redis cache warm for listings.</p>
                <div className="grid md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 p-3 flex items-center gap-2"><Cloud className="w-4 h-4" />DB: {infraStatus?.database || 'unknown'}</div>
                  <div className="rounded-xl bg-gray-50 p-3 flex items-center gap-2"><Activity className="w-4 h-4" />Redis: {infraStatus?.redis || 'unknown'}</div>
                  <div className="rounded-xl bg-gray-50 p-3 flex items-center gap-2"><TimerReset className="w-4 h-4" />Cron: keepalive ready</div>
                  <div className="rounded-xl bg-gray-50 p-3 flex items-center gap-2"><MapPin className="w-4 h-4" />Inventory: {occupancyHealth}</div>
                </div>
              </section>

              {(activeTab === 'dashboard' || activeTab === 'properties') && (
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-lg">Property Listings</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead><tr className="bg-gray-50"><th className="py-3 px-6 text-xs uppercase">Property</th><th className="py-3 px-6 text-xs uppercase">Location</th><th className="py-3 px-6 text-xs uppercase">Price</th><th className="py-3 px-6 text-xs uppercase">Status</th><th className="py-3 px-6 text-xs uppercase text-right">Action</th></tr></thead>
                      <tbody>
                        {properties.map((prop) => (
                          <tr key={prop.id} className="border-b border-gray-50">
                            <td className="py-4 px-6 font-semibold">{prop.title}</td>
                            <td className="py-4 px-6 text-sm text-gray-600"><MapPin className="w-4 h-4 inline mr-1" />{prop.location}</td>
                            <td className="py-4 px-6 font-bold">${prop.price}</td>
                            <td className="py-4 px-6"><span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">{prop.status || 'available'}</span></td>
                            <td className="py-4 px-6 text-right"><button onClick={() => deleteProperty(prop.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                          </tr>
                        ))}
                        {!properties.length && <tr><td colSpan={5} className="py-12 text-center text-gray-500">No properties found yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(activeTab === 'bookings' || activeTab === 'users') && (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                  {activeTab === 'bookings' ? <Calendar className="w-8 h-8 mx-auto mb-4 text-gray-400" /> : <Users className="w-8 h-8 mx-auto mb-4 text-gray-400" />}
                  <h3 className="text-xl font-bold mb-2">{activeTab} module</h3>
                  <p className="text-gray-500">The data structure is ready. Connect finalized Supabase tables to make this live.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
