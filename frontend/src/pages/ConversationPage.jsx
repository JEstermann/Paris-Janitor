import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ConversationPage() {
  const { commandeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [commande, setCommande] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [initDone, setInitDone] = useState(false);

  // Fetch simple
  const fetchAPI = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...options
    };

    const response = await fetch(`${API_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur');
    }

    return data;
  };

  // Charger les messages
  const loadMessages = async () => {
    try {
      setError(null);

      // Récupérer les messages
      const data = await fetchAPI(`/messages/commande/${commandeId}`);
      setMessages(data);

      // Récupérer les infos de la commande (une seule fois)
      if (!initDone) {
        try {
          const cmd = await fetchAPI(`/commandes/${commandeId}`);
          setCommande(cmd);

          const userId = user?._id || user?.id;

          if (cmd.userId && cmd.prestataireId) {
            const clientId = String(cmd.userId._id || cmd.userId);
            const prestataireUserId = cmd.prestataireId.userId;

            if (clientId === userId) {
              setOtherUser({
                _id: cmd.prestataireId._id,
                userId: prestataireUserId,
                name: cmd.prestataireId.name
              });
            } else if (prestataireUserId && String(prestataireUserId) === userId) {
              setOtherUser({
                _id: cmd.userId._id || cmd.userId,
                firstName: cmd.userId.firstName,
                lastName: cmd.userId.lastName,
                email: cmd.userId.email
              });
            }
          }
          setInitDone(true);
        } catch (e) {
          // On laisse passer
          setInitDone(true);
        }
      }

      // Marquer comme lus
      try {
        await fetchAPI(`/messages/commande/${commandeId}/read`, { method: 'PUT' });
      } catch (e) {
        // On ignore
      }
    } catch (err) {
      setError(err.message);
      setInitDone(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // Polling
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [commandeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError(null);
      await fetchAPI('/messages', {
        method: 'POST',
        body: JSON.stringify({ commandeId, content: newMessage })
      });
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOtherUserName = () => {
    if (!otherUser) return 'Chargement...';
    if (otherUser.firstName) {
      return `${otherUser.firstName} ${otherUser.lastName || ''}`.trim();
    }
    return otherUser.name || otherUser.email || 'Interlocuteur';
  };

  const isMyMessage = (msg) => {
    const senderId = msg.senderId?._id || msg.senderId;
    const userId = user?._id || user?.id;
    return String(senderId) === String(userId);
  };

if (loading) {
    return <div className="container loading">Ouverture du chat...</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-top">
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
            ←
          </button>
        </div>
        <div className="chat-header-info">
          <h2>{getOtherUserName()}</h2>
          {commande ? (
            <p className="chat-commande-info">
              {commande.prestationId?.title || 'Prestation'}
              <span className="chat-commande-id">#{commande._id?.substring(0, 8)}</span>
            </p>
          ) : (
            <p className="chat-commande-info">...</p>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="messages-list">
        {messages.length === 0 ? (
          <p className="empty-messages">Pas encore de message. N'hésitez pas à dire bonjour !</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${isMyMessage(msg) ? 'message-mine' : 'message-other'}`}
            >
              <div className="message-bubble">
                <p>{msg.content}</p>
                <small className="message-time">{formatTime(msg.createdAt)}</small>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          disabled={sending}
          maxLength={2000}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
          {sending ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}

export default ConversationPage;
