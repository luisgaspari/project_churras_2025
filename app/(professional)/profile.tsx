import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Avatar,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
  Trash2,
  CreditCard as Edit,
  Eye,
  Crown,
} from 'lucide-react-native';

interface Photo {
  id: string;
  url: string;
  path: string;
}

interface Service {
  id: string;
  title: string;
}

interface Subscription {
  id: string;
  plan_type: 'monthly' | 'semestral' | 'annual';
  status: 'active' | 'expired' | 'cancelled';
  end_date: string;
  days_remaining: number;
}

export default function ProfessionalProfileScreen() {
  const { profile, signOut, session, refreshProfile } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [reviewsStats, setReviewsStats] = useState({
    totalReviews: 0,
    averageRating: 0,
  });

  const fetchServices = useCallback(async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('services')
      .select('id, title')
      .eq('professional_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Erro ao buscar serviços:', error);
    } else {
      setServices(data || []);
    }
  }, [profile?.id]);

  const fetchReviewsStats = useCallback(async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('professional_id', profile.id);

    if (error) {
      console.error('Erro ao buscar estatísticas de avaliações:', error);
    } else if (data && data.length > 0) {
      const totalReviews = data.length;
      const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / totalReviews;

      setReviewsStats({
        totalReviews,
        averageRating,
      });
    } else {
      setReviewsStats({
        totalReviews: 0,
        averageRating: 0,
      });
    }
  }, [profile?.id]);

  const fetchSubscription = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_current_subscription', {
        professional_uuid: profile.id,
      });

      if (error) {
        console.error('Error loading subscription:', error);
      } else if (data && data.length > 0) {
        setSubscription(data[0]);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      fetchPhotos();
      fetchServices();
      fetchReviewsStats();
      fetchSubscription();
    }
  }, [profile?.id, fetchServices, fetchReviewsStats, fetchSubscription]);

  useFocusEffect(
    useCallback(() => {
      fetchServices();
      fetchReviewsStats();
      fetchSubscription();
    }, [fetchServices, fetchReviewsStats, fetchSubscription])
  );

  const fetchPhotos = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('professional_photos')
      .select('id, photo_url')
      .eq('professional_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar fotos:', error);
      Alert.alert('Erro', 'Não foi possível carregar as fotos.');
    } else {
      const formattedPhotos = data.map((p) => {
        const url = `${p.photo_url}?t=${new Date().getTime()}`;
        const path = p.photo_url.substring(p.photo_url.lastIndexOf('/') + 1);
        return { id: p.id, url, path };
      });
      setPhotos(formattedPhotos);
    }
  };

  const handleAddPhoto = async (source: 'camera' | 'gallery') => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
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

      await uploadPhoto(asset.uri);
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const showAddPhotoOptions = () => {
    Alert.alert(
      'Adicionar Foto',
      'Escolha uma opção para adicionar uma nova foto:',
      [
        {
          text: 'Tirar foto',
          onPress: () => handleAddPhoto('camera'),
        },
        {
          text: 'Escolher da Galeria',
          onPress: () => handleAddPhoto('gallery'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const uploadPhoto = async (uri: string) => {
    if (!session?.user) return;
    setUploading(true);

    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${session.user.id}/${new Date().getTime()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('professional_photos')
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('professional_photos')
        .getPublicUrl(fileName);

      if (!publicUrlData) {
        throw new Error('Não foi possível obter a URL da foto.');
      }

      const { error: dbError } = await supabase
        .from('professional_photos')
        .insert({
          professional_id: session.user.id,
          photo_url: publicUrlData.publicUrl,
        });

      if (dbError) {
        throw dbError;
      }

      Alert.alert('Sucesso', 'Foto adicionada!');
      fetchPhotos();
    } catch (error: any) {
      console.error('Erro ao enviar foto:', error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    Alert.alert(
      'Excluir Foto',
      'Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from storage
              const photoPath = photo.url
                .split('/professional_photos/')[1]
                .split('?')[0];

              // Delete from storage
              const { error: storageError } = await supabase.storage
                .from('professional_photos')
                .remove([photoPath]);

              if (storageError) {
                throw storageError;
              }

              // Delete from database
              const { error: dbError } = await supabase
                .from('professional_photos')
                .delete()
                .eq('id', photo.id);

              if (dbError) {
                throw dbError;
              }

              Alert.alert('Sucesso', 'Foto excluída!');
              setPhotos(photos.filter((p) => p.id !== photo.id));
            } catch (error: any) {
              console.error('Erro ao excluir foto:', error);
              Alert.alert(
                'Erro',
                error.message || 'Não foi possível excluir a foto.'
              );
            }
          },
        },
      ]
    );
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

      // We need to wait a bit for the CDN to update
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

  const handleAvatarPress = () => {
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
          } catch (error: any) {
            Alert.alert(
              'Erro',
              error.message || 'Não foi possível sair da conta'
            );
          }
        },
      },
    ]);
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.tertiary;
      case 'expired':
        return theme.colors.error;
      case 'cancelled':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getSubscriptionStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'expired':
        return 'Expirada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'monthly':
        return 'Mensal';
      case 'semestral':
        return 'Semestral';
      case 'annual':
        return 'Anual';
      default:
        return planType;
    }
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
            {/* <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
            > */}
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
            {/* <View style={styles.avatarEditContainer}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Camera
                    size={16}
                    color={theme.colors.onPrimary}
                    style={styles.avatarEditIcon}
                  />
                )}
              </View> */}
            {/* </TouchableOpacity> */}
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
                  {reviewsStats.totalReviews > 0
                    ? `${reviewsStats.averageRating.toFixed(1)} • ${
                        reviewsStats.totalReviews
                      } ${
                        reviewsStats.totalReviews === 1
                          ? 'avaliação'
                          : 'avaliações'
                      }`
                    : 'Nenhuma avaliação ainda'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Subscription Status */}
        <Card style={styles.subscriptionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Status da Assinatura
              </Text>
              <Crown size={20} color={theme.colors.primary} />
            </View>

            {subscription ? (
              <View style={styles.subscriptionInfo}>
                <View style={styles.subscriptionRow}>
                  <Text variant="bodyMedium" style={styles.subscriptionLabel}>
                    Plano:
                  </Text>
                  <Text variant="titleSmall" style={styles.subscriptionValue}>
                    {getPlanName(subscription.plan_type)}
                  </Text>
                </View>

                <View style={styles.subscriptionRow}>
                  <Text variant="bodyMedium" style={styles.subscriptionLabel}>
                    Status:
                  </Text>
                  <Chip
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: `${getSubscriptionStatusColor(
                          subscription.status
                        )}20`,
                      },
                    ]}
                    textStyle={{
                      color: getSubscriptionStatusColor(subscription.status),
                    }}
                  >
                    {getSubscriptionStatusLabel(subscription.status)}
                  </Chip>
                </View>

                {subscription.status === 'active' && (
                  <View style={styles.subscriptionRow}>
                    <Text variant="bodyMedium" style={styles.subscriptionLabel}>
                      Válida até:
                    </Text>
                    <Text variant="bodyMedium" style={styles.subscriptionValue}>
                      {new Date(subscription.end_date).toLocaleDateString(
                        'pt-BR'
                      )}
                      ({subscription.days_remaining} dias)
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noSubscriptionInfo}>
                <Text variant="bodyMedium" style={styles.noSubscriptionText}>
                  Nenhuma assinatura ativa
                </Text>
              </View>
            )}

            <Button
              mode="contained"
              style={styles.manageSubscriptionButton}
              onPress={() => router.push('/(professional)/account-settings')}
              icon={() => <Crown size={16} color={theme.colors.onPrimary} />}
            >
              {subscription ? 'Gerenciar Assinatura' : 'Assinar Agora'}
            </Button>
          </Card.Content>
        </Card>

        {/* Reviews Card */}
        <Card style={styles.reviewsCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Avaliações dos Clientes
              </Text>
              <Button
                mode="text"
                icon={() => <Eye size={16} color={theme.colors.primary} />}
                onPress={() => router.push('/(professional)/reviews')}
              >
                Ver todas
              </Button>
            </View>

            {reviewsStats.totalReviews > 0 ? (
              <View style={styles.reviewsPreview}>
                <View style={styles.reviewsStats}>
                  <Text variant="displaySmall" style={styles.averageRating}>
                    {reviewsStats.averageRating.toFixed(1)}
                  </Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        color={
                          star <= Math.round(reviewsStats.averageRating)
                            ? theme.colors.tertiary
                            : theme.colors.onSurfaceVariant
                        }
                        fill={
                          star <= Math.round(reviewsStats.averageRating)
                            ? theme.colors.tertiary
                            : 'transparent'
                        }
                      />
                    ))}
                  </View>
                  <Text variant="bodyMedium" style={styles.reviewsCount}>
                    {reviewsStats.totalReviews}{' '}
                    {reviewsStats.totalReviews === 1
                      ? 'avaliação'
                      : 'avaliações'}
                  </Text>
                </View>
                <Button
                  mode="contained"
                  style={styles.viewReviewsButton}
                  onPress={() => router.push('/(professional)/reviews')}
                >
                  Ver Detalhes
                </Button>
              </View>
            ) : (
              <View style={styles.noReviewsContainer}>
                <Star size={48} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.noReviewsText}>
                  Você ainda não tem avaliações.
                </Text>
                <Text variant="bodySmall" style={styles.noReviewsSubtext}>
                  Complete seus primeiros churrascos para receber feedback dos
                  clientes!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Photos */}
        <Card style={styles.photosCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Minhas Fotos
              </Text>
              <Button
                mode="text"
                icon={() => <Plus size={16} color={theme.colors.primary} />}
                onPress={showAddPhotoOptions}
                loading={uploading}
                disabled={uploading}
              >
                Adicionar
              </Button>
            </View>
            {photos.length > 0 ? (
              <FlatList
                data={photos}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: item.url }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePhoto(item)}
                    >
                      <Trash2 size={18} color={theme.colors.onError} />
                    </TouchableOpacity>
                  </View>
                )}
                contentContainerStyle={styles.photosGrid}
              />
            ) : (
              <View style={styles.emptyPhotosContainer}>
                <Camera
                  size={48}
                  color={theme.colors.onSurfaceDisabled}
                  style={styles.emptyPhotosIcon}
                />
                <Text variant="bodyMedium" style={styles.emptyPhotosText}>
                  Nenhuma foto adicionada ainda.
                </Text>
                <Text variant="bodySmall" style={styles.emptyPhotosSubtext}>
                  Adicione fotos para mostrar seu trabalho!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

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
                onPress={() => router.push('/(professional)/services/create')}
              >
                Adicionar
              </Button>
            </View>

            {services.length > 0 ? (
              <View style={styles.servicesGrid}>
                {services.map((service) => (
                  <Chip key={service.id} style={styles.serviceChip}>
                    {service.title}
                  </Chip>
                ))}
              </View>
            ) : (
              <View style={styles.emptyServicesContainer}>
                <Text variant="bodyMedium" style={styles.emptyServicesText}>
                  Nenhum serviço cadastrado ainda.
                </Text>
              </View>
            )}

            <Button
              mode="outlined"
              style={styles.manageButton}
              onPress={() => router.push('/(professional)/services')}
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
                onPress={showAddPhotoOptions}
                loading={uploading}
                disabled={uploading}
              >
                Adicionar Fotos
              </Button>
              <Button
                mode="contained"
                style={styles.profileButton}
                icon={() => <Edit size={16} color={theme.colors.onPrimary} />}
                onPress={() => router.push('/(professional)/edit-profile')}
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
              description="Assinatura, exclusão de conta e preferências"
              left={(props) => (
                <Settings {...props} color={theme.colors.onSurface} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(professional)/account-settings')}
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
  avatarEditContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing.xs,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {},
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
  subscriptionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  subscriptionInfo: {
    marginBottom: spacing.md,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subscriptionLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  subscriptionValue: {
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  statusChip: {
    marginLeft: spacing.sm,
  },
  noSubscriptionInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  noSubscriptionText: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  manageSubscriptionButton: {
    marginTop: spacing.sm,
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
  reviewsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  reviewsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsStats: {
    alignItems: 'center',
    flex: 1,
  },
  averageRating: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  reviewsCount: {
    color: theme.colors.onSurfaceVariant,
  },
  viewReviewsButton: {
    marginLeft: spacing.lg,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noReviewsText: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  noReviewsSubtext: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  photosCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  photosGrid: {
    gap: spacing.sm,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surfaceVariant,
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.xs,
    borderRadius: 20,
  },
  emptyPhotosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
  },
  emptyPhotosIcon: {
    marginBottom: spacing.md,
  },
  emptyPhotosText: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptyPhotosSubtext: {
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
  emptyServicesContainer: {
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  emptyServicesText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
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
