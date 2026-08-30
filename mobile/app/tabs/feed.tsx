import { useState, useEffect, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  Text, ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import PostCard from '../../components/ui/PostCard';
import { Colors, Spacing } from '../../constants/Colors';
import type { Post } from '../../types';

export default function FeedScreen() {
  const [posts,     setPosts]     = useState<Post[]>([]);
  const [liked,     setLiked]     = useState<Set<number>>(new Set());
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);
  const [error,     setError]     = useState('');
  const LIMIT = 20;

  const loadPosts = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      setError('');
      const r = await api.get('/posts', { params: { page: pageNum, limit: LIMIT } });
      const newPosts: Post[] = r.data.posts ?? r.data;
      if (refresh || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      setHasMore(newPosts.length === LIMIT);
      setPage(pageNum);
    } catch {
      setError('Erro ao carregar posts. Verifica a tua ligação.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadPosts(1); }, [loadPosts]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadPosts(1, true);
  }

  async function handleLoadMore() {
    if (!hasMore || loading) return;
    await loadPosts(page + 1);
  }

  async function handleLike(postId: number) {
    try {
      const r = await api.post(`/posts/${postId}/like`);
      setLiked(prev => {
        const next = new Set(prev);
        r.data.liked ? next.add(postId) : next.delete(postId);
        return next;
      });
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, likes_count: r.data.liked ? p.likes_count + 1 : p.likes_count - 1 }
          : p
      ));
    } catch {}
  }

  if (loading && posts.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {error ? (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={posts}
        keyExtractor={p => String(p.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            liked={liked.has(item.id)}
            onLike={() => handleLike(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.red} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          hasMore && posts.length > 0
            ? <ActivityIndicator color={Colors.red} style={{ margin: Spacing.xl }} />
            : null
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Sem posts ainda</Text>
            <Text style={s.emptySub}>Sê o primeiro a partilhar um projecto.</Text>
          </View>
        }
        contentContainerStyle={posts.length === 0 ? s.emptyContainer : { paddingBottom: Spacing.xxxl }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:Colors.bg },
  center:         { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:Colors.bg },
  errorBanner:    { backgroundColor:'#FEE2E2', padding:Spacing.md, margin:Spacing.md, borderRadius:8 },
  errorText:      { color:'#991B1B', fontSize:13, textAlign:'center' },
  empty:          { alignItems:'center', paddingTop:80 },
  emptyTitle:     { fontSize:18, fontWeight:'800', color:Colors.ink900, marginBottom:Spacing.sm },
  emptySub:       { fontSize:14, color:Colors.ink400 },
  emptyContainer: { flexGrow:1 },
});
