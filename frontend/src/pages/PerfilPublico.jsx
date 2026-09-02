import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import Button from '../components/ui/Button';
import PostCard from '../components/PostCard';
import { IconArrowLeft, IconMessage } from '../components/ui/Icons';

function fmtDate(d, locale) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export default function PerfilPublico() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user: me } = useAuth();
  const { lang }     = useLang();
  const locale       = lang === 'en' ? 'en-GB' : 'pt-AO';

  const [profile,  setProfile]  = useState(null);
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [following, setFollowing] = useState(false);
  const [toggling,  setToggling]  = useState(false);
  const [starting,  setStarting]  = useState(false);

  const isOwnProfile = me && String(me.id) === String(id);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Carrega perfil e posts em paralelo
      const [u, p] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/posts?userId=${id}&limit=20`),
      ]);
      setProfile(u.data);
      // Suporta resposta paginada { posts: [] } e array directo []
      const postList = Array.isArray(p.data) ? p.data : (p.data.posts ?? []);
      setPosts(postList);
    } catch {
      setError(lang === 'en' ? 'User not found.' : 'Utilizador não encontrado.');
    } finally {
      setLoading(false);
    }
  }, [id, lang]);

  useEffect(() => { load(); }, [load]);

  async function startChat() {
    setStarting(true);
    try {
      const r = await api.post('/messages/start', { targetUserId: Number(id) });
      navigate(`/mensagens/${r.data.conversationId}`);
    } catch { setStarting(false); }
  }

  async function toggleFollow() {
    if (!me || isOwnProfile || toggling) return;
    setToggling(true);
    try {
      await api.post(`/users/${id}/follow`);
      setFollowing(f => !f);
      setProfile(p => p ? {
        ...p,
        followers_count: following
          ? (p.followers_count || 1) - 1
          : (p.followers_count || 0) + 1,
      } : p);
    } catch {} finally { setToggling(false); }
  }

  if (loading) return (
    <div className="page"><Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="spinner" />
      </div></div>
    </div>
  );

  if (error || !profile) return (
    <div className="page"><Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="card card--padded" style={{ textAlign:'center', marginTop: 40 }}>
          <p style={{ color:'var(--ink-400)', marginBottom: 16 }}>{error || 'Utilizador não encontrado.'}</p>
          <Button variant="secondary" onClick={() => navigate(-1)} style={{ width:'auto' }}>
            ← Voltar
          </Button>
        </div>
      </div></div>
    </div>
  );

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Botão voltar */}
          <button className="newpost-back" onClick={() => navigate(-1)}>
            <IconArrowLeft className="icon icon--sm" />
            {lang === 'en' ? 'Back' : 'Voltar'}
          </button>

          {/* Card do perfil */}
          <div className="card" style={{ padding:'var(--s8)', marginBottom:'var(--s4)', textAlign:'center' }}>
            <Avatar name={profile.name} src={profile.avatar_url} size="2xl" />
            <h1 style={{ fontFamily:'var(--display)', fontSize:'var(--t-xl)', fontWeight:'var(--w-black)', margin:'var(--s4) 0 var(--s2)' }}>
              {profile.name}
              {profile.verified && (
                <span style={{ fontSize:'var(--t-sm)', color:'#1E5631', marginLeft: 8 }}>✓</span>
              )}
            </h1>
            {profile.badge && (
              <span className={`seal seal--${profile.badge}`} style={{ marginBottom:'var(--s2)', display:'inline-block' }}>
                {profile.badge_label}
              </span>
            )}
            <div style={{ display:'flex', justifyContent:'center', gap:'var(--s2)', marginBottom:'var(--s2)' }}>
              <Badge level={profile.level} />
            </div>
            {profile.identifier && (
              <p style={{ color:'var(--ink-400)', fontSize:'var(--t-sm)', marginBottom:'var(--s4)' }}>
                {profile.identifier}
              </p>
            )}

            {/* Stats */}
            <div style={{ display:'flex', justifyContent:'center', gap:'var(--s8)', marginBottom:'var(--s6)', borderTop:'var(--line)', borderBottom:'var(--line)', padding:'var(--s4) 0' }}>
              {[
                { label: lang==='en'?'Posts':'Posts',             value: posts.length },
                { label: lang==='en'?'Followers':'Seguidores',    value: profile.followers_count || 0 },
                { label: lang==='en'?'Following':'A seguir',      value: profile.following_count || 0 },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--display)', fontSize:'var(--t-xl)', fontWeight:'var(--w-black)', color:'var(--ink-900)' }}>{s.value}</div>
                  <div style={{ fontSize:'var(--t-xs)', color:'var(--ink-400)', fontWeight:'var(--w-bold)', textTransform:'uppercase', letterSpacing:'.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Acções */}
            <div style={{ display:'flex', justifyContent:'center', gap:'var(--s3)' }}>
              {isOwnProfile ? (
                <Button as={Link} to="/perfil" variant="secondary" style={{ width:'auto' }}>
                  {lang==='en' ? 'Edit profile' : 'Editar perfil'}
                </Button>
              ) : me && (
                <>
                  <Button onClick={toggleFollow} loading={toggling} style={{ width:'auto' }}
                    variant={following ? 'secondary' : 'primary'}>
                    {following
                      ? (lang==='en' ? 'Unfollow' : 'Deixar de seguir')
                      : (lang==='en' ? 'Follow' : 'Seguir')}
                  </Button>
                  <Button variant="secondary" onClick={startChat} loading={starting} style={{ width:'auto' }}>
                    <IconMessage className="icon icon--sm" /> {lang==='en'?'Message':'Mensagem'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Posts do utilizador */}
          <h2 style={{ fontSize:'var(--t-md)', fontWeight:'var(--w-black)', color:'var(--ink-900)', marginBottom:'var(--s4)' }}>
            Posts ({posts.length})
          </h2>
          {posts.length === 0 ? (
            <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
              {lang==='en' ? 'No posts yet.' : 'Sem posts ainda.'}
            </div>
          ) : (
            posts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      </div></div>
    </div>
  );
}
