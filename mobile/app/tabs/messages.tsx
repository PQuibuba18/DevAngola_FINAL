import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, Radius } from '../../constants/Colors';
import type { Conversation, Message } from '../../types';

function timeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'agora'; if (m < 60) return `${m}min`;
  if (m < 1440) return `${Math.floor(m/60)}h`;
  return `${Math.floor(m/1440)}d`;
}

export default function MessagesScreen() {
  const { user }                       = useAuth();
  const [view,      setView]           = useState<'list'|'chat'>('list');
  const [convs,     setConvs]          = useState<Conversation[]>([]);
  const [active,    setActive]         = useState<Conversation|null>(null);
  const [messages,  setMessages]       = useState<Message[]>([]);
  const [text,      setText]           = useState('');
  const [loading,   setLoading]        = useState(true);
  const [sending,   setSending]        = useState(false);
  const flatRef                        = useRef<FlatList>(null);
  const pollRef                        = useRef<ReturnType<typeof setInterval>|null>(null);

  const loadConvs = useCallback(async () => {
    try { const r = await api.get('/messages'); setConvs(r.data); }
    catch {} finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (convId: number) => {
    try {
      const r = await api.get(`/messages/${convId}`);
      setMessages(r.data);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {}
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    if (!active) { if (pollRef.current) clearInterval(pollRef.current); return; }
    loadMessages(active.conversation_id);
    pollRef.current = setInterval(() => loadMessages(active.conversation_id), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [active, loadMessages]);

  async function sendMessage() {
    if (!text.trim() || !active) return;
    setSending(true);
    try {
      const r = await api.post(`/messages/${active.conversation_id}`, { content: text.trim() });
      setMessages(prev => [...prev, r.data]);
      setText('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      loadConvs();
    } catch {} finally { setSending(false); }
  }

  // LISTA DE CONVERSAS
  if (view === 'list') {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Mensagens</Text>
        </View>
        {loading
          ? <ActivityIndicator color={Colors.red} style={{ marginTop:40 }} />
          : <FlatList
              data={convs}
              keyExtractor={c => String(c.conversation_id)}
              renderItem={({ item: c }) => (
                <TouchableOpacity style={s.convItem} onPress={() => { setActive(c); setView('chat'); }}>
                  <View style={s.convAvatar}>
                    <Text style={s.convInitial}>{c.other_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <View style={s.convTop}>
                      <Text style={s.convName}>{c.other_name}</Text>
                      <Text style={s.convTime}>{c.last_at ? timeAgo(c.last_at) : ''}</Text>
                    </View>
                    <View style={s.convBottom}>
                      <Text style={s.convPreview} numberOfLines={1}>{c.last_message || 'Sem mensagens'}</Text>
                      {Number(c.unread) > 0 && (
                        <View style={s.unreadBadge}>
                          <Text style={s.unreadTxt}>{c.unread > 9 ? '9+' : c.unread}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={s.emptyTitle}>Sem conversas ainda</Text>
                  <Text style={s.emptySub}>Visita o perfil de um utilizador e inicia uma conversa.</Text>
                </View>
              }
            />
        }
      </View>
    );
  }

  // CHAT ACTIVO
  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={s.chatHeader}>
        <TouchableOpacity onPress={() => { setView('list'); setActive(null); }} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.chatAvatar}>
          <Text style={s.convInitial}>{active?.other_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={s.chatName}>{active?.other_name}</Text>
          <Text style={s.chatLevel}>{active?.other_level}</Text>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => String(m.id)}
        contentContainerStyle={{ padding:Spacing.md }}
        renderItem={({ item: m }) => {
          const mine = m.sender_id === user?.id;
          return (
            <View style={[s.msgWrap, mine && s.msgWrapMine]}>
              <View style={[s.bubble, mine && s.bubbleMine]}>
                <Text style={[s.bubbleTxt, mine && s.bubbleTxtMine]}>{m.content}</Text>
                <Text style={s.bubbleTime}>{timeAgo(m.created_at)}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={s.composer}>
        <TextInput
          style={s.composerInput}
          value={text}
          onChangeText={setText}
          placeholder="Escreve uma mensagem..."
          placeholderTextColor={Colors.ink400}
          multiline
        />
        <TouchableOpacity style={s.sendBtn} onPress={sendMessage} disabled={sending || !text.trim()}>
          {sending
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={s.sendTxt}>➤</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:Colors.bg },
  header:       { backgroundColor:Colors.surface, padding:Spacing.xl, paddingTop:Spacing.xxl, borderBottomWidth:1, borderBottomColor:Colors.ink100 },
  headerTitle:  { fontSize:24, fontWeight:'900', color:Colors.ink900 },
  convItem:     { flexDirection:'row', padding:Spacing.lg, backgroundColor:Colors.surface, borderBottomWidth:1, borderBottomColor:Colors.ink100, alignItems:'center', gap:Spacing.md },
  convAvatar:   { width:48, height:48, borderRadius:24, backgroundColor:Colors.red, alignItems:'center', justifyContent:'center' },
  convInitial:  { color:Colors.white, fontWeight:'800', fontSize:18 },
  convTop:      { flexDirection:'row', justifyContent:'space-between' },
  convName:     { fontWeight:'700', fontSize:15, color:Colors.ink900 },
  convTime:     { fontSize:11, color:Colors.ink400 },
  convBottom:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:2 },
  convPreview:  { fontSize:13, color:Colors.ink400, flex:1 },
  unreadBadge:  { backgroundColor:Colors.red, borderRadius:Radius.full, minWidth:20, height:20, alignItems:'center', justifyContent:'center', paddingHorizontal:4 },
  unreadTxt:    { color:Colors.white, fontSize:11, fontWeight:'800' },
  empty:        { alignItems:'center', paddingTop:80, paddingHorizontal:Spacing.xl },
  emptyTitle:   { fontSize:18, fontWeight:'800', color:Colors.ink900, marginBottom:Spacing.sm },
  emptySub:     { fontSize:13, color:Colors.ink400, textAlign:'center' },
  chatHeader:   { flexDirection:'row', alignItems:'center', gap:Spacing.md, backgroundColor:Colors.surface, padding:Spacing.lg, paddingTop:Spacing.xxl, borderBottomWidth:1, borderBottomColor:Colors.ink100 },
  backBtn:      { padding:Spacing.xs },
  backTxt:      { fontSize:22, color:Colors.red, fontWeight:'800' },
  chatAvatar:   { width:40, height:40, borderRadius:20, backgroundColor:Colors.red, alignItems:'center', justifyContent:'center' },
  chatName:     { fontWeight:'700', fontSize:15, color:Colors.ink900 },
  chatLevel:    { fontSize:12, color:Colors.ink400 },
  msgWrap:      { marginBottom:Spacing.sm, alignItems:'flex-start' },
  msgWrapMine:  { alignItems:'flex-end' },
  bubble:       { backgroundColor:Colors.surface, borderRadius:Radius.md, padding:Spacing.sm, maxWidth:'75%', borderWidth:1, borderColor:Colors.ink100 },
  bubbleMine:   { backgroundColor:Colors.red, borderColor:Colors.red },
  bubbleTxt:    { fontSize:14, color:Colors.ink900, lineHeight:20 },
  bubbleTxtMine:{ color:Colors.white },
  bubbleTime:   { fontSize:10, color:Colors.ink400, marginTop:4, textAlign:'right' },
  composer:     { flexDirection:'row', padding:Spacing.md, backgroundColor:Colors.surface, borderTopWidth:1, borderTopColor:Colors.ink100, gap:Spacing.sm, alignItems:'flex-end' },
  composerInput:{ flex:1, backgroundColor:Colors.bg, borderRadius:Radius.md, padding:Spacing.sm, fontSize:14, color:Colors.ink900, maxHeight:100, borderWidth:1, borderColor:Colors.ink200 },
  sendBtn:      { width:44, height:44, backgroundColor:Colors.red, borderRadius:Radius.full, alignItems:'center', justifyContent:'center' },
  sendTxt:      { color:Colors.white, fontSize:16 },
});
