import { useState } from 'react';
import { authController } from '../services';

function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

        if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Remplissez les trois champs.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Minimum 6 caractères pour le nouveau mot de passe.');
      return;
    }

    setLoading(true);
    try {
      await authController.changePassword(oldPassword, newPassword);
      setSuccess('C\'est fait — votre mot de passe est à jour.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || "Le changement n'a pas marché.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="auth-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Nouveau mot de passe</h2>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Ancien mot de passe *</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Nouveau mot de passe *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Nouveau mot de passe"
                  minLength="6"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Confirmer le nouveau mot de passe *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirmer le nouveau mot de passe"
                  minLength="6"
                  style={{ width: '100%' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'On enregistre...' : 'Enregistrer'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <small>
                Vous devez connaître votre mot de passe actuel pour pouvoir le changer.
                Si vous l'avez oublié, utilisez la fonction "Mot de passe oublié" (non implémentée).
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;