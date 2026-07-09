import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '@/components/AuthProvider';
import { useColorScheme } from '@/components/useColorScheme';

const ACCENT = '#16a34a';

export default function ProfileScreen() {
  const { user, signOut } = useAuthContext();
  const colorScheme       = useColorScheme();
  const isDark            = colorScheme === 'dark';

  const bg    = isDark ? '#111' : '#f5f5f5';
  const card  = isDark ? '#1e1e1e' : '#fff';
  const text  = isDark ? '#fff' : '#111';
  const muted = isDark ? '#888' : '#666';

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Ionicons name="person-circle-outline" size={72} color={muted} />
        <Text style={[styles.title, { color: text }]}>Mi perfil</Text>
        <Text style={[styles.subtitle, { color: muted }]}>Inicia sesión para gestionar tus datos y pedidos</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={[styles.linkText, { color: ACCENT }]}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Avatar / info */}
      <View style={[styles.avatarCard, { backgroundColor: ACCENT }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{(user.email ?? 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.emailText}>{user.email}</Text>
      </View>

      {/* Sección de opciones */}
      <View style={[styles.section, { backgroundColor: card }]}>
        <MenuItem icon="receipt-outline"  label="Mis pedidos"   color={text} muted={muted} onPress={() => router.push('/(tabs)/orders')} />
        <MenuDivider />
        <MenuItem icon="notifications-outline" label="Notificaciones" color={text} muted={muted} onPress={() => {}} />
        <MenuDivider />
        <MenuItem icon="shield-checkmark-outline" label="Privacidad" color={text} muted={muted} onPress={() => {}} />
      </View>

      <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: card }]} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuItem({ icon, label, color, muted, onPress }: { icon: any; label: string; color: string; muted: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={muted} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={muted} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

function MenuDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  title:         { fontSize: 22, fontWeight: '800' },
  subtitle:      { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  primaryBtn:    { backgroundColor: ACCENT, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  primaryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
  linkText:      { fontSize: 14, fontWeight: '500' },
  avatarCard:    { borderRadius: 16, padding: 24, alignItems: 'center', gap: 10 },
  avatar:        { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarLetter:  { fontSize: 32, fontWeight: '700', color: '#fff' },
  emailText:     { color: 'rgba(255,255,255,0.9)', fontSize: 15 },
  section:       { borderRadius: 16, overflow: 'hidden' },
  menuItem:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  menuLabel:     { fontSize: 15 },
  divider:       { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e7eb', marginLeft: 48 },
  signOutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16 },
  signOutText:   { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
