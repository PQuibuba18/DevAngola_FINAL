import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link }     from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { useLang }  from '../context/LanguageContext';
import api     from '../services/api';
import Navbar  from '../components/Navbar';
import Avatar  from '../components/ui/Avatar';
import Badge   from '../components/ui/Badge';
import Button  from '../components/ui/Button';
import {
  IconArrowLeft, IconMessage, IconHome, IconAward,
  IconHeart, IconComment, IconUserPlus, IconUserCheck,
} from '../components/ui/Icons';

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

  const [profile,   setProfile]   = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [starting,  setStarting]  = useState(false);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [toggling,  setToggling]  = useState(false);

  const isOwnProfile = me && String(me.id) === String(id);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/posts?userId=${id}`),
      me && !isOwnProfile ? api.get(`/users/${id}/follow-status`) : Promise.resolve(null),
    ])
      .then(([u, p, fs]) => {
        setProfile(u.data);
        setFollowers(u.data.followers || 0);
        setFollowingCount(u.data.following || 0);
        setPosts((p.data || []).filter(post => String(post.user_id) === String(id)));
        if (fs) setFollowing(fs.data.following);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, me, isOwnProfile]);

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
      const r = following
        ? await api.delete(`/users/${id}/follow`)
        : await api.post(`/users/${id}/follow`);
      setFollowing(r.data.following);
      setFollowers(r.data.followers);
    } catch {}
    finally { setToggling(false); }
  }

  if (loading) return (
    <div className="page">
      <Navbar />
      <div className="page-body" style={{ display:'flex', justifyContent:'center', paddingTop:'4rem' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  if (error || !profile) return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="pubprofile-wrap">
          <button className="newpost-back" onClick={() => navigate(-1)}>
            <IconArrowLeft className="icon icon--sm" />
            {lang === 'en' ? 'Back' : 'Voltar'}
          </button>
          <div className="card" style={{ padding:'3rem', textAlign:'center', color:'var(--ink-400)' }}>
            <p>{lang === 'en' ? 'User not found.' : 'Utilizador nao encontrado.'}</p>
          </div>
        </div>
      </div></div>
    </div>
  );

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="pubprofile-wrap">

          <button className="newpost-back" onClick={() => navigate(-1)}>
            <IconArrowLeft className="icon icon--sm" />
            {lang === 'en' ? 'Back' : 'Voltar'}
          </button>

          <div className="pubprofile-card card">
            <div className="pubprofile-cover" />

            <div className="pubprofile-body">
              <div className="pubprofile-identity">
                <div className="pubprofile-avatar-wrap">
                  <Avatar name={profile.name} src={profile.avatar_url} size="2xl" />
                  {profile.role === 'admin' && (
                    <span className="admin-pill" style={{ position:'absolute', bottom:0, right:-4 }}>
                      <IconAward className="icon" style={{ width:9, height:9 }} /> Admin
                    </span>
                  )}
                </div>
                <div className="pubprofile-names">
                  <h1 className="pubprofile-name">{profile.name}</h1>
                  <div className="pubprofile-meta">
                    <Badge level={profile.level} lang={lang} />
                    {profile.badge && (
                      <span className={`seal seal--${profile.badge}`}>{profile.badge_label}</span>
                    )}
                    {profile.identifier && (
                      <span className="pubprofile-identifier">{profile.identifier}</span>
                    )}
                  </div>
                  {profile.nationality && (
                    <p className="pubprofile-nationality">{profile.nationality}</p>
                  )}
                </div>
              </div>

              <div className="pubprofile-actions">
                {!isOwnProfile && me && (
                  <Button
                    variant={following ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={toggleFollow}
                    loading={toggling}
                  >
                    {following
                      ? <><IconUserCheck className="icon icon--sm" /> {lang === 'en' ? 'Following' : 'A seguir'}</>
                      : <><IconUserPlus  className="icon icon--sm" /> {lang === 'en' ? 'Follow' : 'Seguir'}</>
                    }
                  </Button>
                )}
                {!isOwnProfile && me && (
                  <Button variant="ghost" size="sm" onClick={startChat} loading={starting}>
                    <IconMessage className="icon icon--sm" />
                    {lang === 'en' ? 'Message' : 'Mensagem'}
                  </Button>
                )}
                {isOwnProfile && (
                  <Button as={Link} to="/perfil" variant="secondary" size="sm">
                    {lang === 'en' ? 'Edit profile' : 'Editar perfil'}
                  </Button>
                )}
              </div>
            </div>

            <div className="pubprofile-stats">
              <div className="pubprofile-stat">
                <IconHome className="icon icon--sm" style={{ color:'var(--ink-400)' }} />
                <strong>{posts.length}</strong>
                <span>{lang === 'en' ? 'posts' : 'posts'}</span>
              </div>
              <div className="pubprofile-stat">
                <IconHeart className="icon icon--sm" style={{ color:'var(--red)' }} />
                <strong>{posts.reduce((acc, p) => acc + (p.likes_count || 0), 0)}</strong>
                <span>{lang === 'en' ? 'likes' : 'gostos'}</span>
              </div>
              <div className="pubprofile-stat">
                <IconComment className="icon icon--sm" style={{ color:'var(--ink-400)' }} />
                <strong>{posts.reduce((acc, p) => acc + (p.comments_count || 0), 0)}</strong>
                <span>{lang === 'en' ? 'comments' : 'comentarios'}</span>
              </div>
              <div className="pubprofile-stat pubprofile-stat--follow">
                <strong>{followers}</strong>
                <span>{lang === 'en' ? 'followers' : 'seguidores'}</span>
              </div>
              <div className="pubprofile-stat pubprofile-stat--follow">
                <strong>{followingCount}</strong>
                <span>{lang === 'en' ? 'following' : 'a seguir'}</span>
              </div>
              <div className="pubprofile-stat pubprofile-stat--date">
                <span className="pubprofile-stat__label">
                  {lang === 'en' ? 'Member since' : 'Membro desde'}
                </span>
                <strong>{fmtDate(profile.created_at, locale)}</strong>
              </div>
            </div>
          </div>

          <h2 className="pubprofile-posts-title">
            Posts <span>({posts.length})</span>
          </h2>

          {posts.length === 0 && (
            <div className="card" style={{ padding:'2.5rem', textAlign:'center', color:'var(--ink-400)', fontStyle:'italic' }}>
              {lang === 'en' ? 'No posts yet.' : 'Ainda nao ha posts.'}
            </div>
          )}

          <div className="pubprofile-posts">
            {posts.map(post => (
              <Link key={post.id} to={`/posts/${post.id}`} className="pubprofile-post card">
                {post.image_url && (
                  <img
                    src={post.image_url.startsWith('http')
                      ? post.image_url
                      : `${(process.env.REACT_APP_API_URL || '').replace('/api','')}${post.image_url}`}
                    alt={post.title}
                    className="pubprofile-post__img"
                  />
                )}
                <div className="pubprofile-post__body">
                  <h3 className="pubprofile-post__title">{post.title}</h3>
                  <p className="pubprofile-post__excerpt">
                    {post.content?.slice(0, 120)}{post.content?.length > 120 ? '...' : ''}
                  </p>
                  <div className="pubprofile-post__foot">
                    <span className="pubprofile-post__stat">
                      <IconHeart className="icon icon--sm" style={{ color:'var(--red)' }} />
                      {post.likes_count || 0}
                    </span>
                    <span className="pubprofile-post__stat">
                      <IconComment className="icon icon--sm" />
                      {post.comments_count || 0}
                    </span>
                    <span className="pubprofile-post__date">
                      {new Date(post.created_at).toLocaleDateString(locale)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div></div>
    </div>
  );
}
