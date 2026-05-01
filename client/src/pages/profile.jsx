import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import Navbar from '../components/Navbar/Navbar';
import ListingCard from '../components/ListingCard/ListingCard';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { listingAPI, userAPI } from '../utils/api';
import toast from 'react-hot-toast';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyListings();
      setEditName(user.name || '');
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

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await userAPI.deleteAccount();
      toast.success('Account deleted successfully');
      // Logout and redirect
      localStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
      setDeletingAccount(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    setSavingName(true);
    try {
      await userAPI.updateProfile({ name: editName });
      await refreshProfile();
      toast.success('Name updated successfully');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    } finally {
      setSavingName(false);
    }
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
                onClick={() => setShowEditModal(true)}
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight">Account Settings</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Profile Settings Section */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Profile Settings</h3>
                    <p className="text-xs text-gray-500 font-medium">Update your profile information</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 rounded-lg py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                      Email (Cannot be changed)
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-gray-100 border-2 border-gray-200 rounded-lg py-2 px-3 text-sm font-medium text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || editName === user.name}
                    className={`w-full bg-black text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      savingName || editName === user.name
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    {savingName ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t-2 border-gray-200 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-red-600">Danger Zone</h3>
                    <p className="text-xs text-red-500 font-medium">Irreversible and destructive actions</p>
                  </div>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-black text-red-900 mb-1">Delete Account</p>
                      <p className="text-xs text-red-700 font-medium mb-3">
                        Once you delete your account, there is no going back. This will permanently delete:
                      </p>
                      <ul className="text-xs text-red-700 font-medium space-y-1 mb-4 ml-4">
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          Your profile and account data
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          All your listings and posts
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          All your comments
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          All your messages and conversations
                        </li>
                      </ul>
                      <button
                        onClick={() => {
                          setShowEditModal(false);
                          setShowDeleteAccountModal(true);
                        }}
                        className="w-full bg-red-600 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account Permanently?"
        message="This will permanently delete your account, all your listings, comments, and messages. This action cannot be undone."
        confirmText={deletingAccount ? "Deleting..." : "Delete Account"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default ProfilePage;
