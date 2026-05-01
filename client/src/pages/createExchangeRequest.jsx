import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { listingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function CreateExchangeRequestPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemTitle: '',
    itemDescription: '',
    itemImage: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, itemImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.itemTitle || !formData.itemDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.itemTitle);
      formDataToSend.append('description', formData.itemDescription);
      if (formData.itemImage) {
        formDataToSend.append('imageUrl', formData.itemImage);
      }
      
      await listingAPI.submitExchange(listingId, formDataToSend);
      toast.success('Exchange request submitted successfully!');
      
      setTimeout(() => {
        navigate(`/listing/${listingId}`);
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit exchange request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-8 lg:px-20 py-8 max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">Exchange Request</h1>
          <p className="text-gray-400 font-medium">Provide details about the item you want to exchange</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-200 rounded-2xl p-8">
          <div className="space-y-6">
            {/* Item Title */}
            <div>
              <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Your Item Title *
              </label>
              <input
                type="text"
                name="itemTitle"
                value={formData.itemTitle}
                onChange={handleChange}
                placeholder="e.g. iPhone 13 Pro"
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                required
              />
            </div>

            {/* Item Description */}
            <div>
              <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Item Description *
              </label>
              <textarea
                name="itemDescription"
                value={formData.itemDescription}
                onChange={handleChange}
                placeholder="Describe your item in detail..."
                rows="4"
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none resize-none"
                required
              />
            </div>

            {/* Item Image */}
            <div>
              <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Item Image (Optional)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-8 px-4 text-center cursor-pointer hover:border-black transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {formData.itemImage ? formData.itemImage.name : 'Click to upload image'}
                  </p>
                </label>
                
                {imagePreview && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-black text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Exchange Request'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateExchangeRequestPage;
