import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Shield, Trash2, Edit, Plus, Users, Home, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const deleteProperty = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProperties(prev => prev.filter((p: any) => p.id !== id));
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

    fetch('/api/properties')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch properties');
        return res.json();
      })
      .then(data => {
        setProperties(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
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
      
      <div className="flex max-w-[1920px] mx-auto pt-6 px-4 md:px-6">
        {/* Admin Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden lg:block pr-8">
          <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-xl tracking-tight">Admin Panel</h2>
            </div>
            
            <nav className="space-y-2">
              <a href="#" className="flex items-center gap-3 px-4 py-3 bg-black text-white rounded-xl font-medium transition-colors">
                <Home className="w-5 h-5" /> Properties
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                <Users className="w-5 h-5" /> Users
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                <CreditCard className="w-5 h-5" /> Transactions
              </a>
            </nav>
          </div>
        </aside>

        {/* Admin Content */}
        <main className="flex-1 pb-24">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-extrabold tracking-tight">Manage Properties</h1>
              <button className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-all active:scale-95 text-sm">
                <Plus className="w-4 h-4" /> Add Property
              </button>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-100 rounded-2xl w-full"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-4 px-4 font-bold text-gray-500 text-sm uppercase tracking-wider">ID</th>
                      <th className="py-4 px-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Title</th>
                      <th className="py-4 px-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Location</th>
                      <th className="py-4 px-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Price</th>
                      <th className="py-4 px-4 font-bold text-gray-500 text-sm uppercase tracking-wider">Status</th>
                      <th className="py-4 px-4 font-bold text-gray-500 text-sm uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((prop: any) => (
                      <tr key={prop.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm font-mono text-gray-500">#{prop.id}</td>
                        <td className="py-4 px-4 font-bold text-gray-900">{prop.title}</td>
                        <td className="py-4 px-4 text-gray-600">{prop.location}</td>
                        <td className="py-4 px-4 font-bold">${prop.price}/night</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {prop.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteProperty(prop.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {properties.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500">
                          No properties found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
