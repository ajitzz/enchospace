import React, { useState } from 'react';
import { 
  ChevronLeft, 
  WifiIcon, 
  GymIcon, 
  CarIcon, 
  UtensilsIcon, 
  WavesIcon, 
  BriefcaseIcon,
  SmokeIcon,
  PawPrintIcon,
  ShieldCheck
} from './Icons';

interface HostFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const HostForm: React.FC<HostFormProps> = ({ onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: 'APARTMENT',
    address: '',
    city: 'Berlin',
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: [] as string[],
  });
  const [file, setFile] = useState<File | null>(null);

  const amenitiesOptions = [
    { id: 'wifi', label: 'Fast Wifi', icon: WifiIcon },
    { id: 'kitchen', label: 'Kitchen', icon: UtensilsIcon },
    { id: 'parking', label: 'Free Parking', icon: CarIcon },
    { id: 'pool', label: 'Pool', icon: WavesIcon },
    { id: 'gym', label: 'Gym', icon: GymIcon },
    { id: 'workspace', label: 'Dedicated Workspace', icon: BriefcaseIcon },
    { id: 'pets', label: 'Pets Allowed', icon: PawPrintIcon },
    { id: 'smoking', label: 'Smoking Allowed', icon: SmokeIcon },
  ];

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = '';
      if (file) {
        const presignRes = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        const { uploadUrl, fileUrl } = await presignRes.json();

        if (uploadUrl.includes('mock-s3-url')) {
          imageUrl = fileUrl;
        } else {
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });
          imageUrl = fileUrl;
        }
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          imageUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed to save listing');

      setSubmitted(true);
      setTimeout(() => {
          onSuccess();
          onBack();
      }, 2000);
    } catch (error) {
      console.error('Failed to list space:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Your space is live!</h1>
              <p className="text-gray-500 max-w-md mx-auto">Congratulations! Your property has been successfully listed. You'll be redirected to the search page in a moment.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Host your space</h1>
        </div>
        <div className="hidden md:flex items-center gap-4">
            <button onClick={onBack} className="px-6 py-2.5 font-bold text-gray-600 hover:text-gray-900 transition-colors">Save & Exit</button>
            <button form="host-form" type="submit" disabled={loading} className="px-8 py-2.5 bg-[#E31C5F] hover:bg-[#C90E4F] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#E31C5F]/20 disabled:opacity-50">
                {loading ? 'Publishing...' : 'Publish Listing'}
            </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 md:pt-12">
        <form id="host-form" onSubmit={handleSubmit} className="space-y-12">
          {/* Section 1: Basics */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">The Basics</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Property Title</label>
                <input 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] focus:border-transparent outline-none text-lg transition-all" 
                  placeholder="e.g. Modern Loft with City View" 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Property Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as 'APARTMENT' | 'ROOM' | 'STUDIO'})} 
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none bg-white appearance-none cursor-pointer"
                  >
                    <option value="APARTMENT">Entire Apartment</option>
                    <option value="ROOM">Private Room</option>
                    <option value="STUDIO">Studio Apartment</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Monthly Rent (€)</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none" 
                    placeholder="1200" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Description</label>
                <textarea 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none min-h-[150px] resize-none" 
                  placeholder="Describe what makes your space unique, the neighborhood, and any special features..." 
                />
              </div>
            </div>
          </section>

          {/* Section 2: Location */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">City</label>
                <input 
                  required 
                  value={formData.city} 
                  onChange={e => setFormData({...formData, city: e.target.value})} 
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none" 
                  placeholder="Berlin" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Street Address</label>
                <input 
                  required 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none" 
                  placeholder="123 Main St" 
                />
              </div>
            </div>
          </section>

          {/* Section 3: Capacity */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Capacity & Layout</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Guests', key: 'maxGuests' as const },
                { label: 'Bedrooms', key: 'bedrooms' as const },
                { label: 'Beds', key: 'beds' as const },
                { label: 'Bathrooms', key: 'bathrooms' as const },
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.label}</label>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, [item.key]: Math.max(1, prev[item.key] - 1) }))}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-gray-900 transition-colors"
                    >
                      -
                    </button>
                    <span className="font-bold text-gray-900">{formData[item.key]}</span>
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, [item.key]: prev[item.key] + 1 }))}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-gray-900 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Amenities */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {amenitiesOptions.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = formData.amenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3 ${
                      isSelected 
                        ? 'border-[#E31C5F] bg-[#E31C5F]/5 text-[#E31C5F]' 
                        : 'border-gray-100 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-sm font-bold text-center leading-tight">{amenity.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 5: Photos */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Photos</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:bg-gray-50 transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {file ? file.name : 'Add photos of your space'}
                    </p>
                    <p className="text-gray-500">Click or drag to upload</p>
                  </div>
                </div>
              </div>
              {file && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFile(null)}
                        className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                      >
                          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>
              )}
            </div>
          </section>

          {/* Mobile Footer Action */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-[#E31C5F] hover:bg-[#C90E4F] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#E31C5F]/20 disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default HostForm;
