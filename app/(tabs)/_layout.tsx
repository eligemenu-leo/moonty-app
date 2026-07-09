import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useCartContext } from '@/components/CartProvider';

function TabBarIcon({ name, color }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string | any }) {
  return <Ionicons name={name} size={26} color={color as string} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { count }   = useCartContext();
  const tint        = Colors[colorScheme].tint;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   tint,
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#888' : '#aaa',
        tabBarStyle:             { borderTopWidth: 0.5 },
        headerShown:             Platform.OS !== 'web',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabBarIcon name="home-outline" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <TabBarIcon name="receipt-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabBarIcon name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
