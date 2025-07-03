import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Avatar,
  Card,
} from 'react-native-paper';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import RatingStars from './RatingStars';

const { height: screenHeight } = Dimensions.get('window');

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const commentInputRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(keyboardShowEvent, () => {
      setKeyboardVisible(true);
    });

    const keyboardHideListener = Keyboard.addListener(keyboardHideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, []);

  // Redefinir estado quando a visibilidade modal muda
  useEffect(() => {
    if (!visible) {
      setRating(0);
      setComment('');
      setKeyboardVisible(false);
      Keyboard.dismiss();
    }
  }, [visible]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert(
        'Avaliação necessária',
        'Por favor, selecione uma avaliação de 1 a 5 estrelas.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Keyboard.dismiss();

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

      Alert.alert(
        'Sucesso',
        'Sua avaliação foi enviada com sucesso! Obrigado pelo feedback.',
        [
          {
            text: 'OK',
            style: 'default',
            onPress: () => {
              handleClose();
              onReviewSubmitted?.();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Erro',
        error.message ||
          'Não foi possível enviar a avaliação. Tente novamente.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleCommentChange = (text: string) => {
    setComment(text);
  };

  const handleCommentFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <View style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContent}>
            {/* Header */}
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

            {/* Conteúdo rolável */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContentContainer}
            >
              {/* Informações profissionais */}
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
                      label={
                        booking.profiles?.full_name?.charAt(0).toUpperCase() ||
                        'C'
                      }
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

              {/* Seção de classificação */}
              <View style={styles.ratingSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Como foi sua experiência?
                </Text>
                <Text variant="bodyMedium" style={styles.sectionDescription}>
                  Sua avaliação ajuda outros clientes a escolher o melhor
                  churrasqueiro.
                </Text>

                <View style={styles.ratingContainer}>
                  <RatingStars
                    rating={rating}
                    onRatingChange={handleRatingChange}
                    size={40}
                  />
                  <Text variant="titleSmall" style={styles.ratingText}>
                    {getRatingText(rating)}
                  </Text>
                </View>
              </View>

              {/* Seção de comentários */}
              <View style={styles.commentSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Comentário (opcional)
                </Text>
                <Text variant="bodyMedium" style={styles.sectionDescription}>
                  Conte mais sobre sua experiência para ajudar outros clientes.
                </Text>

                <View style={styles.textInputContainer}>
                  <TextInput
                    ref={commentInputRef}
                    label="Seu comentário"
                    value={comment}
                    onChangeText={handleCommentChange}
                    onFocus={handleCommentFocus}
                    style={styles.commentInput}
                    contentStyle={styles.commentInputContent}
                    mode="outlined"
                    multiline={true}
                    numberOfLines={4}
                    placeholder="O que você achou do serviço? Como foi a qualidade da comida, pontualidade, atendimento..."
                    maxLength={500}
                    textAlignVertical="top"
                    autoCorrect={true}
                    spellCheck={true}
                    blurOnSubmit={false}
                    returnKeyType="default"
                    enablesReturnKeyAutomatically={false}
                  />
                </View>

                <Text variant="bodySmall" style={styles.characterCount}>
                  {comment.length}/500 caracteres
                </Text>
              </View>

              {/* Botões de ação */}
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
        </KeyboardAvoidingView>
      </View>
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
    maxHeight: '90%',
    minHeight: '60%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
    backgroundColor: theme.colors.surface,
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
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  professionalCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    elevation: 1,
    backgroundColor: theme.colors.surface,
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
  textInputContainer: {
    marginBottom: spacing.sm,
    minHeight: 120,
  },
  commentInput: {
    minHeight: 120,
    backgroundColor: theme.colors.surface,
  },
  commentInputContent: {
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
