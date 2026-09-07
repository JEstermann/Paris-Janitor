import api from './api';

const prestationController = {
  // Récupérer toutes les prestations
  getAll: async () => {
    const response = await api.get('/prestations');
    return response.data;
  },

  // Récupérer une prestation par ID
  getById: async (id) => {
    const response = await api.get(`/prestations/${id}`);
    return response.data;
  },

  // Créer une nouvelle prestation (admin)
  create: async (prestationData) => {
    const response = await api.post('/prestations', prestationData);
    return response.data;
  },

  // Modifier une prestation (admin)
  update: async (id, prestationData) => {
    const response = await api.put(`/prestations/${id}`, prestationData);
    return response.data;
  },

  // Supprimer une prestation (admin)
  delete: async (id) => {
    const response = await api.delete(`/prestations/${id}`);
    return response.data;
  },

  // Récupérer par catégorie
  getByCategory: async (category) => {
    const response = await api.get('/prestations', { params: { category } });
    return response.data;
  },
};

export default prestationController;
