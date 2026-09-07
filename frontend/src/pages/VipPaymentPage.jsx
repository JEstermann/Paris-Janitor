import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vipController } from '../services';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '../services/stripe';

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': { color: '#aab7c4' }
    },
    invalid: { color: '#9e2146' }
  }
};

function VipPaymentForm({ plan, amount, isRenewal, paymentIntentId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const card = elements.getElement(CardElement);
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      paymentIntentId.clientSecret || paymentIntentId,
      {
        payment_method: {
          card
        }
      }
    );

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        await vipController.confirmSubscription(plan, paymentIntentId.paymentIntentId || paymentIntent.id);
        onSuccess();
      } catch (err) {
        setError(err.response?.data?.message || "L'activation a échoué — réessayez.");
        setLoading(false);
      }
    } else {
      setError("Le paiement n'a pas abouti — on réessaie ?");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: 8 }}>
        <h3 style={{ marginBottom: '0.5rem' }}>En résumé</h3>
        <p>Offre <strong>{plan}</strong></p>
        <p>Montant : <strong>{amount} €</strong> {isRenewal && <span style={{ color: '#27ae60' }}>(-10% fidélité, ça fait toujours plaisir)</span>}</p>
      </div>

      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: 8, marginBottom: '1.5rem' }}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button type="submit" className="btn btn-primary" disabled={!stripe || loading} style={{ width: '100%' }}>
        {loading ? 'Traitement...' : `Payer ${amount}€ et devenir VIP`}
      </button>

      <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
        Test : utilisez 4242 4242 4242 4242 / 12/34 / 123
      </p>
    </form>
  );
}

function VipPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);

  const { clientSecret, amount, plan, isRenewal, paymentIntentId } = location.state || {};

  if (!clientSecret || !plan) {
    return (
      <div className="container">
        <div className="alert alert-error">Les infos de paiement sont manquantes.</div>
        <button className="btn btn-secondary" onClick={() => navigate('/vip')}>
          Revenir aux offres VIP
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: '#27ae60' }}>Bienvenue dans le club VIP !</h2>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
            Votre offre {plan} est active. Profitez bien.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/prestations')}>
              Voir les services
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/vip')}>
              Mon offre
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 500 }}>
      <h1 style={{ marginBottom: '2rem' }}>On règle l'abonnement</h1>

      {!stripePromise ? (
        <div className="alert alert-error">
          Le module de paiement n'est pas configuré. Vérifiez vos variables d'environnement.
        </div>
      ) : (
        <Elements stripe={stripePromise}>
          <VipPaymentForm
            plan={plan}
            amount={amount}
            isRenewal={isRenewal}
            paymentIntentId={{ clientSecret, paymentIntentId }}
            onSuccess={() => setSuccess(true)}
          />
        </Elements>
      )}

      <button
        className="btn btn-secondary"
        onClick={() => navigate('/vip')}
        style={{ marginTop: '1rem', width: '100%' }}
      >
        Annuler
      </button>
    </div>
  );
}

export default VipPaymentPage;