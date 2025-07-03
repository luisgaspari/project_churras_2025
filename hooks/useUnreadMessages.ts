import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useUnreadMessages() {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (!profile) {
      setUnreadCount(0);
      return;
    }

    try {
      // Get all conversations for the user
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${profile.id},professional_id.eq.${profile.id}`);

      if (conversationsError) {
        console.error('Error loading conversations:', conversationsError);
        return;
      }

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      // Count unread messages in all conversations
      // Only count messages sent by others (not by the current user)
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', profile.id);

      if (countError) {
        console.error('Error counting unread messages:', countError);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      setUnreadCount(0);
      return;
    }

    // Load initial unread count
    loadUnreadCount();

    // Subscribe to real-time updates for messages
    const messagesSubscription = supabase
      .channel('unread_messages_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Refresh count when messages are inserted, updated, or deleted
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
          // Refresh count when conversations are created or updated
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [profile, loadUnreadCount]);

  return { 
    unreadCount, 
    refreshUnreadCount: loadUnreadCount 
  };
}