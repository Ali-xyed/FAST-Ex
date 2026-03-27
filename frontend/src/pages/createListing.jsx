import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { listingAPI } from '../utils/api';
import { LISTING_TYPES, CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';

function CreateListingPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'SELL',
    category: '',
    price: '',
    bargaining: false,
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create listing
      const listingData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      };
      
      const response = await listingAPI.create(listingData);
      const listingId = response.data.id;

      // Upload images if any
      if (images.length > 0) {
        const imageFormData = new FormData();
        images.forEach(image => {
          imageFormData.append('images', image);
        });
        await listingAPI.uploadImages(listingId, imageFormData);
      }

      toast.success('Listing created successfully!');
      navigate(`/listing/${listingId}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-8 lg:px-20 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-black tracking-tight mb-2">Create Listing</h1>
          <p className="text-gray-400 font-medium">List your item for sale, rent, or exchange</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-8">
            <h2 className="text-lg font-black uppercase tracking-wider mb-6">Basic Information</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. iPhone 13 Pro Max"
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your item in detail..."
                  rows="5"
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Listing Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                    required
                  >
                    {LISTING_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Price (Rs) - Optional
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Leave empty for negotiable"
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="bargaining"
                    checked={formData.bargaining}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-black focus:ring-black rounded"
                  />
                  <span className="text-sm font-bold group-hover:text-black transition-colors">
                    Allow bargaining
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-8">
            <h2 className="text-lg font-black uppercase tracking-wider mb-6">Images (Max 5)</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 group">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors">
                  <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 text-black py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 bg-black text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateListingPage;
