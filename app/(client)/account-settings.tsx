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
} from 'lucide-react-native';

interface Subscription {
  id: string;
  plan_type: 'monthly' | 'semestral' | 'annual';
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  amount: number;
  days_remaining: number;
}

interface SubscriptionPlan {
  type: 'monthly' | 'semestral' | 'annual';
  name: string;
  price: number;
  duration: string;
  savings?: string;
  popular?: boolean;
}

export default function AccountSettingsScreen() {
  const { profile, signOut } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.tertiary;
      case 'expired':
        return theme.colors.error;
      case 'cancelled':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
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
              • Serviços cadastrados
            </Text>
            <Text style={styles.deleteModalListItem}>
              • Histórico de agendamentos
            </Text>
            <Text style={styles.deleteModalListItem}>• Fotos e portfólio</Text>
            <Text style={styles.deleteModalListItem}>
              • Avaliações recebidas
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
              Se você tem dúvidas sobre assinatura, cobrança ou exclusão de
              conta, entre em contato conosco.
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
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: spacing.lg,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 500,
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
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
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
