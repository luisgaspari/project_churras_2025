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
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
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
                isRead ? styles.readStatusRead : styles.readStatusUnread,
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
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: theme.colors.surfaceVariant,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    lineHeight: 20,
  },
  ownMessageText: {
    color: theme.colors.onPrimary,
  },
  otherMessageText: {
    color: theme.colors.onSurfaceVariant,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  ownTimestamp: {
    color: theme.colors.onPrimary,
  },
  otherTimestamp: {
    color: theme.colors.onSurfaceVariant,
  },
  readStatus: {
    fontSize: 11,
    marginLeft: spacing.xs,
  },
  readStatusRead: {
    color: theme.colors.onPrimary,
    opacity: 0.8,
  },
  readStatusUnread: {
    color: theme.colors.onPrimary,
    opacity: 0.5,
  },
});