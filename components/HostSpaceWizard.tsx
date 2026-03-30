import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckCircleIcon, 
  SparklesIcon, 
  Loader2Icon, 
  HomeIcon, 
  MapPinIcon, 
  EuroIcon, 
  CameraIcon,
  WifiIcon,
  CoffeeIcon,
  WindIcon,
  UtensilsIcon,
  TvIcon,
  XIcon
} from 'lucide-react';
import { User, Listing } from '../types';
import { generateListingDescription } from '../services/geminiService';

interface HostSpaceWizardProps {
  user: User | null;
  onBack: () => void;
  onSuccess: () => void;
}

const AMENITIES_OPTIONS = [
  { id: 'Wifi', icon: WifiIcon },
  { id: 'Kitchen', icon: UtensilsIcon },
  { id: 'AC', icon: WindIcon },
  { id: 'TV', icon: TvIcon },
  { id: 'Coffee', icon: CoffeeIcon },
  { id: 'Parking', icon: MapPinIcon },
];

const HostSpaceWizard: React.FC<HostSpaceWizardProps> = ({ user, onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Listing>>({
    title: '',
    type: 'APARTMENT',
    city: '',
    address: '',
    price: 0,
    currency: '€',
    period: 'month',
    amenities: [],
    description: '',
    imageUrl: 'https://picsum.photos/seed/host/1200/800',
    imageUrls: [],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    size: 50
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities?.includes(id) 
        ? prev.amenities.filter(a => a !== id) 
        : [...(prev.amenities || []), id]
    }));
  };

  const handleAddImage = () => {
    const keywords = ['interior', 'apartment', 'modern', 'living-room', 'bedroom', 'kitchen'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const newImage = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?auto=format&fit=crop&w=1200&q=80&q=${randomKeyword}`;
    // Using a more reliable placeholder service or simulated upload
    const simulatedUrl = `https://picsum.photos/seed/${Math.random()}/1200/800`;
    
    setFormData(prev => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), simulatedUrl]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls?.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.city) return;
    setIsGenerating(true);
    try {
      const desc = await generateListingDescription({
        title: formData.title,
        type: formData.type || 'APARTMENT',
        city: formData.city,
        amenities: formData.amenities || []
      });
      setFormData(prev => ({ ...prev, description: desc }));
    } catch (error) {
      console.error("AI Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const listingData = {
        ...formData,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        rating: 5.0,
        reviewCount: 0,
        isVerified: false,
        imageCount: (formData.imageUrls?.length || 0) + 1,
        provider: user.displayName || 'Host'
      };
      
      // Save to Postgres via API
      const response = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(listingData)
      });

      if (!response.ok) throw new Error("Failed to save to database");

      onSuccess();
    } catch (e) {
      console.error('Create listing failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-100 z-[100]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(step / 4) * 100}%` }}
          className="h-full bg-black transition-all duration-500"
        />
      </div>

      <header className="h-20 flex items-center justify-between px-8 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <XIcon className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Step {step} of 4</span>
            <span className="font-bold text-sm">Host your space</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full py-16 px-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight leading-[0.9]">Tell us about <br/><span className="text-gray-400">your space.</span></h1>
                <p className="text-gray-500 font-medium text-lg">What kind of property are you listing?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['APARTMENT', 'ROOM', 'STUDIO'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({...formData, type: type as any})}
                    className={`p-8 rounded-[32px] border-2 transition-all text-left flex flex-col gap-4 ${formData.type === type ? 'border-black bg-black text-white shadow-2xl' : 'border-gray-100 hover:border-gray-300 bg-white'}`}
                  >
                    <HomeIcon className={`w-8 h-8 ${formData.type === type ? 'text-white' : 'text-gray-400'}`} />
                    <span className="font-black tracking-tight uppercase text-sm">{type}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-6 pt-8">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Listing Title</label>
                    <input 
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Minimalist Loft with Skyline View"
                        className="w-full text-2xl font-bold border-b-2 border-gray-100 focus:border-black outline-none py-4 bg-transparent transition-colors"
                    />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight leading-[0.9]">Where is it <br/><span className="text-gray-400">located?</span></h1>
                <p className="text-gray-500 font-medium text-lg">Help guests find your amazing space.</p>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">City</label>
                        <input 
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            placeholder="Berlin"
                            className="w-full text-xl font-bold border-b-2 border-gray-100 focus:border-black outline-none py-4 bg-transparent transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Price per Month</label>
                        <div className="relative">
                            <EuroIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                                placeholder="1200"
                                className="w-full text-xl font-bold border-b-2 border-gray-100 focus:border-black outline-none py-4 pl-8 bg-transparent transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Full Address</label>
                    <input 
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="123 Luxury Ave, Mitte"
                        className="w-full text-xl font-bold border-b-2 border-gray-100 focus:border-black outline-none py-4 bg-transparent transition-colors"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Bedrooms</label>
                        <input 
                            type="number"
                            value={formData.bedrooms}
                            onChange={(e) => setFormData({...formData, bedrooms: Number(e.target.value)})}
                            className="w-full text-xl font-bold border-b-2 border-gray-100 focus:border-black outline-none py-4 bg-transparent transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Bathrooms</label>
                        <input 
                            type="number"
                            value={formData.bathrooms}
                            onChange={(e) => setFormData({...formData, bathrooms: Number(e.target.value)})}
                            className="w-full text-xl font-bold border-b-2 border-gray-100 focus:border-black outline-none py-4 bg-transparent transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Size (m²)</label>
                        <input 
                            type="number"
                            value={formData.size}
                            onChange={(e) => setFormData({...formData, size: Number(e.target.value)})}
                            className="w-full text-xl font-bold border-b-2 border-gray-100 focus:border-black outline-none py-4 bg-transparent transition-colors"
                        />
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight leading-[0.9]">What does it <br/><span className="text-gray-400">offer?</span></h1>
                <p className="text-gray-500 font-medium text-lg">Select the amenities available to guests.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {AMENITIES_OPTIONS.map((amenity) => (
                  <button
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-4 ${formData.amenities?.includes(amenity.id) ? 'border-black bg-black text-white' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                  >
                    <amenity.icon className="w-6 h-6" />
                    <span className="font-bold text-sm">{amenity.id}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight leading-[0.9]">Final <br/><span className="text-gray-400">touches.</span></h1>
                <p className="text-gray-500 font-medium text-lg">Describe your space or let our AI help you.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Description</label>
                        <button 
                            onClick={handleGenerateDescription}
                            disabled={isGenerating || !formData.title}
                            className="text-xs font-black text-[#E31C5F] uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity disabled:opacity-30"
                        >
                            {isGenerating ? <Loader2Icon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                            Generate with AI
                        </button>
                    </div>
                    <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-700 font-medium min-h-[150px] resize-none leading-relaxed"
                        placeholder="Tell guests what makes your place special..."
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Property Photos</label>
                        <button 
                            onClick={handleAddImage}
                            className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
                        >
                            <CameraIcon className="w-3 h-3" />
                            Add Photo
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="aspect-square rounded-2xl overflow-hidden border-2 border-black relative">
                            <img src={formData.imageUrl} alt="Main" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-black text-white text-[8px] font-black uppercase px-2 py-1 rounded">Main</div>
                        </div>
                        {formData.imageUrls?.map((url, idx) => (
                            <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 relative group">
                                <img src={url} alt={`Extra ${idx}`} className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {(!formData.imageUrls || formData.imageUrls.length < 3) && (
                            <button 
                                onClick={handleAddImage}
                                className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"
                            >
                                <CameraIcon className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase">Add More</span>
                            </button>
                        )}
                    </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-24 bg-white border-t border-gray-100 flex items-center justify-between px-8 sticky bottom-0 z-50">
        <button 
          onClick={handlePrev}
          disabled={step === 1}
          className="flex items-center gap-2 font-bold text-gray-400 hover:text-black transition-colors disabled:opacity-0"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        {step < 4 ? (
          <button 
            onClick={handleNext}
            disabled={step === 1 && !formData.title}
            className="bg-black text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50"
          >
            Next
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.description}
            className="bg-[#E31C5F] text-white px-12 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#C90E4F] transition-all active:scale-95 shadow-xl shadow-pink-200 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2Icon className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
            Publish Listing
          </button>
        )}
      </footer>
    </div>
  );
};

export default HostSpaceWizard;
