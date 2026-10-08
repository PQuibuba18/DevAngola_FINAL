import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import VerifiedBadge from '../components/ui/VerifiedBadge';

const CATEGORIES = ['web','mobile','api','tool','library','game','data','other'];
const STATUS_TOKEN = {
  active:                { cls:'tag--green',  label:'Activo'               },
  archived:              { cls:'tag--neutral', label:'Arquivado'            },
  seeking_contributors:  { cls:'tag--blue',   label:'Procura Colaboradores' },
};

export default function OpenSource() {
  const { user }   = useAuth();
  const [projects, setProjects]  = useState([]);
  const [loading,  setLoading]   = useState(true);
  const [showForm, setShowForm]  = useState(false);
  const [filters,  setFilters]   = useState({ category:'', status:'' });
  const [saving,   setSaving]    = useState(false);
  const [starring, setStarring]  = useState(null);
  const [msg,      setMsg]       = useState('');
  const [form, setForm] = useState({
    name:'', description:'', repo_url:'',
    demo_url:'', website_url:'', stack:'', category:'web',
  });

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.status)   params.status   = filters.status;
    api.get('/open-source', { params })
      .then(r => setProjects(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  function ch(e) { setForm(f => ({...f, [e.target.name]: e.target.value})); }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name || !form.description || !form.repo_url) {
      flash('Nome, descrição e repositório obrigatórios.'); return;
    }
    setSaving(true);
    try {
      const stack = form.stack.split(',').map(s => s.trim()).filter(Boolean);
      const r = await api.post('/open-source', { ...form, stack });
      setProjects(p => [r.data, ...p]);
      setShowForm(false);
      setForm({ name:'', description:'', repo_url:'', demo_url:'', website_url:'', stack:'', category:'web' });
      flash('Projecto publicado!');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  async function toggleStar(proj) {
    if (!user) return;
    setStarring(proj.id);
    try {
      const r = await api.post(`/open-source/${proj.id}/star`);
      setProjects(prev => prev.map(p => p.id === proj.id
        ? { ...p, stars_count: r.data.starred ? p.stars_count + 1 : p.stars_count - 1, starred: r.data.starred }
        : p
      ));
    } catch {}
    finally { setStarring(null); }
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="page-container">

          {msg && <div className="toast toast--success">{msg}</div>}

          <div className="page-header">
            <div className="page-header__text">
              <h1 className="page-header__title">Open Source Angola</h1>
              <p className="page-header__sub">Projectos construídos por programadores angolanos. Descobre, contribui e faz crescer o ecossistema.</p>
            </div>
            {user && (
              <Button style={{ width:'auto' }} onClick={() => setShowForm(!showForm)}>
                Publicar projecto
              </Button>
            )}
          </div>

          {/* Filtros */}
          <div className="row--wrap" style={{ marginBottom:'var(--s5)', gap:'var(--s3)' }}>
            <select className="select" style={{ width:'auto' }} value={filters.category}
              onChange={e => setFilters(f=>({...f,category:e.target.value}))}>
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform:'capitalize' }}>{c}</option>)}
            </select>
            <select className="select" style={{ width:'auto' }} value={filters.status}
              onChange={e => setFilters(f=>({...f,status:e.target.value}))}>
              <option value="">Todos os estados</option>
              <option value="active">Activo</option>
              <option value="seeking_contributors">Procura Colaboradores</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>

          {/* Formulário */}
          {showForm && (
            <div className="card card--accent-left card__body--lg" style={{ borderLeftColor:'var(--red)', marginBottom:'var(--s5)' }}>
              <h3 className="section-header">Publicar Projecto Open Source</h3>
              <form onSubmit={handleCreate} className="form-grid">
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
                <div className="field field-full">
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
                <div className="field field-full">
                  <label className="field__label">Stack (separada por vírgula)</label>
                  <input className="input" name="stack" value={form.stack} onChange={ch} placeholder="react, nodejs, postgresql" />
                </div>
                <div className="field field-full">
                  <label className="field__label">Descrição *</label>
                  <textarea className="textarea" rows={4} name="description" value={form.description} onChange={ch}
                    placeholder="O que faz o projecto, para que serve, como contribuir..." />
                </div>
                <div className="field-actions">
                  <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} style={{ width:'auto' }}>Publicar</Button>
                </div>
              </form>
            </div>
          )}

          {loading && <div className="spinner" />}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s3)' }}>
            {projects.map(p => {
              const st = STATUS_TOKEN[p.status] || STATUS_TOKEN.active;
              return (
                <div key={p.id} className="card card__body--lg stack">
                  <div className="row--between" style={{ alignItems:'flex-start' }}>
                    <div className="stack--xs" style={{ flex:1 }}>
                      <span className={`tag ${st.cls}`}>{st.label}</span>
                      <span className="heading-sm">{p.name}</span>
                      {p.category && <span className="caption" style={{ textTransform:'capitalize' }}>{p.category}</span>}
                    </div>
                    <button
                      onClick={() => toggleStar(p)}
                      disabled={starring === p.id || !user}
                      className="btn btn--secondary btn--sm"
                      style={{ flexShrink:0 }}>
                      {starring === p.id ? '...' : `★ ${p.stars_count}`}
                    </button>
                  </div>

                  <p className="body-sm" style={{ flex:1 }}>
                    {p.description?.slice(0,120)}{p.description?.length > 120 ? '...' : ''}
                  </p>

                  {p.stack?.length > 0 && (
                    <div className="row--wrap">
                      {p.stack.slice(0,5).map(s => <span key={s} className="tag tag--red">{s}</span>)}
                    </div>
                  )}

                  <div className="card__footer">
                    <div className="row--sm">
                      <Avatar name={p.owner_name} src={p.owner_avatar} size="xs" />
                      <div className="stack--xs">
                        <span className="body-sm" style={{ fontWeight:'var(--w-bold)' }}>{p.owner_name}</span>
                        {p.owner_verified && <VerifiedBadge size="sm" />}
                      </div>
                    </div>
                    <div className="row--sm">
                      <a href={p.repo_url} target="_blank" rel="noreferrer"
                        className="body-sm" style={{ color:'var(--red)', fontWeight:'var(--w-bold)', textDecoration:'none' }}>
                        GitHub →
                      </a>
                      {p.demo_url && (
                        <a href={p.demo_url} target="_blank" rel="noreferrer"
                          className="caption" style={{ textDecoration:'none', color:'var(--ink-500)' }}>
                          Demo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && projects.length === 0 && (
            <div className="card card--padded">Sem projectos publicados. Partilha o teu código!</div>
          )}
        </div>
      </div></div>
    </div>
  );
}
