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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User API
export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  getUserByEmail: (email) => api.get(`/api/users/${email}`),
  updateProfile: (data) => api.put('/api/users/profile', data),
  uploadProfileImage: (formData) => api.post('/api/users/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Listing API
export const listingAPI = {
  getAll: (params) => api.get('/api/listings', { params }),
  getById: (id) => api.get(`/api/listings/${id}`),
  getUserListings: (email) => api.get(`/api/listings/user/${email}`),
  create: (data) => api.post('/api/listings', data),
  update: (id, data) => api.put(`/api/listings/${id}`, data),
  delete: (id) => api.delete(`/api/listings/${id}`),
  uploadImages: (id, formData) => api.post(`/api/listings/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  markAsSold: (id) => api.patch(`/api/listings/${id}/sold`),
  enableBargaining: (id, enabled) => api.patch(`/api/listings/${id}/bargaining`, { enabled }),
};

// Comment API
export const commentAPI = {
  getByListing: (listingId) => api.get(`/api/comments/listing/${listingId}`),
  create: (data) => api.post('/api/comments', data),
  delete: (id) => api.delete(`/api/comments/${id}`),
};

// Review API
export const reviewAPI = {
  getUserReviews: (email) => api.get(`/api/reviews/user/${email}`),
  createReview: (data) => api.post('/api/reviews', data),
};

// Message API
export const messageAPI = {
  getConversations: () => api.get('/api/messages/conversations'),
  getMessages: (conversationId) => api.get(`/api/messages/conversation/${conversationId}`),
  send: (data) => api.post('/api/messages', data),
  markAsRead: (conversationId) => api.patch(`/api/messages/conversation/${conversationId}/read`),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/api/notifications'),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/api/notifications/read-all'),
};

// Admin API
export const adminAPI = {
  getAllUsers: () => api.get('/api/admin/users'),
  banUser: (email) => api.post('/api/admin/ban', { email }),
  unbanUser: (email) => api.post('/api/admin/unban', { email }),
  getAllListings: () => api.get('/api/admin/listings'),
  deleteListing: (id) => api.delete(`/api/admin/listings/${id}`),
  verifyListing: (id) => api.patch(`/api/admin/listings/${id}/verify`),
};

export default api;
