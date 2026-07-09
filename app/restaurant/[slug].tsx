import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Platform, SectionList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/lib/supabase';
import { Restaurant, DishGroup, Dish } from '@/src/types';
import { useCartContext } from '@/components/CartProvider';
import { useColorScheme } from '@/components/useColorScheme';

const ACCENT = '#16a34a';

export default function RestaurantScreen() {
  const { slug }                    = useLocalSearchParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [groups, setGroups]         = useState<DishGroup[]>([]);
  const [loading, setLoading]       = useState(true);
  const { addItem, removeItem, items, restaurantId } = useCartContext();
  const colorScheme                 = useColorScheme();
  const isDark                      = colorScheme === 'dark';

  const bg    = isDark ? '#111' : '#f5f5f5';
  const card  = isDark ? '#1e1e1e' : '#fff';
  const text  = isDark ? '#fff' : '#111';
  const muted = isDark ? '#888' : '#666';

  useEffect(() => {
    async function load() {
      // 1. Restaurante por slug
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();
      if (!rest) { setLoading(false); return; }
      setRestaurant(rest);

      // 2. Cartas visibles del restaurante (misma lógica que la web)
      const { data: menus } = await supabase
        .from('menus')
        .select('id')
        .eq('restaurant_id', rest.id)
        .neq('moonty_is_visible', false);
      const menuIds = (menus ?? []).map((m: any) => m.id);
      if (!menuIds.length) { setLoading(false); return; }

      // 3. Grupos de platos visibles para esas cartas
      const { data: groups } = await supabase
        .from('dish_groups')
        .select('id, name, order_position')
        .in('menu_id', menuIds)
        .neq('visibility', false)
        .order('order_position');
      const groupIds = (groups ?? []).map((g: any) => g.id);
      if (!groupIds.length) { setLoading(false); return; }

      // 4. Platos visibles de esos grupos
      const { data: dishes } = await supabase
        .from('dishes')
        .select('id, name, description, price_1, image_url, allergens, dish_group_id, order_position')
        .in('dish_group_id', groupIds)
        .neq('visibility', false)
        .order('order_position');

      // 5. Indexar platos por grupo
      const byGroup = new Map<string, any[]>();
      for (const d of dishes ?? []) {
        if (!byGroup.has(d.dish_group_id)) byGroup.set(d.dish_group_id, []);
        byGroup.get(d.dish_group_id)!.push(d);
      }

      setGroups((groups ?? []).map((g: any) => ({ ...g, dishes: byGroup.get(g.id) ?? [] })));
      setLoading(false);
    }
    load();
  }, [slug]);

  const getQty = (dishId: string) => items.find(i => i.dish.id === dishId)?.quantity ?? 0;

  const cartCount = restaurantId === restaurant?.id
    ? items.reduce((s, i) => s + i.quantity, 0)
    : 0;

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={ACCENT} size="large" />;
  if (!restaurant) return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: bg }]}>
      <Text style={{ color: muted }}>Restaurante no encontrado</Text>
    </View>
  );

  const sections = groups.map(g => ({
    title: g.name,
    data:  (g.dishes ?? []).filter((d: Dish) => d.visibility !== false),
  }));

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SectionList
        sections={sections}
        keyExtractor={d => d.id}
        stickySectionHeadersEnabled
        ListHeaderComponent={() => (
          <View>
            {restaurant.cover_url ? (
              <Image source={{ uri: restaurant.cover_url }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, { backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="storefront-outline" size={56} color={ACCENT} />
              </View>
            )}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={[styles.restInfo, { backgroundColor: card }]}>
              <Text style={[styles.restName, { color: text }]}>{restaurant.name}</Text>
              {restaurant.description && <Text style={[styles.restDesc, { color: muted }]}>{restaurant.description}</Text>}
              <View style={styles.meta}>
                {restaurant.delivery_time_min != null && (
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={14} color={muted} />
                    <Text style={[styles.metaText, { color: muted }]}>{restaurant.delivery_time_min} min</Text>
                  </View>
                )}
                {restaurant.minimum_order != null && (
                  <View style={styles.metaChip}>
                    <Ionicons name="cart-outline" size={14} color={muted} />
                    <Text style={[styles.metaText, { color: muted }]}>Mín. {restaurant.minimum_order.toFixed(2)} €</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: bg }]}>
            <Text style={[styles.sectionTitle, { color: text }]}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: dish }: { item: Dish }) => {
          const qty = getQty(dish.id);
          return (
            <View style={[styles.dishCard, { backgroundColor: card }]}>
              {dish.image_url && <Image source={{ uri: dish.image_url }} style={styles.dishImg} />}
              <View style={styles.dishInfo}>
                <Text style={[styles.dishName, { color: text }]}>{dish.name}</Text>
                {dish.description && <Text style={[styles.dishDesc, { color: muted }]} numberOfLines={2}>{dish.description}</Text>}
                <View style={styles.dishBottom}>
                  <Text style={[styles.price, { color: ACCENT }]}>{dish.price_1.toFixed(2)} €</Text>
                  {qty === 0 ? (
                    <TouchableOpacity style={styles.addBtn} onPress={() => addItem(dish, restaurant!.id, restaurant!.name)}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(dish.id)}>
                        <Ionicons name="remove" size={18} color={ACCENT} />
                      </TouchableOpacity>
                      <Text style={[styles.qty, { color: text }]}>{qty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem(dish, restaurant!.id, restaurant!.name)}>
                        <Ionicons name="add" size={18} color={ACCENT} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 100 : 24 }}
      />

      {/* Botón flotante de carrito */}
      {cartCount > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => router.push('/cart')}>
          <Ionicons name="bag-outline" size={20} color="#fff" />
          <Text style={styles.cartFabText}>Ver carrito · {cartCount} artículo{cartCount !== 1 ? 's' : ''}</Text>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  cover:        { height: 220, width: '100%' },
  backBtn:      { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  restInfo:     { padding: 16, gap: 6 },
  restName:     { fontSize: 22, fontWeight: '800' },
  restDesc:     { fontSize: 14, lineHeight: 20 },
  meta:         { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaChip:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:     { fontSize: 13 },
  sectionHeader:{ paddingHorizontal: 16, paddingVertical: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  dishCard:     { flexDirection: 'row', padding: 12, marginHorizontal: 12, marginBottom: 8, borderRadius: 12, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  dishImg:      { width: 84, height: 84, borderRadius: 10 },
  dishInfo:     { flex: 1, gap: 4 },
  dishName:     { fontSize: 15, fontWeight: '600' },
  dishDesc:     { fontSize: 13, lineHeight: 18 },
  dishBottom:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price:        { fontSize: 16, fontWeight: '700' },
  addBtn:       { width: 34, height: 34, borderRadius: 17, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  qtyRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn:       { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  qty:          { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  cartFab:      { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: ACCENT, borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  cartFabText:  { color: '#fff', fontWeight: '700', fontSize: 15, flex: 1 },
});
