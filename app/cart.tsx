import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartContext } from '@/components/CartProvider';
import { useColorScheme } from '@/components/useColorScheme';

const ACCENT = '#16a34a';

export default function CartScreen() {
  const { items, total, restaurantName, addItem, removeItem, clearCart } = useCartContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg    = isDark ? '#111' : '#f5f5f5';
  const card  = isDark ? '#1e1e1e' : '#fff';
  const text  = isDark ? '#fff' : '#111';
  const muted = isDark ? '#888' : '#666';

  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Ionicons name="bag-outline" size={56} color={muted} />
        <Text style={[styles.emptyTitle, { color: text }]}>Tu carrito está vacío</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Explorar restaurantes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <FlatList
        data={items}
        keyExtractor={i => i.dish.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={[styles.restName, { color: muted }]}>{restaurantName}</Text>
            <TouchableOpacity onPress={() => Alert.alert('Vaciar carrito', '¿Seguro?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Vaciar', style: 'destructive', onPress: clearCart },
            ])}>
              <Text style={{ color: '#ef4444', fontSize: 13 }}>Vaciar</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: card }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dishName, { color: text }]}>{item.dish.name}</Text>
              <Text style={[styles.price, { color: ACCENT }]}>{(item.dish.price * item.quantity).toFixed(2)} €</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.dish.id)}>
                <Ionicons name="remove" size={18} color={ACCENT} />
              </TouchableOpacity>
              <Text style={[styles.qty, { color: text }]}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem(item.dish, item.restaurantId, item.restaurantName)}>
                <Ionicons name="add" size={18} color={ACCENT} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Resumen y botón de checkout */}
      <View style={[styles.footer, { backgroundColor: card }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: muted }]}>Total</Text>
          <Text style={[styles.totalAmount, { color: text }]}>{total.toFixed(2)} €</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>Continuar al pago</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyTitle:   { fontSize: 18, fontWeight: '700' },
  btn:          { backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  list:         { padding: 16, gap: 10, paddingBottom: 0 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  restName:     { fontSize: 13, fontWeight: '500' },
  row:          { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  dishName:     { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  price:        { fontSize: 14, fontWeight: '600' },
  qtyRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn:       { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  qty:          { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  footer:       { padding: 20, gap: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb' },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel:   { fontSize: 15 },
  totalAmount:  { fontSize: 20, fontWeight: '800' },
  checkoutBtn:  { backgroundColor: ACCENT, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
