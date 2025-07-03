import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useUnreadMessages() {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<any>(null);

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

      const newCount = count || 0;
      console.log('Unread messages count updated:', newCount);
      setUnreadCount(newCount);
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

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to real-time updates for messages
    subscriptionRef.current = supabase
      .channel(`unread_messages_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload);
          // Only refresh if the message is not from the current user
          if (payload.new.sender_id !== profile.id) {
            setTimeout(() => {
              loadUnreadCount();
            }, 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message updated:', payload);
          // Refresh count when messages are marked as read
          setTimeout(() => {
            loadUnreadCount();
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('New conversation created:', payload);
          // Refresh count when new conversations are created
          setTimeout(() => {
            loadUnreadCount();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [profile, loadUnreadCount]);

  return { 
    unreadCount, 
    refreshUnreadCount: loadUnreadCount 
  };
}