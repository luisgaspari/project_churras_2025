import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  ActivityIndicator,
} from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import RatingStars from './RatingStars';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ReviewsListProps {
  professionalId: string;
  limit?: number;
  showTitle?: boolean;
}

export default function ReviewsList({
  professionalId,
  limit,
  showTitle = true,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [professionalId, limit]);

  const loadReviews = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let query = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          profiles!reviews_client_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setReviews(data || []);

      // Calculate average rating and total reviews
      if (data && data.length > 0) {
        const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / data.length;
        setAverageRating(avgRating);
        setTotalReviews(data.length);
      } else {
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderReviewItem = (item: Review, index: number) => (
    <Card key={item.id} style={[styles.reviewCard, index === 0 && styles.firstReviewCard]}>
      <Card.Content style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <View style={styles.clientInfo}>
            {item.profiles?.avatar_url ? (
              <Avatar.Image
                size={40}
                source={{ uri: item.profiles.avatar_url }}
              />
            ) : (
              <Avatar.Text
                size={40}
                label={item.profiles?.full_name?.charAt(0).toUpperCase() || 'C'}
              />
            )}
            <View style={styles.clientDetails}>
              <Text variant="titleSmall" style={styles.clientName}>
                {item.profiles?.full_name}
              </Text>
              <Text variant="bodySmall" style={styles.reviewDate}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
          <RatingStars rating={item.rating} readonly size={16} />
        </View>

        {item.comment && (
          <Text variant="bodyMedium" style={styles.reviewComment}>
            {item.comment}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderHeader = () => {
    if (!showTitle) return null;

    return (
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Avaliações
        </Text>
        {totalReviews > 0 && (
          <View style={styles.ratingsSummary}>
            <RatingStars rating={averageRating} readonly showHalfStars size={20} />
            <Text variant="titleMedium" style={styles.averageRating}>
              {averageRating.toFixed(1)}
            </Text>
            <Text variant="bodyMedium" style={styles.totalReviews}>
              ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="bodyLarge" style={styles.emptyTitle}>
        Nenhuma avaliação ainda
      </Text>
      <Text variant="bodyMedium" style={styles.emptyDescription}>
        As avaliações dos clientes aparecerão aqui após a conclusão dos serviços.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando avaliações...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {reviews.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.reviewsList}>
          {reviews.map((review, index) => renderReviewItem(review, index))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  ratingsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  averageRating: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  totalReviews: {
    color: theme.colors.onSurfaceVariant,
  },
  reviewsList: {
    paddingHorizontal: spacing.lg,
  },
  reviewCard: {
    marginBottom: spacing.md,
    elevation: 1,
  },
  firstReviewCard: {
    marginTop: 0,
  },
  reviewContent: {
    padding: spacing.md,
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
  reviewComment: {
    color: theme.colors.onSurface,
    lineHeight: 20,
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
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});