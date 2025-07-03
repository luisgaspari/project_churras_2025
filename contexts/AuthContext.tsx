import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  user_type: 'client' | 'professional';
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  location?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<Profile>
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Ignore signOut errors as we're clearing state anyway
      console.log('SignOut error (ignored):', error);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  useEffect(() => {
    // Get initial session with proper error handling for invalid refresh tokens
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Check for specific refresh token errors
        if (error) {
          const errorMessage = error.message?.toLowerCase() || '';
          const isRefreshTokenError = 
            errorMessage.includes('refresh token not found') ||
            errorMessage.includes('invalid refresh token') ||
            error.message?.includes('refresh_token_not_found');

          if (isRefreshTokenError) {
            console.log('Invalid refresh token detected, clearing auth state');
            await clearAuthState();
            return;
          }
          
          // For other errors, still clear state but log the error
          console.error('Auth initialization error:', error);
          await clearAuthState();
          return;
        }

        // If there's no session or user, clear any stale tokens
        if (!session?.user) {
          await clearAuthState();
          return;
        }

        setSession(session);
        setUser(session.user);
        await loadProfile(session.user.id);
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Check if the error is related to refresh tokens
        const errorString = String(error).toLowerCase();
        if (errorString.includes('refresh token') || errorString.includes('token')) {
          console.log('Token-related error detected, clearing auth state');
        }
        await clearAuthState();
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      // Handle token refresh errors
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('Token refresh failed, clearing auth state');
        await clearAuthState();
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
        // Only redirect to home if we're not already there
        if (router.canGoBack()) {
          router.replace('/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Navigate user after profile is loaded
  useEffect(() => {
    if (!loading && profile) {
      if (profile.user_type === 'client') {
        router.replace('/(client)');
      } else if (profile.user_type === 'professional') {
        router.replace('/(professional)');
      }
    }
  }, [profile, loading]);

  const loadProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<Profile>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email!,
        ...userData,
      });

      if (profileError) {
        throw profileError;
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}