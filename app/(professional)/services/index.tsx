import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import {
  Plus,
  MapPin,
  Clock,
  Users,
  CreditCard as Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Menu as MenuIcon,
} from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';

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
  created_at: string;
  updated_at: string;
}

export default function ServicesManagementScreen() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadServices();
    }, [profile?.id])
  );

  useEffect(() => {
    if (profile) {
      loadServices();
    }
  }, [profile]);

  const loadServices = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('professional_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading services:', error);
        Alert.alert('Erro', 'Não foi possível carregar os serviços.');
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Erro', 'Não foi possível carregar os serviços.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    Alert.alert(
      'Excluir Serviço',
      'Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId);

              if (error) {
                throw error;
              }

              Alert.alert('Sucesso', 'Serviço excluído com sucesso!');
              loadServices();
            } catch (error: any) {
              console.error('Error deleting service:', error);
              Alert.alert(
                'Erro',
                error.message || 'Não foi possível excluir o serviço.'
              );
            }
          },
        },
      ]
    );
  };

  const formatPrice = (priceFrom: number, priceTo?: number) => {
    if (priceTo && priceTo > priceFrom) {
      return `R$ ${priceFrom} - ${priceTo}`;
    }
    return `A partir de R$ ${priceFrom}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderServiceCard = (item: Service) => (
    <Card key={item.id} style={styles.serviceCard}>
      {item.images && item.images.length > 0 && (
        <Image
          source={{
            uri:
              item.images[0] ||
              'https://images.pexels.com/photos/1482803/pexels-photo-1482803.jpeg?auto=compress&cs=tinysrgb&w=400',
          }}
          style={styles.serviceImage}
        />
      )}
      <Card.Content style={styles.serviceContent}>
        <View style={styles.serviceHeader}>
          <Text variant="titleMedium" style={styles.serviceTitle}>
            {item.title}
          </Text>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon={() => (
                  <MenuIcon size={20} color={theme.colors.onSurface} />
                )}
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                router.push({
                  pathname: '/(professional)/services/edit/[id]',
                  params: { id: item.id },
                });
              }}
              title="Editar"
              leadingIcon={() => (
                <Edit size={20} color={theme.colors.onSurface} />
              )}
            />
            {/* Futuro: Implementar detalhes do serviço de visualização */}
            {/* <Menu.Item
              onPress={() => {
                setMenuVisible(null);
              }}
              title="Visualizar"
              leadingIcon={() => (
                <Eye size={20} color={theme.colors.onSurface} />
              )}
            /> */}
            <Divider />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleDeleteService(item.id);
              }}
              title="Excluir"
              leadingIcon={() => (
                <Trash2 size={20} color={theme.colors.error} />
              )}
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </View>

        <Text variant="bodyMedium" style={styles.serviceDescription}>
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
              {item.duration_hours}h de duração
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Users size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.infoText}>
              Até {item.max_guests} pessoas
            </Text>
          </View>
        </View>

        <View style={styles.serviceFooter}>
          <Text variant="titleMedium" style={styles.servicePrice}>
            {formatPrice(item.price_from, item.price_to)}
          </Text>
          <Text variant="bodySmall" style={styles.serviceDate}>
            Criado em {formatDate(item.created_at)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
            onPress={() => router.back()}
          />
          <Text variant="headlineMedium" style={styles.title}>
            Meus Serviços
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Plus size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nenhum serviço cadastrado
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Crie seu primeiro serviço para começar a receber clientes.
            </Text>
            <Button
              mode="contained"
              style={styles.emptyButton}
              onPress={() => router.push('/services/create')}
            >
              Criar Primeiro Serviço
            </Button>
          </View>
        ) : (
          <View style={styles.servicesList}>
            {services.map(renderServiceCard)}
          </View>
        )}
      </ScrollView>

      {services.length > 0 && (
        <FAB
          icon={() => <Plus size={24} color="white" />}
          style={styles.fab}
          onPress={() => router.push('/services/create')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  servicesList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  serviceCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  serviceImage: {
    width: '100%',
    height: 200,
  },
  serviceContent: {
    padding: spacing.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: spacing.sm,
  },
  serviceDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
    lineHeight: 20,
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
    marginLeft: spacing.sm,
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
  serviceDate: {
    color: theme.colors.onSurfaceVariant,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  emptyDescription: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
