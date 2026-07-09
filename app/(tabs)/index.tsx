import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/lib/supabase';
import { Restaurant } from '@/src/types';
import { useCartContext } from '@/components/CartProvider';
import { useColorScheme } from '@/components/useColorScheme';

const ACCENT = '#16a34a';

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filtered, setFiltered]       = useState<Restaurant[]>([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const { count }                     = useCartContext();
  const colorScheme                   = useColorScheme();
  const isDark                        = colorScheme === 'dark';

  const fetchRestaurants = useCallback(async () => {
    const { data } = await supabase
      .from('restaurants')
      .select('id,name,slug,description,address,logo_url,cover_url,cuisine_type,rating,delivery_time_min,delivery_fee,minimum_order,is_active,coordinates')
      .eq('is_active', true)
      .order('name');
    if (data) { setRestaurants(data); setFiltered(data); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? restaurants.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.cuisine_type ?? '').toLowerCase().includes(q)
      ) : restaurants
    );
  }, [search, restaurants]);

  const bg    = isDark ? '#111' : '#f5f5f5';
  const card  = isDark ? '#1e1e1e' : '#fff';
  const text  = isDark ? '#fff' : '#111';
  const muted = isDark ? '#888' : '#666';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: ACCENT }]}>
        <View style={{ backgroundColor: 'transparent' }}>
          <Text style={styles.headerTitle}>Moonty</Text>
          <Text style={styles.headerSub}>¿Qué comes hoy?</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartBtn}>
          <Ionicons name="bag-outline" size={26} color="#fff" />
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={[styles.searchWrap, { backgroundColor: card }]}>
        <Ionicons name="search-outline" size={18} color={muted} />
        <TextInput
          style={[styles.searchInput, { color: text }]}
          placeholder="Buscar restaurante o cocina..."
          placeholderTextColor={muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={muted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={ACCENT} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRestaurants(); }} colors={[ACCENT]} />}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: muted }]}>Sin resultados</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: card }]}
              activeOpacity={0.85}
              onPress={() => router.push(`/restaurant/${item.slug}`)}
            >
              {item.cover_url ? (
                <Image source={{ uri: item.cover_url }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, { backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="storefront-outline" size={40} color={ACCENT} />
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  {item.logo_url ? (
                    <Image source={{ uri: item.logo_url }} style={styles.logo} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.restName, { color: text }]}>{item.name}</Text>
                    {item.cuisine_type && (
                      <Text style={[styles.cuisine, { color: muted }]}>{item.cuisine_type}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.meta}>
                  {item.delivery_time_min != null && (
                    <View style={styles.metaChip}>
                      <Ionicons name="time-outline" size={13} color={muted} />
                      <Text style={[styles.metaText, { color: muted }]}>{item.delivery_time_min} min</Text>
                    </View>
                  )}
                  {item.delivery_fee != null && (
                    <View style={styles.metaChip}>
                      <Ionicons name="bicycle-outline" size={13} color={muted} />
                      <Text style={[styles.metaText, { color: muted }]}>
                        {item.delivery_fee === 0 ? 'Envío gratis' : `${item.delivery_fee.toFixed(2)} €`}
                      </Text>
                    </View>
                  )}
                  {item.rating != null && (
                    <View style={styles.metaChip}>
                      <Ionicons name="star" size={13} color="#f59e0b" />
                      <Text style={[styles.metaText, { color: muted }]}>{item.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  header:     { paddingTop: Platform.OS === 'ios' ? 56 : 42, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerTitle:{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSub:  { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  cartBtn:    { padding: 4 },
  badge:      { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchInput:{ flex: 1, fontSize: 15 },
  list:       { paddingHorizontal: 12, paddingBottom: 24, gap: 12 },
  empty:      { textAlign: 'center', marginTop: 60, fontSize: 15 },
  card:       { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cover:      { height: 140, width: '100%' },
  cardBody:   { padding: 14, gap: 8 },
  cardRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:       { width: 36, height: 36, borderRadius: 8 },
  restName:   { fontSize: 16, fontWeight: '700' },
  cuisine:    { fontSize: 13, marginTop: 1 },
  meta:       { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaChip:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:   { fontSize: 12 },
});
