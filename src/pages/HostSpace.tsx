import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Home, Upload, DollarSign, MapPin, CheckCircle, ChevronRight, ChevronLeft, Wifi, Coffee, Tv, Car, Wind, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

const AMENITIES_LIST = [
  { id: 'wifi', label: 'Fast WiFi', icon: Wifi },
  { id: 'kitchen', label: 'Full Kitchen', icon: Coffee },
  { id: 'tv', label: 'Smart TV', icon: Tv },
  { id: 'parking', label: 'Free Parking', icon: Car },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'security', label: '24/7 Security', icon: Shield },
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

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    propertyType: 'Apartment',
    location: '',
    description: '',
    price: '',
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    amenities: [] as string[],
    images: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(async (file: File) => {
        const { uploadUrl, fileUrl } = await fetchApi('/api/upload-url', {
          method: 'POST',
          body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        });

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        return fileUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(error.message || 'Failed to upload some files. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id) 
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetchApi('/api/properties', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          location: formData.location,
          images: formData.images.length > 0 ? formData.images : ['https://picsum.photos/seed/property/800/600'],
          details: {
            propertyType: formData.propertyType,
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms,
            maxGuests: formData.maxGuests,
            amenities: formData.amenities,
          },
          owner_id: user?.id || 'anonymous',
        }),
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      console.error('Failed to host space', error);
      alert(error.message || 'Failed to host space. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Let's start with the basics</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Property Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-lg"
                placeholder="e.g. Modern Loft in City Center"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Property Type</label>
              <select 
                value={formData.propertyType}
                onChange={e => setFormData({...formData, propertyType: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-lg bg-white"
              >
                <option>Apartment</option>
                <option>House</option>
                <option>Villa</option>
                <option>Cabin</option>
                <option>Unique Space</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-lg"
                  placeholder="e.g. Berlin, Germany"
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Tell us more about your place</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all min-h-[150px] text-lg"
                placeholder="Describe the unique features of your space..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Price per Night ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="number" 
                  min="1"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-lg"
                  placeholder="150"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bedrooms</label>
                <input type="number" min="1" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bathrooms</label>
                <input type="number" min="1" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Max Guests</label>
                <input type="number" min="1" value={formData.maxGuests} onChange={e => setFormData({...formData, maxGuests: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none" />
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">What amenities do you offer?</h2>
            <div className="grid grid-cols-2 gap-4">
              {AMENITIES_LIST.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity.id);
                const Icon = amenity.icon;
                return (
                  <button
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-black' : 'text-gray-400'}`} />
                    <span className={`font-medium ${isSelected ? 'text-black' : 'text-gray-600'}`}>{amenity.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Add some photos of your space</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx" 
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-800 font-medium mb-2">
                {uploadingImage ? 'Uploading files...' : 'Drag your photos here'}
              </p>
              <p className="text-sm text-gray-500">Choose at least 5 photos. High quality images work best.</p>
            </div>
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                {formData.images.map((url, i) => {
                  const isImage = url.match(/\.(jpeg|jpg|gif|png|svg)$/i) != null || url.includes('image');
                  const isVideo = url.match(/\.(mp4|webm|ogg)$/i) != null || url.includes('video');
                  return (
                    <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                      {isImage ? (
                        <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                      ) : isVideo ? (
                        <video src={url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 p-4 text-center">
                          <span className="truncate">{url.split('/').pop()}</span>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-red-500 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      case 5:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Review your listing</h2>
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-gray-100">
                {formData.images[0] ? (
                  <img src={formData.images[0]} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No cover image</div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">{formData.title || 'Untitled Space'}</h3>
              <p className="text-gray-500 mb-4">{formData.location || 'No location specified'}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <span>{formData.maxGuests} guests</span>
                <span>·</span>
                <span>{formData.bedrooms} bedrooms</span>
                <span>·</span>
                <span>{formData.bathrooms} baths</span>
              </div>
              <div className="text-2xl font-bold">${formData.price || '0'} <span className="text-base font-normal text-gray-500">night</span></div>
            </div>
          </motion.div>
        );
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.title.trim() !== '' && formData.location.trim() !== '';
    if (step === 2) return formData.description.trim() !== '' && formData.price !== '' && parseFloat(formData.price) > 0;
    if (step === 3) return true; // Amenities are optional
    if (step === 4) return formData.images.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
      
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 pt-8 pb-32">
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="m-auto text-center py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Space Hosted Successfully!</h2>
            <p className="text-gray-600 text-lg">Your property is now live and ready for bookings.</p>
          </motion.div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full mb-12 overflow-hidden">
              <motion.div 
                className="h-full bg-black"
                initial={{ width: '20%' }}
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {renderStep()}
              </AnimatePresence>
            </div>

            {/* Fixed Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-10">
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                <button 
                  onClick={prevStep}
                  className={`px-6 py-3 font-semibold rounded-xl transition-colors ${step === 1 ? 'invisible' : 'text-black hover:bg-gray-100'}`}
                >
                  Back
                </button>
                
                {step < 5 ? (
                  <button 
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isStepValid()}
                    className="flex items-center gap-2 bg-[#E31C5F] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#c2144e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Space'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
