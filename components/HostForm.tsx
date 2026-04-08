import React, { useState } from 'react';
import { XIcon } from './Icons';

interface HostFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const HostForm: React.FC<HostFormProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: 'APARTMENT',
    address: '',
    city: 'Berlin',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = '';
      if (file) {
        // 1. Get presigned URL
        const presignRes = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        const { uploadUrl, fileUrl } = await presignRes.json();

        // 2. Upload to S3 (mocked if dummy credentials)
        if (uploadUrl.includes('mock-s3-url')) {
          imageUrl = fileUrl; // use mock
        } else {
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });
          imageUrl = fileUrl;
        }
      }

      // 3. Save listing to Neon DB
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

      onSuccess();
    } catch (error) {
      console.error('Failed to list space:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Host your space</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="host-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none" placeholder="Cozy Studio in Center" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Property Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none bg-white">
                  <option value="APARTMENT">Apartment</option>
                  <option value="ROOM">Private Room</option>
                  <option value="STUDIO">Studio</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Description</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none min-h-[100px]" placeholder="Tell guests about your space..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Price per month (€)</label>
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none" placeholder="1200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">City</label>
                <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none" placeholder="Berlin" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Address</label>
                <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#E31C5F] outline-none" placeholder="123 Main St" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="text-gray-500 font-medium">
                  {file ? file.name : 'Click or drag to upload a photo'}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-4 bg-gray-50">
          <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
          <button form="host-form" type="submit" disabled={loading} className="px-8 py-3 font-bold text-white bg-[#E31C5F] hover:bg-[#C90E4F] rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? 'Saving...' : 'List Space'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostForm;
