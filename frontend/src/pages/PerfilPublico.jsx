import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import Button from '../components/ui/Button';
import VerifiedBadge from '../components/ui/VerifiedBadge';

export default function PerfilPublico() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user: me } = useAuth();
  const { lang }     = useLang();

  const [profile,   setProfile]  = useState(null);
  const [posts,     setPosts]    = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState('');
  const [following, setFollowing]= useState(false);
  const [toggling,  setToggling] = useState(false);
  const [starting,  setStarting] = useState(false);

  const isOwnProfile = me && String(me.id) === String(id);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [u, p] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/posts?userId=${id}&limit=20`),
      ]);
      setProfile(u.data);
      setPosts(Array.isArray(p.data) ? p.data : (p.data.posts ?? []));
    } catch {
      setError(lang==='en' ? 'User not found.' : 'Utilizador não encontrado.');
    } finally { setLoading(false); }
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
        followers_count: following ? (p.followers_count||1)-1 : (p.followers_count||0)+1,
      } : p);
    } catch {}
    finally { setToggling(false); }
  }

  if (loading) return (
    <div className="page"><Navbar />
      <div className="page-body" style={{ display:'flex', justifyContent:'center', paddingTop:'var(--s16)' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  if (error || !profile) return (
    <div className="page"><Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="card card--padded">
          <p>{error || 'Utilizador não encontrado.'}</p>
          <Button variant="secondary" onClick={() => navigate(-1)} style={{ width:'auto', marginTop:'var(--s4)' }}>
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
        <div className="page-container">

          <button className="btn-back" onClick={() => navigate(-1)}>← Voltar</button>

          {/* Card de perfil */}
          <div className="card card__body--lg" style={{ marginBottom:'var(--s4)', textAlign:'center' }}>
            <Avatar name={profile.name} src={profile.avatar_url} size="2xl" />

            <div style={{ marginTop:'var(--s4)', marginBottom:'var(--s3)' }}>
              <div className="row--wrap" style={{ justifyContent:'center', marginBottom:'var(--s2)' }}>
                <h1 className="heading-lg" style={{ margin:0 }}>{profile.name}</h1>
                {profile.verified && <VerifiedBadge lang={lang} />}
              </div>
              {profile.badge && (
                <span className={`seal seal--${profile.badge}`} style={{ display:'inline-block', marginBottom:'var(--s2)' }}>
                  {profile.badge_label}
                </span>
              )}
              <div className="row--wrap" style={{ justifyContent:'center' }}>
                <Badge level={profile.level} />
              </div>
              {profile.identifier && (
                <p className="body-sm" style={{ marginTop:'var(--s2)' }}>{profile.identifier}</p>
              )}
            </div>

            {/* Stats */}
            <div className="row" style={{ justifyContent:'center', gap:'var(--s8)', padding:'var(--s4) 0', borderTop:'var(--line)', borderBottom:'var(--line)', marginBottom:'var(--s4)' }}>
              {[
                { label:'Posts',      value: posts.length },
                { label: lang==='en'?'Followers':'Seguidores', value: profile.followers_count||0 },
                { label: lang==='en'?'Following':'A seguir',   value: profile.following_count||0 },
              ].map(s => (
                <div key={s.label} className="stat-block">
                  <span className="stat-block__value">{s.value}</span>
                  <span className="stat-block__label">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Acções */}
            <div className="row--wrap" style={{ justifyContent:'center' }}>
              <Link to={`/passport/${profile.id}`}>
                <Button style={{ width:'auto' }}>Passport Profissional</Button>
              </Link>
              {isOwnProfile ? (
                <Link to="/perfil">
                  <Button variant="secondary" style={{ width:'auto' }}>
                    {lang==='en' ? 'Edit profile' : 'Editar perfil'}
                  </Button>
                </Link>
              ) : me && (
                <>
                  <Button
                    onClick={toggleFollow} loading={toggling} style={{ width:'auto' }}
                    variant={following ? 'secondary' : 'primary'}>
                    {following
                      ? (lang==='en' ? 'Unfollow' : 'Deixar de seguir')
                      : (lang==='en' ? 'Follow' : 'Seguir')}
                  </Button>
                  <Button variant="secondary" onClick={startChat} loading={starting} style={{ width:'auto' }}>
                    {lang==='en' ? 'Message' : 'Mensagem'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Posts */}
          <h2 className="section-header">Posts ({posts.length})</h2>
          {posts.length === 0 ? (
            <div className="card card--padded">
              {lang==='en' ? 'No posts yet.' : 'Sem posts ainda.'}
            </div>
          ) : (
            <div className="stack--sm">
              {posts.map(p => (
                <div key={p.id} className="card card__body">
                  <h3 className="heading-sm" style={{ marginBottom:'var(--s1)' }}>{p.title}</h3>
                  <p className="body-sm">{p.content?.slice(0,160)}{p.content?.length>160?'...':''}</p>
                  <div className="meta-line" style={{ marginTop:'var(--s2)' }}>
                    <span>{new Date(p.created_at).toLocaleDateString('pt-AO')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div></div>
    </div>
  );
}
