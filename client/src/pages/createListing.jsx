import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import { listingAPI } from '../utils/api';
import { LISTING_TYPES } from '../utils/constants';
import toast from 'react-hot-toast';

function CreateListingPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'SELL',
    price: '',
    pricePerHour: '',
    withTitle: '',
    withDescription: '',
    isBargaining: false,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();
      
      formDataToSend.append('type', formData.type);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('isBargaining', formData.isBargaining.toString());

      // Add type-specific fields
      if (formData.type === 'SELL') {
        if (formData.price) formDataToSend.append('price', formData.price);
      } else if (formData.type === 'RENT') {
        if (formData.pricePerHour) formDataToSend.append('pricePerHour', formData.pricePerHour);
      } else if (formData.type === 'EXCHANGE') {
        if (!formData.withTitle || !formData.withDescription) {
          toast.error('Please fill in exchange details');
          setIsLoading(false);
          return;
        }
        formDataToSend.append('withTitle', formData.withTitle);
        formDataToSend.append('withDescription', formData.withDescription);
      }

      // Add image file if provided (backend expects 'imageUrl' field with File)
      if (image) {
        formDataToSend.append('imageUrl', image);
      }
      
      const response = await listingAPI.create(formDataToSend);

      // Show confirmation modal instead of toast
      setShowModal(true);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <ConfirmationModal
        isOpen={showModal}
        onClose={handleModalClose}
        title="Post Created Successfully!"
        message="Your post has been created and sent for verification. It requires admin verification, so please wait for a while. You can view it in your profile."
      />

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
                  Title <span className="text-gray-300">({formData.title.length}/10)</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={10}
                  placeholder="e.g. iPhone 13"
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Description <span className="text-gray-300">({formData.description.length}/30)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  maxLength={30}
                  placeholder="Describe your item..."
                  rows="3"
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

                {formData.type === 'SELL' && (
                  <div>
                    <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Price (Rs) - Optional
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 1250"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                    />
                  </div>
                )}

                {formData.type === 'RENT' && (
                  <div>
                    <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Price Per Hour (Rs) - Optional
                    </label>
                    <input
                      type="number"
                      name="pricePerHour"
                      value={formData.pricePerHour}
                      onChange={handleInputChange}
                      placeholder="e.g. 200"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                    />
                  </div>
                )}
              </div>

              {formData.type === 'EXCHANGE' && (
                <div className="space-y-5 pt-2">
                  <div>
                    <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      What do you want in exchange?
                    </label>
                    <input
                      type="text"
                      name="withTitle"
                      value={formData.withTitle}
                      onChange={handleInputChange}
                      placeholder="e.g. Physics Notes"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                      required={formData.type === 'EXCHANGE'}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Exchange Description
                    </label>
                    <textarea
                      name="withDescription"
                      value={formData.withDescription}
                      onChange={handleInputChange}
                      placeholder="Describe what you're looking for..."
                      rows="3"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none resize-none"
                      required={formData.type === 'EXCHANGE'}
                    />
                  </div>
                </div>
              )}

              {/* Only show bargaining option for SELL and RENT types */}
              {(formData.type === 'SELL' || formData.type === 'RENT') && (
                <div>
                  <label className={`flex items-center gap-3 cursor-pointer group ${
                    (formData.type === 'SELL' && !formData.price) || (formData.type === 'RENT' && !formData.pricePerHour) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}>
                    <input
                      type="checkbox"
                      name="isBargaining"
                      checked={formData.isBargaining}
                      onChange={handleInputChange}
                      disabled={
                        (formData.type === 'SELL' && !formData.price) || 
                        (formData.type === 'RENT' && !formData.pricePerHour)
                      }
                      className="w-4 h-4 text-black focus:ring-black rounded disabled:opacity-50"
                    />
                    <span className="text-sm font-bold group-hover:text-black transition-colors">
                      Allow bargaining {
                        ((formData.type === 'SELL' && !formData.price) || (formData.type === 'RENT' && !formData.pricePerHour)) 
                          ? '(Price required)' 
                          : ''
                      }
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-8">
            <h2 className="text-lg font-black uppercase tracking-wider mb-6">Image (Optional)</h2>
            
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden border-2 border-gray-100 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="w-full max-w-md aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors">
                  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-bold text-gray-400 uppercase">Upload Image</span>
                  <span className="text-xs text-gray-300 mt-1">Click to select</span>
                  <input
                    type="file"
                    accept="image/*"
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
