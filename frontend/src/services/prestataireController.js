import api from './api';

const prestataireController = {
  // Récupérer tous les prestataires (admin)
  getAll: async () => {
    const response = await api.get('/prestataires');
    return response.data;
  },

  // Valider un prestataire (admin)
  validate: async (id) => {
    const response = await api.put(`/prestataires/validate/${id}`);
    return response.data;
  },

  // Helper pour afficher le statut
  getValidationLabel: (validated) => {
    return validated ? 'Validé' : 'En attente de validation';
  },
};

export default prestataireController;
