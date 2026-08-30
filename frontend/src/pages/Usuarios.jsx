import { useState, useEffect } from 'react';
import { Link, useNavigate }   from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { useLang }  from '../context/LanguageContext';
import api     from '../services/api';
import Navbar  from '../components/Navbar';
import Avatar  from '../components/ui/Avatar';
import Badge   from '../components/ui/Badge';
import Button  from '../components/ui/Button';
import { IconSearch, IconMessage, IconUserPlus, IconUserCheck } from '../components/ui/Icons';

export default function Usuarios() {
  const { t, lang }  = useLang();
  const { user: me } = useAuth();
  const nav          = useNavigate();

  const [all,      setAll]      = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search,   setSearch]   = useState('');
  const [level,    setLevel]    = useState('');
  const [loading,  setLoading]  = useState(true);
  // mapa userId -> boolean de estado de follow
  const [follows,  setFollows]  = useState({});
  const [toggling, setToggling] = useState({});

  useEffect(() => {
    api.get('/users')
      .then(r => { setAll(r.data); setFiltered(r.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let r = all;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (level) r = r.filter(u => u.level === level);
    setFiltered(r);
  }, [search, level, all]);

  async function startChat(userId) {
    try {
      const r = await api.post('/messages/start', { targetUserId: userId });
      nav(`/mensagens/${r.data.conversationId}`);
    } catch {}
  }

  async function toggleFollow(userId) {
    if (!me || toggling[userId]) return;
    setToggling(prev => ({ ...prev, [userId]: true }));
    try {
      const isFollowing = follows[userId];
      const r = isFollowing
        ? await api.delete(`/users/${userId}/follow`)
        : await api.post(`/users/${userId}/follow`);
      setFollows(prev => ({ ...prev, [userId]: r.data.following }));
    } catch {}
    finally { setToggling(prev => ({ ...prev, [userId]: false })); }
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner"><div className="users-wrap">

        <div className="users-head">
          <h1 className="users-head__title">{t.usersTitle}</h1>
          <p className="users-head__sub">
            {filtered.length} {lang === 'en' ? 'developers found' : 'programadores encontrados'}
          </p>
        </div>

        <div className="users-filters card">
          <div style={{ position:'relative', flex:1, minWidth:180 }}>
            <IconSearch className="icon icon--sm" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', pointerEvents:'none' }} />
            <input
              className="input"
              style={{ paddingLeft:36, height:38 }}
              placeholder={t.searchUsers}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="select" style={{ width:160, height:38, flexShrink:0 }} value={level} onChange={e => setLevel(e.target.value)}>
            <option value="">{t.allLevels}</option>
            <option value="iniciante">{t.iniciante}</option>
            <option value="junior">{t.junior}</option>
            <option value="pleno">{t.pleno}</option>
            <option value="senior">{t.senior}</option>
          </select>
        </div>

        {loading && <div className="spinner" />}

        {!loading && filtered.length === 0 && (
          <p style={{ textAlign:'center', color:'var(--ink-400)', padding:'32px 0', fontStyle:'italic' }}>
            {t.noUsersFound}
          </p>
        )}

        <div className="users-list">
          {filtered.map(u => {
            const isMe        = me && String(me.id) === String(u.id);
            const isFollowing = follows[u.id] || false;
            return (
              <div key={u.id} className="user-row card">
                <Avatar name={u.name} src={u.avatar_url} size="md" />
                <div className="user-row__info">
                  <div className="user-row__name">
                    {u.name}
                    {u.badge && (
                      <span className={`seal seal--${u.badge}`} style={{ marginLeft:6 }}>
                        {u.badge_label}
                      </span>
                    )}
                  </div>
                  <Badge level={u.level} lang={lang} />
                  {u.identifier && (
                    <span style={{ fontSize:'var(--t-xs)', color:'var(--ink-400)', marginTop:2, display:'block' }}>
                      {u.identifier}
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  {!isMe && me && (
                    <Button
                      variant={isFollowing ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => toggleFollow(u.id)}
                      loading={toggling[u.id]}
                      title={isFollowing
                        ? (lang === 'en' ? 'Unfollow' : 'Deixar de seguir')
                        : (lang === 'en' ? 'Follow' : 'Seguir')}
                    >
                      {isFollowing
                        ? <IconUserCheck className="icon icon--sm" />
                        : <IconUserPlus  className="icon icon--sm" />}
                    </Button>
                  )}
                  {!isMe && (
                    <Button variant="ghost" size="sm" onClick={() => startChat(u.id)} title={t.sendMessage}>
                      <IconMessage className="icon icon--sm" />
                    </Button>
                  )}
                  <Button as={Link} to={`/usuarios/${u.id}`} variant="secondary" size="sm">
                    {t.viewProfile}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

      </div></div></div>
    </div>
  );
}
