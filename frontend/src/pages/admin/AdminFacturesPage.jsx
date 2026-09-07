import { useState, useEffect } from 'react';
import { factureController } from '../../services';

function AdminFacturesPage() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    try {
      const data = await factureController.getAll();
      setFactures(data);
    } catch (err) {
      setError("On n'arrive pas à charger les factures.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id) => {
    factureController.downloadPDF(id);
  };

if (loading) return <div className="container loading">On récupère les factures...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Toutes les factures</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Réf.</th>
            <th>Commande</th>
            <th>Client</th>
            <th>HT</th>
            <th>TTC</th>
            <th>TVA</th>
            <th>Date</th>
            <th>Statut</th>
            <th>PDF</th>
          </tr>
        </thead>
        <tbody>
          {factures.map((f) => (
            <tr key={f._id}>
              <td>{f._id.slice(-6)}</td>
              <td>{f.commandeId?._id?.slice(-6) || '—'}</td>
              <td>{f.destinataireId?.firstName} {f.destinataireId?.lastName}</td>
              <td>{f.montantHT} €</td>
              <td>{f.montantTTC} €</td>
              <td>{f.TVA} €</td>
              <td>{new Date(f.dateEmission).toLocaleDateString('fr-FR')}</td>
              <td>
                <span className={`badge badge-${f.statutPaiement}`}>
                  {f.statutPaiement === 'paid' ? 'Payée' : f.statutPaiement === 'pending' ? 'En attente' : 'Échouée'}
                </span>
              </td>
              <td>
                <button className="btn btn-secondary" onClick={() => handleDownload(f.commandeId?._id)}>
                  Télécharger
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminFacturesPage;
