import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/Colors';

const LEVEL_LABEL: Record<string,string> = {
  pendente:'Pendente', iniciante:'Iniciante',
  junior:'Júnior', pleno:'Pleno', senior:'Sénior',
};
const LEVEL_COLOR: Record<string,string> = {
  pendente:'#666', iniciante:'#1E5631',
  junior:'#1A3A8A', pleno:'#7B4F00', senior:'#4A1580',
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router                       = useRouter();
  const [uploading, setUploading]    = useState(false);

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Permite o acesso à galeria nas definições.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', {
        uri:  asset.uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);
      const r = await api.post('/users/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar_url: r.data.avatar_url });
      Alert.alert('Sucesso', 'Avatar actualizado!');
    } catch {
      Alert.alert('Erro', 'Não foi possível actualizar o avatar.');
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Tens a certeza que queres sair?', [
      { text:'Cancelar', style:'cancel' },
      { text:'Sair', style:'destructive', onPress: async () => {
        await logout();
        router.replace('/auth/login');
      }},
    ]);
  }

  if (!user) return null;

  const API = 'http://10.0.2.2:5000';
  const avatarSrc = user.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API}${user.avatar_url}`)
    : null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Cabeçalho do perfil */}
      <View style={s.header}>
        <TouchableOpacity onPress={pickAvatar} disabled={uploading}>
          <View style={s.avatarWrap}>
            {avatarSrc
              ? <Image source={{ uri: avatarSrc }} style={s.avatarImg} />
              : <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
            }
            <View style={s.avatarEdit}>
              {uploading
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={s.avatarEditTxt}>✎</Text>
              }
            </View>
          </View>
        </TouchableOpacity>

        <Text style={s.name}>{user.name}</Text>

        <View style={s.levelWrap}>
          <View style={[s.levelPill, { backgroundColor: LEVEL_COLOR[user.level] + '20' }]}>
            <Text style={[s.levelTxt, { color: LEVEL_COLOR[user.level] }]}>
              {LEVEL_LABEL[user.level]}
            </Text>
          </View>
          {user.badge && (
            <View style={s.badgePill}>
              <Text style={s.badgeTxt}>{user.badge_label}</Text>
            </View>
          )}
          {user.verified && (
            <View style={s.verifiedPill}>
              <Text style={s.verifiedTxt}>✓ Verificado</Text>
            </View>
          )}
        </View>

        {user.identifier && (
          <Text style={s.identifier}>{user.identifier}</Text>
        )}
      </View>

      {/* Detalhes */}
      <View style={s.section}>
        {[
          { label:'E-mail',       value: user.email },
          { label:'Membro desde', value: new Date(0).toLocaleDateString('pt-AO') },
        ].map(row => (
          <View key={row.label} style={s.row}>
            <Text style={s.rowLabel}>{row.label}</Text>
            <Text style={s.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Acções */}
      <View style={s.actions}>
        {user.level === 'pendente' && (
          <TouchableOpacity style={s.quizBtn} onPress={() => router.push('/quiz')}>
            <Text style={s.quizBtnTxt}>Fazer quiz de nível</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutTxt}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:         { flex:1, backgroundColor:Colors.bg },
  content:           { padding:Spacing.xl, paddingBottom:80 },
  header:            { alignItems:'center', marginBottom:Spacing.xxl },
  avatarWrap:        { position:'relative', marginBottom:Spacing.lg },
  avatarImg:         { width:96, height:96, borderRadius:48 },
  avatarPlaceholder: { width:96, height:96, borderRadius:48, backgroundColor:Colors.red, alignItems:'center', justifyContent:'center' },
  avatarInitial:     { color:Colors.white, fontSize:40, fontWeight:'900' },
  avatarEdit:        { position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor:Colors.ink900, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:Colors.white },
  avatarEditTxt:     { color:Colors.white, fontSize:14 },
  name:              { fontSize:22, fontWeight:'900', color:Colors.ink900, marginBottom:Spacing.sm },
  levelWrap:         { flexDirection:'row', gap:Spacing.xs, flexWrap:'wrap', justifyContent:'center', marginBottom:Spacing.sm },
  levelPill:         { paddingVertical:4, paddingHorizontal:10, borderRadius:Radius.full },
  levelTxt:          { fontSize:12, fontWeight:'700' },
  badgePill:         { backgroundColor:'#C8860A20', paddingVertical:4, paddingHorizontal:10, borderRadius:Radius.full },
  badgeTxt:          { fontSize:12, fontWeight:'700', color:Colors.gold },
  verifiedPill:      { backgroundColor:'#1E563120', paddingVertical:4, paddingHorizontal:10, borderRadius:Radius.full },
  verifiedTxt:       { fontSize:12, fontWeight:'700', color:'#1E5631' },
  identifier:        { fontSize:14, color:Colors.ink400, marginTop:4 },
  section:           { backgroundColor:Colors.surface, borderRadius:Radius.md, padding:Spacing.lg, marginBottom:Spacing.lg, borderWidth:1, borderColor:Colors.ink100 },
  row:               { flexDirection:'row', justifyContent:'space-between', paddingVertical:Spacing.sm, borderBottomWidth:1, borderBottomColor:Colors.ink100 },
  rowLabel:          { fontSize:13, color:Colors.ink400, fontWeight:'600' },
  rowValue:          { fontSize:13, color:Colors.ink900, fontWeight:'500', maxWidth:'60%', textAlign:'right' },
  actions:           { gap:Spacing.sm },
  quizBtn:           { backgroundColor:Colors.red, padding:Spacing.lg, borderRadius:Radius.sm, alignItems:'center' },
  quizBtnTxt:        { color:Colors.white, fontWeight:'700', fontSize:15 },
  logoutBtn:         { padding:Spacing.lg, borderRadius:Radius.sm, alignItems:'center', borderWidth:1.5, borderColor:Colors.ink200 },
  logoutTxt:         { color:Colors.ink600, fontWeight:'700', fontSize:15 },
});
