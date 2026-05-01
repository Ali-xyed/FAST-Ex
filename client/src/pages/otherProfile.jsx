import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI, listingAPI, messageAPI } from '../utils/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar/Navbar';
import ListingCard from '../components/ListingCard/ListingCard';
import { useAuth } from '../context/AuthContext';

function OtherProfilePage() {
  const { email } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userRes, listingsRes] = await Promise.all([
        userAPI.getPublicProfile(email),
        listingAPI.getAll({ email }), // Filter by email on client side
      ]);
      
      setUser(userRes.data);
      // Filter listings by email since backend doesn't have user-specific endpoint
      const userListings = listingsRes.data.filter(listing => listing.email === email);
      setListings(userListings);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async () => {
    if (!currentUser) {
      toast.error('Please login to send messages');
      return;
    }

    if (currentUser.email === email) {
      toast.error("You can't message yourself");
      return;
    }

    try {
      const response = await messageAPI.createOrFetchChat({
        otherUserEmail: email,
        initialMessage: `Hi! I'd like to connect with you.`
      });
      
      const chatId = response.data.id;
      toast.success('Chat started!');
      navigate(`/messages?chat=${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to start chat');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-400">User not found</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 px-6 py-2 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="px-8 lg:px-20 py-12 max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="w-32 h-32 rounded-full bg-black flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
              {user.imageUrl ? (
                <img src={user.imageUrl} className="w-full h-full object-cover" alt={user.name} />
              ) : (
                <span className="text-white text-4xl font-black">{user.name.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-black tracking-tight mb-2">{user.name}</h1>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{user.rollNo}</p>
                  
                  <div className="flex items-center gap-8 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-black text-black">{user.reputationScore || 0}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reputation</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-black">{listings.length}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Listings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-black">{new Date(user.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Member Since</p>
                    </div>
                  </div>
                </div>

                {/* Message Button - only show message button with black background */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleMessageClick}
                    className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg min-w-[160px]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div>
          <h2 className="text-xl font-black tracking-tight mb-4">Listings</h2>
          {listings.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">No listings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                listing.isVerified ? (
                  <ListingCard key={listing.id} listing={listing} />
                ) : (
                  <div key={listing.id} className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      <div className="absolute inset-0 backdrop-blur-xl bg-gray-200/50 flex items-center justify-center">
                        <div className="text-center p-6">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <p className="text-sm font-black text-gray-600 uppercase tracking-wider">Image Hidden</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="mb-3">
                        <h3 className="text-lg font-black tracking-tight text-gray-400 uppercase blur-sm">
                          This post is under verification
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400 mb-4 font-medium leading-relaxed blur-sm">
                        Content is hidden until admin verification is complete
                      </p>
                      <div className="flex items-center justify-center pt-4 border-t border-gray-50">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Under Verification
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OtherProfilePage;
