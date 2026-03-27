import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function AdminPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (profile && profile.role !== 'ADMIN') {
      toast.error('Access denied. Admin only.');
      navigate('/home');
      return;
    }

    if (profile) {
      fetchData();
    }
  }, [profile, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await adminAPI.getAllUsers();
        setUsers(response.data);
      } else {
        const response = await adminAPI.getAllListings();
        setListings(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (email) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    
    try {
      await adminAPI.banUser(email);
      toast.success('User banned successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (email) => {
    try {
      await adminAPI.unbanUser(email);
      toast.success('User unbanned successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to unban user');
    }
  };

  const handleDeleteListing = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await adminAPI.deleteListing(id);
      toast.success('Listing deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const handleVerifyListing = async (id) => {
    try {
      await adminAPI.verifyListing(id);
      toast.success('Listing verified successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to verify listing');
    }
  };

  if (!profile || profile.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-8 lg:px-20 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">Admin Panel</h1>
          <p className="text-gray-400 font-medium">Manage users and listings</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'listings' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
            >
              Listings
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400 font-medium">Loading...</p>
              </div>
            ) : activeTab === 'users' ? (
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No users found</p>
                ) : (
                  users.map((user) => (
                    <div key={user.email} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.imageUrl ? (
                            <img src={user.imageUrl} className="w-full h-full object-cover" alt={user.name} />
                          ) : (
                            <span className="text-sm font-bold">{user.name?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                            {user.rollNo} • Reputation: {user.reputationScore || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {user.isBan ? (
                          <>
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">
                              Banned
                            </span>
                            <button
                              onClick={() => handleUnbanUser(user.email)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                            >
                              Unban
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user.email)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                          >
                            Ban User
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {listings.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No listings found</p>
                ) : (
                  listings.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                          {listing.images && listing.images[0] ? (
                            <img src={listing.images[0]} className="w-full h-full object-cover" alt={listing.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black">{listing.title}</p>
                          <p className="text-xs text-gray-400">{listing.category} • {listing.type}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                            By: {listing.seller?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/listing/${listing.id}`)}
                          className="bg-gray-200 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-300 transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleVerifyListing(listing.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
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

export default AdminPage;
