import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const SUPABASE_URL  = 'https://seqmbudpsvsjbybjotuy.supabase.co';
const ANON_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcW1idWRwc3ZzamJ5YmpvdHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDIwNDEsImV4cCI6MjA2OTYxODA0MX0.ccfX9W8GCaTW7GTC6yu2XmEHU72W0ZaoqYpRCX6iTW8';
const POLL_MS       = 15_000;
const ACCENT        = '#16a34a';

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pedido recibido', confirmed: 'Confirmado', preparing: 'Preparando',
  ready: 'Listo', delivering: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado',
};

interface TrackingData {
  order: {
    order_number: string; status: string; customer_name: string;
    is_pickup: boolean; delivery_address: string | null;
    delivery_latitude: number | null; delivery_longitude: number | null;
    restaurants: { name: string; address: string };
  };
  driver_location: { latitude: number; longitude: number } | null;
  eta_minutes: number | null;
}

export default function TrackingScreen() {
  const { token }                   = useLocalSearchParams<{ token: string }>();
  const [data, setData]             = useState<TrackingData | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const pollRef                     = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTracking = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-tracking-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'No encontrado'); return; }
      setData(await res.json());
    } catch { } finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    fetchTracking();
    pollRef.current = setInterval(fetchTracking, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTracking]);

  useEffect(() => {
    const s = data?.order.status;
    if (s === 'delivered' || s === 'cancelled') {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [data?.order.status]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={ACCENT} size="large" />;
  if (error || !data) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error ?? 'Error de seguimiento'}</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: ACCENT }}>Volver</Text></TouchableOpacity>
      </View>
    );
  }

  const { order, driver_location, eta_minutes } = data;
  const isDelivering = order.status === 'delivering';
  const isDelivered  = order.status === 'delivered';

  // Mapa embebido desde la web de Moonty (reutiliza la página de seguimiento ya construida)
  const trackingUrl = `https://moonty.app/seguimiento/${token}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Pedido #{order.order_number}</Text>
          <Text style={styles.headerSub}>{order.restaurants.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Estado */}
        <View style={[styles.card, isDelivered && { borderColor: ACCENT, borderWidth: 1.5 }]}>
          <View style={styles.statusRow}>
            <Ionicons
              name={isDelivered ? 'checkmark-circle' : isDelivering ? 'bicycle-outline' : 'time-outline'}
              size={28}
              color={isDelivered ? ACCENT : isDelivering ? ACCENT : '#f59e0b'}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>{STATUS_LABELS[order.status] ?? order.status}</Text>
              {isDelivering && eta_minutes != null && (
                <Text style={[styles.eta, { color: ACCENT }]}>Llega en aprox. {eta_minutes} min</Text>
              )}
            </View>
          </View>
        </View>

        {/* Mapa (WebView apuntando a la página de seguimiento web) */}
        {isDelivering && driver_location && (
          <View style={styles.mapCard}>
            <WebView
              source={{ uri: trackingUrl }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color={ACCENT} />}
            />
          </View>
        )}

        {/* Dirección */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={ACCENT} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Restaurante</Text>
              <Text style={styles.infoValue}>{order.restaurants.name}</Text>
              <Text style={styles.infoSub}>{order.restaurants.address}</Text>
            </View>
          </View>
          {!order.is_pickup && order.delivery_address && (
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="home-outline" size={18} color="#ef4444" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Dirección de entrega</Text>
                <Text style={styles.infoValue}>{order.delivery_address}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f5f5f5' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header:      { backgroundColor: ACCENT, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:     { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  content:     { padding: 14, gap: 12, paddingBottom: 32 },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusLabel: { fontSize: 16, fontWeight: '700', color: '#111' },
  eta:         { fontSize: 14, fontWeight: '600', marginTop: 2 },
  mapCard:     { borderRadius: 14, overflow: 'hidden', height: 320 },
  webview:     { flex: 1 },
  infoRow:     { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoLabel:   { fontSize: 12, color: '#888', marginBottom: 2 },
  infoValue:   { fontSize: 14, fontWeight: '600', color: '#111' },
  infoSub:     { fontSize: 13, color: '#666', marginTop: 1 },
  errorText:   { fontSize: 15, color: '#ef4444', textAlign: 'center' },
});
