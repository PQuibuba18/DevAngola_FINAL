import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { useLang }  from '../context/LanguageContext';
import api      from '../services/api';
import Navbar   from '../components/Navbar';
import PostCard from '../components/PostCard';
import Button   from '../components/ui/Button';
import Avatar   from '../components/ui/Avatar';
import { IconSend, IconLock } from '../components/ui/Icons';

const ROOMS = [
  { level: 'iniciante', label: 'Iniciante', desc: 'Primeiros passos. Perguntas basicas, duvidas iniciais, primeiros projectos.',  order: 1 },
  { level: 'junior',    label: 'Junior',    desc: 'A construir experiencia. HTML, CSS, JS, Python, primeiras APIs.',              order: 2 },
  { level: 'pleno',     label: 'Pleno',     desc: 'Profissional activo. Arquitectura, boas praticas, code review.',               order: 3 },
  { level: 'senior',    label: 'Senior',    desc: 'Referencia tecnica. Mentoria, decisoes de arquitectura, lideranca.',           order: 4 },
];

const LEVEL_ORDER = { iniciante: 1, junior: 2, pleno: 3, senior: 4 };

function canPost(userLevel, roomLevel) {
  if (userLevel === 'senior') return true;
  return (LEVEL_ORDER[userLevel] || 0) >= (LEVEL_ORDER[roomLevel] || 0);
}

export default function Salas() {
  const { user }         = useAuth();
  const { lang }         = useLang();
  const [params, setParams] = useSearchParams();
  const L                = lang === 'en';

  const initialLevel = params.get('level') || 'junior';
  const [active,   setActive]   = useState(ROOMS.find(r => r.level === initialLevel) || ROOMS[1]);
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [posting,  setPosting]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ title: '', content: '' });
  const [error,    setError]    = useState('');
  const listRef = useRef(null);

  const loadPosts = useCallback((room) => {
    setLoading(true);
    setError('');
    api.get(`/rooms/${room}/posts`)
      .then(r => setPosts(r.data))
      .catch(() => setError(L ? 'Error loading posts.' : 'Erro ao carregar posts.'))
      .finally(() => setLoading(false));
  }, [L]);

  useEffect(() => {
    loadPosts(active.level);
    setParams({ level: active.level }, { replace: true });
    setShowForm(false);
  }, [active, loadPosts, setParams]);

  async function handlePost(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setPosting(true); setError('');
    try {
      const r = await api.post(`/rooms/${active.level}/posts`, form);
      setPosts(prev => [r.data, ...prev]);
      setForm({ title: '', content: '' });
      setShowForm(false);
      listRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || (L ? 'Error publishing.' : 'Erro ao publicar.'));
    } finally {
      setPosting(false);
    }
  }

  const userLevel    = user?.level;
  const userCanPost  = userLevel && userLevel !== 'pendente' && canPost(userLevel, active.level);
  const isPendente   = !userLevel || userLevel === 'pendente';

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="salas-wrap">

          {/* Tabs de sala */}
          <div className="salas-tabs">
            {ROOMS.map(room => (
              <button
                key={room.level}
                className={`sala-tab sala-tab--${room.level}${active.level === room.level ? ' sala-tab--active' : ''}`}
                onClick={() => { setActive(room); setPosts([]); }}
              >
                <span className="sala-tab__label">{room.label}</span>
                {!canPost(userLevel, room.level) && !isPendente && (
                  <IconLock className="icon sala-tab__lock" />
                )}
              </button>
            ))}
          </div>

          {/* Descricao da sala activa */}
          <div className="sala-info card">
            <div className="sala-info__body">
              <div>
                <h2 className="sala-info__title">Sala {active.label}</h2>
                <p className="sala-info__desc">{active.desc}</p>
              </div>
              {isPendente ? (
                <div className="sala-info__blocked">
                  <IconLock className="icon icon--sm" />
                  <span>{L ? 'Complete the level quiz first.' : 'Completa o quiz de nivel primeiro.'}</span>
                </div>
              ) : userCanPost ? (
                <Button onClick={() => setShowForm(f => !f)} size="sm">
                  <IconSend className="icon icon--sm" />
                  {showForm ? (L ? 'Cancel' : 'Cancelar') : (L ? 'Post here' : 'Publicar aqui')}
                </Button>
              ) : (
                <div className="sala-info__blocked">
                  <IconLock className="icon icon--sm" />
                  <span>
                    {L
                      ? `Your level (${userLevel}) cannot post in this room.`
                      : `O teu nivel (${userLevel}) nao pode publicar nesta sala.`}
                  </span>
                </div>
              )}
            </div>

            {/* Tabela de acesso */}
            <div className="sala-info__access">
              <span className="sala-info__access-label">{L ? 'Who can read:' : 'Quem pode ler:'}</span>
              <span className="sala-access-pill sala-access-pill--all">
                {L ? 'Everyone' : 'Todos'}
              </span>
              <span className="sala-info__access-label" style={{ marginLeft:'var(--s4)' }}>
                {L ? 'Who can post:' : 'Quem pode publicar:'}
              </span>
              {ROOMS.filter(r => canPost(r.level, active.level)).map(r => (
                <span key={r.level} className={`sala-access-pill sala-access-pill--${r.level}`}>
                  {r.label}
                </span>
              ))}
            </div>
          </div>

          {/* Formulario de publicacao */}
          {showForm && userCanPost && (
            <div className="card" style={{ padding:'var(--s5)' }}>
              <div style={{ display:'flex', gap:'var(--s3)', marginBottom:'var(--s4)', alignItems:'center' }}>
                <Avatar name={user?.name} src={user?.avatar_url} size="sm" />
                <span style={{ fontSize:'var(--t-sm)', fontWeight:'var(--w-bold)', color:'var(--ink-700)' }}>
                  {user?.name}
                </span>
              </div>
              {error && <div className="error-banner" style={{ marginBottom:'var(--s3)' }}>{error}</div>}
              <form onSubmit={handlePost} style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                <input
                  className="input"
                  placeholder={L ? 'Title' : 'Titulo'}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
                <textarea
                  className="textarea"
                  placeholder={L ? 'Share your knowledge...' : 'Partilha o teu conhecimento...'}
                  rows={4}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  required
                />
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <Button type="submit" loading={posting}>
                    {L ? 'Publish' : 'Publicar'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de posts */}
          <div ref={listRef}>
            {loading && <div className="spinner" style={{ margin:'2rem auto' }} />}
            {!loading && error && !showForm && (
              <div className="card" style={{ padding:'2rem', textAlign:'center', color:'var(--red)' }}>
                {error}
              </div>
            )}
            {!loading && posts.length === 0 && (
              <div className="card" style={{ padding:'3rem', textAlign:'center', color:'var(--ink-400)', fontStyle:'italic' }}>
                {L
                  ? `No posts in the ${active.label} room yet.`
                  : `Ainda nao ha posts na sala ${active.label}.`}
                {userCanPost && (
                  <p style={{ marginTop:'var(--s3)', fontSize:'var(--t-sm)' }}>
                    {L ? 'Be the first to share something.' : 'Se o primeiro a partilhar algo.'}
                  </p>
                )}
              </div>
            )}
            {posts.map(p => <PostCard key={p.id} post={p} />)}
          </div>

        </div>
      </div></div>
    </div>
  );
}
