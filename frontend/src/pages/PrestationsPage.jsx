import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { prestationController, commandeController } from '../services';

function PrestationsPage() {
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { isVoyageur } = useAuth();

  useEffect(() => {
    loadPrestations();
  }, []);

  const loadPrestations = async () => {
    try {
      const data = await prestationController.getAll();
      setPrestations(data);
    } catch (err) {
      setError('On n\'arrive pas à charger les services — réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (prestationId) => {
    try {
      await commandeController.create(prestationId);
      setMessage('Done — votre demande est bien prise en compte.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError("La commande n'a pas pu être créée. Réessayez ?");
    }
  };

  if (loading) return <div className="container loading">En attente...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Nos services</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="grid grid-3">
        {prestations.map((p) => (
          <div key={p._id} className="card">
            <h3 className="card-title">{p.title}</h3>
            <p style={{ color: '#666', marginBottom: '1rem' }}>{p.description}</p>
            <p>
              <span className="badge">{p.category}</span>
            </p>
            <p className="price">{p.priceTTC}€ TTC</p>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>HT: {p.priceHT}€</p>

            {isVoyageur() && (
              <button
                className="btn btn-primary"
                onClick={() => handleOrder(p._id)}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                Commander
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PrestationsPage;
