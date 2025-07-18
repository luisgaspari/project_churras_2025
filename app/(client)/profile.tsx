import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import {
  Phone,
  Mail,
  MapPin,
  Settings,
  LogOut,
  CreditCard as Edit,
  HelpCircle,
  CreditCard,
} from 'lucide-react-native';
import FutureImplementationAlert from '@/components/FutureImplementationAlert';

export default function ClientProfileScreen() {
  const { profile, signOut, session, refreshProfile } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleUpdateAvatar = async (source: 'camera' | 'gallery') => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'É necessário permitir o acesso à câmera para tirar uma foto.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'É necessário permitir o acesso à galeria para escolher uma foto.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const fileSize = asset.fileSize || 0;

      if (fileSize > 50 * 1024 * 1024) {
        Alert.alert(
          'Arquivo muito grande',
          'O tamanho da imagem não pode exceder 50MB.'
        );
        return;
      }

      await uploadAvatar(asset.uri);
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!session?.user) return;
    setUploadingAvatar(true);

    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${session.user.id}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (!publicUrlData) {
        throw new Error('Não foi possível obter a URL pública do avatar.');
      }

      const finalUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalUrl })
        .eq('id', session.user.id);

      if (dbError) {
        throw dbError;
      }

      await refreshProfile();
      Alert.alert('Sucesso', 'Avatar atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível atualizar o avatar.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            // Navegue até a tela de boas-vindas onde o usuário
            // pode escolher o tipo de usuário
            router.replace('../');
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

        {/* Informações do perfil */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            {profile?.avatar_url ? (
              <Avatar.Image
                size={80}
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={80}
                label={profile?.full_name?.charAt(0).toUpperCase() || 'C'}
                style={styles.avatar}
              />
            )}

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

        {/* Informações pessoais */}
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
              mode="contained"
              style={styles.editButton}
              icon={() => <Edit size={16} color={theme.colors.onPrimary} />}
              onPress={() => router.push('/(client)/edit-profile')}
            >
              Editar Perfil
            </Button>
          </Card.Content>
        </Card>

        {/* Opções de menu */}
        <Card style={styles.menuCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Configurações
            </Text>

            <List.Item
              title="Configurações da conta"
              description="Excluir conta"
              left={(props) => (
                <Settings {...props} color={theme.colors.onSurface} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(client)/account-settings')}
              style={styles.menuItem}
            />

            {/* Futuro - Ajuda e Suporte */}
            <List.Item
              title="Ajuda e suporte"
              description="Central de ajuda, FAQ e contato"
              left={(props) => (
                <HelpCircle {...props} color={theme.colors.onSurface} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              // onPress={() => {}}
              onPress={() => FutureImplementationAlert()}
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
