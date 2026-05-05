/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import api, { getApiError, TOKEN_KEY, unwrap, USER_KEY } from '../api/client.js';

const AuthContext = createContext(null);

const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_KEY);
  const storedToken = localStorage.getItem(TOKEN_KEY);

  if (!storedUser || !storedToken) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getStoredUser()));
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = unwrap(await api.get('/users/me'));
        if (cancelled) return;
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
        setIsLoggedIn(true);
      } catch {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = async (credentials) => {
    try {
      const data = unwrap(await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      }));

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: getApiError(error, 'Login failed. Please check your details.') };
    }
  };

  const signup = async (userData) => {
    try {
      const data = unwrap(await api.post('/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        income: userData.income,
      }));

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: getApiError(error, 'Signup failed. Please try again.') };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsLoggedIn(false);
  };

  const value = {
    user,
    isLoggedIn,
    isLoading,
    login,
    signup,
    logout,
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={value}>
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
