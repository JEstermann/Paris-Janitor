import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '../services/stripe';
import api from '../services/api';

// Composant interne qui contient le formulaire de paiement Stripe
function CheckoutFormInner({ commandeId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    // Confirmer le paiement via Stripe Elements
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/mes-commandes`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Marquer la commande comme payée côté backend (le webhook fait aussi ce travail)
      try {
        await api.post(`/commandes/${commandeId}/confirm-payment`, {
          paymentIntentId: paymentIntent.id,
        });
      } catch (err) {
        // Le webhook Stripe se chargera de la mise à jour si l'appel échoue
        console.warn('Webhook fera la mise à jour', err);
      }
      onSuccess(paymentIntent);
    } else {
      setErrorMessage("Le paiement n'a pas abouti. On réessaie ?");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {errorMessage}
        </div>
      )}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={!stripe || submitting}
        style={{ marginTop: '1.5rem', width: '100%' }}
      >
        {submitting ? 'Traitement...' : `Payer ${amount}€`}
      </button>
    </form>
  );
}

// Composant principal qui wrappe CheckoutFormInner avec le provider Stripe Elements
export default function CheckoutForm({ commandeId, amount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!commandeId) return;

    const fetchClientSecret = async () => {
      try {
        const response = await api.post(`/commandes/pay/${commandeId}`);
        if (response.data.clientSecret) {
          setClientSecret(response.data.clientSecret);
        } else {
          setError("On n'arrive pas à préparer le paiement.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Le paiement n'a pas pu être lancé.");
      } finally {
        setLoading(false);
      }
    };

    fetchClientSecret();
  }, [commandeId]);

  const handleSuccess = () => {
    navigate('/mes-commandes', { state: { paymentSuccess: true } });
  };

  if (loading) {
    return <div className="container loading">Préparation du paiement...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/mes-commandes')}>
          Revenir aux commandes
        </button>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Le système de paiement n'est pas configuré. Vérifiez les variables d'environnement.
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1>Régler la commande</h1>
      <div className="card">
        <p>Montant à régler : <strong>{amount} €</strong></p>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutFormInner commandeId={commandeId} amount={amount} onSuccess={handleSuccess} />
        </Elements>
      </div>
    </div>
  );
}
