import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Configure Supabase with explicit storage options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const authService = {
  async register(email: string, password: string) {
    console.log('Attempting registration with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
    console.log('Registration successful, user:', data.user ? 'created' : 'pending', 'requires_confirmation:', data.user?.confirmed_at ? 'no' : 'yes');
    return data;
  },

  async login(email: string, password: string) {
    console.log('Attempting login with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
    console.log('Login successful, session:', data.session ? 'exists' : 'missing');
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }
      return data.session;
    } catch (error) {
      console.error('Exception getting session:', error);
      return null;
    }
  },

  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return null;
      }
      return data.user;
    } catch (error) {
      console.error('Exception getting user:', error);
      return null;
    }
  },

  onAuthStateChange(callback: (user: any) => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;
      callback(user);
    });

    return subscription;
  },
};
