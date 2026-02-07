import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check initial session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authService.getCurrentSession();
        setSession(session);

        if (session) {
          const user = await authService.getCurrentUser();
          setUser(user);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { data: subscription } = authService.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) {
          authService.getCurrentUser().then(setUser);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const register = async (email, password, fullName) => {
    try {
      setError(null);
      await authService.register(email, password, fullName);
      // User needs to verify email before login (if email confirmation is enabled)
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const { session, user } = await authService.login(email, password);
      setSession(session);
      setUser(user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setSession(null);
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!session,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
