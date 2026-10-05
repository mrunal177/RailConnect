import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.ts';

export interface UserProfile {
  id: number;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'PASSENGER' | 'STAFF' | 'ADMIN';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile from backend
  const fetchProfile = async (idToken: string) => {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Could not sync your account with the server.');
    }
    setProfile(data);
  };

  const applySession = async (session: Session | null) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    setToken(session?.access_token ?? null);
    if (session?.access_token) {
      try {
        await fetchProfile(session.access_token);
      } catch (error) {
        console.error('Error fetching auth profile:', error);
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (mounted) void applySession(session);
    }).catch((error: unknown) => {
      console.error('Error restoring auth session:', error);
      if (mounted) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (mounted) queueMicrotask(() => { void applySession(session); });
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { queryParams: { access_type: 'offline', prompt: 'select_account' } },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      await supabase.auth.signOut();
      setUser(null);
      setToken(null);
      setProfile(null);
      throw new Error(err?.message || 'Google Sign-In could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setToken(null);
    } catch (e) {
      console.error('Sign-out error:', e);
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
