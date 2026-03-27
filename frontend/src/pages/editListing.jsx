import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { listingAPI } from '../utils/api';
import { LISTING_TYPES, CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';

function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'SELL',
    category: '',
    price: '',
    bargaining: false,
  });

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await listingAPI.getById(id);
      const listing = response.data;
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        type: listing.type || 'SELL',
        category: listing.category || '',
        price: listing.price || '',
        bargaining: listing.bargaining || false,
      });
    } catch (error) {
      toast.error('Failed to load listing');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const listingData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      };
      
      await listingAPI.update(id, listingData);
      toast.success('Listing updated successfully!');
      navigate(`/listing/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update listing');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-black tracking-tight mb-2">Edit Listing</h1>
          <p className="text-gray-400 font-medium">Update your listing details</p>
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
              {isLoading ? 'Updating...' : 'Update Listing'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditListingPage;
