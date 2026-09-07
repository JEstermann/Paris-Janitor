import api from './api';

const authController = {
  // Inscription
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Connexion
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Décoder le token pour récupérer les infos utilisateur
      const payload = JSON.parse(atob(response.data.token.split('.')[1]));
      localStorage.setItem('user', JSON.stringify(payload));
      // Récupérer les infos complètes (incluant isSuperAdmin) via /auth/me
      try {
        const me = await api.get('/auth/me');
        localStorage.setItem('user', JSON.stringify(me.data));
      } catch {
        // En cas d'échec, on garde le payload du token
      }
    }
    return response.data;
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Récupérer l'utilisateur courant
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Vérifier le rôle
  hasRole: (role) => {
    const user = authController.getCurrentUser();
    return user?.role === role;
  },

  // Changer son propre mot de passe (protégé)
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  },
};

export default authController;
