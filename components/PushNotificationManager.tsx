import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { useAuthContext } from './AuthProvider';

export function PushNotificationManager() {
  const { user } = useAuthContext();
  usePushNotifications(user?.id ?? null);
  return null;
}
