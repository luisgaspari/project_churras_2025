import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  visible,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu e-mail.');
      return;
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, informe um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-app.com/reset-password', // URL para redirecionamento
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível enviar o e-mail de recuperação.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {emailSent ? 'E-mail Enviado' : 'Esqueci a Senha'}
            </Text>
            <IconButton
              icon={() => <X size={24} color={theme.colors.onSurface} />}
              onPress={handleClose}
            />
          </View>

          <View style={styles.modalBody}>
            {emailSent ? (
              <View style={styles.successContainer}>
                <Text variant="bodyLarge" style={styles.successText}>
                  Enviamos um link de recuperação para seu e-mail.
                </Text>
                <Text variant="bodyMedium" style={styles.successSubtext}>
                  Verifique sua caixa de entrada e siga as instruções para
                  redefinir sua senha.
                </Text>
                <Text variant="bodySmall" style={styles.emailText}>
                  {email}
                </Text>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <Text variant="bodyMedium" style={styles.description}>
                  Informe seu e-mail para receber um link de recuperação de
                  senha.
                </Text>

                <TextInput
                  label="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </View>
            )}
          </View>

          <View style={styles.modalActions}>
            {emailSent ? (
              <Button
                mode="contained"
                onPress={handleClose}
                style={styles.actionButton}
              >
                Fechar
              </Button>
            ) : (
              <>
                <Button
                  mode="outlined"
                  onPress={handleClose}
                  style={styles.actionButton}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleResetPassword}
                  style={styles.actionButton}
                  loading={loading}
                  disabled={loading || !email.trim()}
                >
                  Enviar Link
                </Button>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: spacing.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  formContainer: {
    gap: spacing.lg,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
  },
  successContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  successText: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  successSubtext: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailText: {
    color: theme.colors.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});