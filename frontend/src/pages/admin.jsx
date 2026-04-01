import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar/AdminNavbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Dummy data for users
const DUMMY_USERS = [
  { email: 'john.doe@university.edu', name: 'John Doe', imageUrl: '/open_peeps/astro.png', reputationScore: 85, isBanned: false },
  { email: 'jane.smith@university.edu', name: 'Jane Smith', imageUrl: '/open_peeps/bueno.png', reputationScore: 92, isBanned: false },
  { email: 'mike.wilson@university.edu', name: 'Mike Wilson', imageUrl: '/open_peeps/coffee.png', reputationScore: 78, isBanned: true },
  { email: 'sarah.jones@university.edu', name: 'Sarah Jones', imageUrl: '/open_peeps/feliz.png', reputationScore: 95, isBanned: false },
  { email: 'alex.brown@university.edu', name: 'Alex Brown', imageUrl: '/open_peeps/growth.png', reputationScore: 67, isBanned: false },
  { email: 'emily.davis@university.edu', name: 'Emily Davis', imageUrl: '/open_peeps/kiddo.png', reputationScore: 88, isBanned: false },
  { email: 'chris.taylor@university.edu', name: 'Chris Taylor', imageUrl: '/open_peeps/pilot.png', reputationScore: 73, isBanned: true },
  { email: 'lisa.anderson@university.edu', name: 'Lisa Anderson', imageUrl: '/open_peeps/plants.png', reputationScore: 91, isBanned: false },
];

function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState(DUMMY_USERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is admin (role will be 'ADMIN' from backend)
    // Temporarily disabled for testing - will check role later
    // if (user && user.role !== 'ADMIN') {
    //   toast.error('Access denied. Admin only.');
    //   navigate('/home');
    //   return;
    // }
    
    // Set loading to false after a short delay to show content
    if (user) {
      setLoading(false);
    }
  }, [user, navigate]);

  const handleToggleBan = async (email) => {
    const userToUpdate = users.find(u => u.email === email);
    const action = userToUpdate.isBanned ? 'unban' : 'ban';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      // Update local state immediately for better UX
      setUsers(users.map(u => 
        u.email === email ? { ...u, isBanned: !u.isBanned } : u
      ));
      
      // Uncomment when backend is ready
      // const { adminAPI } = await import('../utils/api');
      // await adminAPI.toggleBanUser(email, { banned: !userToUpdate.isBanned });
      toast.success(`User ${action}ned successfully`);
    } catch (error) {
      // Revert on error
      setUsers(users.map(u => 
        u.email === email ? { ...u, isBanned: userToUpdate.isBanned } : u
      ));
      toast.error(`Failed to ${action} user`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <AdminNavbar />

      <main className="px-8 lg:px-20 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">User Management</h1>
          <p className="text-gray-400 font-medium">Ban or unban users from the platform</p>
        </div>

        {/* Users Section */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-lg mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black tracking-tight">All Users</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg font-bold">
                  {users.filter(u => !u.isBanned).length} Active
                </span>
                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold">
                  {users.filter(u => u.isBanned).length} Banned
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
                  <div key={userItem.email} className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    userItem.isBanned ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50 border-2 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-black overflow-hidden flex-shrink-0 shadow-lg">
                        {userItem.imageUrl ? (
                          <img src={userItem.imageUrl} className="w-full h-full object-cover" alt={userItem.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-xl font-black">{userItem.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-gray-900">{userItem.name}</p>
                          {userItem.isBanned && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded">
                              Banned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{userItem.email}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                        <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reputation</p>
                          <p className="text-lg font-black text-gray-900">{userItem.reputationScore}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={() => handleToggleBan(userItem.email)}
                        className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          userItem.isBanned
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {userItem.isBanned ? 'Unban User' : 'Ban User'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
