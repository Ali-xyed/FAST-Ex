import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { messageAPI, listingAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';

const ListingCard = ({ listing, isOwnProfile = false, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSent, setIsSent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Check if listing has been sent on mount
  useEffect(() => {
    const sentListings = JSON.parse(localStorage.getItem('sentListings') || '{}');
    if (sentListings[listing.id]) {
      setIsSent(true);
    }
  }, [listing.id]);

  // Debug logging
  console.log('ListingCard - User:', user?.email, 'Listing Owner:', listing.email, 'Show Chat:', user?.email !== listing.email);
  console.log('ListingCard - userProfile:', listing.userProfile);
  console.log('ListingCard - Profile Image URL:', listing.userProfile?.imageUrl || listing.profileImageUrl);

  const getTypeColor = (type) => {
    switch (type) {
      case 'SELL': return 'bg-green-500';
      case 'RENT': return 'bg-blue-500';
      case 'EXCHANGE': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusInfo = (marked, type) => {
    // For unavailable items, show overlay
    if (marked === 'SOLD' || marked === 'RENTED' || marked === 'EXCHANGED') {
      return {
        showOverlay: true,
        overlayText: marked,
        badge: null
      };
    }
    
    // For available items, combine type and status in one badge
    return {
      showOverlay: false,
      overlayText: null,
      badge: {
        text: type,
        color: getTypeColor(type)
      }
    };
  };

  const handleSellerClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${listing.email}`);
  };

  const handleChatClick = async (e) => {
    e.stopPropagation();
    
    // Check if user is logged in
    if (!user) {
      toast.error("Please login to send messages");
      navigate('/login');
      return;
    }
    
    // Don't allow chat with yourself
    if (user?.email === listing.email) {
      toast.error("You can't chat with yourself");
      return;
    }

    try {
      // Create listing reference object
      const listingReference = {
        id: listing.id,
        title: listing.title,
        imageUrl: listing.imageUrl,
        type: listing.type,
        price: listing.sellListing?.price || listing.rentListing?.pricePerHour || null,
        withTitle: listing.exchangeListing?.withTitle || null
      };

      const response = await messageAPI.createOrFetchChat({
        otherUserEmail: listing.email,
        initialMessage: `Hi! I'm interested in your listing "${listing.title}"`,
        listingReference
      });
      
      // Mark listing as sent in localStorage
      const sentListings = JSON.parse(localStorage.getItem('sentListings') || '{}');
      sentListings[listing.id] = true;
      localStorage.setItem('sentListings', JSON.stringify(sentListings));
      setIsSent(true);
      
      navigate('/messages');
      toast.success('Listing sent in chat!');
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await listingAPI.delete(listing.id);
      toast.success('Listing deleted successfully');
      if (onDelete) onDelete(listing.id);
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const statusInfo = getStatusInfo(listing.marked, listing.type);

  return (
    <>
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
      
      <div 
        onClick={() => navigate(`/listing/${listing.id}`)}
        className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
      >
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Unverified badge for owner's view */}
        {!listing.isVerified && user?.email === listing.email && (
          <div className="absolute top-3 left-3">
            <div className="bg-yellow-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              Unverified
            </div>
          </div>
        )}
        
        {/* Single badge for available items */}
        {statusInfo.badge && (
          <div className="absolute top-3 right-3">
            <div className={`${statusInfo.badge.color} text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg`}>
              {statusInfo.badge.text}
            </div>
          </div>
        )}

        {/* Simple overlay for unavailable items */}
        {statusInfo.showOverlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center pb-8">
            <span className="text-white text-3xl font-black uppercase tracking-wider drop-shadow-lg">
              {statusInfo.overlayText}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-black tracking-tight text-gray-900 group-hover:text-black line-clamp-1 uppercase">
            {listing.title}
          </h3>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4 font-medium leading-relaxed">
          {listing.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              {listing.type === 'EXCHANGE' ? 'Wants' : 'Price'}
            </p>
            <p className="text-xl font-black text-black line-clamp-1">
              {listing.sellListing?.price ? `Rs ${listing.sellListing.price}` : 
               listing.rentListing?.pricePerHour ? `Rs ${listing.rentListing.pricePerHour}/hr` : 
               listing.exchangeListing?.withTitle ? listing.exchangeListing.withTitle :
               'Negotiable'}
            </p>
          </div>
          
          {/* Show delete icon only on own profile, otherwise show chat and profile icons */}
          {isOwnProfile ? (
            <button
              onClick={handleDeleteClick}
              className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all shadow-md"
              title="Delete Listing"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {/* Chat Button - with sent indicator */}
              <button
                onClick={handleChatClick}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md border-2 border-white ${
                  isSent 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
                title={isSent ? "Listing sent" : "Send Message"}
              >
                {isSent ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              </button>
              
              {/* Profile Button - show user image or "L" */}
              <div 
                onClick={handleSellerClick}
                className="relative hover:opacity-70 transition-opacity cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-md">
                  {(listing.userProfile?.imageUrl || listing.profileImageUrl) ? (
                    <img 
                      src={listing.userProfile?.imageUrl || listing.profileImageUrl} 
                      alt={listing.email} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-gray-600">L</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default ListingCard;
