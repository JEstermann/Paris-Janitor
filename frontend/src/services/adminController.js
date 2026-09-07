import api from './api';

const adminController = {
  // Statistiques
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Utilisateurs
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/users${params ? `?${params}` : ''}`);
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  toggleUserActive: async (id) => {
    const response = await api.patch(`/admin/users/${id}/toggle-active`);
    return response.data;
  },
};

export default adminController;
