import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    navigate('/admin');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { path: '/admin/listings', label: 'Listings', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { path: '/admin/comments', label: 'Comments', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  return (
    <>
      <nav className="px-6 lg:px-12 py-4 bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => navigate('/admin')} 
            className="flex items-center gap-3"
          >
            <div className="hidden sm:block">
              <span className="text-2xl font-black tracking-tight">ADMIN</span>
              <span className="text-2xl font-light text-gray-400 italic">Panel</span>
            </div>
            <div className="sm:hidden">
              <span className="text-xl font-black tracking-tight">ADMIN</span>
              <span className="text-xl font-light text-gray-400 italic">Panel</span>
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
            {/* Profile - Desktop */}
            <div className="hidden lg:flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <span className="text-white text-sm font-black">A</span>
              </div>
              <div>
                <p className="text-xs font-black text-black">Admin</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Administrator</p>
              </div>
            </div>

            {/* Logout - Desktop */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
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
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu Sidebar */}
      <div className={`lg:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-xl font-black tracking-tight">ADMIN</span>
                  <span className="text-xl font-light text-gray-400 italic">Panel</span>
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

            {/* Admin Profile in Mobile Menu */}
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center border-2 border-white shadow-lg flex-shrink-0">
                <span className="text-white text-base font-black">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900">Admin</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Administrator</p>
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

export default AdminNavbar;
