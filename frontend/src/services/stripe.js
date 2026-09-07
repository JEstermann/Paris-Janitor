import { loadStripe } from '@stripe/stripe-js';

// Utiliser la clé publishable (pk_test_...) — doit être définie dans .env
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
                       import.meta.env.STRIPE_API_KEY;

if (!publishableKey) {
  console.warn(
    "VITE_STRIPE_PUBLISHABLE_KEY n'est pas définie. Le paiement Stripe ne fonctionnera pas."
  );
}

// loadStripe retourne une promesse qui résout vers l'instance Stripe ou null
let stripePromise = null;
if (publishableKey) {
  stripePromise = loadStripe(publishableKey);
}

export default stripePromise;
