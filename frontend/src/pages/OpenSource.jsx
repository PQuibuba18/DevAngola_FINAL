import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import VerifiedBadge from '../components/ui/VerifiedBadge';

const CATEGORIES = ['web','mobile','api','tool','library','game','data','other'];
const STATUS_COLOR = { active:'#1A5C30', archived:'#888', seeking_contributors:'#1A3A8A' };
const STATUS_LABEL = { active:'Activo', archived:'Arquivado', seeking_contributors:'Procura Colaboradores' };

export default function OpenSource() {
  const { user }   = useAuth();
  const [projects, setProjects]  = useState([]);
  const [loading,  setLoading]   = useState(true);
  const [showForm, setShowForm]  = useState(false);
  const [filters,  setFilters]   = useState({ category:'', status:'' });
  const [form, setForm] = useState({ name:'', description:'', repo_url:'', demo_url:'', website_url:'', stack:'', category:'web' });
  const [saving,   setSaving]    = useState(false);
  const [starring, setStarring]  = useState(null);
  const [msg,      setMsg]       = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.status)   params.status   = filters.status;
    api.get('/open-source', { params }).then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filters]);

  function ch(e) { setForm(f => ({...f, [e.target.name]: e.target.value})); }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name || !form.description || !form.repo_url) { setMsg('Nome, descrição e repositório obrigatórios.'); return; }
    setSaving(true);
    try {
      const stack = form.stack.split(',').map(s => s.trim()).filter(Boolean);
      const r = await api.post('/open-source', { ...form, stack });
      setProjects(p => [r.data, ...p]);
      setShowForm(false);
      setForm({ name:'', description:'', repo_url:'', demo_url:'', website_url:'', stack:'', category:'web' });
      setMsg('Projecto publicado!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  async function toggleStar(proj) {
    if (!user) return;
    setStarring(proj.id);
    try {
      const r = await api.post(`/open-source/${proj.id}/star`);
      setProjects(prev => prev.map(p => p.id === proj.id ? {
        ...p,
        stars_count: r.data.starred ? p.stars_count + 1 : p.stars_count - 1,
        starred: r.data.starred,
      } : p));
    } catch {}
    finally { setStarring(null); }
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div style={{ maxWidth:860, margin:'0 auto' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--s6)', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontFamily:'var(--display)', fontSize:'var(--t-2xl)', fontWeight:'var(--w-black)', letterSpacing:'-.03em', color:'var(--ink-900)', marginBottom:4 }}>
                Open Source Angola
              </h1>
              <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)' }}>
                Projectos construídos por programadores angolanos. Descobre, contribui e faz crescer o ecossistema.
              </p>
            </div>
            {user && <Button style={{ width:'auto' }} onClick={() => setShowForm(!showForm)}>Publicar projecto</Button>}
          </div>

          {msg && <div style={{ background:'var(--ink-900)', color:'#fff', padding:'10px 16px', borderRadius:8, fontSize:13, fontWeight:600, marginBottom:16 }}>{msg}</div>}

          {/* Filtros */}
          <div style={{ display:'flex', gap:'var(--s3)', flexWrap:'wrap', marginBottom:'var(--s4)' }}>
            <select className="select" style={{ width:'auto' }} value={filters.category} onChange={e => setFilters(f=>({...f,category:e.target.value}))}>
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform:'capitalize' }}>{c}</option>)}
            </select>
            <select className="select" style={{ width:'auto' }} value={filters.status} onChange={e => setFilters(f=>({...f,status:e.target.value}))}>
              <option value="">Todos os estados</option>
              <option value="active">Activo</option>
              <option value="seeking_contributors">Procura Colaboradores</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>

          {showForm && (
            <div className="card" style={{ padding:'var(--s6)', marginBottom:'var(--s5)', borderLeft:'4px solid var(--red)' }}>
              <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', marginBottom:'var(--s5)' }}>Publicar Projecto Open Source</h3>
              <form onSubmit={handleCreate} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s3)' }}>
                <div className="field">
                  <label className="field__label">Nome do projecto *</label>
                  <input className="input" name="name" value={form.name} onChange={ch} placeholder="Ex: multicaixa-sdk" />
                </div>
                <div className="field">
                  <label className="field__label">Categoria</label>
                  <select className="select" name="category" value={form.category} onChange={ch}>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform:'capitalize' }}>{c}</option>)}
                  </select>
                </div>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label className="field__label">URL do Repositório * (GitHub / GitLab)</label>
                  <input className="input" name="repo_url" value={form.repo_url} onChange={ch} placeholder="https://github.com/..." />
                </div>
                <div className="field">
                  <label className="field__label">Demo (opcional)</label>
                  <input className="input" name="demo_url" value={form.demo_url} onChange={ch} placeholder="https://..." />
                </div>
                <div className="field">
                  <label className="field__label">Website (opcional)</label>
                  <input className="input" name="website_url" value={form.website_url} onChange={ch} placeholder="https://..." />
                </div>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label className="field__label">Stack (separada por vírgula)</label>
                  <input className="input" name="stack" value={form.stack} onChange={ch} placeholder="react, nodejs, postgresql" />
                </div>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label className="field__label">Descrição *</label>
                  <textarea className="textarea" rows={4} name="description" value={form.description} onChange={ch} placeholder="O que faz o projecto, para que serve, como contribuir..." />
                </div>
                <div style={{ gridColumn:'1/-1', display:'flex', gap:'var(--s3)', justifyContent:'flex-end' }}>
                  <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} style={{ width:'auto' }}>Publicar</Button>
                </div>
              </form>
            </div>
          )}

          {loading && <div className="spinner" />}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s3)' }}>
            {projects.map(p => (
              <div key={p.id} className="card" style={{ padding:'var(--s5)', display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background: STATUS_COLOR[p.status]+'20', color: STATUS_COLOR[p.status], display:'inline-block', marginBottom:6 }}>
                      {STATUS_LABEL[p.status]}
                    </span>
                    <h3 style={{ fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)', marginBottom:2 }}>{p.name}</h3>
                    {p.category && <span style={{ fontSize:11, color:'var(--ink-400)' }}>{p.category}</span>}
                  </div>
                  <button onClick={() => toggleStar(p)}
                    disabled={starring === p.id || !user}
                    style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'1.5px solid var(--ink-200)', padding:'4px 10px', borderRadius:999, cursor: user ? 'pointer' : 'default', fontSize:12, fontWeight:700, color:'var(--ink-600)' }}>
                    {starring === p.id ? '...' : `★ ${p.stars_count}`}
                  </button>
                </div>

                <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', lineHeight:1.5, flex:1 }}>
                  {p.description?.slice(0,120)}{p.description?.length>120?'...':''}
                </p>

                {p.stack && p.stack.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {p.stack.slice(0,5).map(s => (
                      <span key={s} style={{ fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:999, background:'var(--red-soft)', color:'var(--red)' }}>{s}</span>
                    ))}
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'var(--line)', paddingTop:'var(--s3)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Avatar name={p.owner_name} src={p.owner_avatar} size="xs" />
                    <div>
                      <span style={{ fontSize:12, color:'var(--ink-600)', fontWeight:600 }}>{p.owner_name}</span>
                      {p.owner_verified && <VerifiedBadge size="sm" />}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <a href={p.repo_url} target="_blank" rel="noreferrer"
                      style={{ fontSize:12, color:'var(--red)', fontWeight:700, textDecoration:'none' }}>
                      GitHub →
                    </a>
                    {p.demo_url && (
                      <a href={p.demo_url} target="_blank" rel="noreferrer"
                        style={{ fontSize:12, color:'var(--ink-400)', fontWeight:600, textDecoration:'none' }}>
                        Demo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && projects.length === 0 && (
            <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)', gridColumn:'1/-1' }}>
              Sem projectos publicados. Partilha o teu código com a comunidade!
            </div>
          )}
        </div>
      </div></div>
    </div>
  );
}
