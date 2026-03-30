import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, CheckCircle, MapPin, Home, DollarSign, Camera } from 'lucide-react';

interface HostSpaceWizardProps {
  onBack: () => void;
  user: any;
}

export default function HostSpaceWizard({ onBack, user }: HostSpaceWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment',
    price_per_night: 100,
    location_city: '',
    amenities: [] as string[],
    images: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    
    // Mocking S3 upload for preview
    const fakeUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
    updateForm('images', [...formData.images, fakeUrl]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          host_id: user?.uid || 'anonymous',
        }),
      });
      if (res.ok) {
        setStep(5); // Success step
      }
    } catch (error) {
      console.error('Failed to submit listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="mb-8 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          ← Back to home
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-100 w-full">
            <motion.div 
              className="h-full bg-black"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Tell us about your place</h2>
                    <p className="text-gray-500">In this step, we'll ask you which type of property you have and if guests will book the entire place or just a room.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input 
                        type="text" 
                        value={formData.title}
                        onChange={(e) => updateForm('title', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        placeholder="Cozy downtown apartment"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                      <select 
                        value={formData.property_type}
                        onChange={(e) => updateForm('property_type', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      >
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="villa">Villa</option>
                        <option value="unique">Unique Space</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Where's your place located?</h2>
                    <p className="text-gray-500">Your address is only shared with guests after they've made a reservation.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type="text" 
                          value={formData.location_city}
                          onChange={(e) => updateForm('location_city', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                          placeholder="e.g. Berlin, Paris, London"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={(e) => updateForm('description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        placeholder="Describe what makes your place special..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Add some photos of your space</h2>
                    <p className="text-gray-500">You'll need 5 photos to get started. You can add more or make changes later.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900">Drag your photos here</p>
                      <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                        {formData.images.map((img, i) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                            <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Now, set your price</h2>
                    <p className="text-gray-500">You can change it anytime.</p>
                  </div>

                  <div className="flex items-center justify-center py-12">
                    <div className="relative flex items-center">
                      <span className="text-5xl font-bold text-gray-900 mr-2">$</span>
                      <input 
                        type="number" 
                        value={formData.price_per_night}
                        onChange={(e) => updateForm('price_per_night', Number(e.target.value))}
                        className="text-6xl font-extrabold text-gray-900 bg-transparent outline-none w-48 text-center"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 space-y-6"
                >
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-4xl font-extrabold text-gray-900">You're all set!</h2>
                  <p className="text-xl text-gray-500">Your space has been successfully listed.</p>
                  <button 
                    onClick={onBack}
                    className="mt-8 px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                  >
                    View your dashboard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          {step < 5 && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button 
                onClick={handlePrev}
                className={`font-medium underline transition-opacity ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              >
                Back
              </button>
              
              {step < 4 ? (
                <button 
                  onClick={handleNext}
                  className="px-8 py-3.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-[#E31C5F] text-white rounded-xl font-bold hover:bg-[#c11750] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
