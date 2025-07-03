import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { MapPin, Star, Clock, Users } from 'lucide-react-native';

interface Service {
  id: string;
  title: string;
  description: string;
  price_from: number;
  price_to?: number;
  duration_hours: number;
  max_guests: number;
  location: string;
  images: string[];
  professional_id: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  average_rating?: number;
  total_reviews?: number;
}

export default function ClientHomeScreen() {
  const { profile } = useAuth();
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedServices();
  }, []);

  const loadFeaturedServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(
          `
          *,
          profiles (
            full_name,
            avatar_url
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error loading services:', error);
      } else {
        // Load ratings for each service
        const servicesWithRatings = await Promise.all(
          (data || []).map(async (service) => {
            const { data: reviews, error: reviewsError } = await supabase
              .from('reviews')
              .select('rating')
              .eq('professional_id', service.professional_id);

            if (reviewsError) {
              console.error(
                'Error loading reviews for service:',
                service.id,
                reviewsError
              );
              return {
                ...service,
                average_rating: 0,
                total_reviews: 0,
              };
            }

            const totalReviews = reviews?.length || 0;
            const averageRating =
              totalReviews > 0
                ? reviews.reduce((sum, review) => sum + review.rating, 0) /
                  totalReviews
                : 0;

            return {
              ...service,
              average_rating: averageRating,
              total_reviews: totalReviews,
            };
          })
        );

        setFeaturedServices(servicesWithRatings);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceFrom: number, priceTo?: number) => {
    if (priceTo && priceTo > priceFrom) {
      return `R$ ${priceFrom} - ${priceTo}`;
    }
    return `A partir de R$ ${priceFrom}`;
  };

  const formatRating = (rating: number, totalReviews: number) => {
    if (totalReviews === 0) {
      return '5.0';
    }
    return rating.toFixed(1);
  };

  const handleServicePress = (serviceId: string) => {
    router.push({
      pathname: '/(client)/service-details/[id]',
      params: { id: serviceId },
    });
  };

  const renderServiceCard = (item: Service) => (
    <Card
      key={item.id}
      style={styles.serviceCard}
      onPress={() => handleServicePress(item.id)}
    >
      <View style={{ overflow: 'hidden', borderRadius: spacing.md }}>
        {/* Service Image */}
        <Image
          source={{
            uri:
              item.images?.[0] ||
              'https://images.pexels.com/photos/1482803/pexels-photo-1482803.jpeg?auto=compress&cs=tinysrgb&w=800',
          }}
          style={styles.serviceImage}
        />

        <Card.Content style={styles.serviceContent}>
          <Text variant="titleMedium" style={styles.serviceTitle}>
            {item.title}
          </Text>
          <Text
            variant="bodySmall"
            style={styles.serviceDescription}
            numberOfLines={2}
          >
            {item.description}
          </Text>

          <View style={styles.serviceInfo}>
            <View style={styles.infoRow}>
              <MapPin size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.infoText}>
                {item.location}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.infoText}>
                {item.duration_hours}h • até {item.max_guests} pessoas
              </Text>
            </View>
          </View>

          <View style={styles.serviceFooter}>
            <Text variant="titleMedium" style={styles.servicePrice}>
              {formatPrice(item.price_from, item.price_to)}
            </Text>
            <View style={styles.professionalInfo}>
              <Text variant="bodySmall" style={styles.professionalName}>
                {item.profiles?.full_name}
              </Text>
              <View style={styles.rating}>
                <Star
                  size={14}
                  color={
                    item.total_reviews && item.total_reviews > 0
                      ? theme.colors.tertiary
                      : theme.colors.onSurfaceVariant
                  }
                  fill={
                    item.total_reviews && item.total_reviews > 0
                      ? theme.colors.tertiary
                      : 'transparent'
                  }
                />
                <Text variant="bodySmall" style={styles.ratingText}>
                  {formatRating(
                    item.average_rating || 0,
                    item.total_reviews || 0
                  )}
                </Text>
                {item.total_reviews && item.total_reviews > 0 && (
                  <Text variant="bodySmall" style={styles.reviewsCount}>
                    ({item.total_reviews})
                  </Text>
                )}
              </View>
            </View>
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
            Olá, {profile?.full_name?.split(' ')[0]}! 👋
          </Text>
          <Text variant="bodyLarge" style={styles.subGreeting}>
            Que tal um churrasco hoje?
          </Text>
        </View>

        {/* Quick Search */}
        {/* <View style={styles.quickSearchContainer}>
          <Button
            mode="outlined"
            onPress={() => router.push('/(client)/search')}
            style={styles.quickSearchButton}
            contentStyle={styles.quickSearchContent}
          >
            Buscar churrasqueiros...
          </Button>
        </View> */}

        {/* Featured Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Churrasqueiros em destaque
            </Text>
            <Button mode="text" onPress={() => router.push('/(client)/search')}>
              Ver todos
            </Button>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text variant="bodyMedium" style={styles.loadingText}>
                Carregando churrasqueiros...
              </Text>
            </View>
          ) : featuredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                Nenhum churrasqueiro encontrado
              </Text>
              <Text variant="bodyMedium" style={styles.emptyDescription}>
                Novos churrasqueiros aparecerão aqui em breve.
              </Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {featuredServices.map(renderServiceCard)}
            </View>
          )}
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Categorias Populares
          </Text>

          <View style={styles.categoriesGrid}>
            <Card
              style={styles.categoryCard}
              onPress={() => router.push('/(client)/search')}
            >
              <Card.Content style={styles.categoryContent}>
                <Text variant="titleMedium" style={styles.categoryTitle}>
                  🥩 Tradicional
                </Text>
                <Text variant="bodySmall" style={styles.categoryDescription}>
                  Churrasco clássico brasileiro
                </Text>
              </Card.Content>
            </Card>
            <Card
              style={styles.categoryCard}
              onPress={() => router.push('/(client)/search')}
            >
              <Card.Content style={styles.categoryContent}>
                <Text variant="titleMedium" style={styles.categoryTitle}>
                  ⭐ Premium
                </Text>
                <Text variant="bodySmall" style={styles.categoryDescription}>
                  Experiência gastronômica única
                </Text>
              </Card.Content>
            </Card>
          </View>
          <View style={styles.categoriesGrid}>
            <Card
              style={styles.categoryCard}
              onPress={() => router.push('/(client)/search')}
            >
              <Card.Content style={styles.categoryContent}>
                <Text variant="titleMedium" style={styles.categoryTitle}>
                  🥗 Vegetariano
                </Text>
                <Text variant="bodySmall" style={styles.categoryDescription}>
                  Opções vegetarianas deliciosas
                </Text>
              </Card.Content>
            </Card>
            <Card
              style={styles.categoryCard}
              onPress={() => router.push('/(client)/search')}
            >
              <Card.Content style={styles.categoryContent}>
                <Text variant="titleMedium" style={styles.categoryTitle}>
                  👨‍🍳 Gourmet
                </Text>
                <Text variant="bodySmall" style={styles.categoryDescription}>
                  Cortes especiais e técnicas refinadas
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      </ScrollView>
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
  quickSearchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickSearchButton: {
    borderColor: theme.colors.surfaceVariant,
  },
  quickSearchContent: {
    paddingVertical: spacing.md,
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
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
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
  },
  servicesList: {
    paddingBottom: spacing.lg,
  },
  serviceCard: {
    marginBottom: spacing.md,
    elevation: 2,
    borderRadius: spacing.md,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.surfaceVariant,
  },
  serviceContent: {
    padding: spacing.md,
  },
  serviceTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: theme.colors.onSurface,
  },
  serviceDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  serviceInfo: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  professionalInfo: {
    alignItems: 'flex-end',
  },
  professionalName: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  reviewsCount: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    elevation: 1,
  },
  categoryContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  categoryTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  categoryDescription: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
