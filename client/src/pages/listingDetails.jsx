import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import CommentSection from '../components/CommentSection/CommentSection';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import { listingAPI, messageAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function ListingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'comments', or 'offer'
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
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
      const response = await messageAPI.createOrFetchChat({ 
        otherUserEmail: listing.email,
        initialMessage: `Hi! I'm interested in your listing "${listing.title}"`
      });
      const chatId = response.data.id;
      toast.success('Chat opened!');
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
      <div className="min-h-screen bg-white md:bg-gray-50">
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
    <div className="min-h-screen bg-white md:bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-4 sm:px-12 lg:px-20 py-6 max-w-[1600px] mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden mb-4 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'details'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'comments'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Comments
          </button>
          {!isOwner && isBargainingAllowed && listing.marked === 'PENDING' && (
            <button
              onClick={() => setActiveTab('offer')}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'offer'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Bargain
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
          {/* Left Side - Item Details Card (4/9 width) */}
          <div className={`lg:col-span-4 bg-white md:border-2 md:border-gray-200 md:rounded-2xl overflow-hidden flex flex-col ${
            activeTab !== 'details' ? 'hidden lg:flex' : ''
          }`}>
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
                            onClick={() => {
                              setActiveTab('offer');
                              // Scroll to top on mobile
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
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
          <div className={`lg:col-span-5 bg-white md:border-2 md:border-gray-200 md:rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)] ${
            activeTab === 'details' ? 'hidden lg:flex' : ''
          }`}>
            {activeTab === 'comments' ? (
              <>
                <div className="p-4 border-b-2 border-gray-200 flex-shrink-0">
                  <h2 className="text-sm font-black uppercase tracking-wider">Comments</h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CommentSection listingId={id} />
                </div>
              </>
            ) : (
              <>
                <div className="p-6 border-b-2 border-gray-200 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight">Make Your Offer</h2>
                      <p className="text-xs text-gray-500 font-medium">Bargaining is enabled for this item</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6" style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#9CA3AF #F3F4F6'
                  }}>
                  <div className="space-y-6 h-full flex flex-col">
                    {/* Price Range Info */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-black text-gray-900">Price Range</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Minimum</p>
                          <p className="text-2xl font-black text-gray-900">Rs 0</p>
                        </div>
                        <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-300"></div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Maximum</p>
                          <p className="text-2xl font-black text-gray-900">Rs {maxPrice}</p>
                        </div>
                      </div>
                    </div>

                    {/* Offer Input */}
                    <div>
                      <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-3">
                        Your Offer Price
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">
                          Rs
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={maxPrice}
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          placeholder="0"
                          className="w-full bg-white border-2 border-gray-200 rounded-xl py-4 pl-14 pr-4 text-2xl font-black focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                        />
                      </div>
                      
                      {/* Validation Messages */}
                      {offerPrice && parseFloat(offerPrice) > maxPrice && (
                        <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm font-bold text-red-700">
                            Offer cannot exceed Rs {maxPrice}
                          </p>
                        </div>
                      )}
                      
                      {offerPrice && parseFloat(offerPrice) > 0 && parseFloat(offerPrice) <= maxPrice && (
                        <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm font-bold text-green-700">
                            Valid offer! You're saving Rs {maxPrice - parseFloat(offerPrice)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleMakeOffer}
                      disabled={!offerPrice || parseFloat(offerPrice) <= 0 || parseFloat(offerPrice) > maxPrice}
                      className={`w-full bg-black text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl mt-auto ${
                        !offerPrice || parseFloat(offerPrice) <= 0 || parseFloat(offerPrice) > maxPrice
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:scale-[1.02]'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Offer
                      </span>
                    </button>

                    {/* Tips */}
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">Bargaining Tips</p>
                      <ul className="space-y-2 text-xs text-gray-600 font-medium">
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>Start with a reasonable offer to increase acceptance chances</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>The seller will be notified of your offer</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>You can negotiate further via messages</span>
                        </li>
                      </ul>
                    </div>
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
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default ListingDetailsPage;
