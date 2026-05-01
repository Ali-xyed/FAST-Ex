import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../utils/api';
import toast from 'react-hot-toast';

function SettingsPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [editName, setEditName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('imageUrl', file);
      
      await userAPI.uploadProfileImage(formData);
      await refreshProfile();
      toast.success('Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    setSavingChanges(true);
    try {
      await userAPI.updateProfile({ name: editName });
      await refreshProfile();
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to save changes');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 10) {
      toast.error('Password must be at least 10 characters');
      return;
    }

    // Password validation - same as register
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character');
      return;
    }

    setChangingPassword(true);
    try {
      // First verify current password by attempting login
      await authAPI.login({ email: user.email, password: currentPassword });
      
      // If login successful, change password
      await authAPI.changePassword({ email: user.email, password: newPassword });
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.status === 401) {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Validate email confirmation
    if (deleteConfirmEmail !== user.email) {
      toast.error('Email does not match. Please type your email to confirm.');
      return;
    }

    setDeletingAccount(true);
    try {
      // First, log out the user (clear local storage and auth state)
      localStorage.clear();
      
      // Then delete the account from the server
      await userAPI.deleteAccount();
      
      toast.success('Account deleted successfully');
      
      // Navigate to landing page
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
      setDeletingAccount(false);
    }
  };

  if (!user) return null;

  const hasChanges = editName !== user.name;
  const hasPasswordChanges = currentPassword || newPassword || confirmNewPassword;

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-4 sm:px-8 lg:px-20 py-8 max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Profile
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">Profile</h1>
          <p className="text-gray-400 font-medium text-sm">Manage your personal information</p>
        </div>

        {/* Profile Settings Section */}
        <div className="bg-white md:border md:border-gray-200 md:rounded-2xl md:p-8 mb-6">
          {/* Account Email (Read-only) */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-400 mb-2">
              Account email (read-only)
            </label>
            <div className="text-sm font-medium text-gray-700">
              {user.email}
            </div>
          </div>

          {/* Profile Photo */}
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={user.imageUrl || '/client/public/open_peeps/astro.png'}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 mb-1">Profile photo</div>
                  <div className="text-xs text-gray-500 font-medium">JPG, PNG or WEBP. Max size 5MB</div>
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-900 mb-2">
              Display name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
              placeholder="Enter your name"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveChanges}
            disabled={savingChanges || !hasChanges}
            className={`w-full sm:w-auto bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              savingChanges || !hasChanges
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-800'
            }`}
          >
            {savingChanges ? 'Saving changes...' : 'Save changes'}
          </button>
        </div>

        {/* Password Change Section */}
        <div className="bg-white md:border md:border-gray-200 md:rounded-2xl md:p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-black tracking-tight mb-1">Change Password</h2>
            <p className="text-sm text-gray-500 font-medium">Update your account password</p>
          </div>

          <div className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all pr-16"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all pr-16"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">
                Must be at least 10 characters with uppercase, lowercase, digit & special character
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all pr-16"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Change Password Button */}
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !hasPasswordChanges}
              className={`w-full sm:w-auto bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                changingPassword || !hasPasswordChanges
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-800'
              }`}
            >
              {changingPassword ? 'Changing password...' : 'Change password'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white md:border md:border-gray-200 md:rounded-2xl md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-base font-black text-red-600 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-600 font-medium">
                Permanently delete your account and all associated data including listings, messages, and comments. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="w-full md:w-auto md:ml-6 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors md:flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete account
            </button>
          </div>
        </div>
      </main>

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteAccountModal}
        onClose={() => {
          setShowDeleteAccountModal(false);
          setDeleteConfirmEmail('');
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account Permanently?"
        message={
          <div className="space-y-4">
            <p className="text-center text-gray-600 leading-relaxed">
              This action cannot be undone. All your data including profile, listings, comments, and messages will be permanently deleted from our servers.
            </p>
            <div className="text-left">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Type your email to confirm: <span className="text-red-600">{user.email}</span>
              </label>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl py-2.5 px-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        }
        confirmText={deletingAccount ? "Deleting..." : "Delete Account"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default SettingsPage;
