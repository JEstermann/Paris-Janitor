import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { vipController, notificationController } from '../services';

function Navbar() {
  const { user, logout } = useAuth();
  const [vipInfo, setVipInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'voyageur') {
      vipController.getMySubscription()
        .then(data => setVipInfo(data))
        .catch(() => setVipInfo(null));
    } else {
      setVipInfo(null);
    }
  }, [user]);

  // Poll notifications every 30 seconds
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = () => {
      notificationController.getUnreadCount()
        .then(count => setUnreadCount(count))
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <span className="brand-dot"></span> Paris Janitor
      </Link>

      <button
        className="navbar-burger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        {menuOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {!user ? (
          <>
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Accueil</NavLink>
            <NavLink to="/prestations" onClick={() => setMenuOpen(false)}>Services</NavLink>
            <NavLink to="/login" onClick={() => setMenuOpen(false)}>Connexion</NavLink>
            <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
              Créer un compte
            </Link>
          </>
        ) : (
          <>
            <span className="nav-greeting">
              Bonjour <strong>{user.firstName || user.email}</strong>
            </span>
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Accueil</NavLink>
            <NavLink to="/prestations" onClick={() => setMenuOpen(false)}>Services</NavLink>

            {user.role === 'voyageur' && (
              <>
                <NavLink to="/mes-commandes" onClick={() => setMenuOpen(false)}>Commandes</NavLink>
                <NavLink to="/mes-factures" onClick={() => setMenuOpen(false)}>Factures</NavLink>
                <NavLink to="/notifications" onClick={() => setMenuOpen(false)}>
                  Notifs
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </NavLink>
                <NavLink to="/vip" onClick={() => setMenuOpen(false)} className="vip-link">
                  Offre VIP
                </NavLink>
              </>
            )}

            {user.role === 'prestataire' && (
              <NavLink to="/interventions" onClick={() => setMenuOpen(false)}>Mes missions</NavLink>
            )}

            <NavLink to="/messages" onClick={() => setMenuOpen(false)}>Messages</NavLink>

            {user.role === 'admin' && (
              <>
                <NavLink to="/admin/dashboard" onClick={() => setMenuOpen(false)}>Tableau de bord</NavLink>
                <NavLink to="/admin/commandes" onClick={() => setMenuOpen(false)}>Commandes</NavLink>
                <NavLink to="/admin/prestataires" onClick={() => setMenuOpen(false)}>Prestataires</NavLink>
                <NavLink to="/admin/factures" onClick={() => setMenuOpen(false)}>Factures</NavLink>
                <NavLink to="/admin/users" onClick={() => setMenuOpen(false)}>Comptes</NavLink>
              </>
            )}

            <NavLink to="/profil" onClick={() => setMenuOpen(false)}>Mon profil</NavLink>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
