import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('placeholder')
);

// Fallback mock authentication client for demo / AI Studio development
class MockSupabaseAuth {
  private listeners: Array<(event: string, session: Session | null) => void> = [];
  private readonly storageKey = 'smartrail_mock_session';

  private getStoredSession(): Session | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  }

  private setStoredSession(session: Session | null) {
    try {
      if (session) {
        localStorage.setItem(this.storageKey, JSON.stringify(session));
      } else {
        localStorage.removeItem(this.storageKey);
      }
    } catch {
      // ignore
    }
  }

  async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
    return { data: { session: this.getStoredSession() }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    this.listeners.push(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((cb) => cb !== callback);
          },
        },
      },
    };
  }

  async signInWithOAuth(_params?: any): Promise<{ data: { provider: string; url: string | null }; error: null }> {
    const mockUser: User = {
      id: 'uid_mrunal_admin',
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: {
        full_name: 'Mrunal Baravkar',
        name: 'Mrunal Baravkar',
        avatar_url: '',
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'mrunal.r.baravkar@gmail.com',
      phone: '+91 98230 45678',
    } as User;

    const mockSession: Session = {
      access_token: 'mock_token_uid_mrunal_admin',
      token_type: 'bearer',
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      refresh_token: 'mock_refresh_token',
      user: mockUser,
    };

    this.setStoredSession(mockSession);
    this.listeners.forEach((cb) => {
      try {
        cb('SIGNED_IN', mockSession);
      } catch (err) {
        console.error(err);
      }
    });

    return { data: { provider: 'google', url: null }, error: null };
  }

  async signOut(): Promise<{ error: null }> {
    this.setStoredSession(null);
    this.listeners.forEach((cb) => {
      try {
        cb('SIGNED_OUT', null);
      } catch (err) {
        console.error(err);
      }
    });
    return { error: null };
  }

  async getUser(): Promise<{ data: { user: User | null }; error: null }> {
    const session = this.getStoredSession();
    return { data: { user: session?.user ?? null }, error: null };
  }
}

export const supabase: any = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : {
      auth: new MockSupabaseAuth(),
    };
