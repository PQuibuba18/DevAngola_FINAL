import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/Colors';

export default function LoginScreen() {
  const router         = useRouter();
  const { login }      = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Erro', 'Preenche o email e a senha.');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post('/auth/login', { email: email.trim(), password });
      await login(r.data.user, r.data.token);
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao fazer login.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.logoWrap}>
        <Text style={s.logoDev}>Dev</Text>
        <Text style={s.logoAngola}>Angola</Text>
      </View>
      <Text style={s.tag}>Plataforma profissional para programadores angolanos</Text>

      <View style={s.card}>
        <Text style={s.title}>Entrar</Text>

        <Text style={s.label}>E-mail</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="utilizador@devangola.ao"
          placeholderTextColor={Colors.ink400}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={s.label}>Senha</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="A tua senha"
          placeholderTextColor={Colors.ink400}
          secureTextEntry
        />

        <TouchableOpacity
          style={[s.btn, loading && s.btnLoading]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={s.btnText}>Entrar</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')} style={s.link}>
          <Text style={s.linkText}>Ainda não tens conta? <Text style={s.linkAccent}>Regista-te</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: Colors.bg,
    justifyContent: 'center', padding: Spacing.xl,
  },
  logoWrap:  { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.sm },
  logoDev:   { fontSize: 36, fontWeight: '900', color: Colors.ink900 },
  logoAngola:{ fontSize: 36, fontWeight: '900', color: Colors.red },
  tag:       { textAlign: 'center', color: Colors.ink400, fontSize: 13, marginBottom: Spacing.xl },
  card:      { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xxl, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  title:     { fontSize: 22, fontWeight: '800', color: Colors.ink900, marginBottom: Spacing.xl },
  label:     { fontSize: 13, fontWeight: '600', color: Colors.ink600, marginBottom: Spacing.xs },
  input:     { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.ink200, borderRadius: Radius.sm, padding: Spacing.md, fontSize: 15, color: Colors.ink900, marginBottom: Spacing.lg },
  btn:       { backgroundColor: Colors.red, borderRadius: Radius.sm, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm },
  btnLoading:{ opacity: 0.7 },
  btnText:   { color: Colors.white, fontSize: 16, fontWeight: '700' },
  link:      { marginTop: Spacing.lg, alignItems: 'center' },
  linkText:  { color: Colors.ink400, fontSize: 14 },
  linkAccent:{ color: Colors.red, fontWeight: '700' },
});
