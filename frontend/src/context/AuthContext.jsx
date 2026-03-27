import { createContext, useContext, useEffect, useState } from 'react';
import { userAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await userAPI.getProfile();
          setProfile(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error fetching profile:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setIsAuthenticated(false);
      }
    };

    fetchProfile();
  }, []);

  const refreshProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setProfile(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setProfile(null);
    setIsAuthenticated(false);
  };

  const value = {
    profile,
    isAuthenticated,
    loading,
    refreshProfile,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
