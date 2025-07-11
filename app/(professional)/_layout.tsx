import { Stack } from 'expo-router';
import { Tabs } from 'expo-router';
import {
  Calendar,
  ChartBar as BarChart3,
  User,
  HomeIcon,
  Star,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function ProfessionalTabLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="reviews" options={{ headerShown: false }} />
      <Stack.Screen name="account-settings" options={{ headerShown: false }} />
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
          name="bookings"
          options={{
            title: 'Agendamentos',
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reviews"
          options={{
            title: 'Avaliações',
            tabBarIcon: ({ size, color }) => <Star size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Relatórios',
            tabBarIcon: ({ size, color }) => (
              <BarChart3 size={size} color={color} />
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
          name="services"
          options={{
            href: null, // Isso oculta a guia da barra de guias
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null, // Isso oculta a guia da barra de guias
          }}
        />
        <Tabs.Screen
          name="account-settings"
          options={{
            href: null, // Isso oculta a guia da barra de guias
          }}
        />
      </Tabs>
    </>
  );
}
