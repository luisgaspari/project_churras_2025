import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, theme } from '@/constants/theme';
import { User, Phone, Mail, MapPin, Settings, LogOut, CreditCard, CircleHelp as HelpCircle } from 'lucide-react-native';

export default function ClientProfileScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
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
          }
        }
      ]
    );
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
              label={profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                {profile?.full_name || 'Usuário'}
              </Text>
              <Text variant="bodyMedium" style={styles.userType}>
                Cliente
              </Text>
            </View>
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

            <Button
              mode="outlined"
              style={styles.editButton}
              onPress={() => {}}
            >
              Editar Perfil
            </Button>
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
              left={(props) => <Settings {...props} color={theme.colors.onSurface} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
              style={styles.menuItem}
            />

            <List.Item
              title="Métodos de pagamento"
              description="Gerenciar cartões e formas de pagamento"
              left={(props) => <CreditCard {...props} color={theme.colors.onSurface} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
              style={styles.menuItem}
            />

            <List.Item
              title="Ajuda e suporte"
              description="Central de ajuda, FAQ e contato"
              left={(props) => <HelpCircle {...props} color={theme.colors.onSurface} />}
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
  userType: {
    color: theme.colors.onSurfaceVariant,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
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
  editButton: {
    marginTop: spacing.md,
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