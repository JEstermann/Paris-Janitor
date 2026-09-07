const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fonction fetch avec gestion du token et des erreurs
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Gérer les erreurs d'authentification
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Non autorisé');
  }

  // Si c'est un blob, retourner directement
  if (options.blob) {
    if (!response.ok) {
      const error = new Error('Erreur téléchargement');
      error.response = { status: response.status };
      throw error;
    }
    const blob = await response.blob();
    return { data: blob };
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Erreur serveur');
    error.response = { data, status: response.status };
    throw error;
  }

  return { data };
}

const api = {
  get: (url, options = {}) => request(url, { method: 'GET', ...options }),
  post: (url, body, options = {}) => request(url, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (url, body, options = {}) => request(url, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (url) => request(url, { method: 'DELETE' }),
  patch: (url, body, options = {}) => request(url, { method: 'PATCH', body: JSON.stringify(body), ...options })
};

export default api;
