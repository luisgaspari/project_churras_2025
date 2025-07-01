import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Star } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  showHalfStars?: boolean;
}

export default function RatingStars({
  rating,
  onRatingChange,
  size = 24,
  readonly = false,
  showHalfStars = false,
}: RatingStarsProps) {
  const handleStarPress = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const renderStar = (index: number) => {
    const starRating = index + 1;
    const isFilled = rating >= starRating;
    const isHalfFilled = showHalfStars && rating >= starRating - 0.5 && rating < starRating;

    if (readonly) {
      return (
        <View key={index} style={styles.starContainer}>
          <Star
            size={size}
            color={isFilled || isHalfFilled ? theme.colors.tertiary : theme.colors.onSurfaceVariant}
            fill={isFilled ? theme.colors.tertiary : isHalfFilled ? theme.colors.tertiary : 'transparent'}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.starContainer,
          Platform.OS === 'ios' && styles.iosStarContainer
        ]}
        onPress={() => handleStarPress(starRating)}
        activeOpacity={0.7}
        hitSlop={Platform.OS === 'ios' ? { top: 10, bottom: 10, left: 10, right: 10 } : undefined}
      >
        <Star
          size={size}
          color={isFilled ? theme.colors.tertiary : theme.colors.onSurfaceVariant}
          fill={isFilled ? theme.colors.tertiary : 'transparent'}
          strokeWidth={Platform.OS === 'ios' ? 2.5 : 2}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, Platform.OS === 'ios' && styles.iosContainer]}>
      {[0, 1, 2, 3, 4].map(renderStar)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosContainer: {
    paddingVertical: 8,
  },
  starContainer: {
    marginHorizontal: 4,
    padding: 2,
  },
  iosStarContainer: {
    padding: 6,
    borderRadius: 8,
  },
});