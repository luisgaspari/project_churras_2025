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
      // Ignore os erros de signOut, pois estamos limpando o estado de qualquer maneira
      console.log('SignOut error (ignored):', error);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  useEffect(() => {
    // Obtenha a sessão inicial com tratamento de erro adequado
    // para tokens de atualização inválidos
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Verifique se há erros específicos no token de atualização
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

          // Para outros erros, ainda limpe o estado, mas registre o erro
          console.error('Auth initialization error:', error);
          await clearAuthState();
          return;
        }

        // Se não houver sessão ou usuário, limpe todos os tokens obsoletos
        if (!session?.user) {
          await clearAuthState();
          return;
        }

        setSession(session);
        setUser(session.user);
        await loadProfile(session.user.id);
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Verifique se o erro está relacionado aos tokens de atualização
        const errorString = String(error).toLowerCase();
        if (
          errorString.includes('refresh token') ||
          errorString.includes('token')
        ) {
          console.log('Token-related error detected, clearing auth state');
        }
        await clearAuthState();
      }
    };

    initializeAuth();

    // Ouça as alterações de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      // Lidar com erros de atualização de token
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
        // Redirecionar para a página inicial somente se ainda não estivermos lá
        if (router.canGoBack()) {
          router.replace('/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Navegar pelo usuário após o perfil ser carregado
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
      // Criar perfil
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
