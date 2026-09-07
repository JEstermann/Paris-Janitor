import { useState, useEffect } from 'react';
import { adminController } from '../../services';

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminController.getStats();
      setStats(data);
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container loading">On prépare le tableau de bord...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Tableau de bord</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="grid grid-3">
          <div className="card">
            <h3 className="card-title">Comptes ouverts</h3>
            <p style={{ fontSize: '2.5rem', color: '#3498db' }}>{stats.totalUsers}</p>
          </div>
          <div className="card">
            <h3 className="card-title">Commandes passées</h3>
            <p style={{ fontSize: '2.5rem', color: '#27ae60' }}>{stats.totalCommandes}</p>
          </div>
          <div className="card">
            <h3 className="card-title">Chiffre d'affaires</h3>
            <p style={{ fontSize: '2.5rem', color: '#e67e22' }}>{stats.totalCA} €</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
