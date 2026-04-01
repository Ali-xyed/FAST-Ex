import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Prevent multiple redirects
      isRedirecting = true;
      
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Use setTimeout to avoid redirect loops
      setTimeout(() => {
        window.location.href = '/login';
        isRedirecting = false;
      }, 100);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  verifyOTP: (data) => api.post('/api/auth/verify-otp', data),
  login: (data) => api.post('/api/auth/login', data),
  getToken: (data) => api.post('/api/auth/token', data),
  checkEmail: (data) => api.post('/api/auth/check-email', data),
  changePassword: (data) => api.post('/api/auth/change-password', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  getPublicProfile: (email) => api.get(`/api/users/${email}`),
  updateProfile: (data) => api.put('/api/users/profile', data),
  uploadProfileImage: (formData) => api.post('/api/users/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Listing API
export const listingAPI = {
  getAll: (params) => api.get('/api/listings', { params }),
  getMy: () => api.get('/api/listings/my'),
  getById: (id) => api.get(`/api/listings/${id}`),
  create: (data) => {
    // Handle FormData for image upload
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post('/api/listings', data, config);
  },
  updateListing: (id, data) => {
    // Handle FormData for image upload
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.patch(`/api/listings/${id}`, data, config);
  },
  markListing: (id, data) => api.patch(`/api/listings/${id}/mark`, data),
  delete: (id) => api.delete(`/api/listings/${id}`),
  postComment: (id, data) => api.post(`/api/listings/${id}/comments`, data),
  deleteComment: (id, commentId) => api.delete(`/api/listings/${id}/comments/${commentId}`),
  submitBargain: (id, data) => api.post(`/api/listings/${id}/bargain`, data),
  getAllBargains: () => api.get('/api/listings/bargains'),
  getBargainById: (bargainId) => api.get(`/api/listings/bargains/${bargainId}`),
  respondBargain: (bargainId, data) => api.patch(`/api/listings/bargains/${bargainId}/respond`, data),
  requestListing: (id) => api.post(`/api/listings/${id}/request`),
  verifyListing: (id, data) => api.patch(`/api/listings/${id}/verify`, data),
  submitExchange: (id, data) => {
    // Handle FormData for image upload
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post(`/api/listings/${id}/exchange`, data, config);
  },
  getAllExchanges: () => api.get('/api/listings/exchanges'),
  getExchangeById: (exchangeId) => api.get(`/api/listings/exchanges/${exchangeId}`),
  respondExchange: (exchangeId, data) => api.patch(`/api/listings/exchanges/${exchangeId}/respond`, data),
};

// Message API
export const messageAPI = {
  getAllChats: () => api.get('/api/messages/chats'),
  createOrFetchChat: (data) => api.post('/api/messages/chats', data),
  getChatById: (chatId) => api.get(`/api/messages/chats/${chatId}`),
  sendMessage: (chatId, data) => api.post(`/api/messages/chats/${chatId}`, data),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/api/notifications'),
  markAllAsRead: () => api.patch('/api/notifications/read-all'),
};

// Admin API
export const adminAPI = {
  toggleBanUser: (email, data) => api.patch(`/api/admin/users/${email}/toggle-ban`, data),
  verifyListing: (id) => api.patch(`/api/admin/listings/${id}/verify`),
  deleteListing: (id) => api.delete(`/api/admin/listings/${id}`),
  deleteComment: (listingId, commentId) => api.delete(`/api/admin/listings/${listingId}/comments/${commentId}`),
};

export default api;
