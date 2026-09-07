import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { factureController } from '../services';

function MesFacturesPage() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await factureController.getMine();
      setFactures(data);
    } catch (err) {
      setError('On n\'arrive pas à charger vos factures.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (commandeId) => {
    factureController.downloadPDF(commandeId);
  };

  if (loading) return <div className="container loading">On récupère vos factures...</div>;

  // Calcul des totaux
  const totalTTC = factures.reduce((sum, f) => sum + (f.montantTTC || 0), 0);
  const totalHT = factures.reduce((sum, f) => sum + (f.montantHT || 0), 0);
  const totalTVA = factures.reduce((sum, f) => sum + (f.TVA || 0), 0);

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Mes factures</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {factures.length > 0 && (
        <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total HT</div>
            <div className="price">{totalHT.toFixed(2)} €</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total TVA</div>
            <div className="price">{totalTVA.toFixed(2)} €</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total TTC</div>
            <div className="price">{totalTTC.toFixed(2)} €</div>
          </div>
        </div>
      )}

      {factures.length === 0 ? (
        <div className="card">
          <p>Pas encore de facture — c'est normal si vous n'avez pas encore commandé.</p>
          <p style={{ marginTop: '1rem' }}>
            <Link to="/prestations" className="btn btn-primary">
              Voir nos services
            </Link>
          </p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Prestation</th>
              <th>Date</th>
              <th>Montant HT</th>
              <th>TVA</th>
              <th>Montant TTC</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f._id}>
                <td>{f._id.slice(-6).toUpperCase()}</td>
                <td>
                  {f.commandeId?.prestationId?.title || 'Service'}
                  <br />
                  <small style={{ color: '#888' }}>
                    Commande #{f.commandeId?._id?.slice(-6)}
                  </small>
                </td>
                <td>{new Date(f.dateEmission).toLocaleDateString('fr-FR')}</td>
                <td>{f.montantHT?.toFixed(2)} €</td>
                <td>{f.TVA?.toFixed(2)} €</td>
                <td><strong>{f.montantTTC?.toFixed(2)} €</strong></td>
                <td>
                  <span className={`badge badge-${f.statutPaiement}`}>
                    {f.statutPaiement === 'paid' ? 'Payée' : f.statutPaiement === 'pending' ? 'En attente' : 'Échouée'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDownload(f.commandeId?._id)}
                  >
                    Télécharger en PDF
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

export default MesFacturesPage;