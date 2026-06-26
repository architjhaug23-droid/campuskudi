// api.js - API Client for Backend Communication
// Base URL configuration
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://campuskudi.com/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Check if user is authenticated
const isAuthenticated = () => !!getToken();

// API Client with common methods
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // Generic fetch method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add token if authenticated
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new APIClient(API_BASE_URL);

// ============ AUTH ENDPOINTS ============
const Auth = {
  register: (name, email, phone, password, confirmPassword) =>
    api.post('/auth/register', { name, email, phone, password, confirmPassword }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, newPassword, confirmPassword) =>
    api.post('/auth/reset-password', { token, newPassword, confirmPassword })
};

// ============ USER ENDPOINTS ============
const User = {
  getProfile: () =>
    api.get('/user/profile'),

  updateProfile: (name, phone, address) =>
    api.put('/user/profile', { name, phone, address })
};

// ============ PRODUCT ENDPOINTS ============
const Products = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/products${queryString ? '?' + queryString : ''}`);
  },

  getById: (id) =>
    api.get(`/products/${id}`),

  getByCategory: (slug, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/products/category/${slug}${queryString ? '?' + queryString : ''}`);
  },

  search: (query, params = {}) => {
    const queryString = new URLSearchParams({ query, ...params }).toString();
    return api.get(`/products/search?${queryString}`);
  }
};

// ============ CATEGORY ENDPOINTS ============
const Categories = {
  getAll: () =>
    api.get('/categories'),

  getBySlug: (slug) =>
    api.get(`/categories/${slug}`)
};

// ============ CART ENDPOINTS ============
const Cart = {
  get: () =>
    api.get('/cart'),

  add: (productId, quantity, size, color) =>
    api.post('/cart/add', { productId, quantity, size, color }),

  update: (itemId, quantity) =>
    api.put('/cart/update', { itemId, quantity }),

  remove: (itemId) =>
    api.delete(`/cart/remove/${itemId}`),

  clear: () =>
    api.delete('/cart/clear')
};

// ============ WISHLIST ENDPOINTS ============
const Wishlist = {
  get: () =>
    api.get('/wishlist'),

  add: (productId) =>
    api.post('/wishlist/add', { productId }),

  remove: (productId) =>
    api.delete(`/wishlist/remove/${productId}`)
};

// ============ ORDER ENDPOINTS ============
const Orders = {
  create: (shippingAddress, paymentMethod, couponCode) =>
    api.post('/orders/create', { shippingAddress, paymentMethod, couponCode }),

  getMyOrders: () =>
    api.get('/orders/my-orders'),

  getById: (id) =>
    api.get(`/orders/${id}`),

  track: (orderId) =>
    api.get(`/orders/track/${orderId}`)
};

// ============ REVIEW ENDPOINTS ============
const Reviews = {
  create: (productId, rating, comment) =>
    api.post('/reviews', { productId, rating, comment }),

  getByProduct: (productId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/reviews/${productId}${queryString ? '?' + queryString : ''}`);
  },

  delete: (reviewId) =>
    api.delete(`/reviews/${reviewId}`)
};

// ============ PAYMENT ENDPOINTS ============
const Payment = {
  generateUPIQR: (orderId) =>
    api.post('/payment/upi/generate-qr', { orderId }),

  verifyUPI: (orderId, transactionId) =>
    api.post('/payment/upi/verify', { orderId, transactionId }),

  getPaymentStatus: (orderId) =>
    api.get(`/payment/status/${orderId}`),

  processCOD: (orderId) =>
    api.post('/payment/cod/process', { orderId })
};