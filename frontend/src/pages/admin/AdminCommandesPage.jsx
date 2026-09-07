import { useState, useEffect } from 'react';
import { commandeController } from '../../services';

function AdminCommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    try {
      const data = await commandeController.getAll();
      setCommandes(data);
    } catch (err) {
      setError('On n\'arrive pas à charger les commandes.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await commandeController.confirm(id);
      loadCommandes();
    } catch (err) {
      setError("La commande n'a pas pu être confirmée.");
    }
  };

  const handleAssign = async (id) => {
    try {
      await commandeController.assign(id);
      loadCommandes();
    } catch (err) {
      setError("L'assignation n'a pas fonctionné.");
    }
  };

  if (loading) return <div className="container loading">On rassemble les commandes...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Toutes les commandes</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Réf.</th>
            <th>Client</th>
            <th>Service</th>
            <th>Prestataire</th>
            <th>Montant</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {commandes.map((cmd) => (
            <tr key={cmd._id}>
              <td>{cmd._id.slice(-6)}</td>
              <td>{cmd.userId?.firstName} {cmd.userId?.lastName}</td>
              <td>{cmd.prestationId?.title || 'Non définie'}</td>
              <td>{cmd.prestataireId?.name || 'Non assigné'}</td>
              <td>{cmd.montantTTC} €</td>
              <td>
                <span className={`badge badge-${cmd.status}`}>
                  {commandeController.getStatusLabel(cmd.status)}
                </span>
              </td>
              <td>
                {cmd.status === 'demande' && (
                  <>
                    <button className="btn btn-primary" onClick={() => handleConfirm(cmd._id)}>
                      Valider la demande
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => handleAssign(cmd._id)}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Confier au·à la prestataire
                    </button>
                  </>
                )}
                {cmd.status === 'confirmee' && !cmd.prestataireId && (
                  <button className="btn btn-success" onClick={() => handleAssign(cmd._id)}>
                    Confier à un·e prestataire
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminCommandesPage;
