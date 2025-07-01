import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  FlatList,
  Modal,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Avatar,
  Chip,
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
  Mail,
  Calendar,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  MessageCircle,
  Send,
} from 'lucide-react-native';

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
  const [professionalPhotos, setProfessionalPhotos] = useState<ProfessionalPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
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
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            phone,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setService(data);
      // Pre-fill location with service location
      setBookingForm(prev => ({
        ...prev,
        location: data.location,
      }));

      // Load professional photos
      if (data.professional_id) {
        loadProfessionalPhotos(data.professional_id);
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

  const handleInputChange = (field: keyof BookingForm, value: string | Date) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
  };

  const openGallery = (index: number = 0) => {
    setSelectedPhotoIndex(index);
    setShowGalleryModal(true);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedPhotoIndex(prev => 
        prev > 0 ? prev - 1 : professionalPhotos.length - 1
      );
    } else {
      setSelectedPhotoIndex(prev => 
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
          Alert.alert('Erro', 'Não foi possível abrir o aplicativo de telefone.');
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
    const whatsappUrl = `whatsapp://send?phone=55${phoneNumber}&text=${encodeURIComponent(message)}`;
    const whatsappWebUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Fallback to WhatsApp Web
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
    const emailUrl = `mailto:${service.profiles.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

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

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      Alert.alert('Erro', 'Por favor, digite uma mensagem.');
      return;
    }

    if (!profile || !service) {
      Alert.alert('Erro', 'Informações do usuário não disponíveis.');
      return;
    }

    setSendingMessage(true);
    try {
      // Here you would typically save the message to your database
      // For now, we'll simulate sending via email
      const subject = `Nova mensagem sobre: ${service.title}`;
      const body = `Olá ${service.profiles?.full_name}!\n\nVocê recebeu uma nova mensagem de ${profile.full_name} através do ChurrasJa:\n\n"${messageText}"\n\nPara responder, entre em contato diretamente com o cliente:\nE-mail: ${profile.email}\nTelefone: ${profile.phone || 'Não informado'}\n\nAtenciosamente,\nEquipe ChurrasJa`;
      
      const emailUrl = `mailto:${service.profiles?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      await Linking.openURL(emailUrl);
      
      Alert.alert(
        'Mensagem Enviada',
        'Sua mensagem foi enviada com sucesso! O churrasqueiro receberá um e-mail e entrará em contato em breve.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowMessageModal(false);
              setMessageText('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setSendingMessage(false);
    }
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
      {
        title: 'Mensagem',
        description: 'Enviar mensagem pelo app',
        onPress: () => setShowMessageModal(true),
        available: true,
      },
    ];

    const availableOptions = options.filter(option => option.available);

    if (availableOptions.length === 0) {
      Alert.alert('Erro', 'Nenhuma forma de contato disponível.');
      return;
    }

    Alert.alert(
      'Entrar em Contato',
      'Escolha como deseja entrar em contato com o churrasqueiro:',
      [
        ...availableOptions.map(option => ({
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

    // Check if date is in the future
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
    // Simple calculation: base price + additional cost per guest above minimum
    const basePrice = service.price_from;
    const additionalGuests = Math.max(0, guestsCount - 10); // Assume base price covers 10 guests
    const additionalCost = additionalGuests * 20; // R$ 20 per additional guest
    
    return basePrice + additionalCost;
  };

  const handleCreateBooking = async () => {
    if (!validateBookingForm() || !service || !profile) return;

    setBookingLoading(true);
    try {
      const eventDateTime = new Date(bookingForm.event_date);
      const timeString = `${bookingForm.event_time.getHours().toString().padStart(2, '0')}:${bookingForm.event_time.getMinutes().toString().padStart(2, '0')}:00`;

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
              router.push('/(client)/bookings');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível criar a reserva.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const renderImageItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.galleryImage} />
  );

  const renderProfessionalPhotoItem = ({ item, index }: { item: ProfessionalPhoto; index: number }) => (
    <TouchableOpacity onPress={() => openGallery(index)}>
      <Image source={{ uri: item.photo_url }} style={styles.professionalPhoto} />
    </TouchableOpacity>
  );

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
          <Button mode="contained" onPress={() => router.back()}>
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
          onPress={() => router.back()}
        />
        <Text variant="headlineMedium" style={styles.title}>
          Detalhes do Serviço
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
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

        {/* Service Info */}
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
                  4.8
                </Text>
                <Text variant="bodyMedium" style={styles.reviewsText}>
                  (124 avaliações)
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

        {/* Professional Info */}
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
                  label={service.profiles?.full_name?.charAt(0).toUpperCase() || 'C'}
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
                  <Text variant="bodySmall" style={styles.professionalRatingText}>
                    4.8 • 87 churrascos realizados
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
                icon={() => <MessageCircle size={16} color={theme.colors.primary} />}
                style={styles.contactButton}
                onPress={showContactOptions}
              >
                Mensagem
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Professional Gallery */}
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
              <FlatList
                data={professionalPhotos.slice(0, 6)} // Show only first 6 photos
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={renderProfessionalPhotoItem}
                contentContainerStyle={styles.professionalGallery}
              />
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

        {/* Service Image Gallery */}
        {service.images && service.images.length > 1 && (
          <Card style={styles.galleryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Fotos do Serviço
              </Text>
              <FlatList
                data={service.images}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderImageItem}
                contentContainerStyle={styles.gallery}
              />
            </Card.Content>
          </Card>
        )}

        {/* Booking Form */}
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
                    icon={() => <Calendar size={16} color={theme.colors.primary} />}
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateTimeButton}
                  >
                    {formatDate(bookingForm.event_date)}
                  </Button>

                  <Button
                    mode="outlined"
                    icon={() => <Clock size={16} color={theme.colors.primary} />}
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
                onChangeText={(value) => handleInputChange('guests_count', value)}
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

        {/* Action Buttons */}
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

      {/* Gallery Modal */}
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
                source={{ uri: professionalPhotos[selectedPhotoIndex]?.photo_url }}
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

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.messageModalContainer}>
          <View style={styles.messageModalContent}>
            <View style={styles.messageModalHeader}>
              <Text variant="titleMedium" style={styles.messageModalTitle}>
                Enviar Mensagem
              </Text>
              <IconButton
                icon={() => <X size={24} color={theme.colors.onSurface} />}
                onPress={() => setShowMessageModal(false)}
              />
            </View>

            <View style={styles.messageRecipient}>
              {service.profiles?.avatar_url ? (
                <Avatar.Image
                  size={40}
                  source={{ uri: service.profiles.avatar_url }}
                />
              ) : (
                <Avatar.Text
                  size={40}
                  label={service.profiles?.full_name?.charAt(0).toUpperCase() || 'C'}
                />
              )}
              <View style={styles.recipientInfo}>
                <Text variant="titleSmall" style={styles.recipientName}>
                  {service.profiles?.full_name}
                </Text>
                <Text variant="bodySmall" style={styles.recipientService}>
                  {service.title}
                </Text>
              </View>
            </View>

            <TextInput
              label="Sua mensagem"
              value={messageText}
              onChangeText={setMessageText}
              style={styles.messageInput}
              mode="outlined"
              multiline
              numberOfLines={6}
              placeholder="Digite sua mensagem aqui..."
            />

            <View style={styles.messageActions}>
              <Button
                mode="outlined"
                onPress={() => setShowMessageModal(false)}
                style={styles.messageActionButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSendMessage}
                loading={sendingMessage}
                disabled={sendingMessage || !messageText.trim()}
                style={styles.messageActionButton}
                icon={() => <Send size={16} color={theme.colors.onPrimary} />}
              >
                Enviar
              </Button>
            </View>
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
  // Message Modal styles
  messageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  messageModalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  messageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  messageModalTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  messageRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: spacing.sm,
  },
  recipientInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  recipientName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  recipientService: {
    color: theme.colors.onSurfaceVariant,
  },
  messageInput: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  messageActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  messageActionButton: {
    flex: 1,
  },
});