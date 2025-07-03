import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { IconButton } from 'react-native-paper';
import { spacing, theme } from '@/constants/theme';
import { Send } from 'lucide-react-native';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
          maxLength={1000}
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <IconButton
          icon={() => (
            <Send
              size={20}
              color={
                message.trim() && !disabled
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
              }
            />
          )}
          onPress={handleSend}
          disabled={!message.trim() || disabled}
          style={styles.sendButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    margin: 0,
    marginLeft: spacing.xs,
  },
});