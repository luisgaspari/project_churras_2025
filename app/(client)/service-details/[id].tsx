import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Avatar,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Star,
  Phone,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Send,
} from 'lucide-react-native';
import ReviewsList from '@/components/ReviewsList';

const { width: screenWidth } = Dimensions.get('window');

interface Service {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  price_from: number;
  price_to?: number;
  duration_hours: number;
  max_guests: number;
  location: string;
  images: string[];
  profiles?: {
    full_name: string;
    avatar_url?: string;
    phone?: string;
    email: string;
  };
}

interface ProfessionalPhoto {
  id: string;
  photo_url: string;
  created_at: string;
}

interface BookingForm {
  event_date: Date;
  event_time: Date;
  guests_count: string;
  location: string;
  notes: string;
}

export default function ServiceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [professionalPhotos, setProfessionalPhotos] = useState<
    ProfessionalPhoto[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [bookingForm, setBookingForm] = useState<BookingForm>({
    event_date: new Date(),
    event_time: new Date(),
    guests_count: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      loadService();
    }
  }, [id]);

  const loadService = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select(
          `
          *,
          profiles (
            full_name,
            avatar_url,
            phone,
            email
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setService(data);

      // Pré-preencher o local com o local do serviço
      setBookingForm((prev) => ({
        ...prev,
        location: data.location,
      }));

      // Carregar fotos e avaliações profissionais
      if (data.professional_id) {
        loadProfessionalPhotos(data.professional_id);
        loadProfessionalRating(data.professional_id);
      }
    } catch (error: any) {
      console.error('Error loading service:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível carregar o serviço.',
        [
          {
            text: 'OK',
            onPress: () => handleGoBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionalPhotos = async (professionalId: string) => {
    setLoadingPhotos(true);
    try {
      const { data, error } = await supabase
        .from('professional_photos')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading professional photos:', error);
      } else {
        setProfessionalPhotos(data || []);
      }
    } catch (error) {
      console.error('Error loading professional photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const loadProfessionalRating = async (professionalId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('professional_id', professionalId);

      if (error) {
        console.error('Error loading reviews:', error);
      } else if (data && data.length > 0) {
        const totalRating = data.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const avgRating = totalRating / data.length;
        setAverageRating(avgRating);
        setTotalReviews(data.length);
      }
    } catch (error) {
      console.error('Error loading professional rating:', error);
    }
  };

  const handleGoBack = () => {
    // Verifique se podemos voltar na pilha de navegação
    if (router.canGoBack()) {
      router.back();
    } else {
      // Se não houver histórico de navegação, vá para a página inicial do cliente
      router.replace('../(client)');
    }
  };

  const formatPrice = (priceFrom: number, priceTo?: number) => {
    if (priceTo && priceTo > priceFrom) {
      return `R$ ${priceFrom} - ${priceTo}`;
    }
    return `A partir de R$ ${priceFrom}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleInputChange = (
    field: keyof BookingForm,
    value: string | Date
  ) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  };

  const openGallery = (index: number = 0) => {
    setSelectedPhotoIndex(index);
    setShowGalleryModal(true);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedPhotoIndex((prev) =>
        prev > 0 ? prev - 1 : professionalPhotos.length - 1
      );
    } else {
      setSelectedPhotoIndex((prev) =>
        prev < professionalPhotos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handlePhoneCall = () => {
    if (!service?.profiles?.phone) {
      Alert.alert('Erro', 'Número de telefone não disponível.');
      return;
    }

    const phoneNumber = service.profiles.phone.replace(/\D/g, '');
    const phoneUrl = `tel:${phoneNumber}`;

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert(
            'Erro',
            'Não foi possível abrir o aplicativo de telefone.'
          );
        }
      })
      .catch((error) => {
        console.error('Error opening phone app:', error);
        Alert.alert('Erro', 'Não foi possível fazer a ligação.');
      });
  };

  const handleWhatsAppMessage = () => {
    if (!service?.profiles?.phone) {
      Alert.alert('Erro', 'Número de telefone não disponível.');
      return;
    }

    const phoneNumber = service.profiles.phone.replace(/\D/g, '');
    const message = `Olá ${service.profiles.full_name}! Vi seu serviço "${service.title}" no ChurrasJa e gostaria de saber mais informações.`;
    const whatsappUrl = `whatsapp://send?phone=55${phoneNumber}&text=${encodeURIComponent(
      message
    )}`;
    const whatsappWebUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Retorno ao WhatsApp Web
          return Linking.openURL(whatsappWebUrl);
        }
      })
      .catch((error) => {
        console.error('Error opening WhatsApp:', error);
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
      });
  };

  const handleEmailMessage = () => {
    if (!service?.profiles?.email) {
      Alert.alert('Erro', 'E-mail não disponível.');
      return;
    }

    const subject = `Interesse no serviço: ${service.title}`;
    const body = `Olá ${service.profiles.full_name}!\n\nVi seu serviço "${service.title}" no ChurrasJa e gostaria de saber mais informações.\n\nAguardo seu retorno.\n\nAtenciosamente,\n${profile?.full_name}`;
    const emailUrl = `mailto:${
      service.profiles.email
    }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(emailUrl);
        } else {
          Alert.alert('Erro', 'Não foi possível abrir o aplicativo de e-mail.');
        }
      })
      .catch((error) => {
        console.error('Error opening email app:', error);
        Alert.alert('Erro', 'Não foi possível enviar o e-mail.');
      });
  };

  const showContactOptions = () => {
    const options = [
      {
        title: 'WhatsApp',
        description: 'Conversar pelo WhatsApp',
        onPress: handleWhatsAppMessage,
        available: !!service?.profiles?.phone,
      },
      {
        title: 'Telefone',
        description: 'Fazer uma ligação',
        onPress: handlePhoneCall,
        available: !!service?.profiles?.phone,
      },
      {
        title: 'E-mail',
        description: 'Enviar um e-mail',
        onPress: handleEmailMessage,
        available: !!service?.profiles?.email,
      },
    ];

    const availableOptions = options.filter((option) => option.available);

    if (availableOptions.length === 0) {
      Alert.alert('Erro', 'Nenhuma forma de contato disponível.');
      return;
    }

    Alert.alert(
      'Entrar em Contato',
      'Escolha como deseja entrar em contato com o churrasqueiro:',
      [
        ...availableOptions.map((option) => ({
          text: option.title,
          onPress: option.onPress,
        })),
        {
          text: 'Cancelar',
          style: 'cancel' as const,
        },
      ]
    );
  };

  const validateBookingForm = (): boolean => {
    if (!bookingForm.guests_count.trim()) {
      Alert.alert('Erro', 'Por favor, informe o número de convidados.');
      return false;
    }

    if (!bookingForm.location.trim()) {
      Alert.alert('Erro', 'Por favor, informe o local do evento.');
      return false;
    }

    const guestsCount = parseInt(bookingForm.guests_count);
    if (isNaN(guestsCount) || guestsCount <= 0) {
      Alert.alert('Erro', 'Por favor, informe um número válido de convidados.');
      return false;
    }

    if (service && guestsCount > service.max_guests) {
      Alert.alert(
        'Erro',
        `Este serviço atende no máximo ${service.max_guests} pessoas.`
      );
      return false;
    }

    // Verifique se a data está no futuro
    const eventDateTime = new Date(bookingForm.event_date);
    eventDateTime.setHours(
      bookingForm.event_time.getHours(),
      bookingForm.event_time.getMinutes()
    );

    if (eventDateTime <= new Date()) {
      Alert.alert('Erro', 'Por favor, selecione uma data e hora futuras.');
      return false;
    }

    return true;
  };

  const calculateTotalPrice = (): number => {
    if (!service) return 0;

    const guestsCount = parseInt(bookingForm.guests_count) || 0;
    // Cálculo simples: preço base + custo adicional por convidado acima do mínimo
    const basePrice = service.price_from;
    const additionalGuests = Math.max(0, guestsCount - 10); // O preço base cobre 10 convidados
    const additionalCost = additionalGuests * 20; // R$ 20 por convidado adicional

    return basePrice + additionalCost;
  };

  const handleCreateBooking = async () => {
    if (!validateBookingForm() || !service || !profile) return;

    setBookingLoading(true);
    try {
      const eventDateTime = new Date(bookingForm.event_date);
      const timeString = `${bookingForm.event_time
        .getHours()
        .toString()
        .padStart(2, '0')}:${bookingForm.event_time
        .getMinutes()
        .toString()
        .padStart(2, '0')}:00`;

      const bookingData = {
        client_id: profile.id,
        professional_id: service.professional_id,
        service_id: service.id,
        event_date: eventDateTime.toISOString().split('T')[0],
        event_time: timeString,
        guests_count: parseInt(bookingForm.guests_count),
        location: bookingForm.location.trim(),
        total_price: calculateTotalPrice(),
        notes: bookingForm.notes.trim() || null,
        status: 'pending',
      };

      const { error } = await supabase.from('bookings').insert(bookingData);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Sucesso',
        'Sua solicitação foi enviada! O churrasqueiro entrará em contato em breve.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowBookingForm(false);
              // Atualiza a página de bookings ao navegar
              router.push({
                pathname: '/(client)/bookings',
                params: { refresh: Date.now().toString() },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert('Erro', error.message || 'Não foi possível criar a reserva.');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderProfessionalPhotos = () => {
    return (
      <Card style={styles.galleryCard}>
        <Card.Content>
          <View style={styles.galleryHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Portfólio do Churrasqueiro
            </Text>
            {professionalPhotos.length > 0 && (
              <Button
                mode="text"
                onPress={() => openGallery(0)}
                labelStyle={styles.viewAllLabel}
              >
                Ver todas ({professionalPhotos.length})
              </Button>
            )}
          </View>

          {loadingPhotos ? (
            <View style={styles.loadingPhotosContainer}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text variant="bodySmall" style={styles.loadingPhotosText}>
                Carregando fotos...
              </Text>
            </View>
          ) : professionalPhotos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.professionalGallery}
            >
              {professionalPhotos.slice(0, 6).map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  onPress={() => openGallery(index)}
                >
                  <Image
                    source={{ uri: photo.photo_url }}
                    style={styles.professionalPhoto}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyGalleryContainer}>
              <Camera size={48} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={styles.emptyGalleryText}>
                Nenhuma foto disponível
              </Text>
              <Text variant="bodySmall" style={styles.emptyGallerySubtext}>
                O churrasqueiro ainda não adicionou fotos do seu trabalho.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
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

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="titleMedium" style={styles.errorText}>
            Serviço não encontrado
          </Text>
          <Button mode="contained" onPress={handleGoBack}>
            Voltar
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.replace('/(client)')}
        />
        <Text variant="headlineMedium" style={styles.title}>
          Detalhes do Serviço
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Imagem Temporária */}
        {service.images && service.images.length > 0 && (
          <Image
            source={{
              uri:
                service.images[0] ||
                'https://images.pexels.com/photos/1482803/pexels-photo-1482803.jpeg?auto=compress&cs=tinysrgb&w=800',
            }}
            style={styles.heroImage}
          />
        )}

        {/* Informações de serviço */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.serviceTitle}>
              {service.title}
            </Text>

            <View style={styles.priceContainer}>
              <Text variant="headlineMedium" style={styles.servicePrice}>
                {formatPrice(service.price_from, service.price_to)}
              </Text>
              <View style={styles.rating}>
                <Star size={20} color={theme.colors.tertiary} />
                <Text variant="titleMedium" style={styles.ratingText}>
                  {totalReviews > 0 ? averageRating.toFixed(1) : 'Novo'}
                </Text>
                <Text variant="bodyMedium" style={styles.reviewsText}>
                  ({totalReviews}{' '}
                  {totalReviews === 1 ? 'avaliação' : 'avaliações'})
                </Text>
              </View>
            </View>

            <Text variant="bodyLarge" style={styles.serviceDescription}>
              {service.description}
            </Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <MapPin size={20} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {service.location}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Clock size={20} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {service.duration_hours} horas de duração
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Users size={20} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.detailText}>
                  Até {service.max_guests} pessoas
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Informações do profissional */}
        <Card style={styles.professionalCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Churrasqueiro
            </Text>

            <View style={styles.professionalInfo}>
              {service.profiles?.avatar_url ? (
                <Avatar.Image
                  size={60}
                  source={{ uri: service.profiles.avatar_url }}
                />
              ) : (
                <Avatar.Text
                  size={60}
                  label={
                    service.profiles?.full_name?.charAt(0).toUpperCase() || 'C'
                  }
                />
              )}

              <View style={styles.professionalDetails}>
                <Text variant="titleMedium" style={styles.professionalName}>
                  {service.profiles?.full_name}
                </Text>
                <Text variant="bodyMedium" style={styles.professionalTitle}>
                  Churrasqueiro Profissional
                </Text>
                <View style={styles.professionalRating}>
                  <Star size={16} color={theme.colors.tertiary} />
                  <Text
                    variant="bodySmall"
                    style={styles.professionalRatingText}
                  >
                    {totalReviews > 0 ? averageRating.toFixed(1) : 'Novo'} •{' '}
                    {totalReviews} churrascos realizados
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.contactButtons}>
              {service.profiles?.phone && (
                <Button
                  mode="outlined"
                  icon={() => <Phone size={16} color={theme.colors.primary} />}
                  style={styles.contactButton}
                  onPress={handlePhoneCall}
                >
                  Ligar
                </Button>
              )}
              <Button
                mode="outlined"
                icon={() => <Send size={16} color={theme.colors.primary} />}
                style={styles.contactButton}
                onPress={showContactOptions}
              >
                Mensagem
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Seção de avaliações */}
        <Card style={styles.reviewsCard}>
          <Card.Content>
            <ReviewsList
              professionalId={service.professional_id}
              limit={3}
              showTitle={true}
            />
            {totalReviews > 3 && (
              <Button
                mode="text"
                style={styles.viewAllReviewsButton}
                onPress={() => {
                  // Navegar para a tela de avaliações completas
                  // router.push(`/reviews/${service.professional_id}`);
                }}
              >
                Ver todas as avaliações
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Galeria do Profissional */}
        {renderProfessionalPhotos()}

        {/* Formulário de reserva */}
        {showBookingForm && (
          <Card style={styles.bookingCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Fazer Reserva
              </Text>

              <View style={styles.dateTimeContainer}>
                <View style={styles.dateTimeRow}>
                  <Button
                    mode="outlined"
                    icon={() => (
                      <Calendar size={16} color={theme.colors.primary} />
                    )}
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateTimeButton}
                  >
                    {formatDate(bookingForm.event_date)}
                  </Button>

                  <Button
                    mode="outlined"
                    icon={() => (
                      <Clock size={16} color={theme.colors.primary} />
                    )}
                    onPress={() => setShowTimePicker(true)}
                    style={styles.dateTimeButton}
                  >
                    {formatTime(bookingForm.event_time)}
                  </Button>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={bookingForm.event_date}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        handleInputChange('event_date', selectedDate);
                      }
                    }}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={bookingForm.event_time}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);
                      if (selectedTime) {
                        handleInputChange('event_time', selectedTime);
                      }
                    }}
                  />
                )}
              </View>

              <TextInput
                label="Número de convidados *"
                value={bookingForm.guests_count}
                onChangeText={(value) =>
                  handleInputChange('guests_count', value)
                }
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                placeholder={`Máximo ${service.max_guests} pessoas`}
              />

              <TextInput
                label="Local do evento *"
                value={bookingForm.location}
                onChangeText={(value) => handleInputChange('location', value)}
                style={styles.input}
                mode="outlined"
                placeholder="Endereço completo do evento"
              />

              <TextInput
                label="Observações (opcional)"
                value={bookingForm.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Alguma observação especial sobre o evento..."
              />

              <View style={styles.totalContainer}>
                <Text variant="titleMedium" style={styles.totalLabel}>
                  Total estimado:
                </Text>
                <Text variant="headlineSmall" style={styles.totalPrice}>
                  R$ {calculateTotalPrice()}
                </Text>
              </View>

              <View style={styles.bookingActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowBookingForm(false)}
                  style={styles.bookingActionButton}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateBooking}
                  loading={bookingLoading}
                  disabled={bookingLoading}
                  style={styles.bookingActionButton}
                >
                  Confirmar Reserva
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Botões de ação */}
        {!showBookingForm && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon={() => <Calendar size={16} color={theme.colors.onPrimary} />}
              onPress={() => setShowBookingForm(true)}
              style={styles.bookButton}
            >
              Fazer Reserva
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Galeria Modal */}
      <Modal
        visible={showGalleryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGalleryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              Portfólio - {service.profiles?.full_name}
            </Text>
            <IconButton
              icon={() => <X size={24} color="white" />}
              onPress={() => setShowGalleryModal(false)}
            />
          </View>

          <View style={styles.modalContent}>
            {professionalPhotos.length > 0 && (
              <Image
                source={{
                  uri: professionalPhotos[selectedPhotoIndex]?.photo_url,
                }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}

            {professionalPhotos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navButton, styles.prevButton]}
                  onPress={() => navigatePhoto('prev')}
                >
                  <ChevronLeft size={32} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton]}
                  onPress={() => navigatePhoto('next')}
                >
                  <ChevronRight size={32} color="white" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.modalFooter}>
            <Text variant="bodyMedium" style={styles.photoCounter}>
              {selectedPhotoIndex + 1} de {professionalPhotos.length}
            </Text>
          </View>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    marginBottom: spacing.lg,
    color: theme.colors.onSurface,
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
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  infoCard: {
    margin: spacing.lg,
    elevation: 2,
  },
  serviceTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  servicePrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: spacing.xs,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  reviewsText: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  serviceDescription: {
    color: theme.colors.onSurface,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  detailsContainer: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurface,
  },
  professionalCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  professionalDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  professionalName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  professionalTitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  professionalRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalRatingText: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  contactButton: {
    flex: 1,
  },
  galleryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllLabel: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  loadingPhotosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loadingPhotosText: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  professionalGallery: {
    gap: spacing.sm,
  },
  professionalPhoto: {
    width: 120,
    height: 90,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surfaceVariant,
  },
  emptyGalleryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
  },
  emptyGalleryText: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyGallerySubtext: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  reviewsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  viewAllReviewsButton: {
    marginTop: spacing.md,
  },
  gallery: {
    gap: spacing.sm,
  },
  galleryImage: {
    width: 120,
    height: 90,
    borderRadius: theme.roundness,
  },
  bookingCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  dateTimeContainer: {
    marginBottom: spacing.md,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateTimeButton: {
    flex: 1,
  },
  input: {
    marginBottom: spacing.md,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  totalLabel: {
    color: theme.colors.onSurface,
  },
  totalPrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bookingActionButton: {
    flex: 1,
  },
  actionButtons: {
    padding: spacing.lg,
  },
  bookButton: {
    paddingVertical: spacing.sm,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    width: screenWidth,
    height: '80%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: spacing.sm,
    transform: [{ translateY: -25 }],
  },
  prevButton: {
    left: spacing.lg,
  },
  nextButton: {
    right: spacing.lg,
  },
  modalFooter: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  photoCounter: {
    color: 'white',
  },
});
