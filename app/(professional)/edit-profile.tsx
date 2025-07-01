import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  IconButton,
  Avatar,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  ChefHat,
} from 'lucide-react-native';

interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
  location: string;
}

export default function EditProfessionalProfileScreen() {
  const { profile, session, refreshProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    full_name: '',
    email: '',
    phone: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      const initialForm = {
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
      };
      setForm(initialForm);
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileForm, value: string) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Check if there are changes compared to original profile
      const hasFormChanges = 
        newForm.full_name !== (profile?.full_name || '') ||
        newForm.email !== (profile?.email || '') ||
        newForm.phone !== (profile?.phone || '') ||
        newForm.location !== (profile?.location || '');
      
      setHasChanges(hasFormChanges);
      return newForm;
    });
  };

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
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permissão necessária',
              'É necessário permitir o acesso à câmera para tirar uma foto.'
            );
            return;
          }
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permissão necessária',
              'É necessário permitir o acesso à galeria para escolher uma foto.'
            );
            return;
          }
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

      // Wait for CDN to update
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
      Alert.alert('Sucesso', 'Foto do perfil atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível atualizar a foto do perfil.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'web') {
      // On web, only show gallery option
      handleUpdateAvatar('gallery');
    } else {
      Alert.alert(
        'Alterar foto do perfil',
        'Escolha uma opção para alterar seu avatar:',
        [
          {
            text: 'Tirar foto',
            onPress: () => handleUpdateAvatar('camera'),
          },
          {
            text: 'Escolher da Galeria',
            onPress: () => handleUpdateAvatar('gallery'),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const validateForm = (): boolean => {
    if (!form.full_name.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu nome completo.');
      return false;
    }

    if (!form.email.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu e-mail.');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert('Erro', 'Por favor, informe um e-mail válido.');
      return false;
    }

    if (!form.phone.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu telefone para contato com clientes.');
      return false;
    }

    if (!form.location.trim()) {
      Alert.alert('Erro', 'Por favor, informe sua localização de atendimento.');
      return false;
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm() || !profile) return;

    setLoading(true);
    try {
      const updateData = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      await refreshProfile();
      setHasChanges(false);
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível atualizar o perfil.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja descartar as alterações?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={handleGoBack}
        />
        <Text variant="headlineMedium" style={styles.title}>
          Editar Perfil
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <Card style={styles.avatarCard}>
          <Card.Content style={styles.avatarContent}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              style={styles.avatarContainer}
            >
              {profile?.avatar_url ? (
                <Avatar.Image
                  size={100}
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={100}
                  label={profile?.full_name?.charAt(0).toUpperCase() || 'C'}
                  style={styles.avatar}
                />
              )}
              <View style={styles.avatarEditContainer}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <Camera
                    size={20}
                    color={theme.colors.onPrimary}
                  />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.professionalBadge}>
              <ChefHat size={16} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.professionalText}>
                Churrasqueiro Profissional
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.avatarHint}>
              Toque para alterar a foto
            </Text>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Informações Profissionais
            </Text>

            <View style={styles.inputContainer}>
              <User size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                label="Nome completo *"
                value={form.full_name}
                onChangeText={(value) => handleInputChange('full_name', value)}
                style={[styles.input, styles.inputWithIcon]}
                mode="outlined"
                placeholder="Seu nome completo"
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                label="E-mail *"
                value={form.email}
                onChangeText={(value) => handleInputChange('email', value)}
                style={[styles.input, styles.inputWithIcon]}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="seu@email.com"
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                label="Telefone *"
                value={form.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                style={[styles.input, styles.inputWithIcon]}
                mode="outlined"
                keyboardType="phone-pad"
                placeholder="(11) 99999-9999"
              />
            </View>

            <View style={styles.inputContainer}>
              <MapPin size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                label="Localização de atendimento *"
                value={form.location}
                onChangeText={(value) => handleInputChange('location', value)}
                style={[styles.input, styles.inputWithIcon]}
                mode="outlined"
                placeholder="Cidade, Estado ou região de atendimento"
              />
            </View>

            <Text variant="bodySmall" style={styles.requiredNote}>
              * Campos obrigatórios
            </Text>
            
            <Text variant="bodySmall" style={styles.professionalNote}>
              💡 Mantenha suas informações atualizadas para que os clientes possam entrar em contato facilmente.
            </Text>
          </Card.Content>
        </Card>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSaveProfile}
            loading={loading}
            disabled={loading || !hasChanges}
            style={styles.saveButton}
            icon={() => <Save size={20} color={theme.colors.onPrimary} />}
          >
            Salvar Alterações
          </Button>
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
    width: 48, // Same width as IconButton
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  avatarCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  avatarContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  avatarEditContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    padding: spacing.sm,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  professionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.lg,
    marginBottom: spacing.sm,
  },
  professionalText: {
    marginLeft: spacing.xs,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  avatarHint: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
  },
  inputWithIcon: {
    marginLeft: spacing.md,
  },
  requiredNote: {
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  professionalNote: {
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.md,
    lineHeight: 18,
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  buttonContainer: {
    paddingVertical: spacing.xl,
  },
  saveButton: {
    paddingVertical: spacing.sm,
  },
});