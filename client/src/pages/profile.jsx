import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import Navbar from '../components/Navbar/Navbar';
import ListingCard from '../components/ListingCard/ListingCard';
import { useAuth } from '../context/AuthContext';
import { listingAPI, userAPI } from '../utils/api';
import toast from 'react-hot-toast';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      const response = await listingAPI.getMy();
      setMyListings(response.data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      // Don't show error toast if it's a 401 (will be handled by interceptor)
      if (error.response?.status !== 401) {
        toast.error('Failed to load your listings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imageUrl', file);

    try {
      await userAPI.uploadProfileImage(formData);
      await refreshProfile();
      toast.success('Profile image updated!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleDeleteListing = (deletedId) => {
    setMyListings(myListings.filter(listing => listing.id !== deletedId));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-4 sm:px-8 lg:px-20 py-8 max-w-7xl mx-auto">
        <div className="bg-white md:border md:border-gray-100 md:rounded-2xl md:p-8 mb-8">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-black flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} className="w-full h-full object-cover" alt="profile" />
                  ) : (
                    <span className="text-white text-4xl font-black">{user.name?.charAt(0)}</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-all shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="text-black font-black text-lg">★</span>
                  <span className="text-sm font-bold">{user.reputationScore || 0}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Reputation</p>
              </div>
            </div>

            <div className="w-full max-w-2xl">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 truncate px-4">{user.name}</h1>
                <p className="text-sm text-gray-500 font-medium mt-1 break-all px-4">{user.email}</p>
              </div>
              
              {/* Edit Profile Button */}
              <button
                onClick={() => navigate('/settings')}
                className="w-full max-w-xs mx-auto bg-black text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black tracking-tight">My Listings</h2>
            <button
              onClick={() => navigate('/create-listing')}
              className="bg-black text-white px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              + New Listing
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400 font-medium">Loading...</p>
            </div>
          ) : myListings.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
              <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-2xl font-black mb-2">No listings yet</h3>
              <p className="text-gray-400 font-medium mb-6">Create your first listing to get started</p>
              <button
                onClick={() => navigate('/create-listing')}
                className="bg-black text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                Create Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((listing) => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  isOwnProfile={true}
                  onDelete={handleDeleteListing}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
