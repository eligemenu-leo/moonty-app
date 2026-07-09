import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { supabase } from '@/src/lib/supabase';

// Muestra la notificación en pantalla cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(userId: string | null) {
  const receivedSub  = useRef<Notifications.Subscription | null>(null);
  const responseSub  = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!userId) return;

    registerToken(userId);

    // Notificación recibida con la app en primer plano
    receivedSub.current = Notifications.addNotificationReceivedListener(() => {});

    // El usuario toca la notificación
    responseSub.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.order_id || data?.type === 'order') {
        router.push('/(tabs)/orders');
      }
    });

    return () => {
      receivedSub.current?.remove();
      responseSub.current?.remove();
    };
  }, [userId]);
}

async function registerToken(userId: string) {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Moonty',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16a34a',
        sound: 'default',
      });
    }

    const { status: current } = await Notifications.getPermissionsAsync();
    const { status } = current === 'granted'
      ? { status: current }
      : await Notifications.requestPermissionsAsync();

    if (status !== 'granted') return;

    const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId;
    if (!projectId || projectId === 'COMPLETAR_CON_eas_init') {
      console.warn('[push] eas.projectId no configurado — ejecuta: eas init');
      return;
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    const platform  = Platform.OS === 'ios' ? 'ios' : 'android';

    await supabase.from('push_subscriptions').upsert(
      { user_id: userId, token: pushToken.data, platform, is_active: true },
      { onConflict: 'token' }
    );
  } catch (e) {
    console.error('[push] Error al registrar token:', e);
  }
}
