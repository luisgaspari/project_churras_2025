import { Stack } from 'expo-router';
import { Tabs } from 'expo-router';
import { Search, Calendar, User, PhoneIncoming as HomeIcon, MessageCircle } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import TabBarBadge from '@/components/TabBarBadge';
import { View } from 'react-native';

export default function ClientTabLayout() {
  const { unreadCount } = useUnreadMessages();

  return (
    <>
      <Stack.Screen
        name="service-details/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
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
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ size, color, focused }) => (
              <View style={{ position: 'relative' }}>
                <MessageCircle size={size} color={color} />
                {unreadCount > 0 && <TabBarBadge count={unreadCount} />}
              </View>
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