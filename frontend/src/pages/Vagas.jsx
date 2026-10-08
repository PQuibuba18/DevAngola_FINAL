import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';

const AREAS     = ['Frontend','Backend','Full Stack','Mobile','DevOps','Data','UI/UX','Segurança','IA / ML','Outro'];
const TYPES     = [{ value:'full-time', label:'Tempo Inteiro' },{ value:'part-time', label:'Meio Tempo' },{ value:'freelance', label:'Freelance' },{ value:'remoto', label:'Remoto' }];
const LEVELS    = [{ value:'iniciante', label:'Iniciante' },{ value:'junior', label:'Júnior' },{ value:'pleno', label:'Pleno' },{ value:'senior', label:'Sénior' },{ value:'qualquer', label:'Qualquer' }];
const LOCATIONS = ['Luanda','Benguela','Huambo','Namibe','Cabinda','Malanje','Huíla','Bié','Remoto','Internacional'];
const RECENCY   = [{ value:'7', label:'7 dias' },{ value:'30', label:'30 dias' },{ value:'', label:'Todos' }];

function levelToken(level) {
  const map = {
    iniciante: 'tag--iniciante',
    junior:    'tag--junior',
    pleno:     'tag--pleno',
    senior:    'tag--senior',
    qualquer:  'tag--neutral',
  };
  return map[level] || 'tag--neutral';
}

