import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/Colors';

const LEVELS = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'junior',    label: 'Júnior'    },
  { value: 'pleno',     label: 'Pleno'     },
  { value: 'senior',    label: 'Sénior'    },
];

export default function RegisterScreen() {
  const router     = useRouter();
  const { login }  = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', level: '', nationality: 'Angolano',
  });
  const [loading, setLoading] = useState(false);

  function ch(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleRegister() {
    if (!form.name || !form.email || !form.password || !form.level) {
      Alert.alert('Erro', 'Preenche todos os campos.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Erro', 'Senha com mínimo de 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      // Nota: upload de portfolio não disponível na v1 mobile
      // O campo portfolio fica opcional na API — verificar com o backend
      const r = await api.post('/auth/register', form);
      await login(r.data.user, r.data.token);
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar conta.');
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

      <View style={s.card}>
        <Text style={s.title}>Criar conta</Text>

        {[
          { field:'name',     label:'Nome completo', placeholder:'O teu nome',           secure:false, keyboard:'default' as const },
          { field:'email',    label:'E-mail',         placeholder:'utilizador@email.ao',  secure:false, keyboard:'email-address' as const },
          { field:'password', label:'Senha',           placeholder:'Mínimo 6 caracteres', secure:true,  keyboard:'default' as const },
        ].map(({ field, label, placeholder, secure, keyboard }) => (
          <View key={field}>
            <Text style={s.label}>{label}</Text>
            <TextInput
              style={s.input}
              value={(form as any)[field]}
              onChangeText={v => ch(field, v)}
              placeholder={placeholder}
              placeholderTextColor={Colors.ink400}
              secureTextEntry={secure}
              keyboardType={keyboard}
              autoCapitalize={field === 'name' ? 'words' : 'none'}
            />
          </View>
        ))}

        <Text style={s.label}>Nível</Text>
        <View style={s.levelWrap}>
          {LEVELS.map(l => (
            <TouchableOpacity
              key={l.value}
              style={[s.levelBtn, form.level === l.value && s.levelBtnActive]}
              onPress={() => ch('level', l.value)}
            >
              <Text style={[s.levelTxt, form.level === l.value && s.levelTxtActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.btn, loading && s.btnLoading]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={s.btnText}>Criar conta</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/login')} style={s.link}>
          <Text style={s.linkText}>Já tens conta? <Text style={s.linkAccent}>Entra</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flexGrow:1, backgroundColor:Colors.bg, justifyContent:'center', padding:Spacing.xl },
  logoWrap:       { flexDirection:'row', justifyContent:'center', marginBottom:Spacing.xl },
  logoDev:        { fontSize:32, fontWeight:'900', color:Colors.ink900 },
  logoAngola:     { fontSize:32, fontWeight:'900', color:Colors.red },
  card:           { backgroundColor:Colors.surface, borderRadius:Radius.lg, padding:Spacing.xxl, elevation:3 },
  title:          { fontSize:22, fontWeight:'800', color:Colors.ink900, marginBottom:Spacing.xl },
  label:          { fontSize:13, fontWeight:'600', color:Colors.ink600, marginBottom:Spacing.xs },
  input:          { backgroundColor:Colors.bg, borderWidth:1.5, borderColor:Colors.ink200, borderRadius:Radius.sm, padding:Spacing.md, fontSize:15, color:Colors.ink900, marginBottom:Spacing.lg },
  levelWrap:      { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm, marginBottom:Spacing.xl },
  levelBtn:       { paddingVertical:Spacing.sm, paddingHorizontal:Spacing.md, borderRadius:Radius.full, borderWidth:1.5, borderColor:Colors.ink200 },
  levelBtnActive: { backgroundColor:Colors.red, borderColor:Colors.red },
  levelTxt:       { fontSize:13, fontWeight:'600', color:Colors.ink600 },
  levelTxtActive: { color:Colors.white },
  btn:            { backgroundColor:Colors.red, borderRadius:Radius.sm, padding:Spacing.lg, alignItems:'center', marginTop:Spacing.sm },
  btnLoading:     { opacity:0.7 },
  btnText:        { color:Colors.white, fontSize:16, fontWeight:'700' },
  link:           { marginTop:Spacing.lg, alignItems:'center' },
  linkText:       { color:Colors.ink400, fontSize:14 },
  linkAccent:     { color:Colors.red, fontWeight:'700' },
});
