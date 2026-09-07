// Vérifier si la clé Stripe est valide
const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;

if (stripeKey && (stripeKey.startsWith("sk_test_") || stripeKey.startsWith("sk_live_"))) {
  stripe = require("stripe")(stripeKey);
}

module.exports = {
  createPaymentIntent: async (amount, options = {}) => {
    if (!stripe) {
      // Mode dev sans Stripe - retourner un mock
      console.warn("Stripe non configuré - retour mock payment intent");
      const mockId = "pi_mock_" + Date.now();
      return {
        id: mockId,
        client_secret: mockId + "_secret_mock",
        status: "requires_payment_method"
      };
    }

    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      ...options
    });
  },

  isConfigured: () => !!stripe
};
