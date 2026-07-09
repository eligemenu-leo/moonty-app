import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withDelay, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';

const ACCENT = '#16a34a';

export default function PaymentSuccessScreen() {
  const { order_id }    = useLocalSearchParams<{ order_id: string }>();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [shareToken, setShareToken]   = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark      = colorScheme === 'dark';

  const bg   = isDark ? '#111' : '#f0fdf4';
  const text = isDark ? '#fff' : '#111';
  const muted= isDark ? '#888' : '#555';

  // Animaciones de entrada
  const scale   = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideY  = useSharedValue(30);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: slideY.value }],
  }));

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    slideY.value  = withDelay(200, withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }));
  }, []);

  // Cargar número de pedido y share_token para el botón de seguimiento
  useEffect(() => {
    if (!order_id) return;
    supabase
      .from('orders')
      .select('order_number, share_token')
      .eq('id', order_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setOrderNumber(data.order_number);
          setShareToken(data.share_token);
        }
      });
  }, [order_id]);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>

      {/* Círculo con check animado */}
      <Animated.View style={[styles.circle, circleStyle]}>
        <Ionicons name="checkmark" size={56} color="#fff" />
      </Animated.View>

      {/* Texto y botones */}
      <Animated.View style={[styles.content, contentStyle]}>
        <Text style={[styles.title, { color: text }]}>¡Pedido confirmado!</Text>
        {orderNumber ? (
          <Text style={[styles.orderNum, { color: muted }]}>Pedido #{orderNumber}</Text>
        ) : (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 4 }} />
        )}
        <Text style={[styles.sub, { color: muted }]}>
          El restaurante ha recibido tu pedido y lo está preparando.
        </Text>

        {shareToken && (
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => router.replace(`/seguimiento/${shareToken}`)}
          >
            <Ionicons name="navigate-outline" size={18} color="#fff" />
            <Text style={styles.trackBtnText}>Seguir pedido en tiempo real</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.ordersBtn, { borderColor: ACCENT }]}
          onPress={() => router.replace('/(tabs)/orders')}
        >
          <Text style={[styles.ordersBtnText, { color: ACCENT }]}>Ver mis pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={[styles.homeLink, { color: muted }]}>Volver al inicio</Text>
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: Platform.OS === 'ios' ? 80 : 60 },
  circle:    { width: 110, height: 110, borderRadius: 55, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10, marginBottom: 32 },
  content:   { alignItems: 'center', gap: 12, width: '100%' },
  title:     { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  orderNum:  { fontSize: 15, fontWeight: '500' },
  sub:       { fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 4, marginBottom: 8 },
  trackBtn:  { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' },
  trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  ordersBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  ordersBtnText: { fontWeight: '600', fontSize: 15 },
  homeLink:  { fontSize: 14, marginTop: 4 },
});
