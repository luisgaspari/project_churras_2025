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
  SafeAreaView,
  Dimensions,
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const commentInputRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      const keyboardWillShowListener = Keyboard.addListener(
        'keyboardWillShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        }
      );
      const keyboardWillHideListener = Keyboard.addListener(
        'keyboardWillHide',
        () => {
          setKeyboardHeight(0);
        }
      );

      return () => {
        keyboardWillShowListener?.remove();
        keyboardWillHideListener?.remove();
      };
    } else {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
        }
      );

      return () => {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      };
    }
  }, []);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert(
        'Avaliação necessária', 
        'Por favor, selecione uma avaliação de 1 a 5 estrelas.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Dismiss keyboard before submitting
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
        error.message || 'Não foi possível enviar a avaliação. Tente novamente.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setRating(0);
    setComment('');
    setKeyboardHeight(0);
    onClose();
  };

  const handleCommentChange = (text: string) => {
    setComment(text);
  };

  const handleCommentFocus = () => {
    // Scroll to the comment section when focused
    if (Platform.OS === 'ios') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    // Provide haptic feedback on iOS
    if (Platform.OS === 'ios') {
      // Since we can't use Haptics on web, we'll skip this
      // In a real iOS app, you would use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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

  const modalHeight = Platform.OS === 'ios' 
    ? screenHeight - keyboardHeight 
    : keyboardHeight > 0 
      ? screenHeight * 0.9 - keyboardHeight 
      : screenHeight * 0.9;

  const ModalContent = () => (
    <View style={[styles.modalContent, { maxHeight: modalHeight }]}>
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
        ref={scrollViewRef}
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContentContainer}
        bounces={Platform.OS === 'ios'}
        nestedScrollEnabled={true}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
              onRatingChange={handleRatingChange}
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
            ref={commentInputRef}
            label="Seu comentário"
            value={comment}
            onChangeText={handleCommentChange}
            onFocus={handleCommentFocus}
            style={styles.commentInput}
            mode="outlined"
            multiline
            numberOfLines={Platform.OS === 'ios' ? 6 : 4}
            placeholder="O que você achou do serviço? Como foi a qualidade da comida, pontualidade, atendimento..."
            maxLength={500}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={false}
            autoCorrect={true}
            spellCheck={true}
            scrollEnabled={false}
            contentStyle={styles.textInputContent}
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

  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={visible}
        transparent={false}
        animationType="slide"
        onRequestClose={handleClose}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.iosModalContainer}>
          <ModalContent />
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.androidModalContainer}>
        <KeyboardAvoidingView 
          behavior="height" 
          style={styles.keyboardAvoidingView}
        >
          <ModalContent />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iosModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  androidModalContainer: {
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
    borderTopLeftRadius: Platform.OS === 'ios' ? 0 : spacing.lg,
    borderTopRightRadius: Platform.OS === 'ios' ? 0 : spacing.lg,
    flex: Platform.OS === 'ios' ? 1 : 0,
    minHeight: Platform.OS === 'ios' ? '100%' : '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.md : spacing.lg,
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
    elevation: Platform.OS === 'android' ? 1 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
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
  commentInput: {
    marginBottom: spacing.sm,
    minHeight: Platform.OS === 'ios' ? 140 : 100,
    backgroundColor: theme.colors.surface,
  },
  textInputContent: {
    paddingTop: Platform.OS === 'ios' ? spacing.md : spacing.sm,
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
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : 0,
  },
  actionButton: {
    flex: 1,
  },
});