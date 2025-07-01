import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Avatar,
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import RatingStars from './RatingStars';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  booking: {
    id: string;
    professional_id: string;
    service_id: string;
    profiles?: {
      full_name: string;
      avatar_url?: string;
    };
    services?: {
      title: string;
    };
  };
  clientId: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({
  visible,
  onClose,
  booking,
  clientId,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      if (Platform.OS === 'ios') {
        // Use native iOS alert for better compatibility
        Alert.alert('Avaliação necessária', 'Por favor, selecione uma avaliação de 1 a 5 estrelas.');
      } else {
        Alert.alert('Erro', 'Por favor, selecione uma avaliação de 1 a 5 estrelas.');
      }
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        booking_id: booking.id,
        client_id: clientId,
        professional_id: booking.professional_id,
        rating,
        comment: comment.trim() || null,
      };

      const { error } = await supabase.from('reviews').insert(reviewData);

      if (error) {
        throw error;
      }

      const alertTitle = Platform.OS === 'ios' ? 'Avaliação enviada' : 'Sucesso';
      const alertMessage = 'Sua avaliação foi enviada com sucesso! Obrigado pelo feedback.';

      Alert.alert(
        alertTitle,
        alertMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onReviewSubmitted?.();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const alertTitle = Platform.OS === 'ios' ? 'Erro ao enviar' : 'Erro';
      const alertMessage = error.message || 'Não foi possível enviar a avaliação. Tente novamente.';
      
      Alert.alert(alertTitle, alertMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Dismiss keyboard before closing on iOS
    if (Platform.OS === 'ios') {
      Keyboard.dismiss();
    }
    setRating(0);
    setComment('');
    onClose();
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Muito ruim';
      case 2:
        return 'Ruim';
      case 3:
        return 'Regular';
      case 4:
        return 'Bom';
      case 5:
        return 'Excelente';
      default:
        return 'Selecione uma avaliação';
    }
  };

  const ModalContent = () => (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text variant="titleLarge" style={styles.modalTitle}>
          Avaliar Churrasqueiro
        </Text>
        <IconButton
          icon={() => <X size={24} color={theme.colors.onSurface} />}
          onPress={handleClose}
          style={styles.closeButton}
        />
      </View>

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Professional Info */}
        <Card style={styles.professionalCard}>
          <Card.Content style={styles.professionalContent}>
            {booking.profiles?.avatar_url ? (
              <Avatar.Image
                size={60}
                source={{ uri: booking.profiles.avatar_url }}
              />
            ) : (
              <Avatar.Text
                size={60}
                label={booking.profiles?.full_name?.charAt(0).toUpperCase() || 'C'}
              />
            )}
            <View style={styles.professionalInfo}>
              <Text variant="titleMedium" style={styles.professionalName}>
                {booking.profiles?.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.serviceName}>
                {booking.services?.title}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Como foi sua experiência?
          </Text>
          <Text variant="bodyMedium" style={styles.sectionDescription}>
            Sua avaliação ajuda outros clientes a escolher o melhor churrasqueiro.
          </Text>

          <View style={styles.ratingContainer}>
            <RatingStars
              rating={rating}
              onRatingChange={setRating}
              size={40}
            />
            <Text variant="titleSmall" style={styles.ratingText}>
              {getRatingText(rating)}
            </Text>
          </View>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Comentário (opcional)
          </Text>
          <Text variant="bodyMedium" style={styles.sectionDescription}>
            Conte mais sobre sua experiência para ajudar outros clientes.
          </Text>

          <TextInput
            label="Seu comentário"
            value={comment}
            onChangeText={setComment}
            style={styles.commentInput}
            mode="outlined"
            multiline
            numberOfLines={Platform.OS === 'ios' ? 4 : 4}
            placeholder="O que você achou do serviço? Como foi a qualidade da comida, pontualidade, atendimento..."
            maxLength={500}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
          />
          <Text variant="bodySmall" style={styles.characterCount}>
            {comment.length}/500 caracteres
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleClose}
            style={styles.actionButton}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmitReview}
            style={styles.actionButton}
            loading={loading}
            disabled={loading || rating === 0}
          >
            Enviar Avaliação
          </Button>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={Platform.OS === 'ios' ? 'slide' : 'slide'}
      onRequestClose={handleClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          {Platform.OS === 'ios' ? (
            <KeyboardAvoidingView 
              behavior="padding" 
              style={styles.keyboardAvoidingView}
              keyboardVerticalOffset={0}
            >
              <ModalContent />
            </KeyboardAvoidingView>
          ) : (
            <KeyboardAvoidingView 
              behavior="height" 
              style={styles.keyboardAvoidingView}
            >
              <ModalContent />
            </KeyboardAvoidingView>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    maxHeight: Platform.OS === 'ios' ? '95%' : '90%',
    paddingBottom: Platform.OS === 'ios' ? spacing.xl + 20 : spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.lg + 10 : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: spacing.lg,
  },
  professionalCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    elevation: Platform.OS === 'android' ? 1 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 2 : undefined,
  },
  professionalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  professionalInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  professionalName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  serviceName: {
    color: theme.colors.onSurfaceVariant,
  },
  ratingSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: spacing.md,
  },
  ratingText: {
    marginTop: spacing.md,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  commentSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  commentInput: {
    marginBottom: spacing.sm,
    minHeight: Platform.OS === 'ios' ? 100 : 80,
  },
  characterCount: {
    textAlign: 'right',
    color: theme.colors.onSurfaceVariant,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});