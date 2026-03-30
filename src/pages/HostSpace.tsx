import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Home, Upload, DollarSign, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getAuthHeaders } from '../lib/auth';

type Asset = {
  url: string;
  key: string;
  type: string;
  name: string;
};

export default function HostSpace() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/');
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    assets: [] as Asset[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAsset(true);
    try {
      const authHeaders = await getAuthHeaders();

      for (const file of Array.from(files)) {
        const res = await fetch('/api/upload-url', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        });

        if (!res.ok) throw new Error('Failed to get upload URL');
        const { uploadUrl, fileUrl, key } = await res.json();

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        setFormData(prev => ({
          ...prev,
          assets: [
            ...prev.assets,
            {
              url: fileUrl,
              key,
              type: file.type,
              name: file.name,
            },
          ],
        }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file(s). Please sign in and try again.');
    } finally {
      setUploadingAsset(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          location: formData.location,
          assets: formData.assets,
          details: {
            ownerEmail: user?.email || null,
            uxVersion: 'advanced-v1',
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to create property');

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Failed to host space', error);
      alert('Failed to host property. Please sign in and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <main className="max-w-3xl mx-auto pt-12 px-4 pb-24">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
              <Home className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Host Your Space</h1>
          </div>

          {success ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Space Hosted Successfully!</h2>
              <p className="text-gray-600">Your property is now live and ready for bookings.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Property Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Modern Loft in City Center"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all min-h-[120px]"
                  placeholder="Describe the unique features of your space..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Price per Night ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      placeholder="150"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      required
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Berlin, Germany"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Upload Files (image/video/audio/pdf/docx/txt)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.docx,.txt"
                    onChange={handleAssetUpload}
                    disabled={uploadingAsset}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">
                    {uploadingAsset ? 'Uploading...' : 'Click to upload files'}
                  </p>
                </div>
                {formData.assets.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.assets.map((asset, i) => (
                      <div key={`${asset.key}-${i}`} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                        <span className="font-medium">{asset.name}</span>
                        <span className="text-gray-500"> · {asset.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Your Space'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
