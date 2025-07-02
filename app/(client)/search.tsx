import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Searchbar, Card, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { MapPin, Star, Clock, Users, Filter, X } from 'lucide-react-native';

interface Service {
  id: string;
  title: string;
  description: string;
  price_from: number;
  price_to?: number;
  location: string;
  max_guests: number;
  duration_hours: number;
  images: string[];
  professional_id: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  average_rating?: number;
  total_reviews?: number;
}

interface FilterState {
  priceRange: 'all' | 'budget' | 'mid' | 'premium';
  guestCount: 'all' | 'small' | 'medium' | 'large';
  duration: 'all' | 'short' | 'standard' | 'long';
  rating: 'all' | 'high';
}

export default function SearchScreen() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: 'all',
    guestCount: 'all',
    duration: 'all',
    rating: 'all',
  });

  const categories = [
    { key: 'all', label: 'Todos' },
    { key: 'traditional', label: 'Tradicional' },
    { key: 'premium', label: 'Premium' },
    { key: 'vegetarian', label: 'Vegetariano' },
    { key: 'gourmet', label: 'Gourmet' },
  ];

  const priceRanges = [
    { key: 'all', label: 'Todos os preços' },
    { key: 'budget', label: 'Até R$ 500', min: 0, max: 500 },
    { key: 'mid', label: 'R$ 500 - R$ 1000', min: 500, max: 1000 },
    { key: 'premium', label: 'Acima de R$ 1000', min: 1000, max: Infinity },
  ];

  const guestCounts = [
    { key: 'all', label: 'Qualquer quantidade' },
    { key: 'small', label: 'Até 20 pessoas', max: 20 },
    { key: 'medium', label: '20 - 50 pessoas', min: 20, max: 50 },
    { key: 'large', label: 'Mais de 50 pessoas', min: 50 },
  ];

  const durations = [
    { key: 'all', label: 'Qualquer duração' },
    { key: 'short', label: 'Até 3 horas', max: 3 },
    { key: 'standard', label: '3 - 6 horas', min: 3, max: 6 },
    { key: 'long', label: 'Mais de 6 horas', min: 6 },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allServices, searchQuery, selectedCategory, filters]);

  const loadServices = async () => {
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
        .order('created_at', { ascending: false });

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

        setAllServices(servicesWithRatings);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allServices];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.location.toLowerCase().includes(query) ||
          service.profiles?.full_name.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((service) => {
        const title = service.title.toLowerCase();
        const description = service.description.toLowerCase();

        switch (selectedCategory) {
          case 'traditional':
            return (
              title.includes('tradicional') ||
              description.includes('tradicional')
            );
          case 'premium':
            return (
              title.includes('premium') ||
              description.includes('premium') ||
              service.price_from >= 800
            );
          case 'vegetarian':
            return (
              title.includes('vegetariano') ||
              description.includes('vegetariano')
            );
          case 'gourmet':
            return title.includes('gourmet') || description.includes('gourmet');
          default:
            return true;
        }
      });
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const range = priceRanges.find((r) => r.key === filters.priceRange);
      if (range && 'min' in range) {
        filtered = filtered.filter(
          (service) =>
            service.price_from >= (range.min ?? 0) &&
            service.price_from <= (range.max ?? Infinity)
        );
      }
    }

    // Guest count filter
    if (filters.guestCount !== 'all') {
      const guestRange = guestCounts.find((g) => g.key === filters.guestCount);
      if (guestRange && 'max' in guestRange) {
        if ('min' in guestRange) {
          filtered = filtered.filter(
            (service) =>
              service.max_guests >= (guestRange.min ?? 0) &&
              service.max_guests <= (guestRange.max ?? Infinity)
          );
        } else {
          filtered = filtered.filter(
            (service) => service.max_guests <= (guestRange.max ?? Infinity)
          );
        }
      } else if (guestRange && 'min' in guestRange) {
        filtered = filtered.filter(
          (service) => service.max_guests >= (guestRange.min ?? 0)
        );
      }
    }

    // Duration filter
    if (filters.duration !== 'all') {
      const durationRange = durations.find((d) => d.key === filters.duration);
      if (durationRange && 'max' in durationRange) {
        if ('min' in durationRange) {
          filtered = filtered.filter(
            (service) =>
              service.duration_hours >= (durationRange.min ?? 0) &&
              service.duration_hours <= (durationRange.max ?? Infinity)
          );
        } else {
          filtered = filtered.filter(
            (service) =>
              service.duration_hours <= (durationRange.max ?? Infinity)
          );
        }
      } else if (durationRange && 'min' in durationRange) {
        filtered = filtered.filter(
          (service) => service.duration_hours >= (durationRange.min ?? 0)
        );
      }
    }

    // Rating filter
    if (filters.rating === 'high') {
      filtered = filtered.filter(
        (service) =>
          (service.average_rating || 0) >= 4.0 &&
          (service.total_reviews || 0) > 0
      );
    }

    // Sort by rating and reviews
    filtered.sort((a, b) => {
      const aRating = a.average_rating || 0;
      const bRating = b.average_rating || 0;
      const aReviews = a.total_reviews || 0;
      const bReviews = b.total_reviews || 0;

      // First sort by rating
      if (bRating !== aRating) {
        return bRating - aRating;
      }

      // Then by number of reviews
      return bReviews - aReviews;
    });

    setFilteredServices(filtered);
  };

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: 'all',
      guestCount: 'all',
      duration: 'all',
      rating: 'all',
    });
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return (
      filters.priceRange !== 'all' ||
      filters.guestCount !== 'all' ||
      filters.duration !== 'all' ||
      filters.rating !== 'all' ||
      selectedCategory !== 'all' ||
      searchQuery.trim() !== ''
    );
  };

  const formatPrice = (priceFrom: number, priceTo?: number) => {
    if (priceTo && priceTo > priceFrom) {
      return `R$ ${priceFrom} - ${priceTo}`;
    }
    return `A partir de R$ ${priceFrom}`;
  };

  const formatRating = (rating: number, totalReviews: number) => {
    if (totalReviews === 0) {
      return 'Novo';
    }
    return rating.toFixed(1);
  };

  const handleServicePress = (serviceId: string) => {
    router.push({
      pathname: '/(client)/service-details/[id]',
      params: { id: serviceId },
    });
  };

  const renderFilterSection = (
    title: string,
    options: any[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.filterSection}>
      <Text variant="titleSmall" style={styles.filterSectionTitle}>
        {title}
      </Text>
      <View style={styles.filterOptions}>
        {options.map((option) => (
          <Chip
            key={option.key}
            selected={selectedValue === option.key}
            onPress={() => onSelect(option.key)}
            style={styles.filterChip}
            compact
          >
            {option.label}
          </Chip>
        ))}
      </View>
    </View>
  );

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
          <Text variant="headlineMedium" style={styles.title}>
            Buscar Churrasqueiros
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar churrasqueiros, localização..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          <Button
            mode={showFilters ? 'contained' : 'outlined'}
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
            icon={() => (
              <Filter
                size={16}
                color={
                  showFilters ? theme.colors.onPrimary : theme.colors.primary
                }
              />
            )}
            compact
          >
            Filtros
          </Button>
        </View>

        {/* Active Filters Indicator */}
        {hasActiveFilters() && (
          <View style={styles.activeFiltersContainer}>
            <Text variant="bodySmall" style={styles.activeFiltersText}>
              Filtros ativos
            </Text>
            <Button
              mode="text"
              onPress={clearAllFilters}
              style={styles.clearFiltersButton}
              labelStyle={styles.clearFiltersLabel}
              icon={() => <X size={14} color={theme.colors.primary} />}
              compact
            >
              Limpar
            </Button>
          </View>
        )}

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <Chip
              key={category.key}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
              style={styles.categoryChip}
            >
              {category.label}
            </Chip>
          ))}
        </ScrollView>

        {/* Advanced Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text variant="titleMedium" style={styles.filtersTitle}>
              Filtros Avançados
            </Text>

            {renderFilterSection(
              'Faixa de Preço',
              priceRanges,
              filters.priceRange,
              (value) => updateFilter('priceRange', value)
            )}

            {renderFilterSection(
              'Número de Convidados',
              guestCounts,
              filters.guestCount,
              (value) => updateFilter('guestCount', value)
            )}

            {renderFilterSection(
              'Duração do Evento',
              durations,
              filters.duration,
              (value) => updateFilter('duration', value)
            )}

            {renderFilterSection(
              'Avaliação',
              [
                { key: 'all', label: 'Todas as avaliações' },
                { key: 'high', label: '4+ estrelas' },
              ],
              filters.rating,
              (value) => updateFilter('rating', value)
            )}
          </View>
        )}

        {/* Results Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Resultados da busca
            </Text>
            <Text variant="bodyMedium" style={styles.resultsCount}>
              {filteredServices.length}{' '}
              {filteredServices.length === 1 ? 'resultado' : 'resultados'}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text variant="bodyMedium" style={styles.loadingText}>
                Carregando churrasqueiros...
              </Text>
            </View>
          ) : filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                Nenhum churrasqueiro encontrado
              </Text>
              <Text variant="bodyMedium" style={styles.emptyDescription}>
                Tente ajustar os filtros ou buscar por outros termos.
              </Text>
              {hasActiveFilters() && (
                <Button
                  mode="outlined"
                  onPress={clearAllFilters}
                  style={styles.clearFiltersEmptyButton}
                >
                  Limpar filtros
                </Button>
              )}
            </View>
          ) : (
            <View style={styles.servicesList}>
              {filteredServices.map(renderServiceCard)}
            </View>
          )}
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
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchbar: {
    flex: 1,
  },
  filterButton: {
    alignSelf: 'center',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.primaryContainer,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: spacing.sm,
  },
  activeFiltersText: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: '500',
  },
  clearFiltersButton: {
    margin: 0,
  },
  clearFiltersLabel: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryChip: {
    marginRight: spacing.sm,
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: spacing.md,
    elevation: 1,
  },
  filtersTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterSectionTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    marginBottom: spacing.xs,
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
  resultsCount: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
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
    marginBottom: spacing.lg,
  },
  clearFiltersEmptyButton: {
    marginTop: spacing.md,
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
});