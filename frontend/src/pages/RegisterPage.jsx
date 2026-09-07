import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authController } from '../services';

function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'voyageur',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authController.register(formData);
      await authController.login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || "Oups — l'inscription n'a pas fonctionné.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2 className="auth-title">On fait connaissance</h2>
        <p className="auth-subtitle">Quelques infos et c'est parti</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form-fields">
          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="form-group">
            <label>Téléphone <span className="form-hint">(optionnel)</span></label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={12}
            />
            <span className="form-hint">Au moins 12 caractères</span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'On crée votre compte...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-footer">
          Déjà inscrit·e ? <Link to="/login">Connectez-vous</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
