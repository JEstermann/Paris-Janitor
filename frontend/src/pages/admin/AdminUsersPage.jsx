import { useState, useEffect } from 'react';
import { adminController } from '../../services';
import { useAuth } from '../../context/AuthContext';

function AdminUsersPage() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modale édition / création
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = création
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', role: 'voyageur'
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Confirmation désactivation
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminController.getUsers();
      setUsers(data);
    } catch {
      setError("On n'arrive pas à charger la liste.");
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le formulaire de création
  const openCreate = () => {
    setEditingUser(null);
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'voyageur'
    });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.email) {
      setFormError("L'email est obligatoire");
      return;
    }

    if (!editingUser && !form.password) {
      setFormError('Le mot de passe est obligatoire');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        // Edition : on n'envoie pas password ni role
        const payload = { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone };
        await adminController.updateUser(editingUser._id, payload);
      } else {
        // Création : on envoie tout (password, role, et infos)
        const payload = { ...form };
        await adminController.createUser(payload);
      }
      closeModal();
      loadUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || "L'enregistrement n'a pas marché.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    setConfirmTarget({ id: user._id, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email });
  };

  const confirmToggle = async () => {
    if (!confirmTarget) return;
    try {
      await adminController.toggleUserActive(confirmTarget.id);
      setConfirmTarget(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Le changement de statut n'a pas fonctionné.");
      setConfirmTarget(null);
    }
  };

  const getRoleBadge = (role) => {
    const map = {
      admin: 'badge-admin',
      voyageur: 'badge-voyageur',
      prestataire: 'badge-prestataire'
    };
    const labels = { admin: 'Admin', voyageur: 'Voyageur', prestataire: 'Prestataire' };
    return (
      <span className={`badge ${map[role] || ''}`}>
        {labels[role] || role}
      </span>
    );
  };

  if (loading) return <div className="container loading">On charge les comptes...</div>;

  return (
    <div className="container">
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={openCreate}>
          + Créer un utilisateur
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Inscrit le</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Pas encore de comptes créés</td></tr>
          ) : users.map((u) => (
            <tr key={u._id}>
              <td>{u.firstName} {u.lastName}</td>
              <td>{u.email}</td>
              <td>{getRoleBadge(u.role)}</td>
              <td>
                {u.isSuperAdmin ? (
                  <span className="badge badge-admin">Super Admin</span>
                ) : u.active ? (
                  <span className="badge badge-paid">Actif</span>
                ) : (
                  <span className="badge badge-error">Désactivé</span>
                )}
              </td>
              <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
              <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => openEdit(u)}>
                  Modifier
                </button>
                {!u.isSuperAdmin && (
                  <button
                    className={`btn ${u.active ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => handleToggleActive(u)}
                    style={{ minWidth: '120px' }}
                  >
                    {u.active ? 'Désactiver' : 'Activer'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modale création / édition */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h2>{editingUser ? 'Modifier le compte' : 'Nouveau compte'}</h2>

            {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleSave}>
              {!editingUser && (
                <>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe *</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      placeholder="Minimum 12 caractères"
                    />
                  </div>
                  <div className="form-group">
                    <label>Rôle</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="voyageur">Voyageur</option>
                      <option value="prestataire">Prestataire</option>
                      {isSuperAdmin() && <option value="admin">Administrateur</option>}
                    </select>
                  </div>
                </>
              )}

              {editingUser && (
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="email@example.com"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Nom"
                />
              </div>

              {editingUser && (
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0601020304"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'On enregistre...' : (editingUser ? 'Enregistrer' : 'Créer le compte')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation désactivation */}
      {confirmTarget && (
<div className="modal-overlay" onClick={() => setConfirmTarget(null)}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <h2>On est sûrs ?</h2>
            <p>
              On {users.find(u => u._id === confirmTarget.id)?.active ? 'désactive' : 'réactive'} le compte de <strong>{confirmTarget.name}</strong> ?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmTarget(null)}>Annuler</button>
              <button className="btn btn-warning" onClick={confirmToggle}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
