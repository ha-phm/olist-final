import axios from 'axios';

// Get base URL for server proxying, routing API properly
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT token into the request header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('olist_user_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  async login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('olist_user_token', response.data.token);
      localStorage.setItem('olist_user_profile', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('olist_user_token');
    localStorage.removeItem('olist_user_profile');
  },

  getCurrentUser() {
    const profile = localStorage.getItem('olist_user_profile');
    if (!profile) return null;
    try {
      return JSON.parse(profile);
    } catch {
      return null;
    }
  }
};

export const dashboardService = {
  async getOverview(filters: any) {
    const response = await api.get('/dashboards/overview', { params: filters });
    return response.data;
  },

  async getCustomers(filters: any) {
    const response = await api.get('/dashboards/customers', { params: filters });
    return response.data;
  },

  async getProducts(filters: any) {
    const response = await api.get('/dashboards/products', { params: filters });
    return response.data;
  },

  async getOrders(filters: any) {
    const response = await api.get('/dashboards/orders', { params: filters });
    return response.data;
  },

  async getSellers(filters: any) {
    const response = await api.get('/dashboards/sellers', { params: filters });
    return response.data;
  },

  async getReviews(filters: any) {
    const response = await api.get('/dashboards/reviews', { params: filters });
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/products/categories');
    return response.data;
  },

  async getLocations() {
    const response = await api.get('/products/locations');
    return response.data;
  }
};

export const orderService = {
  async searchOrders(query: string) {
    const response = await api.get('/orders/search', { params: { q: query } });
    return response.data;
  },

  async getOrderDetails(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  }
};
export default api;
