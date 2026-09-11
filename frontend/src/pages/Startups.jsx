import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge  from '../components/ui/Badge';

const INDUSTRIES = ['Fintech','Edtech','Healthtech','Agritech','Logtech','E-commerce','SaaS','Media','Govtech','Outro'];
const STAGES = [
  { value:'idea',    label:'Ideia'       },
  { value:'mvp',     label:'MVP'         },
  { value:'early',   label:'Early Stage' },
  { value:'growth',  label:'Growth'      },
  { value:'scaling', label:'Scaling'     },
];
const FUNDING_TYPES = ['grant','competition','incubator','accelerator','scholarship','investment','other'];
const FUND_LABEL = { grant:'Subsídio', competition:'Concurso', incubator:'Incubadora', accelerator:'Aceleradora', scholarship:'Bolsa', investment:'Investimento', other:'Outro' };
const STAGE_COLOR = { idea:'#888', mvp:'#1A3A8A', early:'#7B4F00', growth:'#1A5C30', scaling:'#4A1580' };

export default function Startups() {
  const { user }    = useAuth();
  const [tab,       setTab]      = useState('startups');
  const [startups,  setStartups] = useState([]);
  const [funding,   setFunding]  = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [showForm,  setShowForm] = useState(false);
  const [filters,   setFilters]  = useState({ industry:'', stage:'', hiring:false, cofounder:false });
  const [form, setForm] = useState({
    name:'', tagline:'', description:'', industry:'Fintech', stage:'idea',
    city:'Luanda', website:'', is_hiring:false, is_seeking_investment:false,
    is_seeking_cofounder:false, founded_year:'',
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  useEffect(() => {
    setLoading(true);
    if (tab === 'startups') {
      const params = {};
      if (filters.industry) params.industry = filters.industry;
      if (filters.stage)    params.stage    = filters.stage;
      if (filters.hiring)   params.hiring   = 'true';
      if (filters.cofounder)params.cofounder= 'true';
      api.get('/startups', { params }).then(r => setStartups(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else if (tab === 'funding') {
      api.get('/startups/funding/list').then(r => setFunding(r.data)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab, filters]);

  function ch(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({...f, [e.target.name]: val}));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name || !form.description || !form.industry) { setMsg('Nome, descrição e indústria obrigatórios.'); return; }
    setSaving(true);
    try {
      const r = await api.post('/startups', { ...form, founded_year: form.founded_year||null });
      setStartups(s => [r.data, ...s]);
      setShowForm(false);
      setMsg('Startup publicada!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  const TABS = [
    { key:'startups', label:`Startups (${startups.length})` },
    { key:'funding',  label:'Oportunidades de Financiamento' },
    { key:'matches',  label:'Founder Match' },
  ];

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div style={{ maxWidth:860, margin:'0 auto' }}>

          <div style={{ marginBottom:'var(--s6)' }}>
            <h1 style={{ fontFamily:'var(--display)', fontSize:'var(--t-2xl)', fontWeight:'var(--w-black)', letterSpacing:'-.03em', color:'var(--ink-900)', marginBottom:4 }}>
              Startup Network
            </h1>
            <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)' }}>
              Conectar talento tecnológico, empreendedores, investidores e oportunidades em Angola.
            </p>
          </div>

          {msg && <div style={{ background:'var(--ink-900)', color:'#fff', padding:'10px 16px', borderRadius:8, fontSize:13, fontWeight:600, marginBottom:16 }}>{msg}</div>}

          {/* Tabs */}
          <div style={{ display:'flex', gap:2, marginBottom:'var(--s5)', borderBottom:'var(--line)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding:'var(--s3) var(--s4)', background:'none', border:'none', fontSize:'var(--t-sm)', fontWeight: tab===t.key?800:600, color: tab===t.key?'var(--red)':'var(--ink-400)', borderBottom: tab===t.key?'2px solid var(--red)':'2px solid transparent', cursor:'pointer', whiteSpace:'nowrap', marginBottom:-1 }}>
                {t.label}
              </button>
            ))}
            {user && tab==='startups' && (
              <div style={{ marginLeft:'auto' }}>
                <Button style={{ width:'auto', fontSize:13 }} onClick={() => setShowForm(!showForm)}>
                  + Publicar Startup
                </Button>
              </div>
            )}
          </div>

          {/* ── STARTUPS ── */}
          {tab === 'startups' && (
            <>
              {/* Filtros */}
              <div style={{ display:'flex', gap:'var(--s3)', flexWrap:'wrap', marginBottom:'var(--s4)', alignItems:'center' }}>
                <select className="select" style={{ width:'auto' }} value={filters.industry} onChange={e => setFilters(f=>({...f,industry:e.target.value}))}>
                  <option value="">Todas as indústrias</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
                <select className="select" style={{ width:'auto' }} value={filters.stage} onChange={e => setFilters(f=>({...f,stage:e.target.value}))}>
                  <option value="">Todos os estágios</option>
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <label style={{ display:'flex', gap:6, alignItems:'center', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  <input type="checkbox" checked={filters.hiring} onChange={e => setFilters(f=>({...f,hiring:e.target.checked}))} />
                  A contratar
                </label>
                <label style={{ display:'flex', gap:6, alignItems:'center', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  <input type="checkbox" checked={filters.cofounder} onChange={e => setFilters(f=>({...f,cofounder:e.target.checked}))} />
                  Procura co-fundador
                </label>
              </div>

              {showForm && (
                <div className="card" style={{ padding:'var(--s6)', marginBottom:'var(--s5)', borderLeft:'4px solid var(--red)' }}>
                  <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', marginBottom:'var(--s5)' }}>Publicar Startup</h3>
                  <form onSubmit={handleCreate} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s3)' }}>
                    <div className="field" style={{ gridColumn:'1/-1' }}>
                      <label className="field__label">Nome da startup *</label>
                      <input className="input" name="name" value={form.name} onChange={ch} placeholder="Ex: PayAngola" />
                    </div>
                    <div className="field" style={{ gridColumn:'1/-1' }}>
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
                    <div className="field" style={{ gridColumn:'1/-1', display:'flex', gap:'var(--s5)', flexWrap:'wrap' }}>
                      {[
                        { name:'is_hiring',             label:'A contratar developers' },
                        { name:'is_seeking_investment',  label:'À procura de investimento' },
                        { name:'is_seeking_cofounder',   label:'À procura de co-fundador' },
                      ].map(f => (
                        <label key={f.name} style={{ display:'flex', gap:6, alignItems:'center', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                          <input type="checkbox" name={f.name} checked={form[f.name]} onChange={ch} />
                          {f.label}
                        </label>
                      ))}
                    </div>
                    <div className="field" style={{ gridColumn:'1/-1' }}>
                      <label className="field__label">Descrição *</label>
                      <textarea className="textarea" rows={4} name="description" value={form.description} onChange={ch} placeholder="O que a startup faz, problema que resolve, mercado alvo..." />
                    </div>
                    <div style={{ gridColumn:'1/-1', display:'flex', gap:'var(--s3)', justifyContent:'flex-end' }}>
                      <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                      <Button type="submit" loading={saving} style={{ width:'auto' }}>Publicar</Button>
                    </div>
                  </form>
                </div>
              )}

              {loading && <div className="spinner" />}
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                {startups.map(s => (
                  <div key={s.id} className="card" style={{ padding:'var(--s5)' }}>
                    <div style={{ display:'flex', gap:'var(--s4)', alignItems:'flex-start' }}>
                      <div style={{ width:52, height:52, borderRadius:'var(--r-sm)', background: STAGE_COLOR[s.stage]+'20', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontFamily:'var(--display)', fontWeight:900, fontSize:22, color: STAGE_COLOR[s.stage] }}>
                          {s.name.charAt(0)}
                        </span>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                          <h3 style={{ fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)', margin:0 }}>{s.name}</h3>
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background: STAGE_COLOR[s.stage]+'20', color: STAGE_COLOR[s.stage] }}>
                            {STAGES.find(st => st.value===s.stage)?.label}
                          </span>
                          <span style={{ fontSize:11, color:'var(--ink-400)' }}>{s.industry}</span>
                          {s.city && <span style={{ fontSize:11, color:'var(--ink-400)' }}>{s.city}</span>}
                        </div>
                        {s.tagline && <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-600)', fontWeight:600, marginBottom:4 }}>{s.tagline}</p>}
                        <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', lineHeight:1.5, marginBottom:8 }}>
                          {s.description?.slice(0,160)}{s.description?.length>160?'...':''}
                        </p>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {s.is_hiring && <span style={{ fontSize:11, fontWeight:700, color:'#1A5C30', background:'#E6F4EA', padding:'2px 8px', borderRadius:999 }}>A contratar</span>}
                          {s.is_seeking_investment && <span style={{ fontSize:11, fontWeight:700, color:'#1A3A8A', background:'#EEF2FF', padding:'2px 8px', borderRadius:999 }}>Procura investimento</span>}
                          {s.is_seeking_cofounder && <span style={{ fontSize:11, fontWeight:700, color:'#7B4F00', background:'#FEF7E0', padding:'2px 8px', borderRadius:999 }}>Procura co-fundador</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <Avatar name={s.founder_name} src={s.founder_avatar} size="sm" />
                        <div style={{ fontSize:11, color:'var(--ink-400)', marginTop:2 }}>{s.founder_name}</div>
                        <div style={{ fontSize:11, color:'var(--ink-400)' }}>{s.team_size_actual} membro{s.team_size_actual !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && startups.length === 0 && (
                  <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
                    Sem startups publicadas. Sê o primeiro!
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── FUNDING ── */}
          {tab === 'funding' && (
            <>
              {loading && <div className="spinner" />}
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                {funding.map(f => (
                  <div key={f.id} className="card" style={{ padding:'var(--s5)', borderLeft:'4px solid #C8860A' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:'#C8860A', background:'#FEF7E0', padding:'2px 8px', borderRadius:999 }}>{FUND_LABEL[f.type]||f.type}</span>
                          {f.is_angola_only && <span style={{ fontSize:11, fontWeight:700, color:'#1A5C30', background:'#E6F4EA', padding:'2px 8px', borderRadius:999 }}>Angola</span>}
                        </div>
                        <h3 style={{ fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)', marginBottom:4 }}>{f.title}</h3>
                        <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-600)', marginBottom:4 }}><strong>Organizado por:</strong> {f.organizer}</p>
                        {f.amount && <p style={{ fontSize:'var(--t-sm)', color:'#1A5C30', fontWeight:700, marginBottom:4 }}>Valor: {f.amount}</p>}
                        <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', lineHeight:1.5 }}>{f.description?.slice(0,200)}</p>
                        {f.eligibility && <p style={{ fontSize:12, color:'var(--ink-400)', marginTop:4 }}><strong>Elegibilidade:</strong> {f.eligibility}</p>}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                        {f.deadline && (
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:11, color:'var(--ink-400)' }}>Prazo</div>
                            <div style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>
                              {new Date(f.deadline).toLocaleDateString('pt-AO')}
                            </div>
                          </div>
                        )}
                        {f.application_url && (
                          <a href={f.application_url} target="_blank" rel="noreferrer"
                            style={{ fontSize:13, fontWeight:700, color:'var(--red)', textDecoration:'none' }}>
                            Candidatar →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && funding.length === 0 && (
                  <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
                    Sem oportunidades de financiamento disponíveis.
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── FOUNDER MATCH ── */}
          {tab === 'matches' && (
            <div className="card card--padded" style={{ textAlign:'center' }}>
              <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', color:'var(--ink-900)', marginBottom:8 }}>Founder Match</h3>
              <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)', lineHeight:1.7 }}>
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
