import { createContext, useContext, useState, useEffect } from 'react';
import authController from '../services/authController';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const currentUser = authController.getCurrentUser();
      if (currentUser) {
        if (!cancelled) setUser(currentUser);
        // Si on n'a pas isSuperAdmin dans le user (ancien token), on hydrate via /auth/me
        if (currentUser.isSuperAdmin === undefined && authController.isAuthenticated()) {
          try {
            const me = await api.get('/auth/me');
            if (!cancelled) {
              localStorage.setItem('user', JSON.stringify(me.data));
              setUser(me.data);
            }
          } catch {
            // On garde le user existant
          }
        }
      }
      if (!cancelled) setLoading(false);
    };

    hydrate();
    return () => { cancelled = true; };
  }, []);

  const login = async (email, password) => {
    const response = await authController.login(email, password);
    const currentUser = authController.getCurrentUser();
    setUser(currentUser);
    return response;
  };

  const logout = () => {
    authController.logout();
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin' || user?.isSuperAdmin;
  const isSuperAdmin = () => user?.isSuperAdmin === true;
  const isPrestataire = () => user?.role === 'prestataire';
  const isVoyageur = () => user?.role === 'voyageur';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        isPrestataire,
        isVoyageur,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
