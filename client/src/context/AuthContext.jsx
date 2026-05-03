/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const getStoredUser = () => {
  const storedUser = localStorage.getItem('splitchill_user');
  const storedToken = localStorage.getItem('splitchill_token');

  if (!storedUser || !storedToken) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('splitchill_user');
    localStorage.removeItem('splitchill_token');
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getStoredUser()));
  const isLoading = false;

  const login = async (credentials) => {

    
    const mockUser = {
      id: 'usr_123',
      name: credentials.email?.split('@')[0] || 'User',
      email: credentials.email,
    };
    
    localStorage.setItem('splitchill_token', 'mock_jwt_token');
    localStorage.setItem('splitchill_user', JSON.stringify(mockUser));
    
    setUser(mockUser);
    setIsLoggedIn(true);
    return { success: true };
  };

  const signup = async (userData) => {
    // Replace this with your real API call
    // const res = await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
    
    const mockUser = {
      id: 'usr_' + Date.now(),
      name: userData.name || userData.email?.split('@')[0] || 'User',
      email: userData.email,
    };
    
    localStorage.setItem('splitchill_token', 'mock_jwt_token');
    localStorage.setItem('splitchill_user', JSON.stringify(mockUser));
    
    setUser(mockUser);
    setIsLoggedIn(true);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('splitchill_token');
    localStorage.removeItem('splitchill_user');
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
