import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { useColorScheme } from '@/components/useColorScheme';
import { CartProvider } from '@/components/CartProvider';
import { AuthProvider } from '@/components/AuthProvider';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync(); }, []);

  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)"            options={{ headerShown: false }} />
            <Stack.Screen name="restaurant/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="cart"              options={{ presentation: 'modal', title: 'Tu carrito' }} />
            <Stack.Screen name="checkout"          options={{ title: 'Confirmar pedido' }} />
            <Stack.Screen name="payment/success"      options={{ headerShown: false }} />
            <Stack.Screen name="seguimiento/[token]" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login"        options={{ headerShown: false }} />
            <Stack.Screen name="auth/register"     options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}
