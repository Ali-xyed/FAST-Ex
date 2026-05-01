import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar/AdminNavbar';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);

  // Check admin session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
      toast.error('Please login as admin');
      navigate('/admin');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      const nonAdminUsers = response.data.filter(user => 
        user.role?.toUpperCase() !== 'ADMIN' && 
        user.email !== 'm.ahmad.software.engineer@gmail.com'
      );
      setUsers(nonAdminUsers);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (email) => {
    const userToUpdate = users.find(u => u.email === email);
    setUserToBan(userToUpdate);
    setShowConfirmModal(true);
  };

  const confirmBanToggle = async () => {
    if (!userToBan) return;
    
    const action = userToBan.isBan ? 'unban' : 'ban';
    
    try {
      const response = await adminAPI.toggleBanUser(userToBan.email);
      
      setUsers(users.map(u => 
        u.email === userToBan.email ? { ...u, isBan: response.data.isBan } : u
      ));
      toast.success(`User ${action}ned successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setShowConfirmModal(false);
      setUserToBan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white md:bg-gray-50">
        <AdminNavbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <AdminNavbar />

      <main className="px-4 sm:px-8 lg:px-20 py-8 max-w-full lg:max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">User Management</h1>
          <p className="text-gray-400 font-medium text-sm sm:text-base">Ban or unban users from the platform</p>
        </div>

        {/* Users Section */}
        <div className="bg-white md:border md:border-gray-100 md:rounded-2xl overflow-hidden md:shadow-lg mb-8">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-black tracking-tight">All Users</h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-lg font-bold border border-gray-200">
                  {users.filter(u => !u.isBan).length} Active
                </span>
                <span className="px-3 py-1 bg-black text-white rounded-lg font-bold">
                  {users.filter(u => u.isBan).length} Banned
                </span>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400 font-medium">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((userItem) => (
                  <div key={userItem.email} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl transition-all gap-4 ${
                    userItem.isBan ? 'bg-gray-100 border-2 border-gray-300' : 'bg-white border-2 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-black overflow-hidden flex-shrink-0 shadow-lg">
                        {userItem.imageUrl ? (
                          <img src={userItem.imageUrl} className="w-full h-full object-cover" alt={userItem.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-lg sm:text-xl font-black">{userItem.name?.charAt(0) || 'U'}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-gray-900 truncate">{userItem.name || 'Unknown'}</p>
                          {userItem.isBan && (
                            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded">
                              Banned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium truncate">{userItem.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {/* Mobile reputation */}
                      <div className="sm:hidden flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 flex-1">
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-black text-gray-900">{userItem.reputationScore || 0}</span>
                      </div>
                      {/* Desktop reputation - same height as button */}
                      <div className="hidden sm:flex items-center gap-2 bg-white px-4 rounded-lg border border-gray-200 h-[42px] min-w-[140px]">
                        <svg className="w-5 h-5 text-black flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="flex flex-col justify-center">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-none">Reputation</p>
                          <p className="text-lg font-black text-gray-900 leading-tight">{userItem.reputationScore || 0}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleBan(userItem.email)}
                        className={`flex-1 sm:flex-none px-5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-[42px] min-w-[80px] ${
                          userItem.isBan
                            ? 'bg-white text-black border-2 border-black hover:bg-gray-100'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {userItem.isBan ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && userToBan && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setUserToBan(null);
          }}
          onConfirm={confirmBanToggle}
          title={userToBan.isBan ? "Unban User" : "Ban User"}
          message={`Are you sure you want to ${userToBan.isBan ? 'unban' : 'ban'} ${userToBan.name || userToBan.email}?`}
          confirmText={userToBan.isBan ? "Unban" : "Ban"}
          type="danger"
        />
      )}
    </div>
  );
}

export default AdminPage;
