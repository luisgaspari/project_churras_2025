import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Avatar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, theme } from '@/constants/theme';
import {
  ChefHat,
  Phone,
  Mail,
  MapPin,
  Settings,
  LogOut,
  Camera,
  Plus,
  Star,
} from 'lucide-react-native';

export default function ProfessionalProfileScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/');
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível sair da conta');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Meu Perfil
          </Text>
        </View>

        {/* Profile Info */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={80}
              label={profile?.full_name?.charAt(0).toUpperCase() || 'C'}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                {profile?.full_name || 'Churrasqueiro'}
              </Text>
              <View style={styles.userTypeContainer}>
                <ChefHat size={16} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.userType}>
                  Churrasqueiro Profissional
                </Text>
              </View>
              <View style={styles.ratingContainer}>
                <Star size={16} color={theme.colors.tertiary} />
                <Text variant="bodyMedium" style={styles.rating}>
                  4.8 • 124 avaliações
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                87
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Churrascos
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                R$ 12.5k
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Faturamento
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                98%
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Satisfação
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Services */}
        <Card style={styles.servicesCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Meus Serviços
              </Text>
              <Button
                mode="text"
                icon={() => <Plus size={16} color={theme.colors.primary} />}
                onPress={() => {}}
              >
                Adicionar
              </Button>
            </View>

            <View style={styles.servicesGrid}>
              <Chip style={styles.serviceChip}>Churrasco Tradicional</Chip>
              <Chip style={styles.serviceChip}>Churrasco Premium</Chip>
              <Chip style={styles.serviceChip}>Espetinhos</Chip>
            </View>

            <Button
              mode="outlined"
              style={styles.manageButton}
              onPress={() => {}}
            >
              Gerenciar Serviços
            </Button>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Informações Pessoais
            </Text>

            <View style={styles.infoItem}>
              <Mail size={20} color={theme.colors.onSurfaceVariant} />
              <View style={styles.infoContent}>
                <Text variant="bodySmall" style={styles.infoLabel}>
                  E-mail
                </Text>
                <Text variant="bodyMedium" style={styles.infoValue}>
                  {profile?.email || 'Não informado'}
                </Text>
              </View>
            </View>

            {profile?.phone && (
              <View style={styles.infoItem}>
                <Phone size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.infoContent}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    Telefone
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {profile.phone}
                  </Text>
                </View>
              </View>
            )}

            {profile?.location && (
              <View style={styles.infoItem}>
                <MapPin size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.infoContent}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    Localização
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {profile.location}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.profileButtons}>
              <Button
                mode="outlined"
                style={styles.profileButton}
                icon={() => <Camera size={16} color={theme.colors.primary} />}
                onPress={() => {}}
              >
                Adicionar Fotos
              </Button>
              <Button
                mode="contained"
                style={styles.profileButton}
                onPress={() => {}}
              >
                Editar Perfil
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Menu Options */}
        <Card style={styles.menuCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Configurações
            </Text>

            <List.Item
              title="Configurações da conta"
              description="Privacidade, notificações e preferências"
              left={(props) => (
                <Settings {...props} color={theme.colors.onSurface} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
              style={styles.menuItem}
            />

            <List.Item
              title="Sair da conta"
              description="Fazer logout do aplicativo"
              left={(props) => <LogOut {...props} color={theme.colors.error} />}
              onPress={handleSignOut}
              style={styles.menuItem}
              titleStyle={{ color: theme.colors.error }}
            />
          </Card.Content>
        </Card>
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
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  userTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userType: {
    marginLeft: spacing.xs,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  servicesCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  serviceChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  manageButton: {
    marginTop: spacing.sm,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  infoValue: {
    color: theme.colors.onSurface,
  },
  profileButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  profileButton: {
    flex: 1,
  },
  menuCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  menuItem: {
    paddingVertical: spacing.sm,
  },
});
