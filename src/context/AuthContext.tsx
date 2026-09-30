import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

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
  signInDemoPassenger: () => Promise<void>;
  signInDemoStaff: () => Promise<void>;
  signInDemoAdmin: () => Promise<void>;
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
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error('Failed to sync profile:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          await fetchProfile(idToken);
        } catch (e) {
          console.error('Error fetching auth token:', e);
        }
      } else {
        setToken(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      // Fallback to demo anonymous signin if popups blocked
      await signInAnonymously(auth);
    } finally {
      setLoading(false);
    }
  };

  // Switch demo personas easily for college viva and project demonstration
  const signInDemoPassenger = async () => {
    setProfile({
      id: 3,
      uid: 'uid_passenger_priya',
      name: 'Priya Kulkarni',
      email: 'priya.k@gmail.com',
      phone: '+91 97654 32109',
      role: 'PASSENGER',
      created_at: new Date().toISOString(),
    });
  };

  const signInDemoStaff = async () => {
    setProfile({
      id: 2,
      uid: 'uid_staff_arun',
      name: 'Arun Sharma (Duty Officer)',
      email: 'arun.staff@railway.gov.in',
      phone: '+91 98110 12345',
      role: 'STAFF',
      created_at: new Date().toISOString(),
    });
  };

  const signInDemoAdmin = async () => {
    setProfile({
      id: 1,
      uid: 'uid_mrunal_admin',
      name: 'Mrunal Baravkar (Admin)',
      email: 'mrunal.r.baravkar@gmail.com',
      phone: '+91 98230 45678',
      role: 'ADMIN',
      created_at: new Date().toISOString(),
    });
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
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
        signInDemoPassenger,
        signInDemoStaff,
        signInDemoAdmin,
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
