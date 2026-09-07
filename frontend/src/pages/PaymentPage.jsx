import { useLocation, useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm';

function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { commandeId, amount } = location.state || {};

  if (!commandeId) {
    return (
      <div className="container">
        <div className="alert alert-error">On ne trouve pas la commande à régler.</div>
        <button className="btn btn-secondary" onClick={() => navigate('/mes-commandes')}>
          Revenir à mes commandes
        </button>
      </div>
    );
  }

  return <CheckoutForm commandeId={commandeId} amount={amount} />;
}

export default PaymentPage;
