import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageController } from '../services';

function ConversationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messageController.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err.response?.data?.message || "On n'arrive pas à charger les conversations.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getOtherParticipantName = (conv) => {
    if (!conv.otherParticipant) return 'Interlocuteur';
    const p = conv.otherParticipant;
    if (p.firstName || p.lastName) {
      return `${p.firstName || ''} ${p.lastName || ''}`.trim();
    }
    return p.name || p.email || 'Participant';
  };

  const getPrestationTitle = (conv) => {
    return conv.commande?.prestationId?.title || 'Prestation';
  };

  if (loading) {
    return <div className="container loading">On cherche vos conversations...</div>;
  }

  if (error) {
    return <div className="container error">{error}</div>;
  }

  return (
    <div className="container">
      <h1>Mes conversations</h1>

      {conversations.length === 0 ? (
        <div className="card">
          <p>Aucune conversation pour le moment.</p>
          <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>
            La messagerie s'active dès qu'une commande est confirmée et qu'un prestataire est assigné.
          </p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map((conv) => (
            <Link
              key={conv.commandeId}
              to={`/messages/${conv.commandeId}`}
              className="conversation-item"
            >
              <div className="conversation-header">
                <h3>{getOtherParticipantName(conv)}</h3>
                {conv.unreadCount > 0 && (
                  <span className="badge badge-unread">{conv.unreadCount}</span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: '0.25rem 0' }}>
                {getPrestationTitle(conv)}
              </p>
              <p className="conversation-last-message">
                {conv.lastMessage?.content
                  ? (conv.lastMessage.content.substring(0, 100) +
                    (conv.lastMessage.content.length > 100 ? '...' : ''))
                  : 'Pas encore de message'}
              </p>
              <small className="conversation-date">
                {formatDate(conv.lastMessage?.createdAt)}
              </small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConversationsPage;
