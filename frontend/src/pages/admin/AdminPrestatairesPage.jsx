import { useState, useEffect } from 'react';
import { prestataireController } from '../../services';

function AdminPrestatairesPage() {
  const [prestataires, setPrestataires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPrestataires();
  }, []);

  const loadPrestataires = async () => {
    try {
      const data = await prestataireController.getAll();
      setPrestataires(data);
    } catch (err) {
      setError("On n'arrive pas à charger la liste.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      await prestataireController.validate(id);
      loadPrestataires();
    } catch (err) {
      setError("L'approbation n'a pas fonctionné.");
    }
  };

if (loading) return <div className="container loading">On charge la liste...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Les prestataires</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Tél.</th>
            <th>Statut</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {prestataires.map((p) => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.email}</td>
              <td>{p.phone}</td>
              <td>
                {p.validated ? (
                  <span className="badge badge-paid">Validé·e</span>
                ) : (
                  <span className="badge badge-pending">En cours d'analyse</span>
                )}
              </td>
              <td>{p.noteMoyenne ? `${p.noteMoyenne}/5` : '—'}</td>
              <td>
                {!p.validated && (
                  <button className="btn btn-success" onClick={() => handleValidate(p._id)}>
                    Approuver
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

export default AdminPrestatairesPage;
