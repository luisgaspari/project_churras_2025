import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Star,
  Phone,
  Mail,
} from 'lucide-react-native';
import ReviewModal from '@/components/ReviewModal';

interface Booking {
  id: string;
  event_date: string;
  event_time: string;
  guests_count: number;
  location: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  notes?: string;
  professional_id: string;
  service_id: string;
  services?: {
    title: string;
    duration_hours: number;
  };
  profiles?: {
    full_name: string;
    phone?: string;
    email: string;
    avatar_url?: string;
  };
  has_review?: boolean;
}
export default function BookingsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (profile) {
      loadBookings();
    }
  }, [profile]);

  const loadBookings = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          *,
          services (
            title,
            duration_hours
          ),
          profiles!bookings_professional_id_fkey (
            full_name,
            phone,
            email,
            avatar_url
          )
        `
        )
        .eq('client_id', profile.id)
        .order('event_date', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
      } else {
        // Check which bookings have reviews
        const bookingsWithReviewStatus = await Promise.all(
          (data || []).map(async (booking) => {
            const { data: reviewData } = await supabase
              .from('reviews')
              .select('id')
              .eq('booking_id', booking.id);

            return {
              ...booking,
              has_review: reviewData && reviewData.length > 0,
            };
          })
        );

        setBookings(bookingsWithReviewStatus);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    loadBookings(); // Refresh bookings to update review status
  };

  const openReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedBooking(null);
  };

  const handleCancelBooking = async (booking: Booking) => {
    // Only allow cancellation for pending bookings
    if (booking.status !== 'pending') {
      Alert.alert(
        'Não é possível cancelar',
        'Apenas agendamentos pendentes podem ser cancelados.'
      );
      return;
    }

    // Check if the event is within 24 hours
    const eventDateTime = new Date(
      `${booking.event_date}T${booking.event_time}`
    );
    const now = new Date();
    const hoursUntilEvent =
      (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilEvent < 24) {
      Alert.alert(
        'Cancelamento não permitido',
        'Não é possível cancelar agendamentos com menos de 24 horas de antecedência. Entre em contato diretamente com o churrasqueiro.',
        [
          {
            text: 'OK',
            style: 'default',
          },
          {
            text: 'Contatar Churrasqueiro',
            onPress: () => handleContactProfessional(booking),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Cancelar Agendamento',
      `Tem certeza que deseja cancelar o agendamento com ${booking.profiles?.full_name}?\n\nEsta ação não pode ser desfeita.`,
      [
        {
          text: 'Não',
          style: 'cancel',
        },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: () => confirmCancelBooking(booking.id),
        },
      ]
    );
  };

  const confirmCancelBooking = async (bookingId: string) => {
    setCancellingBooking(bookingId);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Agendamento Cancelado',
        'Seu agendamento foi cancelado com sucesso. O churrasqueiro será notificado.',
        [{ text: 'OK', style: 'default' }]
      );

      // Refresh bookings list
      loadBookings();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      Alert.alert(
        'Erro',
        error.message ||
          'Não foi possível cancelar o agendamento. Tente novamente.'
      );
    } finally {
      setCancellingBooking(null);
    }
  };

  // Define AlertButton type for Alert.alert options
  type AlertButton = {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  };

  const handleContactProfessional = (booking: Booking) => {
    const professional = booking.profiles;
    if (!professional) {
      Alert.alert('Erro', 'Informações do churrasqueiro não disponíveis.');
      return;
    }

    const options: AlertButton[] = [];

    // WhatsApp option (if phone is available)
    if (professional.phone) {
      options.push({
        text: 'WhatsApp',
        onPress: () => openWhatsApp(booking),
      });
    }

    // Phone call option (if phone is available)
    if (professional.phone) {
      options.push({
        text: 'Ligar',
        onPress: () => makePhoneCall(professional.phone!),
      });
    }

    // Email option
    options.push({
      text: 'E-mail',
      onPress: () => sendEmail(booking),
    });

    // Cancel option
    options.push({
      text: 'Cancelar',
      style: 'cancel',
    });

    if (options.length === 1) {
      Alert.alert('Erro', 'Nenhuma forma de contato disponível.');
      return;
    }

    Alert.alert(
      'Contatar Churrasqueiro',
      `Como você gostaria de entrar em contato com ${professional.full_name}?`,
      options
    );
  };

  const openWhatsApp = (booking: Booking) => {
    const professional = booking.profiles;
    if (!professional?.phone) return;

    const phoneNumber = professional.phone.replace(/\D/g, '');
    const eventDate = formatDate(booking.event_date);
    const eventTime = formatTime(booking.event_time);

    const message = `Olá ${professional.full_name}! Sou ${profile?.full_name} e tenho um agendamento com você para ${eventDate} às ${eventTime}. Gostaria de conversar sobre os detalhes do evento.`;

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
          // Fallback to WhatsApp Web
          return Linking.openURL(whatsappWebUrl);
        }
      })
      .catch((error) => {
        console.error('Error opening WhatsApp:', error);
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
      });
  };

  const makePhoneCall = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const phoneUrl = `tel:${cleanPhone}`;

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

  const sendEmail = (booking: Booking) => {
    const professional = booking.profiles;
    if (!professional?.email) return;

    const eventDate = formatDate(booking.event_date);
    const eventTime = formatTime(booking.event_time);

    const subject = `Agendamento - ${
      booking.services?.title || 'Serviço de Churrasco'
    }`;
    const body = `Olá ${professional.full_name}!\n\nSou ${
      profile?.full_name
    } e tenho um agendamento com você:\n\nServiço: ${
      booking.services?.title || 'Serviço de Churrasco'
    }\nData: ${eventDate}\nHorário: ${eventTime}\nLocal: ${
      booking.location
    }\nConvidados: ${
      booking.guests_count
    } pessoas\n\nGostaria de conversar sobre os detalhes do evento.\n\nAtenciosamente,\n${
      profile?.full_name
    }`;

    const emailUrl = `mailto:${professional.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.tertiary;
      case 'pending':
        return theme.colors.secondary;
      case 'cancelled':
        return theme.colors.error;
      case 'completed':
        return theme.colors.completed;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const hexToRgba = (hex: string, alpha: number) => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getStatusBackgroundColor = (status: string) => {
    const color = getStatusColor(status);
    return hexToRgba(color, 0.2);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const isUpcoming = (date: string) => {
    return new Date(date) >= new Date();
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === 'upcoming') {
      return (
        isUpcoming(booking.event_date) &&
        booking.status !== 'completed' &&
        booking.status !== 'cancelled'
      );
    } else {
      return (
        !isUpcoming(booking.event_date) ||
        booking.status === 'completed' ||
        booking.status === 'cancelled'
      );
    }
  });

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <Text variant="titleMedium" style={styles.serviceTitle}>
            {item.services?.title || 'Serviço de Churrasco'}
          </Text>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusBackgroundColor(item.status) },
            ]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {getStatusLabel(item.status)}
          </Chip>
        </View>

        <View style={styles.bookingInfo}>
          <View style={styles.infoRow}>
            <Calendar size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.infoText}>
              {formatDate(item.event_date)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.infoText}>
              {formatTime(item.event_time)} •{' '}
              {item.services?.duration_hours || 4}h
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.infoText}>
              {item.location}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <User size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.infoText}>
              {item.guests_count} pessoas • {item.profiles?.full_name}
            </Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesSection}>
            <Text variant="bodySmall" style={styles.notesLabel}>
              Observações:
            </Text>
            <Text variant="bodyMedium" style={styles.notes}>
              {item.notes}
            </Text>
          </View>
        )}

        <View style={styles.bookingFooter}>
          <Text variant="titleMedium" style={styles.totalPrice}>
            Total: R$ {item.total_price}
          </Text>

          <View style={styles.actions}>
            {item.status === 'pending' && (
              <>
                <Button
                  mode="outlined"
                  style={styles.actionButton}
                  onPress={() => handleCancelBooking(item)}
                  loading={cancellingBooking === item.id}
                  disabled={cancellingBooking === item.id}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  style={styles.actionButton}
                  onPress={() => handleContactProfessional(item)}
                  icon={() => (
                    <Phone size={16} color={theme.colors.onPrimary} />
                  )}
                >
                  Contatar
                </Button>
              </>
            )}

            {(item.status === 'confirmed' || item.status === 'completed') && (
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={() => handleContactProfessional(item)}
                icon={() => <Phone size={16} color={theme.colors.primary} />}
              >
                Contatar
              </Button>
            )}

            {item.status === 'completed' && !item.has_review && (
              <Button
                mode="contained"
                style={styles.reviewButton}
                icon={() => <Star size={16} color={theme.colors.onPrimary} />}
                onPress={() => openReviewModal(item)}
              >
                Avaliar
              </Button>
            )}

            {item.status === 'completed' && item.has_review && (
              <Chip
                style={styles.reviewedChip}
                textStyle={styles.reviewedChipText}
                icon={() => <Star size={14} color={theme.colors.tertiary} />}
              >
                Avaliado
              </Chip>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Meus Agendamentos
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === 'upcoming' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('upcoming')}
          style={styles.tabButton}
        >
          Próximos
        </Button>
        <Button
          mode={activeTab === 'past' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('past')}
          style={styles.tabButton}
        >
          Histórico
        </Button>
      </View>

      <View style={styles.content}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nenhum agendamento encontrado
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              {activeTab === 'upcoming'
                ? 'Quando você agendar um churrasqueiro, os detalhes aparecerão aqui.'
                : 'Seus agendamentos passados aparecerão aqui.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={loadBookings}
          />
        )}
      </View>

      {/* Review Modal */}
      {selectedBooking && (
        <ReviewModal
          visible={showReviewModal}
          onClose={closeReviewModal}
          booking={selectedBooking}
          clientId={profile?.id || ''}
          onReviewSubmitted={handleReviewSubmitted}
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
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  tabButton: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  bookingCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  serviceTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  statusChip: {
    marginLeft: spacing.sm,
  },
  bookingInfo: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurface,
  },
  notesSection: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: spacing.sm,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  notes: {
    color: theme.colors.onSurface,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 80,
  },
  reviewButton: {
    minWidth: 100,
  },
  reviewedChip: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  reviewedChipText: {
    color: theme.colors.tertiary,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
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
  },
});