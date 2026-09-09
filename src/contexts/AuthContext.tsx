import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const POST_AUTH_PATH_KEY = 'ogura_post_auth_path';

/**
 * Returns an origin that is guaranteed to be on the OAuth redirect allow-list.
 * `www.` hosts are not allow-listed, so they are canonicalized to the apex host.
 */
const getCanonicalAuthOrigin = (): string => {
  const { protocol, hostname, port } = window.location;
  const canonicalHost = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  return `${protocol}//${canonicalHost}${port ? `:${port}` : ''}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(() => {
            fetchUserProfile(session.user.id, session);
          }, 0);
        } else {
          setUser(null);
          setIsNewUser(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id, session);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, currentSession: Session | null) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name || currentSession?.user?.user_metadata?.full_name || 'User',
          email: profile.email || currentSession?.user?.email || '',
          phone: profile.phone || undefined,
          avatarUrl: profile.avatar_url || currentSession?.user?.user_metadata?.avatar_url
        });
        // Check if user has completed onboarding
        setIsNewUser(profile.is_onboarded === false);
      } else if (currentSession?.user) {
        // Fallback to session metadata if profile doesn't exist yet
        setUser({
          id: currentSession.user.id,
          name: currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || 'User',
          email: currentSession.user.email || '',
          phone: currentSession.user.user_metadata?.phone,
          avatarUrl: currentSession.user.user_metadata?.avatar_url
        });
        // New user without profile
        setIsNewUser(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Still set user from session metadata on error
      if (currentSession?.user) {
        setUser({
          id: currentSession.user.id,
          name: currentSession.user.user_metadata?.full_name || 'User',
          email: currentSession.user.email || '',
          avatarUrl: currentSession.user.user_metadata?.avatar_url
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Remember where the user was so we can return there after the round-trip.
      try {
        const intended = window.location.pathname + window.location.search;
        if (intended.startsWith('/') && !intended.startsWith('//')) {
          sessionStorage.setItem(POST_AUTH_PATH_KEY, intended);
        }
      } catch {
        // sessionStorage unavailable (private mode) - non-fatal
      }

      // Lovable's wrapper navigates to /~oauth/initiate, a route that only
      // exists on Lovable's own hosting. Off that host — as we now are — it is
      // a hard 404 and the user never reaches Google at all. The wrapper never
      // "errors", it redirects, so the fallback below could never fire.
      // Off Lovable, go straight to Supabase's Google provider.
      const onLovableHost = /(^|\.)lovable\.(app|dev)$/i.test(window.location.hostname);

      if (!onLovableHost) {
        const { error: directError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: getCanonicalAuthOrigin() },
        });
        if (!directError) return { success: true };
        console.error('Supabase Google OAuth failed:', directError.message);
        return {
          success: false,
          error:
            'Google sign-in is not configured yet. Add the Google client ID and secret ' +
            'under Authentication → Providers in Supabase.',
        };
      }

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: getCanonicalAuthOrigin(),
      });

      if (result.error) {
        const errorMsg = result.error.message || '';
        console.error('OAuth error details:', { message: errorMsg, origin: window.location.origin });

        // The hosted wrapper only accepts allow-listed origins. Where it will
        // not run (local dev, a preview host), try Supabase's Google provider
        // directly before giving up.
        const { error: directError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: getCanonicalAuthOrigin() },
        });
        if (!directError) return { success: true };
        console.error('Direct Supabase OAuth also failed:', directError.message);

        if (errorMsg.includes('redirect_uri_mismatch') || errorMsg.includes('redirect')) {
          console.error('OAuth redirect URI mismatch. Current origin:', window.location.origin);
          return { success: false, error: 'Sign-in configuration error. Please try again or contact support.' };
        }
        if (errorMsg.includes('access_denied')) {
          return { success: false, error: 'Sign-in was cancelled.' };
        }
        if (errorMsg.includes('popup_closed') || errorMsg.includes('closed')) {
          return { success: false, error: 'Sign-in window was closed. Please try again.' };
        }

        return { success: false, error: 'Google sign-in failed. Please try again.' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('OAuth unexpected error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign-in failed' };
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, error: error.message };
      if (!data.user) return { success: false, error: 'Signup failed' };

      // Deliberately no seller record here. Signing up is not the same as
      // being an approved atelier — the application and its review live at
      // /sell, and approval is a human decision made there.
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsNewUser(false);
  };

  const completeOnboarding = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({ is_onboarded: true, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }

    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout,
      isAuthenticated: !!session,
      isLoading,
      isNewUser,
      completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
