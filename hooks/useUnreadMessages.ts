import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useUnreadMessages() {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) {
      setUnreadCount(0);
      return;
    }

    // Load initial unread count
    loadUnreadCount();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  const loadUnreadCount = async () => {
    if (!profile) return;

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
  };

  return { unreadCount, refreshUnreadCount: loadUnreadCount };
}