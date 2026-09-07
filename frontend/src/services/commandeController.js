import api from './api';

const commandeController = {
  // Créer une commande
  create: async (prestationId) => {
    const response = await api.post('/commandes', { prestationId });
    return response.data;
  },

  // Récupérer mes commandes (voyageur)
  getMine: async () => {
    const response = await api.get('/commandes/me');
    return response.data;
  },

  // Récupérer mes interventions (prestataire)
  getPrestataireCommandes: async () => {
    const response = await api.get('/commandes/prestataire');
    return response.data;
  },

  // Récupérer toutes les commandes (admin)
  getAll: async () => {
    const response = await api.get('/commandes');
    return response.data;
  },

  // Confirmer une commande (admin)
  confirm: async (id) => {
    const response = await api.put(`/commandes/${id}/confirm`);
    return response.data;
  },

  // Démarrer une intervention (prestataire)
  start: async (id) => {
    const response = await api.put(`/commandes/${id}/start`);
    return response.data;
  },

  // Terminer une intervention (prestataire)
  finish: async (id) => {
    const response = await api.put(`/commandes/${id}/finish`);
    return response.data;
  },

  // Annuler une commande (voyageur)
  cancel: async (id) => {
    const response = await api.put(`/commandes/${id}/cancel`);
    return response.data;
  },

  // Assigner un prestataire (admin)
  assign: async (id) => {
    const response = await api.put(`/commandes/${id}/assign`);
    return response.data;
  },

  // Payer une commande
  pay: async (id) => {
    const response = await api.post(`/commandes/pay/${id}`);
    return response.data;
  },

  // Mapper les libellés des status
  getStatusLabel: (status) => {
    const labels = {
      demande: 'En attente',
      confirmee: 'Confirmée',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée',
      payee: 'Payée',
    };
    return labels[status] || status;
  },

  // Évaluer une prestation terminée (voyageur)
  evaluate: async (id, note, commentaire) => {
    const response = await api.put(`/commandes/${id}/evaluate`, { note, commentaire });
    return response.data;
  },
};
export default commandeController;
