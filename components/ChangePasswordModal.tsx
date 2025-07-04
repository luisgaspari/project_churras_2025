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
} from 'react-native-paper';
import { X, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onPasswordChanged?: () => void;
}

export default function ChangePasswordModal({
  visible,
  onClose,
  onPasswordChanged,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePasswords = (): boolean => {
    if (!currentPassword.trim()) {
      Alert.alert('Erro', 'Por favor, informe sua senha atual.');
      return false;
    }

    if (!newPassword.trim()) {
      Alert.alert('Erro', 'Por favor, informe a nova senha.');
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'A confirmação da senha não confere.');
      return false;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Erro', 'A nova senha deve ser diferente da senha atual.');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      // Primeiro, verificar se a senha atual está correta
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Erro', 'Senha atual incorreta.');
        return;
      }

      // Atualizar para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert(
        'Sucesso',
        'Sua senha foi alterada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onPasswordChanged?.();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível alterar a senha.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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
              Alterar Senha
            </Text>
            <IconButton
              icon={() => <X size={24} color={theme.colors.onSurface} />}
              onPress={handleClose}
            />
          </View>

          <View style={styles.modalBody}>
            <Text variant="bodyMedium" style={styles.description}>
              Para sua segurança, informe sua senha atual e defina uma nova
              senha.
            </Text>

            <TextInput
              label="Senha atual *"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showCurrentPassword}
              disabled={loading}
              right={
                <TextInput.Icon
                  icon={() =>
                    showCurrentPassword ? (
                      <EyeOff size={20} color={theme.colors.onSurfaceVariant} />
                    ) : (
                      <Eye size={20} color={theme.colors.onSurfaceVariant} />
                    )
                  }
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                />
              }
            />

            <TextInput
              label="Nova senha *"
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showNewPassword}
              disabled={loading}
              right={
                <TextInput.Icon
                  icon={() =>
                    showNewPassword ? (
                      <EyeOff size={20} color={theme.colors.onSurfaceVariant} />
                    ) : (
                      <Eye size={20} color={theme.colors.onSurfaceVariant} />
                    )
                  }
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />
              }
            />

            <TextInput
              label="Confirmar nova senha *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              disabled={loading}
              right={
                <TextInput.Icon
                  icon={() =>
                    showConfirmPassword ? (
                      <EyeOff size={20} color={theme.colors.onSurfaceVariant} />
                    ) : (
                      <Eye size={20} color={theme.colors.onSurfaceVariant} />
                    )
                  }
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            <Text variant="bodySmall" style={styles.requirements}>
              A nova senha deve ter pelo menos 6 caracteres e ser diferente da
              senha atual.
            </Text>
          </View>

          <View style={styles.modalActions}>
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
              onPress={handleChangePassword}
              style={styles.actionButton}
              loading={loading}
              disabled={
                loading ||
                !currentPassword.trim() ||
                !newPassword.trim() ||
                !confirmPassword.trim()
              }
            >
              Alterar Senha
            </Button>
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
    maxHeight: '90%',
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
  description: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  requirements: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
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