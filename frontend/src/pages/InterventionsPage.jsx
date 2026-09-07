import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commandeController } from '../services';

function InterventionsPage() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    try {
      const data = await commandeController.getPrestataireCommandes();
      // Filtrer pour les prestataires - interventions en cours et à faire
      const filtered = data.filter((c) =>
        ['confirmee', 'payee', 'en_cours'].includes(c.status) && c.prestataireId
      );
      setCommandes(filtered);
    } catch (err) {
      setError('On n\'arrive pas à charger les interventions.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id) => {
    try {
      await commandeController.start(id);
      loadCommandes();
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg && msg.includes('pas payée')) {
        setError('Cette prestation ne peut pas commencer : le client n\'a pas encore payé.');
      } else {
        setError(msg || "L'intervention n'a pas pu démarrer.");
      }
    }
  };

  const handleFinish = async (id) => {
    try {
      await commandeController.finish(id);
      loadCommandes();
    } catch (err) {
      setError(err.response?.data?.message || 'On n\'a pas pu clôturer la mission.');
    }
  };

  if (loading) return <div className="container loading">On récupère vos missions...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Mes interventions</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {commandes.length === 0 ? (
        <div className="card">
          <p>Rien à faire pour l'instant — on vous préviendra dès qu'une mission vous est confiée.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Service</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((cmd) => (
              <tr key={cmd._id}>
                <td>{cmd._id.slice(-6)}</td>
                <td>{cmd.prestationId?.title || 'Non défini'}</td>
                <td>{cmd.montantTTC} €</td>
                <td>
                  <span className={`badge badge-${cmd.status}`}>
                    {commandeController.getStatusLabel(cmd.status)}
                  </span>
                </td>
                <td>
                  {['confirmee', 'payee'].includes(cmd.status) && (
                    <button className="btn btn-primary" onClick={() => handleStart(cmd._id)}>
                      C'est parti
                    </button>
                  )}
                  {cmd.status === 'en_cours' && (
                    <button className="btn btn-success" onClick={() => handleFinish(cmd._id)}>
                      Terminé
                    </button>
                  )}
                  <button
                    className="btn btn-info"
                    onClick={() => navigate(`/messages/${cmd._id}`)}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Échanger
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InterventionsPage;
