import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../constants/Colors';
import type { Post } from '../../types';

function timeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const LEVEL_COLOR: Record<string, string> = {
  iniciante: '#1E5631', junior: '#1A3A8A',
  pleno: '#7B4F00', senior: '#4A1580',
};

interface Props { post: Post; onLike?: () => void; liked?: boolean; }

export default function PostCard({ post, onLike, liked }: Props) {
  const router = useRouter();
  const API = 'http://10.0.2.2:5000';
  const imgSrc = post.image_url
    ? post.image_url.startsWith('http') ? post.image_url : `${API}${post.image_url}`
    : null;

  return (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/post/${post.id}`)}>
      {/* Cabeçalho */}
      <View style={s.head}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{post.author_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={s.authorName}>{post.author_name}</Text>
            {post.author_badge && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{post.author_badge_label}</Text>
              </View>
            )}
          </View>
          <View style={s.metaRow}>
            <View style={[s.levelPill, { backgroundColor: LEVEL_COLOR[post.author_level] + '20' }]}>
              <Text style={[s.levelTxt, { color: LEVEL_COLOR[post.author_level] }]}>
                {post.author_level}
              </Text>
            </View>
            <Text style={s.time}>{timeAgo(post.created_at)}</Text>
            {post.is_open_source && <Text style={s.oss}>Open Source</Text>}
          </View>
        </View>
      </View>

      {/* Corpo */}
      <Text style={s.title} numberOfLines={2}>{post.title}</Text>
      <Text style={s.content} numberOfLines={3}>{post.content}</Text>

      {imgSrc && (
        <Image source={{ uri: imgSrc }} style={s.img} resizeMode="cover" />
      )}

      {/* Rodapé */}
      <View style={s.foot}>
        <TouchableOpacity style={s.action} onPress={onLike}>
          <Text style={[s.actionIcon, liked && { color: Colors.red }]}>♥</Text>
          <Text style={s.actionTxt}>{post.likes_count}</Text>
        </TouchableOpacity>
        <View style={s.action}>
          <Text style={s.actionIcon}>💬</Text>
          <Text style={s.actionTxt}>{post.comments_count}</Text>
        </View>
        {post.file_url && (
          <View style={s.action}>
            <Text style={s.actionIcon}>⬇</Text>
            <Text style={s.actionTxt}>ZIP</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:       { backgroundColor:Colors.surface, marginHorizontal:Spacing.lg, marginVertical:Spacing.xs, borderRadius:Radius.md, padding:Spacing.lg, elevation:1, borderWidth:1, borderColor:Colors.ink100 },
  head:       { flexDirection:'row', alignItems:'flex-start', marginBottom:Spacing.sm },
  avatar:     { width:40, height:40, borderRadius:20, backgroundColor:Colors.red, alignItems:'center', justifyContent:'center', marginRight:Spacing.sm },
  avatarText: { color:Colors.white, fontWeight:'800', fontSize:16 },
  nameRow:    { flexDirection:'row', alignItems:'center', gap:Spacing.xs },
  authorName: { fontWeight:'700', fontSize:14, color:Colors.ink900 },
  badge:      { backgroundColor:'#C8860A20', paddingHorizontal:6, paddingVertical:1, borderRadius:Radius.full },
  badgeTxt:   { fontSize:10, fontWeight:'700', color:Colors.gold },
  metaRow:    { flexDirection:'row', alignItems:'center', gap:Spacing.xs, marginTop:2 },
  levelPill:  { paddingHorizontal:6, paddingVertical:1, borderRadius:Radius.full },
  levelTxt:   { fontSize:10, fontWeight:'700' },
  time:       { fontSize:11, color:Colors.ink400 },
  oss:        { fontSize:10, color:Colors.red, fontWeight:'600' },
  title:      { fontSize:16, fontWeight:'800', color:Colors.ink900, marginBottom:Spacing.xs },
  content:    { fontSize:14, color:Colors.ink600, lineHeight:20, marginBottom:Spacing.sm },
  img:        { width:'100%', height:180, borderRadius:Radius.sm, marginBottom:Spacing.sm },
  foot:       { flexDirection:'row', gap:Spacing.xl, borderTopWidth:1, borderTopColor:Colors.ink100, paddingTop:Spacing.sm },
  action:     { flexDirection:'row', alignItems:'center', gap:4 },
  actionIcon: { fontSize:16, color:Colors.ink400 },
  actionTxt:  { fontSize:13, color:Colors.ink400, fontWeight:'600' },
});
