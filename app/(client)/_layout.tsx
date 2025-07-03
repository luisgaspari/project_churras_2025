import { Stack } from 'expo-router';
import { Tabs } from 'expo-router';
import {
  Search,
  Calendar,
  User,
  HomeIcon,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';

export default function ClientTabLayout() {
  return (
    <>
      <Stack.Screen
        name="service-details/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.surfaceVariant,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ size, color }) => (
              <HomeIcon size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Buscar',
            tabBarIcon: ({ size, color }) => (
              <Search size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Agendamentos',
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="service-details"
          options={{
            href: null, // This hides the tab from the tab bar
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null, // This hides the tab from the tab bar
          }}
        />
      </Tabs>
    </>
  );
}