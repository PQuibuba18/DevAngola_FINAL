import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Image, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/Colors';

export default function NewPostScreen() {
  const router              = useRouter();
  const [title,   setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image,   setImage] = useState<{ uri: string; name: string } | null>(null);
  const [isOS,    setIsOS]  = useState(false);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão', 'Permite acesso à galeria nas definições.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8,
    });
    if (!r.canceled) {
      const asset = r.assets[0];
      setImage({ uri: asset.uri, name: `post_img_${Date.now()}.jpg` });
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Erro', 'Título e descrição são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title',         title.trim());
      form.append('content',       content.trim());
      form.append('is_open_source', String(isOS));
      if (image) {
        form.append('image', {
          uri:  image.uri,
          name: image.name,
          type: 'image/jpeg',
        } as any);
      }
      await api.post('/posts', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Publicado!', 'O teu post foi partilhado com a comunidade.', [
        { text: 'OK', onPress: () => router.replace('/tabs/feed') },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Novo post</Text>
      </View>

      <Text style={s.label}>Título *</Text>
      <TextInput
        style={s.input} value={title} onChangeText={setTitle}
        placeholder="Ex: Sistema de pagamentos Multicaixa"
        placeholderTextColor={Colors.ink400} maxLength={200}
      />

      <Text style={s.label}>Descrição *</Text>
      <TextInput
        style={[s.input, s.textarea]} value={content} onChangeText={setContent}
        placeholder="Descreve o projecto — tecnologias, desafios, resultados..."
        placeholderTextColor={Colors.ink400} multiline numberOfLines={6}
        textAlignVertical="top"
      />

      <Text style={s.label}>Imagem (opcional)</Text>
      <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
        {image
          ? <Image source={{ uri: image.uri }} style={s.imagePreview} resizeMode="cover" />
          : <View style={s.imagePlaceholder}>
              <Text style={s.imagePlaceholderIcon}>📷</Text>
              <Text style={s.imagePlaceholderTxt}>Adicionar imagem</Text>
              <Text style={s.imagePlaceholderSub}>JPG, PNG · máx. 5 MB</Text>
            </View>
        }
      </TouchableOpacity>
      {image && (
        <TouchableOpacity onPress={() => setImage(null)} style={s.removeImage}>
          <Text style={s.removeImageTxt}>Remover imagem</Text>
        </TouchableOpacity>
      )}

      <View style={s.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.switchLabel}>Projecto Open Source</Text>
          <Text style={s.switchSub}>
            O código-fonte fica disponível para a comunidade
          </Text>
        </View>
        <Switch
          value={isOS}
          onValueChange={setIsOS}
          trackColor={{ false: Colors.ink200, true: Colors.red }}
          thumbColor={Colors.white}
        />
      </View>

      <TouchableOpacity
        style={[s.submitBtn, loading && s.submitBtnLoading]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={s.submitTxt}>Publicar</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:           { flex: 1, backgroundColor: Colors.bg },
  content:             { padding: Spacing.lg, paddingBottom: 60 },
  header:              { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  backBtn:             { padding: Spacing.xs },
  backTxt:             { fontSize: 22, color: Colors.red, fontWeight: '800' },
  headerTitle:         { fontSize: 20, fontWeight: '900', color: Colors.ink900 },
  label:               { fontSize: 13, fontWeight: '600', color: Colors.ink600, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input:               { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.ink200, borderRadius: Radius.sm, padding: Spacing.md, fontSize: 15, color: Colors.ink900 },
  textarea:            { minHeight: 140, textAlignVertical: 'top' },
  imagePicker:         { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.ink200, borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.xs },
  imagePreview:        { width: '100%', height: 200 },
  imagePlaceholder:    { padding: Spacing.xxl, alignItems: 'center', gap: Spacing.xs },
  imagePlaceholderIcon:{ fontSize: 32 },
  imagePlaceholderTxt: { fontSize: 14, fontWeight: '600', color: Colors.ink600 },
  imagePlaceholderSub: { fontSize: 12, color: Colors.ink400 },
  removeImage:         { marginTop: Spacing.xs, alignItems: 'flex-end' },
  removeImageTxt:      { fontSize: 12, color: Colors.red, fontWeight: '600' },
  switchRow:           { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: Spacing.md, marginTop: Spacing.xl, borderWidth: 1, borderColor: Colors.ink100 },
  switchLabel:         { fontSize: 14, fontWeight: '700', color: Colors.ink900, marginBottom: 2 },
  switchSub:           { fontSize: 12, color: Colors.ink400 },
  submitBtn:           { backgroundColor: Colors.red, borderRadius: Radius.sm, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl },
  submitBtnLoading:    { opacity: 0.7 },
  submitTxt:           { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
