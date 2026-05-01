import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar/AdminNavbar';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

function AdminListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [filterVerified, setFilterVerified] = useState('UNVERIFIED'); // Default to unverified
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);

  // Check admin session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
      toast.error('Please login as admin');
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllListings();
      setListings(response.data);
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!listingToDelete) return;
    
    try {
      await adminAPI.deleteListing(listingToDelete.id);
      setListings(listings.filter(l => l.id !== listingToDelete.id));
      toast.success('Listing deleted successfully');
      setShowDeleteModal(false);
      setListingToDelete(null);
      
      // Refetch to update dashboard counts
      await fetchListings();
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const handleVerifyListing = async (id, action) => {
    try {
      await adminAPI.verifyListing(id, action);
      
      if (action === 'reject') {
        // Remove from list if rejected
        setListings(listings.filter(l => l.id !== id));
        toast.success('Listing rejected! User reputation -5');
      } else {
        // Update verification status if approved
        setListings(listings.map(l => 
          l.id === id ? { ...l, isVerified: true } : l
        ));
        toast.success('Listing approved! User reputation +1');
      }
      
      // Refetch to update dashboard counts
      await fetchListings();
    } catch (error) {
      toast.error(`Failed to ${action} listing`);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filterType !== 'ALL' && listing.type !== filterType) return false;
    if (filterVerified === 'VERIFIED' && !listing.isVerified) return false;
    if (filterVerified === 'UNVERIFIED' && listing.isVerified) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <AdminNavbar />

      <main className="px-4 sm:px-8 lg:px-20 py-8 max-w-full lg:max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Listing Management</h1>
          <p className="text-gray-400 font-medium text-sm sm:text-base">Approve or remove listings from the platform</p>
        </div>

        {/* Filters */}
        <div className="bg-white md:border md:border-gray-100 md:rounded-2xl p-4 sm:p-6 mb-6 md:shadow-lg">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {['ALL', 'SELL', 'EXCHANGE'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      filterType === type
                        ? 'bg-black text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {['ALL', 'VERIFIED', 'UNVERIFIED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterVerified(status)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      filterVerified === status
                        ? 'bg-black text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-lg font-bold border border-gray-200">
                {listings.filter(l => l.isVerified).length} Verified
              </span>
              <span className="px-3 py-1 bg-black text-white rounded-lg font-bold">
                {listings.filter(l => !l.isVerified).length} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="bg-white md:border md:border-gray-100 md:rounded-2xl overflow-hidden md:shadow-lg">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black tracking-tight mb-6">
              All Listings ({filteredListings.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400 font-medium">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredListings.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No listings found</p>
                ) : (
                  filteredListings.map((listing) => (
                    <div key={listing.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl transition-all gap-4 ${
                      listing.isVerified ? 'bg-white border-2 border-gray-200' : 'bg-gray-100 border-2 border-gray-300'
                    }`}>
                      <div className="flex items-start sm:items-center gap-4 flex-1 w-full">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 shadow-md">
                          {listing.imageUrl ? (
                            <img src={listing.imageUrl} className="w-full h-full object-cover" alt={listing.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 sm:w-8 h-6 sm:h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-sm sm:text-base font-black text-gray-900 truncate">{listing.title}</p>
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded ${
                              listing.type === 'SELL' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-900'
                            }`}>
                              {listing.type}
                            </span>
                            {listing.isVerified && (
                              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1 line-clamp-2">{listing.description}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                            <span className="text-gray-500 font-medium truncate">By: {listing.email}</span>
                            {listing.price && (
                              <span className="font-black text-black">Rs {listing.price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {!listing.isVerified && (
                          <>
                            <button
                              onClick={() => handleVerifyListing(listing.id, 'approve')}
                              className="flex-1 sm:flex-none bg-green-600 text-white px-4 sm:px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyListing(listing.id, 'reject')}
                              className="flex-1 sm:flex-none bg-red-600 text-white px-4 sm:px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {listing.isVerified && (
                          <button
                            onClick={() => {
                              setListingToDelete(listing);
                              setShowDeleteModal(true);
                            }}
                            className="flex-1 sm:flex-none bg-white text-black border-2 border-black px-4 sm:px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setListingToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Listing"
        message={`Are you sure you want to delete "${listingToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default AdminListingsPage;
