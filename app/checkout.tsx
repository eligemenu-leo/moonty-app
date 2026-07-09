import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useCartContext } from '@/components/CartProvider';
import { useAuthContext } from '@/components/AuthProvider';

const SUPABASE_URL = 'https://seqmbudpsvsjbybjotuy.supabase.co';
const ACCENT       = '#16a34a';

export default function CheckoutScreen() {
  const { items, total, restaurantId, clearCart } = useCartContext();
  const { user, session }                          = useAuthContext();
  const [checkoutUrl, setCheckoutUrl]              = useState<string | null>(null);
  const [loading, setLoading]                      = useState(false);
  const [error, setError]                          = useState('');

  const startCheckout = async () => {
    if (!user || !session) { router.push('/auth/login'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          items: items.map(i => ({ dish_id: i.dish.id, quantity: i.quantity, price: i.dish.price })),
          is_pickup: false,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Error al crear sesión de pago');
      setCheckoutUrl(d.url);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleNav = (url: string) => {
    if (url.includes('/payment/success')) {
      clearCart();
      router.replace('/(tabs)/orders');
      return false;
    }
    if (url.includes('/payment/cancelled')) {
      setCheckoutUrl(null);
      return false;
    }
    return true;
  };

  if (checkoutUrl) {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: checkoutUrl }}
          onShouldStartLoadWithRequest={req => handleNav(req.url)}
          startInLoadingState
          renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color={ACCENT} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#111" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Resumen del pedido</Text>

        {items.map(i => (
          <View key={i.dish.id} style={styles.line}>
            <Text style={styles.lineQty}>{i.quantity}×</Text>
            <Text style={styles.lineName}>{i.dish.name}</Text>
            <Text style={styles.linePrice}>{(i.dish.price * i.quantity).toFixed(2)} €</Text>
          </View>
        ))}

        <View style={styles.divider} />
        <View style={styles.totalLine}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{total.toFixed(2)} €</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.payBtn, loading && { opacity: 0.6 }]} onPress={startCheckout} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="card-outline" size={20} color="#fff" />
              <Text style={styles.payBtnText}>Pagar {total.toFixed(2)} €</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f5f5f5' },
  backBtn:     { padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36 },
  content:     { flex: 1, padding: 20, gap: 12 },
  title:       { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  line:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineQty:     { fontSize: 14, color: '#888', width: 28 },
  lineName:    { fontSize: 15, color: '#111', flex: 1 },
  linePrice:   { fontSize: 15, fontWeight: '600', color: '#111' },
  divider:     { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e7eb', marginVertical: 4 },
  totalLine:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:  { fontSize: 16, color: '#888' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#111' },
  error:       { color: '#ef4444', fontSize: 13 },
  payBtn:      { backgroundColor: ACCENT, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  payBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
});
