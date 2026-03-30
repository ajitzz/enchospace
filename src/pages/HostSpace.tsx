import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import {
  Home,
  Upload,
  DollarSign,
  MapPin,
  CheckCircle,
  BedDouble,
  Bath,
  Users,
  Sparkles,
  FileText,
  Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getAuthHeaders } from '../lib/auth';

type Asset = {
  url: string;
  key: string;
  type: string;
  name: string;
};

const AMENITIES = [
  'Wifi',
  'Air Conditioning',
  'Kitchen',
  'Washer',
  'Dryer',
  'Dedicated Workspace',
  'TV',
  'Parking',
  'Pool',
  'Gym',
  'Pet Friendly',
  'Elevator',
  'Balcony',
  'Security',
  'Smoke Alarm',
  'Heating',
];

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
    location: '',
    propertyType: 'APARTMENT',
    nightlyPrice: '',
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 40,
    minNights: 1,
    amenities: ['Wifi', 'Kitchen'] as string[],
    houseRules: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'Flexible',
    assets: [] as Asset[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  const coverImage = useMemo(
    () => formData.assets.find((asset) => asset.type.startsWith('image/'))?.url,
    [formData.assets],
  );

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAsset(true);
    try {
      const authHeaders = await getAuthHeaders();

      for (const file of Array.from(files) as File[]) {
        const res = await fetch('/api/upload-url', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
        });

        if (!res.ok) throw new Error('Failed to get upload URL');
        const { uploadUrl, fileUrl, key } = await res.json();

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        setFormData((prev) => ({
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
    if (formData.assets.length === 0) {
      alert('Please upload at least one media or document file before publishing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.nightlyPrice),
          location: formData.location,
          assets: formData.assets,
          details: {
            ownerEmail: user?.email || null,
            uxVersion: 'advanced-v2',
            propertyType: formData.propertyType,
            nightlyPrice: parseFloat(formData.nightlyPrice),
            maxGuests: formData.maxGuests,
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms,
            sizeSqm: formData.sizeSqm,
            minNights: formData.minNights,
            amenities: formData.amenities,
            houseRules: formData.houseRules,
            checkInTime: formData.checkInTime,
            checkOutTime: formData.checkOutTime,
            cancellationPolicy: formData.cancellationPolicy,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to create property');

      setSuccess(true);
      setTimeout(() => navigate('/'), 1800);
    } catch (error) {
      console.error('Failed to host space', error);
      alert('Failed to host property. Please sign in and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
      <main className="max-w-7xl mx-auto pt-10 px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Host Your Space</h1>
                <p className="text-gray-500 text-sm">Publish a premium listing with full media + amenity details.</p>
              </div>
            </div>

            {success ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Space Hosted Successfully!</h2>
                <p className="text-gray-600">Your property is now live and ready for bookings.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <section className="space-y-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Basic information</h2>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Property Title</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Modern Loft near Downtown"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all min-h-[130px]"
                      placeholder="Describe vibe, interiors, neighborhood, accessibility, and guest experience."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Property Type</label>
                      <select
                        value={formData.propertyType}
                        onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="APARTMENT">Apartment</option>
                        <option value="STUDIO">Studio</option>
                        <option value="ROOM">Private Room</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          required
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                          placeholder="e.g. Shoreditch, London"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Pricing & capacity</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                      <span className="text-xs font-bold text-gray-500 uppercase">Nightly</span>
                      <div className="relative mt-2">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          required
                          type="number"
                          min="1"
                          value={formData.nightlyPrice}
                          onChange={(e) => setFormData({ ...formData, nightlyPrice: e.target.value })}
                          className="w-full pl-7 pr-2 py-2 rounded-lg border border-gray-300"
                        />
                      </div>
                    </label>

                    <label className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                      <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Guests</span>
                      <input
                        type="number"
                        min={1}
                        value={formData.maxGuests}
                        onChange={(e) => setFormData({ ...formData, maxGuests: Number(e.target.value) })}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300"
                      />
                    </label>

                    <label className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                      <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><BedDouble className="w-3 h-3" /> Bedrooms</span>
                      <input
                        type="number"
                        min={0}
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300"
                      />
                    </label>

                    <label className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                      <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Bath className="w-3 h-3" /> Bathrooms</span>
                      <input
                        type="number"
                        min={1}
                        step="0.5"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Size (sqm)</span>
                      <input
                        type="number"
                        min={10}
                        value={formData.sizeSqm}
                        onChange={(e) => setFormData({ ...formData, sizeSqm: Number(e.target.value) })}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Minimum Nights</span>
                      <input
                        type="number"
                        min={1}
                        value={formData.minNights}
                        onChange={(e) => setFormData({ ...formData, minNights: Number(e.target.value) })}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Cancellation</span>
                      <select
                        value={formData.cancellationPolicy}
                        onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300"
                      >
                        <option>Flexible</option>
                        <option>Moderate</option>
                        <option>Strict</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section className="space-y-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {AMENITIES.map((amenity) => {
                      const selected = formData.amenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all border ${
                            selected
                              ? 'bg-black text-white border-black shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                          }`}
                        >
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Policies</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Check-in time</span>
                      <input
                        type="time"
                        value={formData.checkInTime}
                        onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Check-out time</span>
                      <input
                        type="time"
                        value={formData.checkOutTime}
                        onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">House rules</label>
                    <textarea
                      value={formData.houseRules}
                      onChange={(e) => setFormData({ ...formData, houseRules: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 min-h-[110px]"
                      placeholder="No smoking, no parties, quiet hours after 10PM, etc."
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Media & documents</h2>
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
                    <p className="text-sm text-gray-700 font-semibold">
                      {uploadingAsset ? 'Uploading assets...' : 'Click to upload media and documents (saved to S3)'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Supported: image/video/audio/pdf/docx/txt · max 25MB each</p>
                  </div>

                  {formData.assets.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.assets.map((asset, i) => (
                        <div key={`${asset.key}-${i}`} className="text-sm bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                          <div className="font-semibold text-gray-800 truncate">{asset.name}</div>
                          <div className="text-xs text-gray-500 truncate">{asset.type}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

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

          <aside className="lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="h-52 bg-gray-100">
                {coverImage ? (
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold">Live Preview</h3>
                  <div className="flex items-center text-amber-500 text-sm font-bold gap-1">
                    <Star className="w-4 h-4 fill-current" /> New
                  </div>
                </div>
                <p className="font-bold text-gray-900">{formData.title || 'Your property title'}</p>
                <p className="text-sm text-gray-500">{formData.location || 'Location will appear here'}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700">{formData.propertyType}</span>
                  <span className="font-bold text-gray-900">${formData.nightlyPrice || '0'}/night</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.slice(0, 6).map((amenity) => (
                    <span key={amenity} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                      {amenity}
                    </span>
                  ))}
                </div>
                <div className="rounded-xl bg-black text-white p-4 text-sm">
                  <div className="font-bold flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4" /> Publishing checklist</div>
                  <ul className="space-y-1 text-white/80">
                    <li>• Add at least 5 strong photos/videos</li>
                    <li>• Clear amenities and house rules</li>
                    <li>• Competitive nightly pricing</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
