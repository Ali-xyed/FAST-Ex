import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar/AdminNavbar';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

function AdminListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [filterVerified, setFilterVerified] = useState('UNVERIFIED'); // Default to unverified

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
      // Use admin API to get ALL listings including unverified
      const response = await adminAPI.getAllListings();
      setListings(response.data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await adminAPI.deleteListing(id);
      setListings(listings.filter(l => l.id !== id));
      toast.success('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const handleVerifyListing = async (id) => {
    try {
      await adminAPI.verifyListing(id);
      setListings(listings.map(l => 
        l.id === id ? { ...l, isVerified: true } : l
      ));
      toast.success('Listing verified successfully');
    } catch (error) {
      console.error('Error verifying listing:', error);
      toast.error('Failed to verify listing');
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filterType !== 'ALL' && listing.type !== filterType) return false;
    if (filterVerified === 'VERIFIED' && !listing.isVerified) return false;
    if (filterVerified === 'UNVERIFIED' && listing.isVerified) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <AdminNavbar />

      <main className="px-8 lg:px-20 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">Listing Management</h1>
          <p className="text-gray-400 font-medium">Approve or remove listings from the platform</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 block">Type</label>
              <div className="flex gap-2">
                {['ALL', 'SELL', 'EXCHANGE'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
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
              <div className="flex gap-2">
                {['ALL', 'VERIFIED', 'UNVERIFIED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterVerified(status)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
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
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg font-bold">
                {listings.filter(l => l.isVerified).length} Verified
              </span>
              <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg font-bold">
                {listings.filter(l => !l.isVerified).length} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-black tracking-tight mb-6">
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
                    <div key={listing.id} className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                      listing.isVerified ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-20 h-20 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 shadow-md">
                          {listing.imageUrl ? (
                            <img src={listing.imageUrl} className="w-full h-full object-cover" alt={listing.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-base font-black text-gray-900">{listing.title}</p>
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded ${
                              listing.type === 'SELL' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {listing.type}
                            </span>
                            {listing.isVerified && (
                              <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{listing.description}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-500 font-medium">By: {listing.email}</span>
                            {listing.price && (
                              <span className="font-black text-black">${listing.price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {!listing.isVerified && (
                          <button
                            onClick={() => handleVerifyListing(listing.id)}
                            className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminListingsPage;
