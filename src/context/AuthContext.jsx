import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../utils/api';

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

const STORAGE_TOKEN = 'biograf_token';
const STORAGE_USER  = 'biograf_user';

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true); // init = restauration depuis localStorage

  // ── Restauration de session au démarrage ─────────────────────────────────
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_TOKEN);
      const savedUser  = localStorage.getItem(STORAGE_USER);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // localStorage corrompu → on nettoie
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Persistance ──────────────────────────────────────────────────────────
  const persist = useCallback((tok, usr) => {
    localStorage.setItem(STORAGE_TOKEN, tok);
    localStorage.setItem(STORAGE_USER, JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    setToken(null);
    setUser(null);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Inscription — retourne { needsVerification: true } en cas de succès
   * @param {{ email, password, fullName, language }} data
   */
  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    // Le backend envoie un email → on informe le parent sans connecter
    return { needsVerification: true, email: data.email, user: res.user };
  }, []);

  /**
   * Connexion — persiste le token et l'utilisateur
   * @param {{ email, password }} data
   */
  const login = useCallback(async (data) => {
    const res = await authApi.login(data); // { token, user, message }
    persist(res.token, res.user);
    return res;
  }, [persist]);

  /**
   * Déconnexion
   */
  const logout = useCallback(async () => {
    if (user?.id) {
      try { await authApi.logout(user.id); } catch { /* best-effort */ }
    }
    clear();
  }, [user, clear]);

  /**
   * Mise à jour locale de l'utilisateur (après modification de profil)
   * @param {object} patch
   */
  const updateLocalUser = useCallback((patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem(STORAGE_USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Valeur exposée ───────────────────────────────────────────────────────
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    register,
    updateLocalUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
  return ctx;
}
