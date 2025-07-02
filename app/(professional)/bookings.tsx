import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Linking, Platform } from 'react-native';
import { Text, Card, Button, Chip, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { Calendar, Clock, MapPin, User, Phone, Plus, MessageCircle, Mail } from 'lucide-react-native';

interface Booking {
  id: string;
  event_date: string;
  event_time: string;
  guests_count: number;
  location: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  notes?: string;
  services?: {
    title: string;
    duration_hours: number;
  };
  profiles?: {
    full_name: string;
    phone?: string;
    email: string;
  };
}

export default function ProfessionalBookingsScreen() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'all'>('pending');
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

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
        .select(`
          *,
          services (
            title,
            duration_hours
          ),
          profiles!bookings_client_id_fkey (
            full_name,
            phone,
            email
          )
        `)
        .eq('professional_id', profile.id)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error loading bookings:', error);
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    setUpdatingBooking(bookingId);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      // Show success message
      const statusMessages = {
        confirmed: 'Agendamento confirmado com sucesso!',
        cancelled: 'Agendamento recusado.',
        completed: 'Agendamento finalizado com sucesso!'
      };

      Alert.alert('Sucesso', statusMessages[status as keyof typeof statusMessages]);
      
      // Refresh bookings
      loadBookings();
    } catch (error: any) {
      console.error('Error updating booking:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o agendamento.');
    } finally {
      setUpdatingBooking(null);
    }
  };

  const handleContactClient = (booking: Booking) => {
    const client = booking.profiles;
    if (!client) {
      Alert.alert('Erro', 'Informações do cliente não disponíveis.');
      return;
    }

    const options = [];

    // WhatsApp option (if phone is available)
    if (client.phone) {
      options.push({
        text: 'WhatsApp',
        onPress: () => openWhatsApp(booking),
      });
    }

    // Phone call option (if phone is available)
    if (client.phone) {
      options.push({
        text: 'Ligar',
        onPress: () => makePhoneCall(client.phone!),
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
      'Contatar Cliente',
      `Como você gostaria de entrar em contato com ${client.full_name}?`,
      options
    );
  };

  const openWhatsApp = (booking: Booking) => {
    const client = booking.profiles;
    if (!client?.phone) return;

    const phoneNumber = client.phone.replace(/\D/g, '');
    const eventDate = formatDate(booking.event_date);
    const eventTime = formatTime(booking.event_time);
    
    const message = `Olá ${client.full_name}! Sou ${profile?.full_name}, churrasqueiro do ChurrasJa. Sobre seu agendamento para ${eventDate} às ${eventTime}, gostaria de conversar sobre os detalhes do evento.`;
    
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

  const makePhoneCall = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const phoneUrl = `tel:${cleanPhone}`;

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

  const sendEmail = (booking: Booking) => {
    const client = booking.profiles;
    if (!client?.email) return;

    const eventDate = formatDate(booking.event_date);
    const eventTime = formatTime(booking.event_time);
    
    const subject = `Agendamento ChurrasJa - ${booking.services?.title || 'Serviço de Churrasco'}`;
    const body = `Olá ${client.full_name}!\n\nSou ${profile?.full_name}, churrasqueiro do ChurrasJa.\n\nSobre seu agendamento:\n\nServiço: ${booking.services?.title || 'Serviço de Churrasco'}\nData: ${eventDate}\nHorário: ${eventTime}\nLocal: ${booking.location}\nConvidados: ${booking.guests_count} pessoas\n\nGostaria de conversar sobre os detalhes do seu evento para garantir que tudo saia perfeito!\n\nAtenciosamente,\n${profile?.full_name}\nChurrasqueiro Profissional`;
    
    const emailUrl = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

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
        return theme.colors.primary;
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

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <Text variant="titleMedium" style={styles.clientName}>
            {item.profiles?.full_name}
          </Text>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusBackgroundColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {getStatusLabel(item.status)}
          </Chip>
        </View>

        <Text variant="titleSmall" style={styles.serviceTitle}>
          {item.services?.title || 'Serviço de Churrasco'}
        </Text>

        <View style={styles.bookingInfoContainer}>
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
                {formatTime(item.event_time)} • {item.services?.duration_hours || 4}h
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
                {item.guests_count} pessoas
              </Text>
            </View>

            {item.profiles?.phone && (
              <View style={styles.infoRow}>
                <Phone size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.infoText}>
                  {item.profiles.phone}
                </Text>
              </View>
            )}

            {item.profiles?.email && (
              <View style={styles.infoRow}>
                <Mail size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.infoText}>
                  {item.profiles.email}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.totalPriceContainer}>
            <Text variant="titleLarge" style={styles.totalPrice}>
              R$ {item.total_price}
            </Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesSection}>
            <Text variant="bodySmall" style={styles.notesLabel}>
              Observações do cliente:
            </Text>
            <Text variant="bodyMedium" style={styles.notes}>
              {item.notes}
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {/* Contact button - available for all statuses except cancelled */}
          {item.status !== 'cancelled' && (
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              onPress={() => handleContactClient(item)}
              icon={() => <MessageCircle size={16} color={theme.colors.primary} />}
            >
              Contatar
            </Button>
          )}

          {/* Status-specific action buttons */}
          {item.status === 'pending' && (
            <>
              <Button 
                mode="outlined" 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => updateBookingStatus(item.id, 'cancelled')}
                loading={updatingBooking === item.id}
                disabled={updatingBooking === item.id}
              >
                Recusar
              </Button>
              <Button 
                mode="contained" 
                style={styles.actionButton}
                onPress={() => updateBookingStatus(item.id, 'confirmed')}
                loading={updatingBooking === item.id}
                disabled={updatingBooking === item.id}
              >
                Aceitar
              </Button>
            </>
          )}

          {item.status === 'confirmed' && (
            <Button 
              mode="contained" 
              style={styles.actionButton}
              onPress={() => updateBookingStatus(item.id, 'completed')}
              loading={updatingBooking === item.id}
              disabled={updatingBooking === item.id}
            >
              Finalizar
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Agendamentos
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === 'pending' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('pending')}
          style={styles.tabButton}
        >
          Pendentes
        </Button>
        <Button
          mode={activeTab === 'confirmed' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('confirmed')}
          style={styles.tabButton}
        >
          Confirmados
        </Button>
        <Button
          mode={activeTab === 'all' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('all')}
          style={styles.tabButton}
        >
          Todos
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
              {activeTab === 'pending' 
                ? 'Quando você receber novas solicitações, elas aparecerão aqui.'
                : `Nenhum agendamento ${activeTab === 'confirmed' ? 'confirmado' : ''} no momento.`
              }
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

      <FAB
        icon={() => <Plus size={24} color="white" />}
        style={styles.fab}
        onPress={() => {}}
      />
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
    gap: spacing.sm,
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
    marginBottom: spacing.sm,
  },
  clientName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  statusChip: {
    marginLeft: spacing.sm,
  },
  serviceTitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  bookingInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bookingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurface,
    flex: 1,
  },
  totalPriceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: spacing.md,
    minWidth: 100,
  },
  totalPrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: spacing.md,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  notes: {
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  actionButton: {
    minWidth: 90,
  },
  rejectButton: {
    borderColor: theme.colors.error,
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
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});