import api from './api';

const messageController = {
  // Envoyer un message
  send: async (commandeId, content) => {
    const response = await api.post('/messages', { commandeId, content });
    return response.data;
  },

  // Récupérer les messages d'une commande
  getForCommande: async (commandeId) => {
    const response = await api.get(`/messages/commande/${commandeId}`);
    return response.data;
  },

  // Marquer les messages comme lus
  markAsRead: async (commandeId) => {
    const response = await api.put(`/messages/commande/${commandeId}/read`);
    return response.data;
  },

  // Récupérer la liste des conversations
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },
};

export default messageController;
