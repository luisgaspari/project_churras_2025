import React, { useState, useEffect } from 'react';
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
  TextInput,
  Button,
  Card,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import {
  ArrowLeft,
  Camera,
  Plus,
  X,
  MapPin,
  Clock,
  Users,
  DollarSign,
} from 'lucide-react-native';

interface ServiceForm {
  title: string;
  description: string;
  price_from: string;
  price_to: string;
  duration_hours: string;
  max_guests: string;
  location: string;
}

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
}

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, session } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>({
    title: '',
    description: '',
    price_from: '',
    price_to: '',
    duration_hours: '',
    max_guests: '',
    location: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (id) {
      loadService();
    }
  }, [id]);

  const loadService = async () => {
    if (!id) return;

    setLoadingService(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setService(data);
        setForm({
          title: data.title,
          description: data.description,
          price_from: data.price_from.toString(),
          price_to: data.price_to?.toString() || '',
          duration_hours: data.duration_hours.toString(),
          max_guests: data.max_guests.toString(),
          location: data.location,
        });
        setImages(data.images || []);
      }
    } catch (error: any) {
      console.error('Error loading service:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível carregar o serviço.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoadingService(false);
    }
  };

  const handleInputChange = (field: keyof ServiceForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = async () => {
    Alert.alert(
      'Adicionar Imagem',
      'Escolha uma opção para adicionar uma imagem:',
      [
        {
          text: 'Tirar foto',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Escolher da Galeria',
          onPress: () => pickImage('gallery'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
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
      await uploadImage(asset.uri);
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!session?.user) return;
    setUploadingImage(true);

    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${
        session.user.id
      }/services/${new Date().getTime()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('service_images')
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('service_images')
        .getPublicUrl(fileName);

      if (!publicUrlData) {
        throw new Error('Não foi possível obter a URL da imagem.');
      }

      setImages((prev) => [...prev, publicUrlData.publicUrl]);
    } catch (error: any) {
      console.error('Erro ao enviar imagem:', error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar a imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!form.title.trim()) {
      Alert.alert('Erro', 'Por favor, informe o título do serviço.');
      return false;
    }

    if (!form.description.trim()) {
      Alert.alert('Erro', 'Por favor, informe a descrição do serviço.');
      return false;
    }

    if (!form.price_from.trim()) {
      Alert.alert('Erro', 'Por favor, informe o preço inicial.');
      return false;
    }

    if (!form.duration_hours.trim()) {
      Alert.alert('Erro', 'Por favor, informe a duração do serviço.');
      return false;
    }

    if (!form.max_guests.trim()) {
      Alert.alert('Erro', 'Por favor, informe o número máximo de convidados.');
      return false;
    }

    if (!form.location.trim()) {
      Alert.alert('Erro', 'Por favor, informe a localização do serviço.');
      return false;
    }

    const priceFrom = parseFloat(form.price_from);
    const priceTo = form.price_to ? parseFloat(form.price_to) : null;

    if (isNaN(priceFrom) || priceFrom <= 0) {
      Alert.alert('Erro', 'Por favor, informe um preço inicial válido.');
      return false;
    }

    if (priceTo && (isNaN(priceTo) || priceTo <= priceFrom)) {
      Alert.alert('Erro', 'O preço final deve ser maior que o preço inicial.');
      return false;
    }

    const duration = parseInt(form.duration_hours);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Erro', 'Por favor, informe uma duração válida.');
      return false;
    }

    const maxGuests = parseInt(form.max_guests);
    if (isNaN(maxGuests) || maxGuests <= 0) {
      Alert.alert('Erro', 'Por favor, informe um número válido de convidados.');
      return false;
    }

    return true;
  };

  const handleUpdateService = async () => {
    if (!validateForm() || !service) return;

    setLoading(true);
    try {
      const serviceData = {
        title: form.title.trim(),
        description: form.description.trim(),
        price_from: parseFloat(form.price_from),
        price_to: form.price_to ? parseFloat(form.price_to) : null,
        duration_hours: parseInt(form.duration_hours),
        max_guests: parseInt(form.max_guests),
        location: form.location.trim(),
        images,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', service.id);

      if (error) {
        throw error;
      }

      Alert.alert('Sucesso', 'Serviço atualizado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating service:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível atualizar o serviço.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderImageItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.serviceImage} />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => removeImage(index)}
      >
        <X size={16} color={theme.colors.onError} />
      </TouchableOpacity>
    </View>
  );

  if (loadingService) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Carregando serviço...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
            onPress={() => router.back()}
          />
          <Text variant="headlineMedium" style={styles.title}>
            Editar Serviço
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações básicas */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Informações Básicas
            </Text>

            <TextInput
              label="Título do serviço *"
              value={form.title}
              onChangeText={(value) => handleInputChange('title', value)}
              style={styles.input}
              mode="outlined"
              placeholder="Ex: Churrasco Tradicional"
            />

            <TextInput
              label="Descrição *"
              value={form.description}
              onChangeText={(value) => handleInputChange('description', value)}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Descreva seu serviço de churrasco..."
            />

            <View style={styles.inputRow}>
              <MapPin size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                label="Localização *"
                value={form.location}
                onChangeText={(value) => handleInputChange('location', value)}
                style={[styles.input, styles.inputWithIcon]}
                mode="outlined"
                placeholder="Ex: São Paulo, SP"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Preços */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Preços
            </Text>

            <View style={styles.inputRow}>
              <DollarSign size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                label="Preço inicial (R$) *"
                value={form.price_from}
                onChangeText={(value) => handleInputChange('price_from', value)}
                style={[styles.input, styles.inputWithIcon, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                label="Preço final (R$)"
                value={form.price_to}
                onChangeText={(value) => handleInputChange('price_to', value)}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                placeholder="Opcional"
              />
            </View>

            <Text variant="bodySmall" style={styles.helperText}>
              Se você oferece um preço fixo, preencha apenas o preço inicial.
            </Text>
          </Card.Content>
        </Card>

        {/* Detalhes do serviço */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Detalhes do Serviço
            </Text>

            <View style={styles.inputRow}>
              <Clock size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                label="Duração (horas) *"
                value={form.duration_hours}
                onChangeText={(value) =>
                  handleInputChange('duration_hours', value)
                }
                style={[styles.input, styles.inputWithIcon, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                placeholder="4"
              />
              <View style={styles.inputSpacer} />
              <Users size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                label="Máx. convidados *"
                value={form.max_guests}
                onChangeText={(value) => handleInputChange('max_guests', value)}
                style={[styles.input, styles.inputWithIcon, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                placeholder="50"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Imagens */}
        <Card style={styles.section}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Fotos do Serviço
              </Text>
              <Button
                mode="text"
                icon={() => <Plus size={16} color={theme.colors.primary} />}
                onPress={handleAddImage}
                loading={uploadingImage}
                disabled={uploadingImage || images.length >= 5}
              >
                Adicionar
              </Button>
            </View>

            {images.length > 0 ? (
              <FlatList
                data={images}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderImageItem}
                contentContainerStyle={styles.imagesGrid}
              />
            ) : (
              <View style={styles.emptyImagesContainer}>
                <Camera
                  size={48}
                  color={theme.colors.onSurfaceDisabled}
                  style={styles.emptyImagesIcon}
                />
                <Text variant="bodyMedium" style={styles.emptyImagesText}>
                  Nenhuma foto adicionada ainda.
                </Text>
                <Text variant="bodySmall" style={styles.emptyImagesSubtext}>
                  Adicione até 5 fotos para mostrar seu trabalho!
                </Text>
              </View>
            )}

            {uploadingImage && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text variant="bodySmall" style={styles.uploadingText}>
                  Enviando imagem...
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Botão Atualizar */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleUpdateService}
            loading={loading}
            disabled={loading}
            style={styles.updateButton}
          >
            Atualizar Serviço
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.onSurfaceVariant,
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
  section: {
    marginTop: spacing.lg,
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
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  inputWithIcon: {
    marginLeft: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  inputSpacer: {
    width: spacing.md,
  },
  helperText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  imagesGrid: {
    gap: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  serviceImage: {
    width: 120,
    height: 90,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surfaceVariant,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.xs,
    borderRadius: 20,
  },
  emptyImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
  },
  emptyImagesIcon: {
    marginBottom: spacing.md,
  },
  emptyImagesText: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptyImagesSubtext: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  uploadingText: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  buttonContainer: {
    paddingVertical: spacing.xl,
  },
  updateButton: {
    paddingVertical: spacing.sm,
  },
});
