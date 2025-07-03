import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import { Send } from 'lucide-react-native';
import { spacing, theme } from '@/constants/theme';

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
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Digite sua mensagem..."
        style={styles.input}
        mode="outlined"
        multiline
        maxLength={1000}
        disabled={disabled}
        onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
        blurOnSubmit={false}
        returnKeyType="send"
      />
      <IconButton
        icon={() => <Send size={20} color={theme.colors.primary} />}
        onPress={handleSend}
        disabled={!message.trim() || disabled}
        style={[
          styles.sendButton,
          (!message.trim() || disabled) && styles.sendButtonDisabled,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  input: {
    flex: 1,
    marginRight: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
    backgroundColor: theme.colors.primaryContainer,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceVariant,
  },
});
