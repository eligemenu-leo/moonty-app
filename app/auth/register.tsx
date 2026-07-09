import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '@/components/AuthProvider';
import { useColorScheme } from '@/components/useColorScheme';

const ACCENT = '#16a34a';

export default function RegisterScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const { signUp }              = useAuthContext();
  const colorScheme             = useColorScheme();
  const isDark                  = colorScheme === 'dark';

  const bg   = isDark ? '#111' : '#f5f5f5';
  const card = isDark ? '#1e1e1e' : '#fff';
  const text = isDark ? '#fff' : '#111';
  const muted= isDark ? '#888' : '#666';

  const handleRegister = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    if (password.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true); setError('');
    const { error: err } = await signUp(email.trim(), password);
    if (err) { setError(err.message); setLoading(false); }
    else setDone(true);
  };

  if (done) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Ionicons name="checkmark-circle" size={64} color={ACCENT} />
        <Text style={[styles.title, { color: text }]}>¡Cuenta creada!</Text>
        <Text style={[styles.sub, { color: muted }]}>Revisa tu email para confirmar la cuenta y luego inicia sesión.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/auth/login')}>
          <Text style={styles.btnText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: bg }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, { color: text }]}>Crear cuenta</Text>
        <Text style={[styles.sub, { color: muted }]}>Regístrate para pedir en Moonty</Text>

        <View style={[styles.form, { backgroundColor: card }]}>
          <TextInput style={[styles.input, { color: text, borderColor: isDark ? '#333' : '#e5e7eb' }]} placeholder="Email" placeholderTextColor={muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={[styles.input, { color: text, borderColor: isDark ? '#333' : '#e5e7eb' }]} placeholder="Contraseña (mín. 6 caracteres)" placeholderTextColor={muted} value={password} onChangeText={setPassword} secureTextEntry />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Registrarse</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={[styles.link, { color: ACCENT }]}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back:      { padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36 },
  content:   { flex: 1, padding: 24, gap: 20, justifyContent: 'center', marginTop: -60 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  title:     { fontSize: 28, fontWeight: '800' },
  sub:       { fontSize: 15, marginTop: -12, textAlign: 'center' },
  form:      { borderRadius: 16, padding: 16, gap: 12 },
  input:     { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15 },
  errorText: { color: '#ef4444', fontSize: 13 },
  btn:       { backgroundColor: ACCENT, padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:      { textAlign: 'center', fontSize: 14, fontWeight: '500' },
});
