import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  IconButton,
  TextInput,
  RadioButton,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import {
  ArrowLeft,
  Trash2,
  CreditCard,
  Calendar,
  Crown,
  X,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
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

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    type: 'monthly',
    name: 'Mensal',
    price: 30.0,
    duration: '1 mês',
  },
  {
    type: 'semestral',
    name: 'Semestral',
    price: 170.0,
    duration: '6 meses',
    savings: 'Economize R$ 10',
    popular: true,
  },
  {
    type: 'annual',
    name: 'Anual',
    price: 340.0,
    duration: '12 meses',
    savings: 'Economize R$ 20',
  },
];

export default function AccountSettingsScreen() {
  const { profile, signOut } = useAuth();
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Estado do formulário de pagamento
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  useEffect(() => {
    if (profile) {
      loadCurrentSubscription();
    }
  }, [profile]);

  const loadCurrentSubscription = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_current_subscription', {
        professional_uuid: profile.id,
      });

      if (error) {
        console.error('Error loading subscription:', error);
      } else if (data && data.length > 0) {
        setCurrentSubscription(data[0]);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handlePurchaseSubscription = async () => {
    if (!selectedPlan || !profile) return;

    setProcessingPayment(true);
    try {
      // Calcular a data final com base no tipo de plano
      const startDate = new Date();
      const endDate = new Date(startDate);

      switch (selectedPlan.type) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'semestral':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'annual':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      // Cancelar qualquer assinatura ativa existente
      if (currentSubscription) {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', currentSubscription.id);
      }

      // Criar nova assinatura
      const { error } = await supabase.from('subscriptions').insert({
        professional_id: profile.id,
        plan_type: selectedPlan.type,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        amount: selectedPlan.price,
        payment_method: 'Cartão de Crédito',
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Assinatura Ativada!',
        `Sua assinatura ${selectedPlan.name} foi ativada com sucesso. Agora você tem acesso completo à plataforma.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPaymentModal(false);
              setShowSubscriptionModal(false);
              loadCurrentSubscription();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      Alert.alert(
        'Erro no Pagamento',
        error.message ||
          'Não foi possível processar o pagamento. Tente novamente.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'expired':
        return 'Expirada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const renderSubscriptionStatus = () => {
    if (loading) {
      return (
        <Card style={styles.subscriptionCard}>
          <Card.Content style={styles.loadingContent}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Carregando assinatura...
            </Text>
          </Card.Content>
        </Card>
      );
    }

    if (!currentSubscription) {
      return (
        <Card style={styles.subscriptionCard}>
          <Card.Content>
            <View style={styles.noSubscriptionContent}>
              <Crown size={48} color={theme.colors.onSurfaceVariant} />
              <Text variant="titleLarge" style={styles.noSubscriptionTitle}>
                Nenhuma Assinatura Ativa
              </Text>
              <Text
                variant="bodyMedium"
                style={styles.noSubscriptionDescription}
              >
                Assine um de nossos planos para ter acesso completo à plataforma
                e aumentar sua visibilidade.
              </Text>
              <Button
                mode="contained"
                style={styles.subscribeButton}
                onPress={() => setShowSubscriptionModal(true)}
                icon={() => <Crown size={16} color={theme.colors.onPrimary} />}
              >
                Ver Planos
              </Button>
            </View>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.subscriptionCard}>
        <Card.Content>
          <View style={styles.subscriptionHeader}>
            <Text variant="titleLarge" style={styles.subscriptionTitle}>
              Minha Assinatura
            </Text>
            <Chip
              style={[
                styles.statusChip,
                {
                  backgroundColor: `${getStatusColor(
                    currentSubscription.status
                  )}20`,
                },
              ]}
              textStyle={{ color: getStatusColor(currentSubscription.status) }}
            >
              {getStatusLabel(currentSubscription.status)}
            </Chip>
          </View>

          <View style={styles.subscriptionDetails}>
            <View style={styles.planInfoRow}>
              <Text variant="headlineSmall" style={styles.planName}>
                Plano{' '}
                {
                  SUBSCRIPTION_PLANS.find(
                    (p) => p.type === currentSubscription.plan_type
                  )?.name
                }
              </Text>
              <Text variant="titleMedium" style={styles.planPrice}>
                R$ {currentSubscription.amount}
              </Text>
            </View>

            <View style={styles.dateInfo}>
              <View style={styles.dateItem}>
                <Calendar size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.dateText}>
                  Válida até:{' '}
                  {new Date(currentSubscription.end_date).toLocaleDateString(
                    'pt-BR'
                  )}
                </Text>
              </View>

              {currentSubscription.status === 'active' && (
                <View style={styles.dateItem}>
                  <CheckCircle size={16} color={theme.colors.tertiary} />
                  <Text variant="bodyMedium" style={styles.dateText}>
                    {currentSubscription.days_remaining} dias restantes
                  </Text>
                </View>
              )}
            </View>

            {currentSubscription.status === 'active' && (
              <Button
                mode="outlined"
                style={styles.renewButton}
                onPress={() => setShowSubscriptionModal(true)}
              >
                Renovar ou Alterar Plano
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSubscriptionModal = () => (
    <Modal
      visible={showSubscriptionModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSubscriptionModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Escolha seu Plano
            </Text>
            <IconButton
              icon={() => <X size={24} color={theme.colors.onSurface} />}
              onPress={() => setShowSubscriptionModal(false)}
            />
          </View>

          <ScrollView style={styles.plansContainer}>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.type}
                style={[
                  styles.planCard,
                  selectedPlan?.type === plan.type && styles.selectedPlanCard,
                  plan.popular && styles.popularPlanCard,
                ]}
                onPress={() => setSelectedPlan(plan)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MAIS POPULAR</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <RadioButton
                    value={plan.type}
                    status={
                      selectedPlan?.type === plan.type ? 'checked' : 'unchecked'
                    }
                    onPress={() => setSelectedPlan(plan)}
                  />
                  <View style={styles.planInfo}>
                    <Text variant="titleMedium" style={styles.planTitle}>
                      {plan.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.planDuration}>
                      {plan.duration}
                    </Text>
                  </View>
                  <View style={styles.planPricing}>
                    <Text variant="headlineSmall" style={styles.planPriceText}>
                      R$ {plan.price.toFixed(2)}
                    </Text>
                    {plan.savings && (
                      <Text style={styles.planSavings}>{plan.savings}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              style={styles.modalActionButton}
              onPress={() => setShowSubscriptionModal(false)}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              style={styles.modalActionButton}
              onPress={() => {
                if (selectedPlan) {
                  setShowPaymentModal(true);
                }
              }}
              disabled={!selectedPlan}
            >
              Continuar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Dados do Cartão
            </Text>
            <IconButton
              icon={() => <X size={24} color={theme.colors.onSurface} />}
              onPress={() => setShowPaymentModal(false)}
            />
          </View>

          <ScrollView style={styles.paymentForm}>
            {selectedPlan && (
              <Card style={styles.orderSummary}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.orderTitle}>
                    Resumo do Pedido
                  </Text>
                  <View style={styles.orderRow}>
                    <Text variant="bodyMedium">Plano {selectedPlan.name}</Text>
                    <Text variant="titleMedium" style={styles.orderPrice}>
                      R$ {selectedPlan.price.toFixed(2)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}

            <TextInput
              label="Nome no Cartão"
              value={paymentForm.cardholderName}
              onChangeText={(value) =>
                setPaymentForm((prev) => ({ ...prev, cardholderName: value }))
              }
              style={styles.paymentInput}
              mode="outlined"
            />

            <TextInput
              label="Número do Cartão"
              value={paymentForm.cardNumber}
              onChangeText={(value) =>
                setPaymentForm((prev) => ({
                  ...prev,
                  cardNumber: formatCardNumber(value),
                }))
              }
              style={styles.paymentInput}
              mode="outlined"
              keyboardType="numeric"
              maxLength={19}
            />

            <View style={styles.paymentRow}>
              <TextInput
                label="MM/AA"
                value={paymentForm.expiryDate}
                onChangeText={(value) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    expiryDate: formatExpiryDate(value),
                  }))
                }
                style={[styles.paymentInput, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                maxLength={5}
              />

              <TextInput
                label="CVV"
                value={paymentForm.cvv}
                onChangeText={(value) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    cvv: value.replace(/[^0-9]/g, ''),
                  }))
                }
                style={[styles.paymentInput, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              style={styles.modalActionButton}
              onPress={() => setShowPaymentModal(false)}
              disabled={processingPayment}
            >
              Voltar
            </Button>
            <Button
              mode="contained"
              style={styles.modalActionButton}
              onPress={handlePurchaseSubscription}
              loading={processingPayment}
              disabled={processingPayment}
            >
              Finalizar Compra
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

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
          onPress={() => router.back()}
        />
        <Text variant="headlineMedium" style={styles.title}>
          Configurações da Conta
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status da assinatura */}
        {renderSubscriptionStatus()}

        {/* Ações da conta */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Ações da Conta
            </Text>

            <List.Item
              title="Gerenciar Assinatura"
              description="Alterar plano ou renovar assinatura"
              left={(props) => (
                <CreditCard {...props} color={theme.colors.primary} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowSubscriptionModal(true)}
              style={styles.actionItem}
            />

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

        {/* Seção de Ajuda */}
        <Card style={styles.helpCard}>
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
        </Card>
      </ScrollView>

      {/* Modals */}
      {renderSubscriptionModal()}
      {renderPaymentModal()}
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
  subscriptionCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginLeft: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  noSubscriptionContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noSubscriptionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  noSubscriptionDescription: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  subscribeButton: {
    paddingHorizontal: spacing.lg,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  subscriptionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  statusChip: {
    marginLeft: spacing.sm,
  },
  subscriptionDetails: {
    gap: spacing.md,
  },
  planInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  planPrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  dateInfo: {
    gap: spacing.sm,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurface,
  },
  renewButton: {
    marginTop: spacing.md,
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
  plansContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  planCard: {
    borderWidth: 2,
    borderColor: theme.colors.surfaceVariant,
    borderRadius: spacing.md,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedPlanCard: {
    borderColor: theme.colors.primary,
  },
  popularPlanCard: {
    borderColor: theme.colors.tertiary,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: spacing.md,
  },
  popularBadgeText: {
    color: theme.colors.onTertiary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  planInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  planTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  planDuration: {
    color: theme.colors.onSurfaceVariant,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPriceText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  planSavings: {
    color: theme.colors.tertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  modalActionButton: {
    flex: 1,
  },
  // Payment modal styles
  paymentForm: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  orderSummary: {
    marginBottom: spacing.lg,
    backgroundColor: theme.colors.primaryContainer,
  },
  orderTitle: {
    fontWeight: 'bold',
    color: theme.colors.onPrimaryContainer,
    marginBottom: spacing.md,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  paymentInput: {
    marginBottom: spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
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