export default function Vagas() {
  const { user } = useAuth();
  const { lang } = useLang();

  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [applying,  setApplying]  = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [search,    setSearch]    = useState('');
  const [filters,   setFilters]   = useState({ level:'', type:'', location:'', area:'', days:'' });
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ company_name:'', title:'', description:'', level_required:'junior', location:'Luanda', type:'full-time', contact_email:'', skills:'' });
  const [msg,       setMsg]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit:50 };
      if (filters.level)    params.level    = filters.level;
      if (filters.type)     params.type     = filters.type;
      if (filters.location) params.location = filters.location;
      const r = await api.get('/jobs', { params });
      let list = Array.isArray(r.data) ? r.data : (r.data.jobs ?? []);
      if (filters.days) {
        const cutoff = new Date(Date.now() - Number(filters.days) * 864e5);
        list = list.filter(j => new Date(j.created_at) >= cutoff);
      }
      if (filters.area) {
        const a = filters.area.toLowerCase();
        list = list.filter(j =>
          j.title.toLowerCase().includes(a) ||
          j.description.toLowerCase().includes(a) ||
          (j.skills||[]).some(s => s.toLowerCase().includes(a))
        );
      }
      setJobs(list);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const visible = jobs.filter(j => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return j.title.toLowerCase().includes(q) || j.company_name.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) || (j.skills||[]).some(s => s.toLowerCase().includes(q));
  });

  async function handleApply(job) {
    if (job.applied) return;
    if (!window.confirm(`Confirmas a candidatura a "${job.title}"?`)) return;
    setApplying(job.id);
    try {
      await api.post(`/jobs/${job.id}/apply`);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applied:true, application_count:(j.application_count||0)+1 } : j));
    } catch (err) { flash(err.response?.data?.error || 'Erro ao candidatar.'); }
    finally { setApplying(null); }
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: f[k]===v ? '' : v })); }

  function chForm(e) { setForm(f => ({...f, [e.target.name]: e.target.value})); }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.company_name || !form.title || !form.description || !form.contact_email) { flash('Preenche todos os campos obrigatórios.'); return; }
    setSaving(true);
    try {
      const skills = form.skills.split(',').map(s=>s.trim()).filter(Boolean);
      const r = await api.post('/jobs', { ...form, skills });
      setJobs(p => [r.data.job, ...p]);
      setShowForm(false);
      setForm({ company_name:'', title:'', description:'', level_required:'junior', location:'Luanda', type:'full-time', contact_email:'', skills:'' });
      flash('Vaga publicada!');
    } catch (err) { flash(err.response?.data?.error || 'Erro ao publicar.'); }
    finally { setSaving(false); }
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  const hasFilters = Object.values(filters).some(Boolean) || search;

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="page-container">

          {msg && <div className="feedback feedback--success" style={{ position:'fixed', top:'calc(var(--nav-h) + 12px)', right:'var(--s5)', zIndex:999 }}>{msg}</div>}

          {/* Header */}
          <div className="page-header">
            <div className="page-header__text">
              <h1 className="page-header__title">Vagas de Tecnologia</h1>
              <p className="page-header__sub">
                {visible.length} oportunidade{visible.length !== 1 ? 's' : ''}{hasFilters ? ' (filtradas)' : ' em Angola'}
              </p>
            </div>
            <Button style={{ width:'auto' }} onClick={() => setShowForm(!showForm)}>Publicar vaga</Button>
          </div>

          {/* Formulário */}
          {showForm && (
            <div className="card card--accent-left card__body--lg" style={{ borderLeftColor:'var(--red)', marginBottom:'var(--s5)' }}>
              <h3 className="section-header">Nova Vaga</h3>
              <form onSubmit={handleCreate} className="form-grid">
                {[
                  { name:'company_name',  label:'Empresa *',         placeholder:'Ex: Unitel, BAI...' },
                  { name:'title',         label:'Cargo *',            placeholder:'Ex: Desenvolvedor React' },
                  { name:'contact_email', label:'Email de contacto *',placeholder:'rh@empresa.ao' },
                  { name:'location',      label:'Localização',        placeholder:'Luanda' },
                ].map(f => (
                  <div key={f.name} className="field">
                    <label className="field__label">{f.label}</label>
                    <input className="input" name={f.name} value={form[f.name]} onChange={chForm} placeholder={f.placeholder} />
                  </div>
                ))}
                <div className="field">
                  <label className="field__label">Nível</label>
                  <select className="select" name="level_required" value={form.level_required} onChange={chForm}>
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">Tipo</label>
                  <select className="select" name="type" value={form.type} onChange={chForm}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="field field-full">
                  <label className="field__label">Skills (separadas por vírgula)</label>
                  <input className="input" name="skills" value={form.skills} onChange={chForm} placeholder="react, nodejs, postgresql..." />
                </div>
                <div className="field field-full">
                  <label className="field__label">Descrição *</label>
                  <textarea className="textarea" name="description" value={form.description} onChange={chForm} rows={4} placeholder="Descreve a vaga, responsabilidades, requisitos..." />
                </div>
                <div className="field-actions">
                  <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} style={{ width:'auto' }}>Publicar vaga</Button>
                </div>
              </form>
            </div>
          )}

          {/* Pesquisa */}
          <div className="card" style={{ padding:'var(--s3) var(--s4)', marginBottom:'var(--s3)', display:'flex', gap:'var(--s3)', alignItems:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="input" style={{ border:'none', padding:0, height:'auto', flex:1, fontSize:'var(--t-base)', background:'none' }}
              placeholder="Pesquisar: título, empresa, skill..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {hasFilters && (
              <button onClick={() => { setFilters({ level:'', type:'', location:'', area:'', days:'' }); setSearch(''); }}
                className="caption" style={{ color:'var(--red)', fontWeight:'var(--w-black)', background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                Limpar filtros
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="stack--sm" style={{ marginBottom:'var(--s6)' }}>
            {[
              { label:'NÍVEL',    key:'level',    items: LEVELS.map(l => ({ value:l.value, label:l.label })),            cls:'chip--' },
              { label:'TIPO',     key:'type',     items: TYPES.map(t => ({ value:t.value, label:t.label })),             cls:'chip--red' },
              { label:'ÁREA',     key:'area',     items: AREAS.map(a => ({ value:a, label:a })),                         cls:'chip--' },
              { label:'LOCAL',    key:'location', items: LOCATIONS.map(l => ({ value:l, label:l })),                     cls:'chip--blue' },
              { label:'PERÍODO',  key:'days',     items: RECENCY.map(r => ({ value:r.value, label:r.label })),           cls:'chip--amber' },
            ].map(group => (
              <div key={group.key} className="filter-bar">
                <span className="filter-bar__label">{group.label}</span>
                {group.items.map(item => (
                  <button key={item.value}
                    className={`chip${filters[group.key]===item.value ? ` chip--active ${group.cls}` : ''}`}
                    onClick={() => setFilter(group.key, item.value)}>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {loading && <div className="spinner" />}

          <div className="stack--sm">
            {visible.map(job => <JobCard key={job.id} job={job} onApply={handleApply} applying={applying} />)}
            {!loading && visible.length === 0 && (
              <div className="card card--padded">
                {hasFilters ? 'Nenhuma vaga encontrada com estes filtros.' : 'Sem vagas publicadas. Sê o primeiro!'}
              </div>
            )}
          </div>
        </div>
      </div></div>
    </div>
  );
}

function JobCard({ job, onApply, applying }) {
  const [expanded, setExpanded] = useState(false);
  const typeLabel = { 'full-time':'Tempo Inteiro', 'part-time':'Meio Tempo', 'freelance':'Freelance', 'remoto':'Remoto' };

  function timeAgo(d) {
    const h = Math.floor((Date.now() - new Date(d)) / 36e5);
    if (h < 1) return 'Agora mesmo';
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    return `há ${days}d`;
  }

  return (
    <div className="card card--accent-left card__body--lg" style={{ borderLeftColor:`var(--level-${job.level_required}-text, var(--ink-200))` }}>
      <div className="row--between" style={{ alignItems:'flex-start', flexWrap:'wrap', gap:'var(--s4)' }}>
        <div style={{ flex:1, minWidth:0 }}>
          {/* Empresa + título */}
          <div className="stack--xs" style={{ marginBottom:'var(--s3)' }}>
            <span className="heading-sm">{job.title}</span>
            <span className="body-sm" style={{ color:'var(--ink-600)', fontWeight:'var(--w-medium)' }}>{job.company_name}</span>
          </div>

          {/* Tags de meta */}
          <div className="row--wrap" style={{ marginBottom:'var(--s2)' }}>
            <span className={`tag tag--${job.level_required || 'neutral'}`}>{job.level_required}</span>
            <span className="tag tag--neutral">{typeLabel[job.type] || job.type}</span>
            <span className="tag tag--neutral">{job.location}</span>
            <span className="caption">{timeAgo(job.created_at)}</span>
            <span className="caption">{job.application_count || 0} candidatos</span>
          </div>

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="row--wrap">
              {job.skills.slice(0,6).map(s => <span key={s} className="tag tag--red">{s}</span>)}
              {job.skills.length > 6 && <span className="caption">+{job.skills.length - 6}</span>}
            </div>
          )}

          {/* Descrição expandível */}
          {expanded && (
            <p className="body-sm" style={{ marginTop:'var(--s3)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{job.description}</p>
          )}

          <button onClick={() => setExpanded(e => !e)}
            className="caption" style={{ marginTop:'var(--s2)', color:'var(--ink-400)', fontWeight:'var(--w-bold)', background:'none', border:'none', cursor:'pointer' }}>
            {expanded ? 'Ver menos ▲' : 'Ler mais ▼'}
          </button>
        </div>

        {/* Acção */}
        <div style={{ flexShrink:0 }}>
          <button
            onClick={() => onApply(job)}
            disabled={!!job.applied || applying === job.id}
            style={{
              padding:'var(--s2) var(--s5)',
              borderRadius:'var(--r-sm)',
              border:'none',
              fontSize:'var(--t-sm)',
              fontWeight:'var(--w-bold)',
              cursor: job.applied ? 'default' : 'pointer',
              background: job.applied ? 'var(--green)' : 'var(--red)',
              color:'var(--white)',
              opacity: applying === job.id ? 0.7 : 1,
              transition:'opacity var(--t-fast)',
            }}>
            {applying === job.id ? '...' : job.applied ? 'Candidatado' : 'Candidatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
