import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { commandeController, factureController } from '../services';

function MesCommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [evalNote, setEvalNote] = useState(5);
  const [evalComment, setEvalComment] = useState('');
  const [evalMsg, setEvalMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadCommandes();
  }, []);

  useEffect(() => {
    if (location.state?.paymentSuccess) {
      loadCommandes();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadCommandes = async () => {
    try {
      const data = await commandeController.getMine();
      setCommandes(data);
    } catch (err) {
      setError('On n\'arrive pas à charger vos commandes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cette commande sera annulée. On est sûr ?')) return;
    try {
      await commandeController.cancel(id);
      loadCommandes();
    } catch (err) {
      setError('L\'annulation n\'a pas fonctionné — réessayez.');
    }
  };

  const handlePay = async (id) => {
    const commande = commandes.find(cmd => cmd._id === id);
    if (!commande) {
      setError('Cette commande a disparu de la liste.');
      return;
    }

    navigate('/payment', {
      state: {
        commandeId: id,
        amount: commande.montantTTC
      }
    });
  };

  const handleDownloadFacture = async (id) => {
    try {
      factureController.downloadPDF(id);
    } catch (err) {
      setError('On n\'arrive pas à ouvrir la facture. Réessayez dans un instant.');
    }
  };

  const handleEvaluate = async (id) => {
    if (!evalNote || evalNote < 1 || evalNote > 5) {
      setEvalMsg('Choisissez une note entre 1 et 5 étoiles.');
      return;
    }
    setEvaluatingId(id);
    setEvalMsg('');
    try {
      await commandeController.evaluate(id, evalNote, evalComment);
      setEvaluatingId(null);
      setEvalNote(5);
      setEvalComment('');
      setEvalMsg('Merci pour votre avis !');
      loadCommandes();
    } catch (err) {
      setEvalMsg(err.response?.data?.message || 'Erreur lors de l\'évaluation');
      setEvaluatingId(null);
    }
  };

  if (loading) return <div className="container loading">On cherche vos commandes...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Mes commandes</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {evalMsg && (
        <div className={evalMsg.includes('Erreur') ? 'alert alert-error' : 'alert alert-success'}>
          {evalMsg}
        </div>
      )}

      {commandes.length === 0 ? (
        <div className="card">
          <p>Pas encore de commande. Jetez un œil à nos services, ça se fait en deux clics.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Service</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Paiement</th>
              <th>Avis</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((cmd) => {
              const isEvaluated = cmd.evaluation && cmd.evaluation.note;
              const canEvaluate = cmd.status === 'terminee' && !isEvaluated && !evaluatingId;

              return (
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
                    <span className={`badge badge-${cmd.paymentStatus}`}>
                      {cmd.paymentStatus === 'pending' ? 'En attente' : cmd.paymentStatus === 'paid' ? 'Payé' : cmd.paymentStatus}
                    </span>
                  </td>
                  <td>
                    {isEvaluated ? (
                      <div>
                        <span style={{ color: '#e67e22' }}>
                          {'★'.repeat(cmd.evaluation.note)}{'☆'.repeat(5 - cmd.evaluation.note)}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '0.5rem' }}>
                          {cmd.evaluation.commentaire}
                        </span>
                      </div>
                    ) : cmd.status === 'terminee' ? (
                      <span style={{ color: '#888' }}>Pas encore d'avis</span>
                    ) : (
                      <span style={{ color: '#aaa' }}>—</span>
                    )}
                  </td>
                  <td>
                    {cmd.status === 'confirmee' && cmd.paymentStatus === 'pending' && (
                      <button className="btn btn-success" onClick={() => handlePay(cmd._id)}>
                        Régler
                      </button>
                    )}
                    {['demande', 'confirmee'].includes(cmd.status) && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancel(cmd._id)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Annuler
                      </button>
                    )}
                    {canEvaluate && (
                      <button
                        className="btn btn-primary"
                        onClick={() => setEvaluatingId(cmd._id)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Laisser un avis
                      </button>
                    )}
                    {cmd.factureId && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDownloadFacture(cmd._id)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Télécharger la facture
                      </button>
                    )}
                    {cmd.prestataireId && ['payee', 'en_cours', 'terminee'].includes(cmd.status) && (
                      <button
                        className="btn btn-info"
                        onClick={() => navigate(`/messages/${cmd._id}`)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Écrire au prestataire
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Formulaire d'évaluation inline */}
      {evaluatingId && (
        <div className="card" style={{ marginTop: '1.5rem', maxWidth: 500 }}>
          <h3 style={{ marginBottom: '1rem' }}>Votre avis compte</h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Note : {evalNote} / 5
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={evalNote}
              onChange={(e) => setEvalNote(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
              <span>1 — Déçu·e</span>
              <span>3 — Correct</span>
              <span>5 — Au top</span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Un mot en plus (optionnel)
            </label>
            <textarea
              value={evalComment}
              onChange={(e) => setEvalComment(e.target.value)}
              rows="3"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                resize: 'vertical'
              }}
              placeholder="Dites-nous comment ça s'est passé..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleEvaluate(evaluatingId)}
              disabled={!evalNote}
            >
              Envoyer mon avis
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEvaluatingId(null);
                setEvalNote(5);
                setEvalComment('');
                setEvalMsg('');
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MesCommandesPage;