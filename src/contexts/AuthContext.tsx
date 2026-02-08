import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  aud: string;
  role: string;
  email_confirmed_at: string;
  phone: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  identities: any[];
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // First, try to get the current session (from localStorage)
        const session = await authService.getCurrentSession();
        if (session) {
          // Session exists, get the user data
          const currentUser = await authService.getCurrentUser();
          if (isMounted) {
            setUser(currentUser as User);
          }
        } else {
          // No session found
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const subscription = authService.onAuthStateChange((currentUser) => {
      if (isMounted) {
        setUser(currentUser as User);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.login(email, password);
      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 100));
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser as User);
      } else {
        throw new Error('Failed to get user after login');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.register(email, password);
      // After registration, user should login
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser as User);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
