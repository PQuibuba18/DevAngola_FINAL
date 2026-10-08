import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';

const INDUSTRIES = ['Fintech','Edtech','Healthtech','Agritech','Logtech','E-commerce','SaaS','Media','Govtech','Outro'];
const STAGES = [
  { value:'idea',    label:'Ideia'       },
  { value:'mvp',     label:'MVP'         },
  { value:'early',   label:'Early Stage' },
  { value:'growth',  label:'Growth'      },
  { value:'scaling', label:'Scaling'     },
];
const FUNDING_TYPES = ['grant','competition','incubator','accelerator','scholarship','investment','other'];
const FUND_LABEL    = { grant:'Subsídio', competition:'Concurso', incubator:'Incubadora', accelerator:'Aceleradora', scholarship:'Bolsa', investment:'Investimento', other:'Outro' };

function stageToken(stage) {
  const map = {
    idea:    { text:'var(--ink-500)', bg:'var(--ink-100)'   },
    mvp:     { text:'var(--blue)',    bg:'var(--blue-soft)'  },
    early:   { text:'var(--amber)',   bg:'var(--amber-soft)' },
    growth:  { text:'var(--green)',   bg:'var(--green-soft)' },
    scaling: { text:'var(--purple)',  bg:'var(--purple-soft)'},
  };
  return map[stage] || map.idea;
}

