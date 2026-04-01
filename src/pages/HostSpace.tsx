import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Upload, DollarSign, MapPin, CheckCircle, ChevronRight, ChevronLeft, Wifi, Coffee, Tv, Car, Wind, Shield, FileText, Video, Music, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

const AMENITIES_LIST = [
  { id: 'wifi', label: 'Fast WiFi', icon: Wifi },
  { id: 'kitchen', label: 'Full Kitchen', icon: Coffee },
  { id: 'tv', label: 'Smart TV', icon: Tv },
  { id: 'parking', label: 'Free Parking', icon: Car },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'security', label: '24/7 Security', icon: Shield },
];

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Cabin', 'Unique Space', 'Studio Loft'];

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

  const mediaSummary = useMemo(() => {
    let imageCount = 0;
    let videoCount = 0;
    let audioCount = 0;
    let docsCount = 0;

    formData.images.forEach((url) => {
      if (url.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) || url.includes('image')) imageCount += 1;
      else if (url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video')) videoCount += 1;
      else if (url.match(/\.(mp3|wav|aac)$/i) || url.includes('audio')) audioCount += 1;
      else docsCount += 1;
    });

    return { imageCount, videoCount, audioCount, docsCount };
  }, [formData.images]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(async (file: File) => {
        const res = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        });

        if (!res.ok) throw new Error('Failed to get upload URL');
        const { uploadUrl, fileUrl } = await res.json();

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        return fileUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload some files. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const toggleAmenity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            mediaSummary,
          },
          owner_id: user?.id || 'anonymous',
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/admin'), 1800);
      }
    } catch (error) {
      console.error('Failed to host space', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const isStepValid = () => {
    if (step === 1) return formData.title.trim() !== '' && formData.location.trim() !== '';
    if (step === 2) return formData.description.trim() !== '' && formData.price !== '' && parseFloat(formData.price) > 0;
    if (step === 3) return true;
    if (step === 4) return formData.images.length >= 3;
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

      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 pt-8 pb-32">
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="m-auto text-center py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Space Hosted Successfully!</h2>
            <p className="text-gray-600 text-lg">Your listing is ready. Redirecting you to Admin panel...</p>
          </motion.div>
        ) : (
          <>
            <div className="mb-8 rounded-3xl border border-gray-100 bg-gradient-to-r from-gray-900 to-gray-700 text-white p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <p className="font-semibold">Production-ready host workflow</p>
              </div>
              <p className="text-sm md:text-base text-gray-100/90">Add high-quality media (images/video/audio/docs), clear property details, and publish directly to your platform.</p>
            </div>

            <div className="w-full h-2 bg-gray-100 rounded-full mb-12 overflow-hidden">
              <motion.div className="h-full bg-black" initial={{ width: '20%' }} animate={{ width: `${(step / 5) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="text-2xl font-bold mb-2">Let&apos;s start with the basics</h2>
                    <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-4 rounded-xl border border-gray-200" placeholder="Property title" />
                    <select value={formData.propertyType} onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })} className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white">
                      {PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}
                    </select>
                    <div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200" placeholder="Location" /></div>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="text-2xl font-bold mb-2">Tell guests what makes this stay special</h2>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-4 rounded-xl border border-gray-200 min-h-[150px]" />
                    <div className="relative"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="number" min="1" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200" placeholder="Price per night" /></div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="text-2xl font-bold">Configure capacity & amenities</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <input type="number" min="1" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value || '1', 10) })} className="px-4 py-3 rounded-xl border border-gray-200" />
                      <input type="number" min="1" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value || '1', 10) })} className="px-4 py-3 rounded-xl border border-gray-200" />
                      <input type="number" min="1" value={formData.maxGuests} onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value || '1', 10) })} className="px-4 py-3 rounded-xl border border-gray-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">{AMENITIES_LIST.map((amenity) => { const Icon = amenity.icon; const selected = formData.amenities.includes(amenity.id); return <button key={amenity.id} onClick={() => toggleAmenity(amenity.id)} className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${selected ? 'border-black bg-gray-50' : 'border-gray-100'}`}><Icon className="w-5 h-5" />{amenity.label}</button>; })}</div>
                  </motion.div>
                )}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="text-2xl font-bold">Upload media & property files</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="rounded-xl bg-gray-50 p-3"><FileText className="w-4 h-4 mb-1" /> Docs: {mediaSummary.docsCount}</div>
                      <div className="rounded-xl bg-gray-50 p-3"><Video className="w-4 h-4 mb-1" /> Videos: {mediaSummary.videoCount}</div>
                      <div className="rounded-xl bg-gray-50 p-3"><Music className="w-4 h-4 mb-1" /> Audio: {mediaSummary.audioCount}</div>
                      <div className="rounded-xl bg-gray-50 p-3"><Upload className="w-4 h-4 mb-1" /> Images: {mediaSummary.imageCount}</div>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center relative">
                      <input type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleFileUpload} disabled={uploadingImage} className="absolute inset-0 w-full h-full opacity-0" />
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-lg font-medium">{uploadingImage ? 'Uploading files...' : 'Drop files or click to upload'}</p>
                      <p className="text-sm text-gray-500">At least 3 media files required. Supports image, video, audio, PDF, DOCX.</p>
                    </div>
                    {formData.images.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{formData.images.map((url, i) => <div key={url + i} className="relative group aspect-square rounded-2xl border border-gray-100 overflow-hidden"><img src={url} alt={`upload ${i}`} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /><button onClick={() => removeFile(i)} className="absolute top-2 right-2 rounded-full bg-white px-2 py-1 text-xs">Remove</button></div>)}</div>}
                  </motion.div>
                )}
                {step === 5 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="text-2xl font-bold">Review & publish</h2>
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
                      <h3 className="text-xl font-bold">{formData.title || 'Untitled Space'}</h3>
                      <p className="text-gray-500">{formData.location || 'No location'}</p>
                      <p className="text-gray-700">{formData.description || 'No description'}</p>
                      <p className="font-semibold">${formData.price || '0'} / night</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-10">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <button onClick={prevStep} className={`px-6 py-3 font-semibold rounded-xl ${step === 1 ? 'invisible' : 'text-black hover:bg-gray-100'}`}><ChevronLeft className="w-4 h-4 inline mr-1" />Back</button>
                {step < 5 ? (
                  <button onClick={nextStep} disabled={!isStepValid()} className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50">Next <ChevronRight className="w-5 h-5" /></button>
                ) : (
                  <button onClick={handleSubmit} disabled={isSubmitting || !isStepValid()} className="flex items-center gap-2 bg-[#E31C5F] text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50">{isSubmitting ? 'Publishing...' : 'Publish Space'}</button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
