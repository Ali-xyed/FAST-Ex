import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import CommentSection from '../components/CommentSection/CommentSection';
import { listingAPI, messageAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function ListingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' or 'offer'
  const [offerPrice, setOfferPrice] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    price: '',
    pricePerHour: '',
    imageUrl: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showMarkAsDropdown, setShowMarkAsDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await listingAPI.getById(id);
      console.log('Listing data:', response.data);
      console.log('isBargaining check:', {
        sellListing: response.data.sellListing,
        rentListing: response.data.rentListing,
        sellIsBargaining: response.data.sellListing?.isBargaining,
        rentIsBargaining: response.data.rentListing?.isBargaining,
      });
      setListing(response.data);
      
      // Initialize edit data
      setEditData({
        title: response.data.title,
        description: response.data.description,
        price: response.data.sellListing?.price || '',
        pricePerHour: response.data.rentListing?.pricePerHour || '',
        imageUrl: null,
      });
      setImagePreview(response.data.imageUrl);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await listingAPI.delete(id);
      toast.success('Listing deleted!');
      navigate('/home');
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const handleMarkAs = async (status) => {
    try {
      setUpdatingStatus(true);
      await listingAPI.markListing(id, { marked: status });
      toast.success(`Listing marked as ${status}!`);
      setShowMarkAsDropdown(false);
      fetchListing(); // Refresh listing data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleContactSeller = async () => {
    if (listing.type === 'EXCHANGE') {
      // Navigate to exchange request form
      navigate(`/exchange-request/${id}`);
    } else {
      // For SELL/RENT, send request
      try {
        await listingAPI.requestListing(id);
        toast.success('Request sent successfully!');
      } catch (error) {
        console.error('Error requesting listing:', error);
        toast.error(error.response?.data?.message || 'Failed to send request');
      }
    }
  };

  const handleMessageSeller = async () => {
    try {
      const response = await messageAPI.createOrFetchChat({ otherEmail: listing.email });
      console.log('Create/fetch chat response:', response.data);
      const chatId = response.data.id;
      navigate(`/messages?chat=${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to open chat');
    }
  };

  const handleMakeOffer = async () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0 || parseFloat(offerPrice) > maxPrice) {
      toast.error('Please enter a valid offer price');
      return;
    }

    try {
      const bargainData = {
        price: parseFloat(offerPrice),
        type: listing.type === 'SELL' ? 'BUY' : 'RENT',
        ...(listing.sellListing && { sellListingId: listing.sellListing.id }),
        ...(listing.rentListing && { rentListingId: listing.rentListing.id })
      };

      await listingAPI.submitBargain(id, bargainData);
      toast.success('Offer submitted successfully!');
      setOfferPrice('');
      setActiveTab('comments');
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error(error.response?.data?.message || 'Failed to submit offer');
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset edit data to original values
    setEditData({
      title: listing.title,
      description: listing.description,
      price: listing.sellListing?.price || '',
      pricePerHour: listing.rentListing?.pricePerHour || '',
      imageUrl: null,
    });
    setImagePreview(listing.imageUrl);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData(prev => ({ ...prev, imageUrl: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditData(prev => ({ ...prev, imageUrl: null }));
    setImagePreview(null);
  };

  const handleSaveEdit = async () => {
    if (!editData.title || !editData.description) {
      toast.error('Title and description are required');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', editData.title);
      formData.append('description', editData.description);
      
      if (listing.type === 'SELL' && editData.price) {
        formData.append('price', editData.price);
      } else if (listing.type === 'RENT' && editData.pricePerHour) {
        formData.append('pricePerHour', editData.pricePerHour);
      }
      
      if (editData.imageUrl) {
        formData.append('imageUrl', editData.imageUrl);
      }

      await listingAPI.updateListing(id, formData);
      toast.success('Listing updated successfully!');
      setIsEditing(false);
      fetchListing(); // Refresh listing data
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error(error.response?.data?.message || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  // Check if bargaining is allowed
  const isBargainingAllowed = listing?.sellListing?.isBargaining || listing?.rentListing?.isBargaining;
  const maxPrice = listing?.sellListing?.price || listing?.rentListing?.pricePerHour || 0;

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

  if (!listing) return null;

  const isOwner = user?.email === listing.email;
  const image = listing.imageUrl;

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-12 lg:px-20 py-6 max-w-[1600px] mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
          {/* Left Side - Item Details Card (4/9 width) */}
          <div className="lg:col-span-4 bg-white border-2 border-gray-200 rounded-2xl overflow-hidden flex flex-col">
            {/* Image */}
            <div 
              className="relative h-64 bg-gray-50"
            >
              {isEditing ? (
                <div className="relative w-full h-full">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt={editData.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <svg className="w-16 h-16 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 text-xs font-bold">Click to upload image</p>
                    </label>
                  )}
                </div>
              ) : (
                <div 
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => image && setShowImageModal(true)}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 text-xs font-bold">NO PREVIEW IMAGE</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6 flex-1 flex flex-col">
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={editData.title}
                  onChange={handleEditChange}
                  className="text-2xl font-black tracking-tight mb-2 bg-gray-50 border-2 border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-black/5 outline-none"
                />
              ) : (
                <h1 className="text-2xl font-black tracking-tight mb-2">{listing.title}</h1>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {listing.type}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>Lahore</span>
                </div>
              </div>

              {/* Price and Seller inline */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                {(listing.sellListing || listing.rentListing) && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Price</p>
                    {isEditing ? (
                      listing.type === 'SELL' ? (
                        <input
                          type="number"
                          name="price"
                          value={editData.price}
                          onChange={handleEditChange}
                          className="w-full text-xl font-black bg-gray-50 border-2 border-gray-200 rounded-xl py-1 px-2 focus:ring-2 focus:ring-black/5 outline-none"
                        />
                      ) : listing.type === 'RENT' ? (
                        <input
                          type="number"
                          name="pricePerHour"
                          value={editData.pricePerHour}
                          onChange={handleEditChange}
                          className="w-full text-xl font-black bg-gray-50 border-2 border-gray-200 rounded-xl py-1 px-2 focus:ring-2 focus:ring-black/5 outline-none"
                        />
                      ) : (
                        <p className="text-2xl font-black">Negotiable</p>
                      )
                    ) : (
                      <p className="text-2xl font-black">
                        {listing.sellListing?.price !== undefined ? `Rs ${listing.sellListing.price}` : 
                         listing.rentListing?.pricePerHour !== undefined ? `Rs ${listing.rentListing.pricePerHour}/hr` : 
                         'N/A'}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Seller</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-700">{listing.email}</p>
                    {!isOwner && (
                      <button
                        onClick={handleMessageSeller}
                        className="flex items-center gap-1 bg-white border border-black text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        </svg>
                        Message
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Description</p>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                    rows="4"
                    className="w-full text-sm text-gray-700 font-medium leading-relaxed bg-gray-50 border-2 border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-black/5 outline-none resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">{listing.description}</p>
                )}
              </div>

              <p className="text-[10px] text-gray-400 mb-4">
                {new Date(listing.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>

              {/* Action Buttons */}
              <div className="mt-auto">
                {!isOwner ? (
                  <div className="space-y-3">
                    {listing.marked !== 'PENDING' ? (
                      <div className="w-full bg-gray-100 border-2 border-gray-200 py-3 rounded-xl text-center">
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                          {listing.marked === 'SOLD' && 'SOLD OUT'}
                          {listing.marked === 'RENTED' && 'RENTED OUT'}
                          {listing.marked === 'EXCHANGED' && 'EXCHANGED'}
                          {!['SOLD', 'RENTED', 'EXCHANGED', 'PENDING'].includes(listing.marked) && 'NOT AVAILABLE'}
                        </p>
                      </div>
                    ) : listing.type === 'EXCHANGE' ? (
                      <button
                        onClick={handleContactSeller}
                        className="w-full bg-black text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                      >
                        Exchange Request
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleContactSeller}
                          className="w-full bg-black text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                        >
                          Request Item
                        </button>
                        {isBargainingAllowed && (
                          <button
                            onClick={() => setActiveTab(activeTab === 'offer' ? 'comments' : 'offer')}
                            className={`w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                              activeTab === 'offer'
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-black hover:bg-gray-200'
                            }`}
                          >
                            Bargain
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : isEditing ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className={`flex-1 bg-black text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all ${
                        saving ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Mark As Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowMarkAsDropdown(!showMarkAsDropdown)}
                        disabled={updatingStatus}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        <span>Mark as: {listing.marked}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showMarkAsDropdown && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden z-10">
                          <button
                            onClick={() => handleMarkAs('PENDING')}
                            disabled={updatingStatus || listing.marked === 'PENDING'}
                            className={`w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-50 transition-all ${
                              listing.marked === 'PENDING' ? 'bg-green-50 text-green-600' : 'text-gray-700'
                            }`}
                          >
                            PENDING (Available)
                          </button>
                          
                          {listing.type === 'SELL' && (
                            <button
                              onClick={() => handleMarkAs('SOLD')}
                              disabled={updatingStatus || listing.marked === 'SOLD'}
                              className={`w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-50 transition-all border-t border-gray-100 ${
                                listing.marked === 'SOLD' ? 'bg-red-50 text-red-600' : 'text-gray-700'
                              }`}
                            >
                              SOLD
                            </button>
                          )}
                          
                          {listing.type === 'RENT' && (
                            <button
                              onClick={() => handleMarkAs('RENTED')}
                              disabled={updatingStatus || listing.marked === 'RENTED'}
                              className={`w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-50 transition-all border-t border-gray-100 ${
                                listing.marked === 'RENTED' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                              }`}
                            >
                              RENTED
                            </button>
                          )}
                          
                          {listing.type === 'EXCHANGE' && (
                            <button
                              onClick={() => handleMarkAs('EXCHANGED')}
                              disabled={updatingStatus || listing.marked === 'EXCHANGED'}
                              className={`w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-50 transition-all border-t border-gray-100 ${
                                listing.marked === 'EXCHANGED' ? 'bg-purple-50 text-purple-600' : 'text-gray-700'
                              }`}
                            >
                              EXCHANGED
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleEditClick}
                        className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Comments/Offer Section (5/9 width) */}
          <div className="lg:col-span-5 bg-white border-2 border-gray-200 rounded-2xl overflow-hidden flex flex-col">
            {activeTab === 'comments' ? (
              <>
                <div className="p-4 border-b-2 border-gray-200 flex-shrink-0">
                  <h2 className="text-sm font-black uppercase tracking-wider">Comments</h2>
                </div>
                <div 
                  className="flex-1 overflow-y-scroll p-4" 
                  style={{ 
                    maxHeight: 'calc(100vh - 200px)',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#9CA3AF #F3F4F6'
                  }}
                >
                  <CommentSection listingId={id} />
                </div>
              </>
            ) : (
              <>
                <div className="p-4 border-b-2 border-gray-200 flex-shrink-0">
                  <h2 className="text-sm font-black uppercase tracking-wider">Make Your Offer</h2>
                </div>
                <div 
                  className="flex-1 overflow-y-scroll p-4" 
                  style={{ 
                    maxHeight: 'calc(100vh - 200px)',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#9CA3AF #F3F4F6'
                  }}
                >
                  <div className="space-y-4">
                    <p className="text-xs text-gray-600">
                      The seller has enabled bargaining. Make an offer between Rs 0 and Rs {maxPrice}.
                    </p>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Your Offer Price (Rs)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={maxPrice}
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        placeholder={`Enter amount (Max: Rs ${maxPrice})`}
                        className="w-full bg-gray-50 border-none rounded-xl py-2.5 px-3 text-xs font-bold focus:ring-2 focus:ring-black/5 outline-none"
                      />
                      {offerPrice && parseFloat(offerPrice) > maxPrice && (
                        <p className="text-[10px] text-red-500 mt-1 font-medium">
                          Offer cannot exceed Rs {maxPrice}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleMakeOffer}
                      disabled={!offerPrice || parseFloat(offerPrice) <= 0 || parseFloat(offerPrice) > maxPrice}
                      className={`w-full bg-black text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all ${
                        !offerPrice || parseFloat(offerPrice) <= 0 || parseFloat(offerPrice) > maxPrice
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      Submit Offer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {showImageModal && image && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={image}
            alt={listing.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default ListingDetailsPage;
