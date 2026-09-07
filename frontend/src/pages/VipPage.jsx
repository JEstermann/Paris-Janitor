import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vipController } from '../services';

function VipPage() {
  const { isVoyageur, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribeLoading, setSubscribeLoading] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, subData] = await Promise.all([
        vipController.getPlans(),
        vipController.getMySubscription()
      ]);
      setPlans(plansData.plans || []);
      setCurrentSub(subData);
    } catch (err) {
      setError('Impossible de charger les infos — réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isVoyageur()) {
      setError('Le club VIP, c\'est seulement pour les voyageurs qui louent leur bien.');
      return;
    }

    setSubscribeLoading(plan.type);
    setError('');
    try {
      const data = await vipController.subscribe(plan.type);
      // Redirection vers la page de paiement avec le bon plan
      navigate('/payment-vip', {
        state: {
          clientSecret: data.clientSecret,
          amount: data.amount,
          plan: data.plan,
          isRenewal: data.isRenewal,
          paymentIntentId: data.paymentIntentId
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Ça n'a pas marché — on réessaiera.");
      setSubscribeLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("On arrête vraiment votre abonnement ? Vous repasserez en Free.")) return;
    try {
      await vipController.cancel();
      setSuccessMsg("C'est fait — vous êtes redevenu·e membre Free.");
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "On n'a pas pu résilier — contactez le support.");
    }
  };

  if (loading) return <div className="container loading">On prépare les offres...</div>;

  const isActive = currentSub?.subscription?.active;
  const currentType = currentSub?.subscription?.type;

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Passez en VIP</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Moins cher, des services offerts, l'esprit tranquille.
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{successMsg}</div>}

      {isActive && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <strong>Vous êtes sur l'offre {currentSub.benefits.label}</strong>
          {currentSub.remainingFreebies.year > 0 && (
            <span> — {currentSub.remainingFreebies.year} presta{currentSub.remainingFreebies.year > 1 ? 's' : ''} offerte{currentSub.remainingFreebies.year > 1 ? 's' : ''} cette année</span>
          )}
          {currentSub.remainingFreebies.week > 0 && (
            <span> — {currentSub.remainingFreebies.week} presta{currentSub.remainingFreebies.week > 1 ? 's' : ''} offerte{currentSub.remainingFreebies.week > 1 ? 's' : ''} cette semaine</span>
          )}
          <br />
          <span style={{ fontSize: '0.9rem' }}>
            Expire le {new Date(currentSub.subscription.endDate).toLocaleDateString('fr-FR')}
          </span>
        </div>
      )}

      <div className="grid grid-3">
        {plans.map((plan) => {
          const isCurrentPlan = currentType === plan.type && isActive;
          return (
            <div
              key={plan.type}
              className={`card ${plan.type === 'explorator' ? 'card-featured' : ''}`}
              style={{
                border: plan.type === 'explorator' ? '2px solid #e67e22' : undefined,
                position: 'relative'
              }}
            >
              {plan.type === 'explorator' && (
                <span style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#e67e22', color: 'white', padding: '2px 12px', borderRadius: 12,
                  fontSize: '0.8rem', fontWeight: 'bold'
                }}>
                  Populaire
                </span>
              )}

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{plan.label}</h2>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                  {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                  {plan.price > 0 && <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#888' }}>/an</span>}
                </div>
                {plan.renewalBonus && (
                  <span style={{ fontSize: '0.85rem', color: '#27ae60' }}>
                    Renouvellement : {plan.renewalPrice}€/an (-10%)
                  </span>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                <li style={{ padding: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#27ae60' }}>+</span> Accès au catalogue
                </li>
                <li style={{ padding: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#27ae60' }}>+</span> Commentaires &amp; évaluations
                </li>
                <li style={{ padding: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#27ae60' }}>+</span> Réduction {plan.reduction}%
                </li>
                {plan.freebiesPerYear > 0 && (
                  <li style={{ padding: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#27ae60' }}>+</span> {plan.freebiesPerYear} presta offerte{plan.freebiesPerYear > 1 ? 's' : ''}/an (&lt; {plan.maxFreebiePrice}€)
                  </li>
                )}
                {plan.freebiesPerWeek > 0 && (
                  <li style={{ padding: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#27ae60' }}>+</span> {plan.freebiesPerWeek} presta offerte{plan.freebiesPerWeek > 1 ? 's' : ''}/semaine (sans limite)
                  </li>
                )}
                {plan.priorityAccess && (
                  <li style={{ padding: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#27ae60' }}>+</span> Accès prioritaire
                  </li>
                )}
                {plan.renewalBonus && (
                  <li style={{ padding: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#27ae60' }}>+</span> Bonus renouvellement -10%
                  </li>
                )}
              </ul>

              {isCurrentPlan ? (
                <div style={{ textAlign: 'center' }}>
                  <span className="badge" style={{ background: '#27ae60', color: 'white', padding: '0.5rem 1rem' }}>
                    Plan actuel
                  </span>
                  {plan.type !== 'free' && (
                    <button
                      className="btn btn-danger"
                      onClick={handleCancel}
                      style={{ display: 'block', width: '100%', marginTop: '0.5rem' }}
                    >
                      Résilier
                    </button>
                  )}
                </div>
              ) : (
                <button
                  className={plan.type === 'explorator' ? 'btn btn-primary' : plan.type === 'bag_packer' ? 'btn btn-success' : 'btn btn-secondary'}
                  style={{ width: '100%' }}
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscribeLoading === plan.type}
                >
                  {subscribeLoading === plan.type ? 'Chargement...' : isAuthenticated ? 'Choisir ce plan' : 'Se connecter'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Tableau comparatif */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Le détail des offres</h2>
        <table className="table" style={{ maxWidth: 700, margin: '0 auto' }}>
          <thead>
            <tr>
              <th>Avantage</th>
              <th>Free</th>
              <th>Bag Packer</th>
              <th>Explorator</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Réduction</td>
              <td>—</td>
              <td>5%</td>
              <td>5%</td>
            </tr>
            <tr>
              <td>Prestations offertes</td>
              <td>—</td>
              <td>1/an (&lt;80€)</td>
              <td>1/semaine (illimité)</td>
            </tr>
            <tr>
              <td>Accès prioritaire</td>
              <td>—</td>
              <td>+</td>
              <td>+</td>
            </tr>
            <tr>
              <td>Bonus renouvellement</td>
              <td>—</td>
              <td>—</td>
              <td>-10%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VipPage;