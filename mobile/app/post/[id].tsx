import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/Colors';
import type { Post, Comment } from '../../types';

export default function PostDetailScreen() {
  const { id }              = useLocalSearchParams<{ id: string }>();
  const { user }            = useAuth();
  const router              = useRouter();
  const [post,    setPost]   = useState<Post | null>(null);
  const [comments,setComments] = useState<Comment[]>([]);
  const [liked,   setLiked]  = useState(false);
  const [text,    setText]   = useState('');
  const [loading, setLoading]= useState(true);
  const [sending, setSending]= useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/posts/${id}`);
        setPost(r.data);
        setComments(r.data.comments || []);
      } catch { Alert.alert('Erro', 'Post não encontrado.'); router.back(); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function handleLike() {
    if (!post) return;
    try {
      const r = await api.post(`/posts/${post.id}/like`);
      setLiked(r.data.liked);
      setPost(p => p ? { ...p, likes_count: r.data.liked ? p.likes_count+1 : p.likes_count-1 } : p);
    } catch {}
  }

  async function submitComment() {
    if (!text.trim() || !post) return;
    setSending(true);
    try {
      const r = await api.post(`/posts/${post.id}/comment`, { content: text.trim() });
      setComments(r.data.comments || []);
      setText('');
    } catch { Alert.alert('Erro', 'Não foi possível publicar o comentário.'); }
    finally { setSending(false); }
  }

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={Colors.red} size="large" /></View>
  );
  if (!post) return null;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{post.title}</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Post */}
        <View style={s.post}>
          <Text style={s.title}>{post.title}</Text>
          <View style={s.authorRow}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{post.author_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={s.authorName}>{post.author_name}</Text>
              <Text style={s.authorLevel}>{post.author_level}</Text>
            </View>
            {post.is_open_source && (
              <View style={s.oss}><Text style={s.ossTxt}>Open Source</Text></View>
            )}
          </View>
          <Text style={s.body}>{post.content}</Text>
          <View style={s.actions}>
            <TouchableOpacity style={s.action} onPress={handleLike}>
              <Text style={[s.actionIcon, liked && { color: Colors.red }]}>♥</Text>
              <Text style={s.actionTxt}>{post.likes_count}</Text>
            </TouchableOpacity>
            <View style={s.action}>
              <Text style={s.actionIcon}>💬</Text>
              <Text style={s.actionTxt}>{comments.length}</Text>
            </View>
          </View>
        </View>

        {/* Comentários */}
        <Text style={s.commentsTitle}>Comentários ({comments.length})</Text>
        {comments.map(c => (
          <View key={c.id} style={s.comment}>
            <View style={s.cmtAvatar}>
              <Text style={s.cmtInitial}>{c.author_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex:1 }}>
              <View style={s.cmtHead}>
                <Text style={s.cmtName}>{c.author_name}</Text>
                <Text style={s.cmtLevel}>{c.author_level}</Text>
              </View>
              <Text style={s.cmtBody}>{c.content}</Text>
            </View>
          </View>
        ))}

        {/* Formulário de comentário */}
        {user && (
          <View style={s.cmtForm}>
            <TextInput
              style={s.cmtInput}
              value={text}
              onChangeText={setText}
              placeholder="Escreve um comentário..."
              placeholderTextColor={Colors.ink400}
              multiline
            />
            <TouchableOpacity style={s.cmtBtn} onPress={submitComment} disabled={sending}>
              {sending
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={s.cmtBtnTxt}>Publicar</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:Colors.bg },
  center:       { flex:1, justifyContent:'center', alignItems:'center' },
  header:       { flexDirection:'row', alignItems:'center', gap:Spacing.md, backgroundColor:Colors.surface, padding:Spacing.lg, paddingTop:Spacing.xxl, borderBottomWidth:1, borderBottomColor:Colors.ink100 },
  backBtn:      { padding:Spacing.xs },
  backTxt:      { fontSize:22, color:Colors.red, fontWeight:'800' },
  headerTitle:  { flex:1, fontSize:16, fontWeight:'700', color:Colors.ink900 },
  content:      { padding:Spacing.lg, paddingBottom:60 },
  post:         { backgroundColor:Colors.surface, borderRadius:Radius.md, padding:Spacing.xl, marginBottom:Spacing.lg, borderWidth:1, borderColor:Colors.ink100 },
  title:        { fontSize:20, fontWeight:'900', color:Colors.ink900, marginBottom:Spacing.md },
  authorRow:    { flexDirection:'row', alignItems:'center', gap:Spacing.sm, marginBottom:Spacing.lg },
  avatar:       { width:40, height:40, borderRadius:20, backgroundColor:Colors.red, alignItems:'center', justifyContent:'center' },
  avatarTxt:    { color:Colors.white, fontWeight:'800', fontSize:16 },
  authorName:   { fontWeight:'700', fontSize:14, color:Colors.ink900 },
  authorLevel:  { fontSize:12, color:Colors.ink400 },
  oss:          { marginLeft:'auto', backgroundColor:Colors.redSoft, paddingVertical:2, paddingHorizontal:8, borderRadius:Radius.full },
  ossTxt:       { fontSize:11, color:Colors.red, fontWeight:'700' },
  body:         { fontSize:15, color:Colors.ink700, lineHeight:24, marginBottom:Spacing.lg },
  actions:      { flexDirection:'row', gap:Spacing.xl, borderTopWidth:1, borderTopColor:Colors.ink100, paddingTop:Spacing.sm },
  action:       { flexDirection:'row', alignItems:'center', gap:4 },
  actionIcon:   { fontSize:18, color:Colors.ink400 },
  actionTxt:    { fontSize:13, color:Colors.ink400, fontWeight:'600' },
  commentsTitle:{ fontSize:16, fontWeight:'800', color:Colors.ink900, marginBottom:Spacing.md },
  comment:      { flexDirection:'row', gap:Spacing.sm, backgroundColor:Colors.surface, borderRadius:Radius.sm, padding:Spacing.md, marginBottom:Spacing.sm, borderWidth:1, borderColor:Colors.ink100 },
  cmtAvatar:    { width:32, height:32, borderRadius:16, backgroundColor:Colors.red, alignItems:'center', justifyContent:'center' },
  cmtInitial:   { color:Colors.white, fontWeight:'800', fontSize:13 },
  cmtHead:      { flexDirection:'row', gap:Spacing.xs, alignItems:'center', marginBottom:2 },
  cmtName:      { fontWeight:'700', fontSize:13, color:Colors.ink900 },
  cmtLevel:     { fontSize:11, color:Colors.ink400 },
  cmtBody:      { fontSize:13, color:Colors.ink600, lineHeight:18 },
  cmtForm:      { backgroundColor:Colors.surface, borderRadius:Radius.md, padding:Spacing.md, marginTop:Spacing.md, borderWidth:1, borderColor:Colors.ink100, gap:Spacing.sm },
  cmtInput:     { backgroundColor:Colors.bg, borderRadius:Radius.sm, padding:Spacing.sm, fontSize:14, color:Colors.ink900, minHeight:80, borderWidth:1, borderColor:Colors.ink200 },
  cmtBtn:       { backgroundColor:Colors.red, borderRadius:Radius.sm, padding:Spacing.sm, alignItems:'center' },
  cmtBtnTxt:    { color:Colors.white, fontWeight:'700', fontSize:14 },
  ink700:       Colors.ink600,
});
