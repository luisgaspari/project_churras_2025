import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { Star, MessageSquare, Calendar, TrendingUp } from 'lucide-react-native';
import RatingStars from '@/components/RatingStars';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  booking_id: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
  bookings: {
    event_date: string;
    services: {
      title: string;
    };
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function ProfessionalReviewsScreen() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile) {
      loadReviews();
    }
  }, [profile]);

  const loadReviews = async (isRefresh = false) => {
    if (!profile) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          booking_id,
          profiles!reviews_client_id_fkey (
            full_name,
            avatar_url
          ),
          bookings (
            event_date,
            services (
              title
            )
          )
        `
        )
        .eq('professional_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const mappedReviews =
        (data || []).map((review: any) => ({
          ...review,
          profiles: Array.isArray(review.profiles)
            ? review.profiles[0]
            : review.profiles,
          bookings: Array.isArray(review.bookings)
            ? {
                ...review.bookings[0],
                services: Array.isArray(review.bookings[0]?.services)
                  ? review.bookings[0]?.services[0]
                  : review.bookings[0]?.services,
              }
            : review.bookings,
        })) || [];
      setReviews(mappedReviews);
      calculateStats(mappedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (reviewsData: Review[]) => {
    const totalReviews = reviewsData.length;

    if (totalReviews === 0) {
      setStats({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
      return;
    }

    const totalRating = reviewsData.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating = totalRating / totalReviews;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach((review) => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    setStats({
      totalReviews,
      averageRating,
      ratingDistribution,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRatingPercentage = (count: number) => {
    return stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
  };

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.statsTitle}>
          Resumo das Avaliações
        </Text>

        <View style={styles.overallRating}>
          <View style={styles.ratingDisplay}>
            <Text variant="displaySmall" style={styles.averageRating}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <RatingStars
              rating={stats.averageRating}
              readonly
              showHalfStars
              size={20}
            />
            <Text variant="bodyMedium" style={styles.totalReviews}>
              {stats.totalReviews}{' '}
              {stats.totalReviews === 1 ? 'avaliação' : 'avaliações'}
            </Text>
          </View>

          <View style={styles.ratingDistribution}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <View key={rating} style={styles.ratingRow}>
                <Text variant="bodyMedium" style={styles.ratingLabel}>
                  {rating}
                </Text>
                <Star
                  size={16}
                  color={theme.colors.tertiary}
                  fill={theme.colors.tertiary}
                />
                <View style={styles.ratingBar}>
                  <View
                    style={[
                      styles.ratingBarFill,
                      {
                        width: `${getRatingPercentage(
                          stats.ratingDistribution[
                            rating as keyof typeof stats.ratingDistribution
                          ]
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text variant="bodySmall" style={styles.ratingCount}>
                  {
                    stats.ratingDistribution[
                      rating as keyof typeof stats.ratingDistribution
                    ]
                  }
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderReviewCard = (review: Review) => (
    <Card key={review.id} style={styles.reviewCard}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <View style={styles.clientInfo}>
            {review.profiles?.avatar_url ? (
              <Avatar.Image
                size={48}
                source={{ uri: review.profiles.avatar_url }}
              />
            ) : (
              <Avatar.Text
                size={48}
                label={
                  review.profiles?.full_name?.charAt(0).toUpperCase() || 'C'
                }
              />
            )}
            <View style={styles.clientDetails}>
              <Text variant="titleMedium" style={styles.clientName}>
                {review.profiles?.full_name}
              </Text>
              <Text variant="bodySmall" style={styles.reviewDate}>
                {formatDate(review.created_at)}
              </Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <RatingStars rating={review.rating} readonly size={18} />
          </View>
        </View>

        <View style={styles.serviceInfo}>
          <Calendar size={16} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={styles.serviceText}>
            {review.bookings?.services?.title} •{' '}
            {formatDate(review.bookings?.event_date)}
          </Text>
        </View>

        {review.comment && (
          <View style={styles.commentSection}>
            <MessageSquare size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.comment}>
              "{review.comment}"
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Star size={64} color={theme.colors.onSurfaceVariant} />
      <Text variant="titleLarge" style={styles.emptyTitle}>
        Nenhuma avaliação ainda
      </Text>
      <Text variant="bodyMedium" style={styles.emptyDescription}>
        Quando você concluir seus primeiros churrascos, as avaliações dos
        clientes aparecerão aqui.
      </Text>
      <View style={styles.emptyTips}>
        <Text variant="titleMedium" style={styles.tipsTitle}>
          Dicas para receber boas avaliações:
        </Text>
        <Text variant="bodyMedium" style={styles.tipItem}>
          • Seja pontual e profissional.
        </Text>
        <Text variant="bodyMedium" style={styles.tipItem}>
          • Mantenha a qualidade da comida.
        </Text>
        <Text variant="bodyMedium" style={styles.tipItem}>
          • Comunique-se bem com os clientes.
        </Text>
        <Text variant="bodyMedium" style={styles.tipItem}>
          • Mantenha o ambiente limpo e organizado.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Minhas Avaliações
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadReviews(true)}
            colors={[theme.colors.primary]}
          />
        }
      >
        {stats.totalReviews > 0 && renderStatsCard()}

        {reviews.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.reviewsList}>
            <View style={styles.reviewsHeader}>
              <Text variant="titleLarge" style={styles.reviewsTitle}>
                Avaliações Recentes
              </Text>
              <Chip
                icon={() => (
                  <TrendingUp size={16} color={theme.colors.primary} />
                )}
                style={styles.reviewsChip}
              >
                {reviews.length} avaliações
              </Chip>
            </View>

            {reviews.map(renderReviewCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  statsCard: {
    marginBottom: spacing.lg,
    elevation: 2,
  },
  statsTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  overallRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  averageRating: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.sm,
  },
  totalReviews: {
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  ratingDistribution: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingLabel: {
    width: 12,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: theme.colors.tertiary,
    borderRadius: 4,
  },
  ratingCount: {
    width: 20,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  reviewsList: {
    paddingBottom: spacing.xl,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  reviewsTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  reviewsChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  reviewCard: {
    marginBottom: spacing.md,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  clientName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  reviewDate: {
    color: theme.colors.onSurfaceVariant,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: spacing.sm,
  },
  serviceText: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurface,
  },
  commentSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  comment: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurface,
    lineHeight: 20,
    flex: 1,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  emptyTips: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.lg,
    borderRadius: spacing.md,
    width: '100%',
  },
  tipsTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  tipItem: {
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});
