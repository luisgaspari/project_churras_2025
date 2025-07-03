import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, theme } from '@/constants/theme';

interface ChatBubbleProps {
  message: string;
  isOwnMessage: boolean;
  timestamp: string;
  isRead?: boolean;
}

export default function ChatBubble({
  message,
  isOwnMessage,
  timestamp,
  isRead,
}: ChatBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Text
          variant="bodyMedium"
          style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {message}
        </Text>
        <View style={styles.timestampContainer}>
          <Text
            variant="bodySmall"
            style={[
              styles.timestamp,
              isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
            ]}
          >
            {formatTime(timestamp)}
          </Text>
          {isOwnMessage && (
            <Text
              variant="bodySmall"
              style={[
                styles.readStatus,
                {
                  color: isRead
                    ? theme.colors.tertiary
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {isRead ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.lg,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  otherBubble: {
    backgroundColor: theme.colors.surfaceVariant,
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    lineHeight: 20,
  },
  ownMessageText: {
    color: theme.colors.onPrimary,
  },
  otherMessageText: {
    color: theme.colors.onSurface,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  timestamp: {
    fontSize: 11,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: theme.colors.onSurfaceVariant,
  },
  readStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
