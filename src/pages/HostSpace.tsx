import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { 
  Home, Upload, DollarSign, MapPin, CheckCircle, ChevronRight, ChevronLeft, 
  Wifi, Coffee, Tv, Car, Wind, Shield, Image as ImageIcon, Video, 
  Music, FileText, Trash2, Sparkles, Plus, Minus, Globe, Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '@supabase/supabase-js';

import DOMPurify from 'dompurify';

const AMENITIES_LIST = [
  { id: 'wifi', label: 'Fast WiFi', icon: Wifi },
  { id: 'kitchen', label: 'Full Kitchen', icon: Coffee },
  { id: 'tv', label: 'Smart TV', icon: Tv },
  { id: 'parking', label: 'Free Parking', icon: Car },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'security', label: '24/7 Security', icon: Shield },
];

const PROPERTY_TYPES = [
  { id: 'Apartment', label: 'Apartment', icon: Home },
  { id: 'House', label: 'House', icon: Home },
  { id: 'Villa', label: 'Villa', icon: Home },
  { id: 'Cabin', label: 'Cabin', icon: Home },
  { id: 'Unique Space', label: 'Unique Space', icon: Sparkles },
];

export default function HostSpace(): React.ReactElement {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

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
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Security: Client-side validation
    const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg', 'application/pdf'];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const validFiles = Array.from(files).filter(file => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert(`File type ${file.type} is not allowed.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} exceeds 10MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadPromises = validFiles.map(async (file: File) => {
        const { uploadUrl, fileUrl } = await fetchApi<any>('/api/upload-url', {
          method: 'POST',
          body: JSON.stringify({ 
            fileName: file.name, 
            fileType: file.type,
            fileSize: file.size 
          }),
        });

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return fileUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Upload failed:', error);
      alert(message || 'Failed to upload some files. Please try again.');
    } finally {
      setUploadingFiles(false);
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
    if (!isStepValid()) return;
    setIsSubmitting(true);
    try {
      // Sanitize description
      const sanitizedDescription = DOMPurify.sanitize(formData.description);

      await fetchApi('/api/properties', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: sanitizedDescription,
          price: parseFloat(formData.price),
          location: formData.location.trim(),
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
      setTimeout(() => navigate('/'), 3000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to host space', error);
      alert(message || 'Failed to host space. Please try again.');
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="space-y-8"
          >
            <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">THE BASICS</h2>
                <p className="text-gray-500 font-medium">Tell us about your extraordinary space.</p>
            </div>

            <div className="space-y-6">
                <div className="group">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">Property Title</label>
                    <input 
                        type="text" 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full px-6 py-5 rounded-[2rem] border-2 border-gray-100 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-xl font-bold placeholder:text-gray-300 bg-gray-50/50"
                        placeholder="e.g. Cyberpunk Loft in Neo-Tokyo"
                    />
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Property Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PROPERTY_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = formData.propertyType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setFormData({...formData, propertyType: type.id})}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
                                        isSelected 
                                        ? 'border-brand bg-brand/5 shadow-xl shadow-brand/10' 
                                        : 'border-gray-100 hover:border-gray-200 bg-white'
                                    }`}
                                >
                                    <Icon className={`w-8 h-8 ${isSelected ? 'text-brand' : 'text-gray-400'}`} />
                                    <span className={`font-bold text-sm ${isSelected ? 'text-brand' : 'text-gray-600'}`}>{type.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="group">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input 
                            type="text" 
                            value={formData.location}
                            onChange={e => setFormData({...formData, location: e.target.value})}
                            className="w-full pl-16 pr-6 py-5 rounded-[2rem] border-2 border-gray-100 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-xl font-bold placeholder:text-gray-300 bg-gray-50/50"
                            placeholder="e.g. Shibuya, Tokyo"
                        />
                    </div>
                </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="space-y-8"
          >
            <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">THE DETAILS</h2>
                <p className="text-gray-500 font-medium">Define the experience of your space.</p>
            </div>

            <div className="space-y-6">
                <div className="group">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">Description</label>
                    <textarea 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full px-6 py-5 rounded-[2.5rem] border-2 border-gray-100 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all min-h-[200px] text-lg font-medium placeholder:text-gray-300 bg-gray-50/50"
                        placeholder="Describe the unique aura of your space..."
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">Price per Night</label>
                        <div className="relative">
                            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                            <input 
                                type="number" 
                                min="1"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                                className="w-full pl-16 pr-6 py-5 rounded-[2rem] border-2 border-gray-100 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-xl font-bold placeholder:text-gray-300 bg-gray-50/50"
                                placeholder="150"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Beds', key: 'bedrooms' },
                            { label: 'Baths', key: 'bathrooms' },
                            { label: 'Guests', key: 'maxGuests' }
                        ].map((item) => (
                            <div key={item.key} className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{item.label}</label>
                                <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-100 rounded-2xl p-2">
                                    <button 
                                        onClick={() => setFormData(prev => ({ ...prev, [item.key]: Math.max(1, (prev[item.key as keyof typeof prev] as number) - 1) }))}
                                        className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-brand"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="font-bold text-lg">{formData[item.key as keyof typeof formData]}</span>
                                    <button 
                                        onClick={() => setFormData(prev => ({ ...prev, [item.key]: (prev[item.key as keyof typeof prev] as number) + 1 }))}
                                        className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-brand"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="space-y-8"
          >
            <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">AMENITIES</h2>
                <p className="text-gray-500 font-medium">What futuristic comforts do you provide?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {AMENITIES_LIST.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity.id);
                const Icon = amenity.icon;
                return (
                  <button
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden group ${
                        isSelected 
                        ? 'border-brand bg-brand/5 shadow-xl shadow-brand/5' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    {isSelected && (
                        <motion.div 
                            layoutId="amenity-bg"
                            className="absolute inset-0 bg-gradient-to-r from-brand/10 to-transparent opacity-50"
                        />
                    )}
                    <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className={`font-bold text-lg ${isSelected ? 'text-brand' : 'text-gray-600'}`}>{amenity.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="space-y-8"
          >
            <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">MEDIA ASSETS</h2>
                <p className="text-gray-500 font-medium">Upload photos, videos, and documents to showcase your space.</p>
            </div>

            <div className="relative border-4 border-dashed border-gray-100 rounded-[3rem] p-16 text-center hover:border-brand/30 hover:bg-brand/5 transition-all cursor-pointer group">
              <input 
                type="file" 
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx" 
                onChange={handleFileUpload}
                disabled={uploadingFiles}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-brand/10 transition-all">
                    <Upload className="w-10 h-10 text-gray-400 group-hover:text-brand transition-colors" />
                  </div>
                  <div>
                      <p className="text-2xl font-black text-gray-900">
                        {uploadingFiles ? 'SYNCING ASSETS...' : 'DROP YOUR ASSETS'}
                      </p>
                      <p className="text-gray-500 font-medium">Images, Videos, Audio, or Documents</p>
                  </div>
                  <div className="flex justify-center gap-4 pt-4">
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                      <Video className="w-5 h-5 text-gray-300" />
                      <Music className="w-5 h-5 text-gray-300" />
                      <FileText className="w-5 h-5 text-gray-300" />
                  </div>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence>
                    {formData.images.map((url, i) => {
                    const isImage = url.match(/\.(jpeg|jpg|gif|png|svg)$/i) != null || url.includes('image');
                    const isVideo = url.match(/\.(mp4|webm|ogg)$/i) != null || url.includes('video');
                    const isAudio = url.match(/\.(mp3|wav|ogg)$/i) != null || url.includes('audio');
                    const isDoc = url.match(/\.(pdf|doc|docx)$/i) != null;

                    return (
                        <motion.div 
                            key={url} 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative group aspect-square rounded-[2rem] overflow-hidden shadow-xl border-2 border-gray-50 bg-gray-50"
                        >
                        {isImage ? (
                            <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                        ) : isVideo ? (
                            <div className="w-full h-full relative">
                                <video src={url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Video className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        ) : isAudio ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 bg-brand/5">
                                <Music className="w-10 h-10 text-brand" />
                                <span className="text-[10px] font-bold text-brand uppercase truncate w-full text-center">Audio Asset</span>
                            </div>
                        ) : isDoc ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 bg-blue-50">
                                <FileText className="w-10 h-10 text-blue-500" />
                                <span className="text-[10px] font-bold text-blue-500 uppercase truncate w-full text-center">Document</span>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 p-4 text-center">
                                <span className="truncate">{url.split('/').pop()}</span>
                            </div>
                        )}
                        <button 
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-red-500 p-3 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110 active:scale-90"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        </motion.div>
                    );
                    })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="space-y-8"
          >
            <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">PREVIEW</h2>
                <p className="text-gray-500 font-medium">Final review of your futuristic sanctuary.</p>
            </div>

            <div className="bg-white rounded-[3rem] border-2 border-gray-100 p-8 shadow-2xl shadow-black/5">
              <div className="aspect-video rounded-[2.5rem] overflow-hidden mb-8 bg-gray-100 relative shadow-inner">
                {formData.images[0] ? (
                  <img src={formData.images[0]} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest">No cover image</div>
                )}
                <div className="absolute top-6 left-6 glass px-4 py-2 rounded-full flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Preview Mode</span>
                </div>
              </div>

              <div className="space-y-6">
                  <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter mb-2 leading-none">{formData.title || 'UNTITLED SPACE'}</h3>
                        <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                            <MapPin className="w-3 h-3" />
                            {formData.location || 'LOCATION PENDING'}
                        </div>
                      </div>
                      <div className="text-right">
                          <div className="text-3xl font-black text-brand tracking-tighter leading-none">${formData.price || '0'}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">per night</div>
                      </div>
                  </div>

                  <div className="flex items-center gap-6 py-6 border-y border-gray-100">
                    {[
                        { label: 'Guests', value: formData.maxGuests },
                        { label: 'Beds', value: formData.bedrooms },
                        { label: 'Baths', value: formData.bathrooms }
                    ].map(stat => (
                        <div key={stat.label} className="flex flex-col">
                            <span className="text-xl font-black text-gray-900 leading-none">{stat.value}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                      {formData.amenities.map(id => {
                          const amenity = AMENITIES_LIST.find(a => a.id === id);
                          if (!amenity) return null;
                          const Icon = amenity.icon;
                          return (
                              <div key={id} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                                  <Icon className="w-3 h-3 text-gray-500" />
                                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{amenity.label}</span>
                              </div>
                          );
                      })}
                  </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.title.trim() !== '' && formData.location.trim() !== '';
    if (step === 2) return formData.description.trim() !== '' && formData.price !== '' && parseFloat(formData.price) > 0;
    if (step === 3) return true;
    if (step === 4) return formData.images.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-brand selection:text-white">
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
      
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-6 pt-12 pb-40">
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="m-auto text-center py-20 bg-brand/5 rounded-[4rem] px-12 border-2 border-brand/10"
          >
            <div className="w-32 h-32 bg-brand rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand/40">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-5xl font-black tracking-tighter mb-4 leading-none uppercase">MISSION ACCOMPLISHED</h2>
            <p className="text-gray-600 text-xl font-medium mb-12">Your futuristic sanctuary is now live on the network.</p>
            <div className="flex justify-center gap-4">
                <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-widest text-xs">
                    <Globe className="w-4 h-4" />
                    Global Visibility Active
                </div>
                <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-widest text-xs">
                    <Lock className="w-4 h-4" />
                    Secure Transactions Enabled
                </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-16 px-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-3 flex-1 relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500 z-10 ${
                            step >= i ? 'bg-brand text-white shadow-xl shadow-brand/20 scale-110' : 'bg-gray-100 text-gray-400'
                        }`}>
                            {i}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${step >= i ? 'text-brand' : 'text-gray-300'}`}>
                            {['Basics', 'Details', 'Amenities', 'Media', 'Review'][i-1]}
                        </span>
                        {i < 5 && (
                            <div className="absolute left-[calc(50%+2rem)] right-[calc(-50%+2rem)] top-6 h-1 bg-gray-100 -z-0">
                                <motion.div 
                                    className="h-full bg-brand"
                                    initial={{ width: '0%' }}
                                    animate={{ width: step > i ? '100%' : '0%' }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {renderStep()}
              </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 p-6 z-50">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <motion.button 
                  whileHover={{ x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevStep}
                  className={`flex items-center gap-3 px-8 py-4 font-black uppercase tracking-widest text-xs rounded-2xl transition-all ${
                      step === 1 ? 'invisible' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Phase
                </motion.button>
                
                {step < 5 ? (
                  <motion.button 
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="flex items-center gap-3 bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-black/20"
                  >
                    Next Phase <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isStepValid()}
                    className="flex items-center gap-3 bg-brand text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-dark transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-brand/40"
                  >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Initializing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Publish to Network
                        </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
