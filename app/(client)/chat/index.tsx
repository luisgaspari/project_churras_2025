import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { MessageCircle } from 'lucide-react-native';

interface Conversation {
  id: string;
  client_id: string;
  professional_id: string;
  last_message_at: string;
  professional_profile: {
    full_name: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
  };
}

export default function ChatListScreen() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadConversations();
      
      // Subscribe to real-time updates
      const subscription = supabase
        .channel('conversations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `client_id=eq.${profile.id}`,
          },
          () => {
            loadConversations();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          () => {
            loadConversations();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile]);

  const loadConversations = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          client_id,
          professional_id,
          last_message_at,
          professional_profile:profiles!conversations_professional_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('client_id', profile.id)
        .order('last_message_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Load last message for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conversation) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...conversation,
            last_message: lastMessage?.[0],
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const handleConversationPress = (conversationId: string) => {
    router.push(`/(client)/chat/${conversationId}`);
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => handleConversationPress(item.id)}
    >
      <Card style={styles.conversationCard}>
        <Card.Content style={styles.conversationContent}>
          <View style={styles.avatarContainer}>
            {item.professional_profile?.avatar_url ? (
              <Avatar.Image
                size={50}
                source={{ uri: item.professional_profile.avatar_url }}
              />
            ) : (
              <Avatar.Text
                size={50}
                label={item.professional_profile?.full_name?.charAt(0).toUpperCase() || 'P'}
              />
            )}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text variant="titleMedium" style={styles.professionalName}>
                {item.professional_profile?.full_name}
              </Text>
              <Text variant="bodySmall" style={styles.timestamp}>
                {formatLastMessageTime(item.last_message_at)}
              </Text>
            </View>

            <Text
              variant="bodyMedium"
              style={styles.lastMessage}
              numberOfLines={1}
            >
              {item.last_message?.content || 'Conversa iniciada'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Conversas
        </Text>
      </View>

      <View style={styles.content}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nenhuma conversa ainda
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Quando você entrar em contato com churrasqueiros, suas conversas aparecerão aqui.
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={loadConversations}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  conversationCard: {
    marginBottom: spacing.sm,
    elevation: 1,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  professionalName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  timestamp: {
    color: theme.colors.onSurfaceVariant,
  },
  lastMessage: {
    color: theme.colors.onSurfaceVariant,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  emptyDescription: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
});