import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import {
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Plus,
} from 'lucide-react-native';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  monthlyRevenue: number;
  averageRating: number;
  totalReviews: number;
}

interface RecentBooking {
  id: string;
  event_date: string;
  event_time: string;
  location: string;
  status: string;
  total_price: number;
  profiles?: {
    full_name: string;
  };
}

export default function ProfessionalHomeScreen() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadDashboardData();
    }
  }, [profile]);

  useFocusEffect(
    React.useCallback(() => {
      if (profile) {
        loadDashboardData();
      }
    }, [profile])
  );

  const loadDashboardData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Carregar reservas para análise
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(
          `
          *,
          profiles!bookings_client_id_fkey (
            full_name
          )
        `
        )
        .eq('professional_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (bookingsError) {
        console.error('Error loading bookings:', bookingsError);
      }

      // Carregar avaliações para cálculo de classificação
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('professional_id', profile.id);

      if (reviewsError) {
        console.error('Error loading reviews:', reviewsError);
      }

      // Calcular estatísticas
      const totalBookings = bookings?.length || 0;
      const pendingBookings =
        bookings?.filter((b) => b.status === 'pending').length || 0;

      // Calcular a receita mensal (mês atual)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const completedBookings =
        bookings?.filter((b) => b.status === 'completed') || [];
      const monthlyRevenue =
        completedBookings
          ?.filter((b) => {
            const bookingDate = new Date(b.event_date);
            return (
              bookingDate.getMonth() === currentMonth &&
              bookingDate.getFullYear() === currentYear
            );
          })
          .reduce((sum, b) => sum + b.total_price, 0) || 0;

      // Calcular a classificação média das avaliações
      const totalReviews = reviews?.length || 0;
      const averageRating =
        totalReviews > 0
          ? (reviews ?? []).reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          : 0;

      setStats({
        totalBookings,
        pendingBookings,
        monthlyRevenue,
        averageRating,
        totalReviews,
      });

      setRecentBookings(bookings || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.tertiary;
      case 'pending':
        return theme.colors.secondary;
      case 'cancelled':
        return theme.colors.error;
      case 'completed':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderBookingCard = (item: RecentBooking) => (
    <Card style={styles.bookingCard} onPress={() => {}}>
      {/* Corrija o problema de overflow/shadow envolvendo o conteúdo em uma View */}
      <View style={{ overflow: 'hidden', borderRadius: 8 }}>
        <Card.Content>
          <View style={styles.bookingHeader}>
            <Text variant="titleMedium" style={styles.clientName}>
              {item.profiles?.full_name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <Text
                variant="bodySmall"
                style={{
                  color: getStatusColor(item.status),
                  marginRight: spacing.xs,
                }}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              />
            </View>
          </View>
          <Text variant="bodyMedium" style={styles.bookingDate}>
            {formatDate(item.event_date)} • {formatTime(item.event_time)}
          </Text>
          <View style={styles.bookingFooter}>
            <Text variant="bodySmall" style={styles.bookingLocation}>
              {item.location}
            </Text>
            <Text variant="titleSmall" style={styles.bookingPrice}>
              R$ {item.total_price}
            </Text>
          </View>
        </Card.Content>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.greeting}>
            Olá, {profile?.full_name?.split(' ')[0]}! 👨‍🍳
          </Text>
          <Text variant="bodyLarge" style={styles.subGreeting}>
            Como estão seus churrascos hoje?
          </Text>
        </View>

        {/* Cartões de estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Calendar size={24} color={theme.colors.primary} />
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.totalBookings}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total de Agendamentos
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <TrendingUp size={24} color={theme.colors.secondary} />
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.pendingBookings}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Pendentes
                </Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <DollarSign size={24} color={theme.colors.tertiary} />
                <Text variant="headlineSmall" style={styles.statNumber}>
                  R$ {stats.monthlyRevenue}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Receita do Mês
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Star size={24} color={theme.colors.tertiary} />
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.totalReviews > 0
                    ? stats.averageRating.toFixed(1)
                    : '--'}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Avaliação Média
                </Text>
                {stats.totalReviews > 0 && (
                  <Text variant="bodySmall" style={styles.statSubLabel}>
                    ({stats.totalReviews}{' '}
                    {stats.totalReviews === 1 ? 'avaliação' : 'avaliações'})
                  </Text>
                )}
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Reservas pendentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Agendamentos Pendentes
            </Text>
            <Button
              mode="text"
              onPress={() => router.push('/(professional)/bookings')}
            >
              Ver todos
            </Button>
          </View>

          {recentBookings.filter((b) => b.status === 'pending').length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Calendar size={48} color={theme.colors.onSurfaceVariant} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  Nenhum agendamento ainda
                </Text>
                <Text variant="bodyMedium" style={styles.emptyDescription}>
                  Quando você receber reservas, elas aparecerão aqui.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.bookingsList}>
              {recentBookings
                .filter((booking) => booking.status === 'pending')
                .map((booking) => (
                  <React.Fragment key={booking.id}>
                    {renderBookingCard(booking)}
                  </React.Fragment>
                ))}
            </View>
          )}
        </View>

        {/* Ações rápidas */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Ações Rápidas
          </Text>

          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              style={styles.actionButton}
              onPress={() => router.push('/(professional)/services/create')}
            >
              Criar Novo Serviço
            </Button>
            <Button
              mode="outlined"
              style={styles.actionButton}
              onPress={() => router.push('/(professional)/analytics')}
            >
              Ver Relatórios
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* <FAB
        icon={() => <Plus size={24} color="white" />}
        style={styles.fab}
        onPress={() => router.push('/(professional)/services/create')}
      /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: spacing.xs,
  },
  subGreeting: {
    color: theme.colors.onSurfaceVariant,
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 130,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statNumber: {
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    color: theme.colors.onSurface,
  },
  statLabel: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  statSubLabel: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  bookingsList: {
    paddingBottom: spacing.lg,
  },
  bookingCard: {
    marginBottom: spacing.sm,
    elevation: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  clientName: {
    marginTop: spacing.xs,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bookingDate: {
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bookingLocation: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  bookingPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.primary,
  },
  emptyCard: {
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: theme.colors.onSurface,
  },
  emptyDescription: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
