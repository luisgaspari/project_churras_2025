import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useUnreadMessages() {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase.rpc('get_unread_messages_count', {
        user_uuid: profile.id,
      });

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      setUnreadCount(data || 0);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  useEffect(() => {
    if (profile) {
      refreshUnreadCount();

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
            refreshUnreadCount();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile]);

  return {
    unreadCount,
    refreshUnreadCount,
  };
}