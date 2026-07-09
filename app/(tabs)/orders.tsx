import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/lib/supabase';
import { Order } from '@/src/types';
import { useAuthContext } from '@/components/AuthProvider';
import { useColorScheme } from '@/components/useColorScheme';

const ACCENT = '#16a34a';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid:       { label: 'Recibido',   color: '#3b82f6' },
  confirmed:  { label: 'Confirmado', color: '#8b5cf6' },
  preparing:  { label: 'Preparando', color: '#f59e0b' },
  ready:      { label: 'Listo',      color: '#06b6d4' },
  delivering: { label: 'En camino',  color: ACCENT    },
  delivered:  { label: 'Entregado',  color: '#6b7280' },
  cancelled:  { label: 'Cancelado',  color: '#ef4444' },
};

const ACTIVE = ['paid', 'confirmed', 'preparing', 'ready', 'delivering'];

export default function OrdersScreen() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user }                    = useAuthContext();
  const colorScheme                 = useColorScheme();
  const isDark                      = colorScheme === 'dark';

  const fetchOrders = useCallback(async () => {
    if (!user) { setLoading(false); setRefreshing(false); return; }
    const { data } = await supabase
      .from('orders')
      .select('id,order_number,status,total_amount,created_at,delivery_address,is_pickup,share_token,restaurants(name,logo_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40);
    if (data) setOrders(data as any);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const bg    = isDark ? '#111' : '#f5f5f5';
  const card  = isDark ? '#1e1e1e' : '#fff';
  const text  = isDark ? '#fff' : '#111';
  const muted = isDark ? '#888' : '#666';

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Ionicons name="receipt-outline" size={48} color={muted} />
        <Text style={[styles.emptyTitle, { color: text }]}>Inicia sesión para ver tus pedidos</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginBtnText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={ACCENT} size="large" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[ACCENT]} />}
          ListHeaderComponent={<Text style={[styles.pageTitle, { color: text }]}>Mis pedidos</Text>}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={48} color={muted} />
              <Text style={[styles.emptyTitle, { color: muted }]}>Aún no tienes pedidos</Text>
            </View>
          }
          renderItem={({ item }) => {
            const st    = STATUS_LABELS[item.status] ?? { label: item.status, color: muted };
            const isActive = ACTIVE.includes(item.status);
            const date  = new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            return (
              <View style={[styles.card, { backgroundColor: card }]}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={[styles.restName, { color: text }]}>{(item.restaurants as any)?.name}</Text>
                    <Text style={[styles.orderNum, { color: muted }]}>#{item.order_number}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: st.color + '20' }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <Text style={[styles.amount, { color: text }]}>{item.total_amount.toFixed(2)} €</Text>
                  <Text style={[styles.date, { color: muted }]}>{date}</Text>
                </View>
                {isActive && item.share_token && (
                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => router.push(`/seguimiento/${item.share_token}`)}
                  >
                    <Ionicons name="navigate-outline" size={15} color={ACCENT} />
                    <Text style={styles.trackText}>Seguir pedido</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  pageTitle:  { fontSize: 22, fontWeight: '800', paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4 },
  list:       { padding: 12, gap: 12 },
  emptyTitle: { fontSize: 16, textAlign: 'center' },
  loginBtn:   { backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  loginBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  card:       { borderRadius: 14, padding: 14, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  restName:   { fontSize: 15, fontWeight: '700' },
  orderNum:   { fontSize: 12, marginTop: 2 },
  statusChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount:     { fontSize: 15, fontWeight: '700' },
  date:       { fontSize: 12 },
  trackBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb', marginTop: 2 },
  trackText:  { color: ACCENT, fontSize: 13, fontWeight: '600' },
});
