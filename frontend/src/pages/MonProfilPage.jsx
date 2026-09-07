import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function MonProfilPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Charger les données depuis le user du contexte
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email) {
      setError('Renseignez un email pour qu\'on puisse vous joindre.');
      return;
    }

    setSaving(true);
    try {
      await api.put('/auth/profile', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone
      });
      setSuccess('Modifications enregistrées.');
      // Mettre à jour le localStorage
      const updatedUser = { ...user, firstName: form.firstName, lastName: form.lastName, email: form.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ça n\'a pas pris — vérifiez vos infos.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div className="container loading">On prépare votre profil...</div>;

  return (
    <div className="container">
      <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="auth-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Votre profil</h2>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Prénom</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Prénom"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Nom</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Nom"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="email@example.com"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0601020304"
                  style={{ width: '100%' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? 'On enregistre...' : 'Enregistrer'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', textAlign: 'center' }}>
              <p style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                Envie de changer de mot de passe ?
              </p>
              <a href="/change-password" className="btn btn-secondary" style={{ display: 'inline-block' }}>
                Modifier mon mot de passe
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonProfilPage;