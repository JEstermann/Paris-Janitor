import api from './api';

const vipController = {
  // Liste des plans publics
  getPlans: async () => {
    const response = await api.get('/vip/plans');
    return response.data;
  },

  // Mon abonnement actuel
  getMySubscription: async () => {
    const response = await api.get('/vip/me');
    return response.data;
  },

  // Souscrire à un plan (crée un PaymentIntent Stripe)
  subscribe: async (planType) => {
    const response = await api.post('/vip/subscribe', { type: planType });
    return response.data;
  },

  // Confirmer après paiement (appelé depuis le frontend après Stripe)
  confirmSubscription: async (plan, paymentIntentId) => {
    const response = await api.post('/vip/confirm', { plan, paymentIntentId });
    return response.data;
  },

  // Résilier l'abonnement
  cancel: async () => {
    const response = await api.post('/vip/cancel');
    return response.data;
  }
};

export default vipController;