import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const adminToken = localStorage.getItem('adminToken');
      const token = localStorage.getItem('token');

      if (!adminToken && !token) {
        setChecking(false);
        return;
      }

      try {
        const response = await userAPI.getProfile();
        if (response.data.role === 'ADMIN') {
          setIsAdmin(true);
        }
      } catch (error) {
        localStorage.removeItem('adminToken');
      } finally {
        setChecking(false);
      }
    };

    if (!authLoading) {
      checkAdminAccess();
    }
  }, [authLoading, user]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
