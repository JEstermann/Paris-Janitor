import { useState, useEffect } from 'react';
import { notificationController } from '../services';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationController.getAll();
      setNotifications(data);
    } catch {
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationController.markAsRead(id);
      setNotifications(notifications.map(n =>
        n._id === id ? { ...n, read: true } : n
      ));
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationController.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette notification ?')) return;
    try {
      await notificationController.remove(id);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch {
      // ignore
    }
  };

  const getTypeIcon = (type) => {
    const map = {
      commande_confirmee: 'OK',
      commande_assignee: 'PT',
      commande_demarree: '>',
      commande_terminee: 'OK',
      commande_annulee: 'X',
      paiement_recu: '€'
    };
    return map[type] || '?';
  };

  const getTypeColor = (type) => {
    const map = {
      commande_confirmee: '#3498db',
      commande_assignee: '#9b59b6',
      commande_demarree: '#9b59b6',
      commande_terminee: '#27ae60',
      commande_annulee: '#e74c3c',
      paiement_recu: '#27ae60'
    };
    return map[type] || '#666';
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000; // secondes

    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString('fr-FR');
  };

  if (loading) return <div className="container loading">On regarde les nouvelles...</div>;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllAsRead}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {notifications.length === 0 ? (
        <div className="card">
          <p>Pas de nouvelles pour l'instant. On vous préviendra dès qu'il se passe quelque chose.</p>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div
              key={n._id}
              className={`notification-item ${!n.read ? 'unread' : ''}`}
              onClick={() => !n.read && handleMarkAsRead(n._id)}
            >
              <div
                className="notification-icon"
                style={{ backgroundColor: getTypeColor(n.type) }}
              >
                {getTypeIcon(n.type)}
              </div>
              <div className="notification-content">
                <div className="notification-title">
                  {n.titre}
                  {!n.read && <span className="unread-dot" />}
                </div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">{formatDate(n.createdAt)}</div>
              </div>
              <button
                className="notification-delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                title="Supprimer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;