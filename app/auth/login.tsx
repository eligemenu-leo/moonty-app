import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '@/components/AuthProvider';
import { useColorScheme } from '@/components/useColorScheme';

const ACCENT = '#16a34a';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { signIn }              = useAuthContext();
  const colorScheme             = useColorScheme();
  const isDark                  = colorScheme === 'dark';

  const bg   = isDark ? '#111' : '#f5f5f5';
  const card = isDark ? '#1e1e1e' : '#fff';
  const text = isDark ? '#fff' : '#111';
  const muted= isDark ? '#888' : '#666';

  const handleLogin = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    const { error: err } = await signIn(email.trim(), password);
    if (err) { setError(err.message); setLoading(false); }
    else router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: bg }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, { color: text }]}>Bienvenido</Text>
        <Text style={[styles.sub, { color: muted }]}>Inicia sesión en tu cuenta Moonty</Text>

        <View style={[styles.form, { backgroundColor: card }]}>
          <TextInput style={[styles.input, { color: text, borderColor: isDark ? '#333' : '#e5e7eb' }]} placeholder="Email" placeholderTextColor={muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <TextInput style={[styles.input, { color: text, borderColor: isDark ? '#333' : '#e5e7eb' }]} placeholder="Contraseña" placeholderTextColor={muted} value={password} onChangeText={setPassword} secureTextEntry />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={[styles.link, { color: ACCENT }]}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back:      { padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36 },
  content:   { flex: 1, padding: 24, gap: 20, justifyContent: 'center', marginTop: -60 },
  title:     { fontSize: 28, fontWeight: '800' },
  sub:       { fontSize: 15, marginTop: -12 },
  form:      { borderRadius: 16, padding: 16, gap: 12 },
  input:     { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15 },
  errorText: { color: '#ef4444', fontSize: 13 },
  btn:       { backgroundColor: ACCENT, padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:      { textAlign: 'center', fontSize: 14, fontWeight: '500' },
});
