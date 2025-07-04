import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { Text, Card, Button, List, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import {
  ArrowLeft,
  Trash2,
  TriangleAlert as AlertTriangle,
  Key,
} from 'lucide-react-native';
import ChangePasswordModal from '@/components/ChangePasswordModal';

export default function AccountSettingsScreen() {
  const { profile, signOut } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (!profile) return;

    setDeletingAccount(true);
    try {
      // Excluir conta de usuário (isso excluirá em cascata todos os dados relacionados)
      const { error } = await supabase.auth.admin.deleteUser(profile.id);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Conta Excluída',
        'Sua conta foi excluída com sucesso. Você será redirecionado para a tela inicial.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await signOut();
              router.replace('/');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível excluir a conta. Tente novamente.'
      );
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const handlePasswordChanged = () => {
    Alert.alert(
      'Senha Alterada',
      'Sua senha foi alterada com sucesso. Por segurança, você será redirecionado para fazer login novamente.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.deleteModalContent}>
          <View style={styles.deleteModalHeader}>
            <AlertTriangle size={48} color={theme.colors.error} />
            <Text variant="titleLarge" style={styles.deleteModalTitle}>
              Excluir Conta
            </Text>
          </View>

          <Text variant="bodyLarge" style={styles.deleteModalText}>
            Tem certeza que deseja excluir sua conta permanentemente?
          </Text>

          <Text variant="bodyMedium" style={styles.deleteModalWarning}>
            Esta ação não pode ser desfeita. Todos os seus dados, incluindo:
          </Text>

          <View style={styles.deleteModalList}>
            <Text style={styles.deleteModalListItem}>
              • Perfil e informações pessoais
            </Text>
            <Text style={styles.deleteModalListItem}>
              • Histórico de agendamentos
            </Text>
            <Text style={styles.deleteModalListItem}>
              • Avaliações feitas
            </Text>
          </View>

          <Text variant="bodyMedium" style={styles.deleteModalWarning}>
            Serão permanentemente removidos.
          </Text>

          <View style={styles.deleteModalActions}>
            <Button
              mode="outlined"
              style={styles.deleteModalButton}
              onPress={() => setShowDeleteModal(false)}
              disabled={deletingAccount}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              style={[styles.deleteModalButton, styles.deleteButton]}
              onPress={handleDeleteAccount}
              loading={deletingAccount}
              disabled={deletingAccount}
              buttonColor={theme.colors.error}
            >
              Excluir Conta
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.push('/profile')}
        />
        <Text variant="headlineMedium" style={styles.title}>
          Configurações da Conta
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Segurança */}
        <Card style={styles.securityCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Segurança
            </Text>

            <List.Item
              title="Alterar senha"
              description="Altere sua senha de acesso"
              left={(props) => <Key {...props} color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowChangePasswordModal(true)}
              style={styles.actionItem}
            />
          </Card.Content>
        </Card>

        {/* Ações da conta */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Ações da Conta
            </Text>

            <List.Item
              title="Excluir Conta"
              description="Remover permanentemente sua conta"
              left={(props) => <Trash2 {...props} color={theme.colors.error} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowDeleteModal(true)}
              style={styles.actionItem}
              titleStyle={{ color: theme.colors.error }}
            />
          </Card.Content>
        </Card>

        {/* Futuro - Seção de Ajuda */}
        {/* <Card style={styles.helpCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Precisa de Ajuda?
            </Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              Se você tem dúvidas sobre sua conta ou exclusão de dados, entre em contato conosco.
            </Text>
            <Button
              mode="outlined"
              style={styles.helpButton}
              onPress={() => {}}
            >
              Falar com Suporte
            </Button>
          </Card.Content>
        </Card> */}
      </ScrollView>

      {/* Modals */}
      {renderDeleteModal()}
      
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onPasswordChanged={handlePasswordChanged}
      />
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  securityCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  actionsCard: {
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  actionItem: {
    paddingVertical: spacing.sm,
  },
  helpCard: {
    marginBottom: spacing.lg,
    elevation: 2,
  },
  helpText: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  helpButton: {
    alignSelf: 'flex-start',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Delete modal styles
  deleteModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: spacing.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  deleteModalTitle: {
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  deleteModalText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  deleteModalWarning: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  deleteModalList: {
    marginVertical: spacing.md,
    paddingLeft: spacing.md,
  },
  deleteModalListItem: {
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  deleteModalButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
});