import api from './api';

const factureController = {
  // Récupérer mes factures (voyageur)
  getMine: async () => {
    const response = await api.get('/factures/me');
    return response.data;
  },

  // Récupérer toutes les factures (admin)
  getAll: async () => {
    const response = await api.get('/factures');
    return response.data;
  },

  // Récupérer une facture par ID
  getById: async (id) => {
    const response = await api.get(`/factures/${id}`);
    return response.data;
  },

  // Télécharger la facture PDF d'une commande
  download: async (commandeId) => {
    const response = await api.get(`/factures/commande/${commandeId}`, {
      blob: true,
    });
    return response.data;
  },

  // Générer une facture pour une commande (admin)
  generate: async (commandeId) => {
    const response = await api.post(`/factures/commande/${commandeId}`);
    return response.data;
  },

  // Télécharger le PDF
  downloadPDF: async (commandeId) => {
    try {
      const response = await api.get(`/factures/commande/${commandeId}`, {
        blob: true,
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${commandeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Erreur lors du téléchargement');
    }
  },
};

export default factureController;