export default function Startups() {
  const { user }   = useAuth();
  const [tab,      setTab]      = useState('startups');
  const [startups, setStartups] = useState([]);
  const [funding,  setFunding]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters,  setFilters]  = useState({ industry:'', stage:'', hiring:false, cofounder:false });
  const [form, setForm] = useState({
    name:'', tagline:'', description:'', industry:'Fintech', stage:'idea',
    city:'Luanda', website:'', is_hiring:false,
    is_seeking_investment:false, is_seeking_cofounder:false, founded_year:'',
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  useEffect(() => {
    setLoading(true);
    if (tab === 'startups') {
      const params = {};
      if (filters.industry)  params.industry  = filters.industry;
      if (filters.stage)     params.stage     = filters.stage;
      if (filters.hiring)    params.hiring    = 'true';
      if (filters.cofounder) params.cofounder = 'true';
      api.get('/startups', { params }).then(r => setStartups(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else if (tab === 'funding') {
      api.get('/startups/funding/list').then(r => setFunding(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab, filters]);

  function ch(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({...f, [e.target.name]: val}));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name || !form.description || !form.industry) { flash('Nome, descrição e indústria obrigatórios.'); return; }
    setSaving(true);
    try {
      const r = await api.post('/startups', { ...form, founded_year: form.founded_year||null });
      setStartups(s => [r.data, ...s]);
      setShowForm(false);
      flash('Startup publicada!');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  const TABS = [
    { key:'startups', label:'Startups' },
    { key:'funding',  label:'Financiamento' },
    { key:'matches',  label:'Founder Match' },
  ];

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="page-container">

          {msg && <div className="feedback feedback--success" style={{ position:'fixed', top:'calc(var(--nav-h) + 12px)', right:'var(--s5)', zIndex:999 }}>{msg}</div>}

          <div className="page-header">
            <div className="page-header__text">
              <h1 className="page-header__title">Startup Network</h1>
              <p className="page-header__sub">Conectar talento, empreendedores, investidores e oportunidades em Angola.</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:2, marginBottom:'var(--s6)', borderBottom:'var(--line)', position:'relative' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`admin-tab${tab===t.key?' admin-tab--active':''}`}>
                {t.label}
              </button>
            ))}
            {user && tab==='startups' && (
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', paddingBottom:'var(--s2)' }}>
                <Button style={{ width:'auto', fontSize:'var(--t-sm)' }} onClick={() => setShowForm(!showForm)}>
                  + Publicar Startup
                </Button>
              </div>
            )}
          </div>

          {/* ── STARTUPS ── */}
          {tab === 'startups' && (
            <div className="stack">
              {/* Filtros */}
              <div className="row--wrap">
                <select className="select" style={{ width:'auto' }} value={filters.industry} onChange={e => setFilters(f=>({...f,industry:e.target.value}))}>
                  <option value="">Todas as indústrias</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
                <select className="select" style={{ width:'auto' }} value={filters.stage} onChange={e => setFilters(f=>({...f,stage:e.target.value}))}>
                  <option value="">Todos os estágios</option>
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <label style={{ display:'flex', gap:'var(--s2)', alignItems:'center', cursor:'pointer' }}>
                  <input type="checkbox" checked={filters.hiring} onChange={e => setFilters(f=>({...f,hiring:e.target.checked}))} />
                  <span className="caption" style={{ fontWeight:'var(--w-black)' }}>A contratar</span>
                </label>
                <label style={{ display:'flex', gap:'var(--s2)', alignItems:'center', cursor:'pointer' }}>
                  <input type="checkbox" checked={filters.cofounder} onChange={e => setFilters(f=>({...f,cofounder:e.target.checked}))} />
                  <span className="caption" style={{ fontWeight:'var(--w-black)' }}>Procura co-fundador</span>
                </label>
              </div>

              {/* Formulário */}
              {showForm && (
                <div className="card card--accent-left card__body--lg" style={{ borderLeftColor:'var(--red)' }}>
                  <h3 className="section-header">Publicar Startup</h3>
                  <form onSubmit={handleCreate} className="form-grid">
                    <div className="field field-full">
                      <label className="field__label">Nome da startup *</label>
                      <input className="input" name="name" value={form.name} onChange={ch} placeholder="Ex: PayAngola" />
                    </div>
                    <div className="field field-full">
                      <label className="field__label">Tagline</label>
                      <input className="input" name="tagline" value={form.tagline} onChange={ch} placeholder="Ex: Pagamentos simples para todos os angolanos" />
                    </div>
                    <div className="field">
                      <label className="field__label">Indústria *</label>
                      <select className="select" name="industry" value={form.industry} onChange={ch}>
                        {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label className="field__label">Estágio</label>
                      <select className="select" name="stage" value={form.stage} onChange={ch}>
                        {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label className="field__label">Cidade</label>
                      <input className="input" name="city" value={form.city} onChange={ch} placeholder="Luanda" />
                    </div>
                    <div className="field">
                      <label className="field__label">Website</label>
                      <input className="input" name="website" value={form.website} onChange={ch} placeholder="https://..." />
                    </div>
                    <div className="field field-full" style={{ display:'flex', gap:'var(--s5)', flexWrap:'wrap' }}>
                      {[
                        { name:'is_hiring',            label:'A contratar' },
                        { name:'is_seeking_investment', label:'À procura de investimento' },
                        { name:'is_seeking_cofounder',  label:'À procura de co-fundador' },
                      ].map(f => (
                        <label key={f.name} style={{ display:'flex', gap:'var(--s2)', alignItems:'center', cursor:'pointer' }}>
                          <input type="checkbox" name={f.name} checked={form[f.name]} onChange={ch} />
                          <span className="body-sm" style={{ fontWeight:'var(--w-bold)' }}>{f.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="field field-full">
                      <label className="field__label">Descrição *</label>
                      <textarea className="textarea" rows={4} name="description" value={form.description} onChange={ch} placeholder="O que a startup faz, problema que resolve, mercado alvo..." />
                    </div>
                    <div className="field-actions">
                      <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                      <Button type="submit" loading={saving} style={{ width:'auto' }}>Publicar</Button>
                    </div>
                  </form>
                </div>
              )}

              {loading && <div className="spinner" />}

              {startups.map(s => {
                const st = stageToken(s.stage);
                const stageLabel = STAGES.find(x => x.value===s.stage)?.label || s.stage;
                return (
                  <div key={s.id} className="card card__body--lg">
                    <div className="row--between" style={{ alignItems:'flex-start', flexWrap:'wrap', gap:'var(--s4)' }}>
                      <div className="row" style={{ gap:'var(--s4)', flex:1, alignItems:'flex-start' }}>
                        <div className="entity-icon" style={{ background: st.bg, color: st.text }}>{s.name.charAt(0)}</div>
                        <div className="stack--xs" style={{ flex:1 }}>
                          <div className="row--wrap">
                            <span className="heading-sm">{s.name}</span>
                            <span className="tag" style={{ background: st.bg, color: st.text }}>{stageLabel}</span>
                            <span className="tag tag--neutral">{s.industry}</span>
                            {s.city && <span className="caption">{s.city}</span>}
                          </div>
                          {s.tagline && <p className="body-sm" style={{ fontWeight:'var(--w-bold)', color:'var(--ink-700)' }}>{s.tagline}</p>}
                          <p className="body-sm">{s.description?.slice(0,160)}{s.description?.length>160?'...':''}</p>
                          <div className="row--wrap">
                            {s.is_hiring               && <span className="tag tag--green">A contratar</span>}
                            {s.is_seeking_investment   && <span className="tag tag--blue">Procura investimento</span>}
                            {s.is_seeking_cofounder    && <span className="tag tag--amber">Procura co-fundador</span>}
                          </div>
                        </div>
                      </div>
                      <div className="stack--xs" style={{ alignItems:'flex-end', flexShrink:0 }}>
                        <Avatar name={s.founder_name} src={s.founder_avatar} size="sm" />
                        <span className="caption">{s.founder_name}</span>
                        <span className="caption">{s.team_size_actual} membro{s.team_size_actual !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!loading && startups.length === 0 && (
                <div className="card card--padded">Sem startups publicadas. Sê o primeiro!</div>
              )}
            </div>
          )}

          {/* ── FUNDING ── */}
          {tab === 'funding' && (
            <div className="stack">
              {loading && <div className="spinner" />}
              {funding.map(f => (
                <div key={f.id} className="card card--accent-left card__body--lg" style={{ borderLeftColor:'var(--amber-mid)' }}>
                  <div className="row--between" style={{ flexWrap:'wrap', gap:'var(--s4)', alignItems:'flex-start' }}>
                    <div className="stack--xs" style={{ flex:1 }}>
                      <div className="row--wrap">
                        <span className="tag tag--gold">{FUND_LABEL[f.type]||f.type}</span>
                        {f.is_angola_only && <span className="tag tag--green">Angola</span>}
                      </div>
                      <h3 className="heading-sm">{f.title}</h3>
                      <p className="body-sm"><strong>Organizado por:</strong> {f.organizer}</p>
                      {f.amount     && <p className="body-sm" style={{ color:'var(--green)', fontWeight:'var(--w-bold)' }}>Valor: {f.amount}</p>}
                      <p className="body-sm">{f.description?.slice(0,200)}</p>
                      {f.eligibility && <p className="caption"><strong>Elegibilidade:</strong> {f.eligibility}</p>}
                    </div>
                    <div className="stack--xs" style={{ alignItems:'flex-end', flexShrink:0 }}>
                      {f.deadline && (
                        <div style={{ textAlign:'right' }}>
                          <span className="caption">Prazo</span>
                          <div className="body-sm" style={{ fontWeight:'var(--w-bold)', color:'var(--red)' }}>
                            {new Date(f.deadline).toLocaleDateString('pt-AO')}
                          </div>
                        </div>
                      )}
                      {f.application_url && (
                        <a href={f.application_url} target="_blank" rel="noreferrer"
                          className="body-sm" style={{ color:'var(--red)', fontWeight:'var(--w-bold)', textDecoration:'none' }}>
                          Candidatar →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && funding.length === 0 && (
                <div className="card card--padded">Sem oportunidades disponíveis.</div>
              )}
            </div>
          )}

          {/* ── FOUNDER MATCH ── */}
          {tab === 'matches' && (
            <div className="card card--padded">
              <h3 className="section-header" style={{ marginBottom:'var(--s2)' }}>Founder Match</h3>
              <p className="body-sm" style={{ lineHeight:1.7 }}>
                Encontra o teu co-fundador técnico ou de negócio. Visita o perfil de qualquer utilizador
                e clica em "Propor parceria" para enviar um pedido de match.
              </p>
            </div>
          )}

        </div>
      </div></div>
    </div>
  );
}
