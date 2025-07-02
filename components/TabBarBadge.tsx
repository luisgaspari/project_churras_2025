import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '@/constants/theme';

interface TabBarBadgeProps {
  count: number;
  size?: number;
}

export default function TabBarBadge({ count, size = 18 }: TabBarBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text 
        variant="labelSmall" 
        style={[styles.badgeText, { fontSize: size * 0.6 }]}
      >
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  badgeText: {
    color: theme.colors.onError,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});