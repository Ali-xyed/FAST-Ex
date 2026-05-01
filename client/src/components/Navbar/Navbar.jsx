import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setShowProfileMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/home', label: 'Browse', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/messages', label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ path: '/admin', label: 'Admin', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' });
  }

  return (
    <>
      <nav className={`px-6 lg:px-12 py-4 bg-white/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-lg border-b border-gray-100' : 'border-b border-transparent'
      }`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => navigate('/home')} 
            className="flex items-center gap-3"
          >
            <div className="hidden sm:block">
              <span className="text-2xl font-black tracking-tight">FAST</span>
              <span className="text-2xl font-light text-gray-400 italic">-Ex</span>
            </div>
            <div className="sm:hidden">
              <span className="text-xl font-black tracking-tight">FAST</span>
              <span className="text-xl font-light text-gray-400 italic">-Ex</span>
            </div>
          </button>
          
          {/* Navigation Pills - Desktop */}
          <div className="hidden lg:flex items-center gap-2 bg-gray-50/80 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200/50">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                  isActive(item.path)
                    ? 'bg-white text-black shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span>{item.label}</span>
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Create Listing Button */}
            <button
              onClick={() => navigate('/create-listing')}
              className="group bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Create</span>
            </button>

            {/* Notifications - Navigate to page */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200"
            >
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>

            {/* Hamburger Menu Button - Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Profile Menu - Desktop */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-black to-gray-700 flex items-center justify-center border-2 border-white shadow-lg overflow-hidden"
              >
                {user?.imageUrl ? (
                  <img src={user.imageUrl} className="w-full h-full object-cover" alt="profile" />
                ) : (
                  <span className="text-white text-sm font-black">{(user?.name || 'U').charAt(0)}</span>
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-14 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
                  <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                    <p className="text-base font-black text-gray-900">{user?.name}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{user?.rollNo}</p>
                    <div className="mt-3 flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-black">★</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500">Reputation</p>
                        <p className="text-lg font-black text-gray-900">{user?.reputationScore || 0}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                    className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 border-t border-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu Sidebar */}
      <div className={`lg:hidden fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-xl font-black tracking-tight">FAST</span>
                  <span className="text-xl font-light text-gray-400 italic">-Ex</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Profile in Mobile Menu */}
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-black to-gray-700 flex items-center justify-center border-2 border-white shadow-lg overflow-hidden flex-shrink-0">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} className="w-full h-full object-cover" alt="profile" />
                ) : (
                  <span className="text-white text-base font-black">{(user?.name || 'U').charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{user?.rollNo}</p>
              </div>
            </div>

            {/* Reputation Score */}
            <div className="mt-3 flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-base font-black">★</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500">Reputation Score</p>
                <p className="text-xl font-black text-gray-900">{user?.reputationScore || 0}</p>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Items */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Additional Menu Items */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
              <button
                onClick={() => handleNavigation('/profile')}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>MY PROFILE</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
