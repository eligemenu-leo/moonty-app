import { useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartContext } from '@/components/CartProvider';
import { useAuthContext } from '@/components/AuthProvider';
import { useColorScheme } from '@/components/useColorScheme';

const SUPABASE_URL = 'https://seqmbudpsvsjbybjotuy.supabase.co';
const ACCENT       = '#16a34a';
const APP_ORIGIN   = 'https://moonty.app'; // para que Redsys redirija a URLs detectables

// HTML que auto-envía el formulario POST a Redsys
function buildRedsysHtml(actionUrl: string, merchantParameters: string, signatureVersion: string, signature: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5;font-family:sans-serif}
.msg{text-align:center;color:#555;font-size:15px}</style></head>
<body>
<div class="msg">Redirigiendo al banco seguro…</div>
<form id="f" method="POST" action="${actionUrl}">
  <input type="hidden" name="Ds_SignatureVersion"   value="${signatureVersion}" />
  <input type="hidden" name="Ds_MerchantParameters" value="${merchantParameters}" />
  <input type="hidden" name="Ds_Signature"          value="${signature}" />
</form>
<script>document.getElementById('f').submit();</script>
</body></html>`;
}

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  isPickup: boolean;
  address: string;
  notes: string;
}

export default function CheckoutScreen() {
  const { items, total, restaurantId, restaurantName, clearCart } = useCartContext();
  const { user, session }                                          = useAuthContext();
  const colorScheme                                                = useColorScheme();
  const isDark                                                     = colorScheme === 'dark';

  const [form, setForm]           = useState<CustomerForm>({
    name: '', email: user?.email ?? '', phone: '', isPickup: false, address: '', notes: '',
  });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [redsysHtml, setRedsysHtml] = useState<string | null>(null);
  const [orderId, setOrderId]     = useState<string | null>(null);

  const bg    = isDark ? '#111' : '#f5f5f5';
  const card  = isDark ? '#1e1e1e' : '#fff';
  const text  = isDark ? '#fff' : '#111';
  const muted = isDark ? '#888' : '#666';
  const border= isDark ? '#333' : '#e5e7eb';

  const set = (k: keyof CustomerForm, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.name.trim())  return 'Introduce tu nombre';
    if (!form.email.trim()) return 'Introduce tu email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email no válido';
    if (!form.phone.trim()) return 'Introduce tu teléfono';
    if (!form.isPickup && !form.address.trim()) return 'Introduce la dirección de entrega';
    return null;
  };

  const startCheckout = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (!session) { router.push('/auth/login'); return; }
    setLoading(true); setError('');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          // Origin controla las URLs de retorno que Redsys usa para redirigir al usuario
          Origin: APP_ORIGIN,
        },
        body: JSON.stringify({
          user_id:     user?.id,
          restaurant_id: restaurantId,
          customer: {
            name:  form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          },
          items: items.map(i => ({
            id:       i.dish.id,
            type:     'dish',
            name:     i.dish.name,
            price:    i.dish.price_1,
            quantity: i.quantity,
          })),
          notes:    form.notes.trim() || undefined,
          delivery: {
            is_pickup: form.isPickup,
            address:   form.isPickup ? undefined : form.address.trim(),
          },
          payment_method: 'online',
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Error al iniciar el pago');

      if (d.type === 'redsys') {
        setOrderId(d.orderId);
        setRedsysHtml(
          buildRedsysHtml(d.actionUrl, d.merchantParameters, d.signatureVersion, d.signature)
        );
      } else {
        // Tipo no esperado
        throw new Error('Respuesta inesperada del servidor de pagos');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Interceptar la navegación del WebView para detectar éxito o cancelación
  const handleNavChange = (nav: WebViewNavigation) => {
    const url = nav.url;
    if (url.includes('/payment/success')) {
      clearCart();
      router.replace('/(tabs)/orders');
    } else if (url.includes('/payment/cancelled')) {
      setRedsysHtml(null); // volver al formulario
    }
  };

  // ── Vista Redsys (WebView con el formulario POST auto-enviado) ───────────────
  if (redsysHtml) {
    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.webHeader, { backgroundColor: ACCENT }]}>
          <TouchableOpacity onPress={() => setRedsysHtml(null)} style={{ padding: 6 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.webHeaderTitle}>Pago seguro</Text>
          <View style={{ width: 34 }} />
        </View>
        <WebView
          source={{ html: redsysHtml }}
          onNavigationStateChange={handleNavChange}
          startInLoadingState
          renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color={ACCENT} />}
          // Permitir todo el tráfico (banco puede redirigir a subdominios distintos)
          mixedContentMode="always"
        />
      </View>
    );
  }

  // ── Formulario de datos + resumen ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: bg }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: ACCENT }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar pedido</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Resumen de artículos */}
        <View style={[styles.section, { backgroundColor: card }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>{restaurantName}</Text>
          {items.map(i => (
            <View key={i.dish.id} style={styles.lineRow}>
              <Text style={[styles.lineQty, { color: muted }]}>{i.quantity}×</Text>
              <Text style={[styles.lineName, { color: text }]}>{i.dish.name}</Text>
              <Text style={[styles.linePrice, { color: text }]}>{(i.dish.price_1 * i.quantity).toFixed(2)} €</Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: muted }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: ACCENT }]}>{total.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Entrega o recogida */}
        <View style={[styles.section, { backgroundColor: card }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>Tipo de entrega</Text>
          <View style={styles.toggleRow}>
            {[{ v: false, l: 'Entrega a domicilio' }, { v: true, l: 'Recogida en local' }].map(opt => (
              <TouchableOpacity
                key={String(opt.v)}
                style={[styles.toggleBtn, form.isPickup === opt.v && styles.toggleBtnActive]}
                onPress={() => set('isPickup', opt.v)}
              >
                <Text style={[styles.toggleText, form.isPickup === opt.v && styles.toggleTextActive]}>
                  {opt.l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {!form.isPickup && (
            <TextInput
              style={[styles.input, { color: text, borderColor: border }]}
              placeholder="Dirección de entrega"
              placeholderTextColor={muted}
              value={form.address}
              onChangeText={v => set('address', v)}
            />
          )}
        </View>

        {/* Datos de contacto */}
        <View style={[styles.section, { backgroundColor: card }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>Datos de contacto</Text>
          <TextInput style={[styles.input, { color: text, borderColor: border }]} placeholder="Nombre completo" placeholderTextColor={muted} value={form.name}  onChangeText={v => set('name', v)} />
          <TextInput style={[styles.input, { color: text, borderColor: border }]} placeholder="Email" placeholderTextColor={muted} value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={[styles.input, { color: text, borderColor: border }]} placeholder="Teléfono" placeholderTextColor={muted} value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" />
          <TextInput style={[styles.input, styles.inputTall, { color: text, borderColor: border }]} placeholder="Notas para el restaurante (opcional)" placeholderTextColor={muted} value={form.notes} onChangeText={v => set('notes', v)} multiline />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Botón de pago */}
        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.6 }]}
          onPress={startCheckout}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="lock-closed-outline" size={18} color="#fff" />
              <Text style={styles.payBtnText}>Pagar {total.toFixed(2)} € · Redsys</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.secureNote, { color: muted }]}>
          Pago procesado de forma segura por Redsys (protocolo 3D Secure)
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:     { color: '#fff', fontSize: 17, fontWeight: '700' },
  webHeader:       { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  webHeaderTitle:  { color: '#fff', fontSize: 16, fontWeight: '600' },
  content:         { padding: 14, gap: 14, paddingBottom: 40 },
  section:         { borderRadius: 14, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionTitle:    { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  lineRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lineQty:         { width: 24, fontSize: 14 },
  lineName:        { flex: 1, fontSize: 14 },
  linePrice:       { fontSize: 14, fontWeight: '600' },
  divider:         { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  totalRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:      { fontSize: 15 },
  totalAmount:     { fontSize: 20, fontWeight: '800' },
  toggleRow:       { flexDirection: 'row', gap: 8 },
  toggleBtn:       { flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: '#d1d5db', padding: 10, alignItems: 'center' },
  toggleBtnActive: { borderColor: ACCENT, backgroundColor: ACCENT + '15' },
  toggleText:      { fontSize: 13, color: '#888', fontWeight: '500', textAlign: 'center' },
  toggleTextActive:{ color: ACCENT, fontWeight: '700' },
  input:           { borderWidth: 1, borderRadius: 10, padding: 13, fontSize: 15 },
  inputTall:       { minHeight: 72, textAlignVertical: 'top' },
  errorBox:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12 },
  errorText:       { color: '#ef4444', fontSize: 13, flex: 1 },
  payBtn:          { backgroundColor: ACCENT, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  secureNote:      { textAlign: 'center', fontSize: 12, lineHeight: 18 },
});
