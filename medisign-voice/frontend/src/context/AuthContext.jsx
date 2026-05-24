import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('medisign_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.auth.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem('medisign_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('medisign_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api.auth.register(payload);
    localStorage.setItem('medisign_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('medisign_token');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser: loadUser }),
    [user, loading, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
