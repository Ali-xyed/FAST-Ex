import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../NotificationDropdown/NotificationDropdown';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="px-8 lg:px-20 py-4 border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate('/home')} className="text-3xl font-black tracking-tighter">
            FAST<span className="text-gray-300 font-bold italic ml-0.5">-Ex</span>
          </button>
          
          <div className="hidden lg:flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
            <button
              onClick={() => navigate('/home')}
              className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${isActive('/home') ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Browse
            </button>
            <button
              onClick={() => navigate('/messages')}
              className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${isActive('/messages') ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Messages
            </button>
            <button
              onClick={() => navigate('/profile')}
              className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${isActive('/profile') ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Profile
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${isActive('/admin') ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Admin
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/create-listing')}
            className="bg-black text-white px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
          >
            + Create Listing
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-all relative"
            >
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-11 h-11 rounded-full bg-black flex items-center justify-center border-2 border-white shadow-lg overflow-hidden"
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} className="w-full h-full object-cover" alt="profile" />
              ) : (
                <span className="text-white text-xs font-black">{(user?.name || 'U').charAt(0)}</span>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-14 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                  <p className="text-sm font-black">{user?.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user?.rollNo}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500">Reputation:</span>
                    <span className="text-[11px] font-black text-black">{user?.reputationScore || 0}</span>
                  </div>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                  className="w-full px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
                >
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
