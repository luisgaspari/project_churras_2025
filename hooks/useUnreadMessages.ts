import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessages() {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    // Função para carregar contagem inicial
    const loadUnreadCount = async () => {
      try {
        // Buscar todas as conversas do usuário
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`client_id.eq.${profile.id},professional_id.eq.${profile.id}`);

        if (!conversations || conversations.length === 0) {
          setUnreadCount(0);
          return;
        }

        const conversationIds = conversations.map(c => c.id);

        // Contar mensagens não lidas em todas as conversas
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('is_read', false)
          .neq('sender_id', profile.id);

        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error loading unread count:', error);
        setUnreadCount(0);
      }
    };

    // Carregar contagem inicial
    loadUnreadCount();

    // Configurar subscription para mudanças em tempo real
    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Recarregar contagem quando houver mudanças nas mensagens
          loadUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          // Recarregar contagem quando houver mudanças nas conversas
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  const refreshUnreadCount = async () => {
    if (!profile) return;

    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${profile.id},professional_id.eq.${profile.id}`);

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', profile.id);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  return { unreadCount, refreshUnreadCount };
}