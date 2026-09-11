import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api          from '../services/api';
import Navbar       from '../components/Navbar';
import Avatar       from '../components/ui/Avatar';
import Badge        from '../components/ui/Badge';
import Button       from '../components/ui/Button';
import VerifiedBadge from '../components/ui/VerifiedBadge';

// ── Utilitários ───────────────────────────────────────────────

function dateRange(start, end, isCurrent) {
  const fmt = d => d ? new Date(d).toLocaleDateString('pt-AO', { month:'short', year:'numeric' }) : '';
  return isCurrent ? `${fmt(start)} — Presente` : `${fmt(start)}${end ? ` — ${fmt(end)}` : ''}`;
}

function ScoreBar({ label, value, max = 30, color = 'var(--red)' }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color:'var(--ink-600)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color:'var(--ink-900)' }}>{value}</span>
      </div>
      <div style={{ height: 6, background:'var(--ink-100)', borderRadius: 999, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background: color, borderRadius: 999, transition:'width .5s ease' }} />
      </div>
    </div>
  );
}

function StarRating({ score }) {
  return (
    <div style={{ display:'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i<=score?'#C8860A':'var(--ink-200)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

const TYPE_ICON = { work:'💼', education:'🎓', freelance:'💻', volunteer:'🤝' };
const TYPE_LABEL = { work:'Emprego', education:'Educação', freelance:'Freelance', volunteer:'Voluntariado' };
const STATUS_COLOR = { completed:'#1A5C30', in_progress:'#1A3A8A', open:'#7B4F00', archived:'#888' };
const STATUS_LABEL = { completed:'Concluído', in_progress:'Em progresso', open:'Aberto', archived:'Arquivado' };

// ── Componente principal ─────────────────────────────────────

export default function Passport() {
  const { userId }     = useParams();
  const { user: me }   = useAuth();
  const { lang }       = useLang();
  const navigate       = useNavigate();

  const isOwn = me && String(me.id) === String(userId);

  const [passport,    setPassport]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [tab,         setTab]         = useState('overview');
  const [showExpForm, setShowExpForm] = useState(false);
  const [showReview,  setShowReview]  = useState(false);
  const [expForm,     setExpForm]     = useState({
    type:'work', title:'', organization:'', location:'',
    start_date:'', end_date:'', description:'', is_current: false,
  });
  const [reviewForm,  setReviewForm]  = useState({ score: 5, comment:'', context:'collaboration' });
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get(`/passport/${userId}`);
      setPassport(r.data);
    } catch {
      setError('Passaporte não encontrado.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function saveExperience(e) {
    e.preventDefault();
    if (!expForm.title || !expForm.organization || !expForm.start_date) return;
    setSaving(true);
    try {
      await api.post('/passport/experience', expForm);
      await load();
      setShowExpForm(false);
      setExpForm({ type:'work', title:'', organization:'', location:'', start_date:'', end_date:'', description:'', is_current:false });
      setMsg('Experiência adicionada!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erro ao guardar.');
    } finally { setSaving(false); }
  }

  async function deleteExp(id) {
    if (!window.confirm('Remover esta experiência?')) return;
    try { await api.delete(`/passport/experience/${id}`); await load(); }
    catch { setMsg('Erro ao remover.'); }
  }

  async function submitReview(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/passport/review/${userId}`, reviewForm);
      await load();
      setShowReview(false);
      setMsg('Avaliação enviada!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erro ao enviar avaliação.');
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="page"><Navbar />
      <div className="page-body" style={{ display:'flex', justifyContent:'center', paddingTop: 60 }}>
        <div className="spinner" />
      </div>
    </div>
  );

  if (error || !passport) return (
    <div className="page"><Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="card card--padded" style={{ textAlign:'center', marginTop: 40 }}>
          <p style={{ color:'var(--ink-400)', marginBottom: 16 }}>{error}</p>
          <Button variant="secondary" onClick={() => navigate(-1)} style={{ width:'auto' }}>← Voltar</Button>
        </div>
      </div></div>
    </div>
  );

  const { user, skills, experience, projects, reviews, mentorship, talent_score, activity } = passport;
  const avgReview = reviews.length
    ? (reviews.reduce((a, r) => a + r.score, 0) / reviews.length).toFixed(1)
    : null;

  const TABS = [
    { key:'overview',   label:'Visão Geral' },
    { key:'experience', label:'Experiência' },
    { key:'projects',   label:`Projectos (${projects.length})` },
    { key:'skills',     label:`Skills (${skills.length})` },
    { key:'reviews',    label:`Avaliações (${reviews.length})` },
  ];

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">

        {msg && (
          <div style={{ position:'fixed', top: 80, right: 20, zIndex: 999, background:'var(--ink-900)', color:'#fff', padding:'10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            {msg}
          </div>
        )}

        <div style={{ maxWidth: 860, margin:'0 auto' }}>

          {/* Botão voltar */}
          <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap: 6, background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--ink-400)', fontWeight:600, marginBottom:'var(--s4)' }}>
            ← Voltar
          </button>

          {/* Hero — cabeçalho do passport */}
          <div className="card" style={{ padding:'var(--s8)', marginBottom:'var(--s4)' }}>
            <div style={{ display:'flex', gap:'var(--s6)', alignItems:'flex-start', flexWrap:'wrap' }}>

              <Avatar name={user.name} src={user.avatar_url} size="2xl" />

              <div style={{ flex:1, minWidth: 200 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)', flexWrap:'wrap', marginBottom:'var(--s2)' }}>
                  <h1 style={{ fontFamily:'var(--display)', fontSize:'var(--t-xl)', fontWeight:'var(--w-black)', color:'var(--ink-900)', margin:0 }}>
                    {user.name}
                  </h1>
                  {user.verified && <VerifiedBadge lang={lang} />}
                </div>

                {user.identifier && (
                  <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-600)', fontWeight:'var(--w-medium)', marginBottom:'var(--s2)' }}>
                    {user.identifier}
                  </p>
                )}

                <div style={{ display:'flex', gap:'var(--s2)', flexWrap:'wrap', marginBottom:'var(--s4)' }}>
                  <Badge level={user.level} />
                  {user.badge && <span className={`seal seal--${user.badge}`}>{user.badge_label}</span>}
                </div>

                {/* Stats rápidas */}
                <div style={{ display:'flex', gap:'var(--s6)', flexWrap:'wrap' }}>
                  {[
                    { label:'Posts',      value: activity.total_posts || 0 },
                    { label:'Seguidores', value: user.followers_count || 0 },
                    { label:'Projectos',  value: projects.length },
                    { label:'Avaliações', value: reviews.length },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--display)', fontSize:'var(--t-lg)', fontWeight:'var(--w-black)', color:'var(--ink-900)', lineHeight:1 }}>{s.value}</div>
                      <div style={{ fontSize:'var(--t-xs)', color:'var(--ink-400)', fontWeight:'var(--w-bold)', textTransform:'uppercase', letterSpacing:'.06em', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Talent Score */}
              {talent_score && (
                <div style={{ textAlign:'center', background:'var(--bg)', borderRadius:'var(--r-md)', padding:'var(--s4) var(--s6)', minWidth: 120, border:'var(--line)' }}>
                  <div style={{ fontFamily:'var(--display)', fontSize: 40, fontWeight:'var(--w-black)', color:'var(--red)', lineHeight:1 }}>
                    {talent_score.score}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color:'var(--ink-400)', textTransform:'uppercase', letterSpacing:'.08em', marginTop: 4 }}>
                    Talent Score
                  </div>
                </div>
              )}
            </div>

            {/* Acções */}
            {!isOwn && me && (
              <div style={{ display:'flex', gap:'var(--s3)', marginTop:'var(--s5)', borderTop:'var(--line)', paddingTop:'var(--s4)' }}>
                <Button
                  style={{ width:'auto' }}
                  onClick={() => setShowReview(true)}
                >
                  Avaliar profissional
                </Button>
                <Button
                  variant="secondary"
                  style={{ width:'auto' }}
                  onClick={async () => {
                    try {
                      const r = await api.post('/messages/start', { targetUserId: Number(userId) });
                      navigate(`/mensagens/${r.data.conversationId}`);
                    } catch {}
                  }}
                >
                  Enviar mensagem
                </Button>
              </div>
            )}

            {isOwn && (
              <div style={{ marginTop:'var(--s4)', borderTop:'var(--line)', paddingTop:'var(--s4)' }}>
                <Link to="/perfil" style={{ fontSize:13, color:'var(--red)', fontWeight:700 }}>
                  Editar perfil →
                </Link>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:2, marginBottom:'var(--s4)', borderBottom:'var(--line)', overflowX:'auto' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding:'var(--s3) var(--s4)', background:'none', border:'none',
                  fontSize:'var(--t-sm)', fontWeight: tab===t.key ? 800 : 600,
                  color: tab===t.key ? 'var(--red)' : 'var(--ink-400)',
                  borderBottom: tab===t.key ? '2px solid var(--red)' : '2px solid transparent',
                  cursor:'pointer', whiteSpace:'nowrap', marginBottom:-1,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s4)' }}>

              {/* Talent Score breakdown */}
              {talent_score && (
                <div className="card" style={{ padding:'var(--s5)', gridColumn:'1/-1' }}>
                  <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-base)', marginBottom:'var(--s4)', color:'var(--ink-900)' }}>
                    Talent Score — {talent_score.score}/100
                  </h3>
                  <ScoreBar label="Identidade verificada" value={talent_score.score_identity}   max={20} color="#1A5C30" />
                  <ScoreBar label="Skills e Quiz"         value={talent_score.score_skills}     max={30} color="#1A3A8A" />
                  <ScoreBar label="Projectos"             value={talent_score.score_projects}   max={25} color="#7B4F00" />
                  <ScoreBar label="Avaliações"            value={talent_score.score_reviews}    max={20} color="#C8860A" />
                  <ScoreBar label="Comunidade"            value={talent_score.score_community}  max={15} color="var(--red)" />
                  <ScoreBar label="Mentoria"              value={talent_score.score_mentorship} max={15} color="#4A1580" />
                  <ScoreBar label="Fiabilidade"           value={talent_score.score_reliability}max={10} color="#1A5C30" />
                </div>
              )}

              {/* Actividade */}
              <div className="card" style={{ padding:'var(--s5)' }}>
                <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-base)', marginBottom:'var(--s4)', color:'var(--ink-900)' }}>
                  Actividade
                </h3>
                {[
                  { label:'Posts publicados',  value: activity.total_posts || 0 },
                  { label:'Open Source',        value: activity.open_source_posts || 0 },
                  { label:'Gostos recebidos',   value: activity.total_likes_received || 0 },
                  { label:'Empregos aceites',   value: activity.jobs_accepted || 0 },
                  { label:'Mentees activos',    value: mentorship.mentees_active || 0 },
                ].map(r => (
                  <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'var(--s2) 0', borderBottom:'var(--line)' }}>
                    <span style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)' }}>{r.label}</span>
                    <span style={{ fontSize:'var(--t-sm)', fontWeight:'var(--w-bold)', color:'var(--ink-900)' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Últimas skills */}
              <div className="card" style={{ padding:'var(--s5)' }}>
                <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-base)', marginBottom:'var(--s4)', color:'var(--ink-900)' }}>
                  Skills principais
                </h3>
                {skills.slice(0,8).map(s => (
                  <div key={s.skill} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'var(--s2) 0', borderBottom:'var(--line)' }}>
                    <span style={{ fontSize:'var(--t-sm)', color:'var(--ink-700)', fontWeight:600 }}>{s.skill}</span>
                    <div style={{ display:'flex', gap: 3 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i<=s.level ? 'var(--red)' : 'var(--ink-100)' }} />
                      ))}
                    </div>
                  </div>
                ))}
                {skills.length === 0 && (
                  <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)' }}>Sem skills declaradas.</p>
                )}
              </div>

              {/* Média de avaliações */}
              {avgReview && (
                <div className="card" style={{ padding:'var(--s5)', gridColumn:'1/-1', display:'flex', gap:'var(--s4)', alignItems:'center' }}>
                  <div style={{ textAlign:'center', minWidth: 80 }}>
                    <div style={{ fontFamily:'var(--display)', fontSize: 48, fontWeight:'var(--w-black)', color:'#C8860A', lineHeight:1 }}>{avgReview}</div>
                    <div style={{ fontSize: 11, color:'var(--ink-400)', marginTop: 4 }}>de 5</div>
                  </div>
                  <div>
                    <StarRating score={Math.round(Number(avgReview))} />
                    <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', marginTop: 4 }}>{reviews.length} avaliações profissionais</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EXPERIÊNCIA ── */}
          {tab === 'experience' && (
            <div>
              {isOwn && (
                <div style={{ marginBottom:'var(--s4)' }}>
                  <Button style={{ width:'auto' }} onClick={() => setShowExpForm(!showExpForm)}>
                    + Adicionar experiência
                  </Button>
                </div>
              )}

              {showExpForm && (
                <div className="card" style={{ padding:'var(--s6)', marginBottom:'var(--s4)' }}>
                  <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', marginBottom:'var(--s4)' }}>Nova experiência</h3>
                  <form onSubmit={saveExperience} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s3)' }}>
                    <div className="field">
                      <label className="field__label">Tipo</label>
                      <select className="select" value={expForm.type} onChange={e => setExpForm(f => ({...f, type: e.target.value}))}>
                        {Object.entries(TYPE_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label className="field__label">Cargo / Título *</label>
                      <input className="input" value={expForm.title} onChange={e => setExpForm(f => ({...f, title: e.target.value}))} placeholder="Ex: Desenvolvedor Full Stack" />
                    </div>
                    <div className="field">
                      <label className="field__label">Empresa / Organização *</label>
                      <input className="input" value={expForm.organization} onChange={e => setExpForm(f => ({...f, organization: e.target.value}))} placeholder="Ex: Unitel, BAI..." />
                    </div>
                    <div className="field">
                      <label className="field__label">Localização</label>
                      <input className="input" value={expForm.location} onChange={e => setExpForm(f => ({...f, location: e.target.value}))} placeholder="Ex: Luanda" />
                    </div>
                    <div className="field">
                      <label className="field__label">Data de início *</label>
                      <input className="input" type="date" value={expForm.start_date} onChange={e => setExpForm(f => ({...f, start_date: e.target.value}))} />
                    </div>
                    <div className="field">
                      <label className="field__label">Data de fim</label>
                      <input className="input" type="date" value={expForm.end_date} disabled={expForm.is_current} onChange={e => setExpForm(f => ({...f, end_date: e.target.value}))} />
                      <label style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 6, fontSize: 12, cursor:'pointer' }}>
                        <input type="checkbox" checked={expForm.is_current} onChange={e => setExpForm(f => ({...f, is_current: e.target.checked, end_date:''}))} />
                        Cargo actual
                      </label>
                    </div>
                    <div className="field" style={{ gridColumn:'1/-1' }}>
                      <label className="field__label">Descrição</label>
                      <textarea className="textarea" rows={3} value={expForm.description} onChange={e => setExpForm(f => ({...f, description: e.target.value}))} placeholder="Descreve brevemente as responsabilidades..." />
                    </div>
                    <div style={{ gridColumn:'1/-1', display:'flex', gap:'var(--s3)', justifyContent:'flex-end' }}>
                      <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowExpForm(false)}>Cancelar</Button>
                      <Button type="submit" loading={saving} style={{ width:'auto' }}>Guardar</Button>
                    </div>
                  </form>
                </div>
              )}

              {experience.length === 0 && !showExpForm && (
                <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
                  {isOwn ? 'Adiciona a tua experiência profissional.' : 'Sem experiência declarada.'}
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                {experience.map(exp => (
                  <div key={exp.id} className="card" style={{ padding:'var(--s5)', borderLeft:`4px solid var(--ink-200)` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontSize:'var(--t-sm)', fontWeight:700, color:'var(--ink-400)', marginBottom: 2 }}>
                          {TYPE_LABEL[exp.type]}
                        </div>
                        <div style={{ fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)' }}>{exp.title}</div>
                        <div style={{ fontSize:'var(--t-sm)', color:'var(--ink-600)', fontWeight:600 }}>{exp.organization}</div>
                        <div style={{ fontSize: 12, color:'var(--ink-400)', marginTop: 2 }}>
                          {dateRange(exp.start_date, exp.end_date, exp.is_current)}
                          {exp.location && ` · ${exp.location}`}
                        </div>
                        {exp.description && (
                          <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', marginTop:'var(--s2)', lineHeight:1.6 }}>{exp.description}</p>
                        )}
                      </div>
                      {isOwn && (
                        <button onClick={() => deleteExp(exp.id)}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize: 18, color:'var(--ink-300)', padding: 4, flexShrink:0 }}>
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROJECTOS ── */}
          {tab === 'projects' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
              {projects.length === 0 && (
                <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
                  Sem projectos ainda.
                </div>
              )}
              {projects.map(p => (
                <div key={p.id} className="card" style={{ padding:'var(--s5)', borderLeft:`4px solid ${STATUS_COLOR[p.status] || '#888'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display:'flex', gap: 8, alignItems:'center', marginBottom: 4 }}>
                        <span style={{ fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)' }}>{p.title}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding:'2px 8px', borderRadius: 999, background: STATUS_COLOR[p.status]+'20', color: STATUS_COLOR[p.status] }}>
                          {STATUS_LABEL[p.status]}
                        </span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--ink-400)' }}>
                        Papel: <strong>{p.member_role}</strong> · {p.team_size} membros
                      </div>
                      <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', marginTop: 4, lineHeight:1.5 }}>
                        {p.description?.slice(0, 120)}{p.description?.length > 120 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                  {p.skills_used && p.skills_used.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap: 4, marginTop:'var(--s2)' }}>
                      {p.skills_used.map(s => (
                        <span key={s} style={{ fontSize: 11, fontWeight: 700, padding:'1px 7px', borderRadius: 999, background:'var(--red-soft)', color:'var(--red)' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── SKILLS ── */}
          {tab === 'skills' && (
            <div className="card" style={{ padding:'var(--s6)' }}>
              {skills.length === 0 && (
                <p style={{ color:'var(--ink-400)', textAlign:'center' }}>Sem skills declaradas.</p>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s3)' }}>
                {skills.map(s => (
                  <div key={s.skill} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'var(--s3)', background:'var(--bg)', borderRadius:'var(--r-sm)' }}>
                    <span style={{ fontSize:'var(--t-sm)', fontWeight:700, color:'var(--ink-900)' }}>{s.skill}</span>
                    <div style={{ display:'flex', gap: 3 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: i<=s.level ? 'var(--red)' : 'var(--ink-100)' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {isOwn && (
                <div style={{ marginTop:'var(--s5)', borderTop:'var(--line)', paddingTop:'var(--s4)' }}>
                  <Link to="/perfil" style={{ fontSize:13, color:'var(--red)', fontWeight:700 }}>
                    Gerir skills no perfil →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── AVALIAÇÕES ── */}
          {tab === 'reviews' && (
            <div>
              {!isOwn && me && !showReview && (
                <div style={{ marginBottom:'var(--s4)' }}>
                  <Button style={{ width:'auto' }} onClick={() => setShowReview(true)}>
                    Escrever avaliação
                  </Button>
                </div>
              )}

              {showReview && (
                <div className="card" style={{ padding:'var(--s6)', marginBottom:'var(--s4)' }}>
                  <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', marginBottom:'var(--s4)' }}>Avaliar {user.name}</h3>
                  <form onSubmit={submitReview} style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                    <div className="field">
                      <label className="field__label">Pontuação *</label>
                      <div style={{ display:'flex', gap: 8 }}>
                        {[1,2,3,4,5].map(i => (
                          <button key={i} type="button"
                            onClick={() => setReviewForm(f => ({...f, score: i}))}
                            style={{ width: 40, height: 40, borderRadius: 8, border:`2px solid ${reviewForm.score >= i ? '#C8860A' : 'var(--ink-200)'}`, background: reviewForm.score >= i ? '#C8860A20' : 'none', cursor:'pointer', fontSize: 18 }}>
                            ★
                          </button>
                        ))}
                        <span style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)', alignSelf:'center' }}>{reviewForm.score}/5</span>
                      </div>
                    </div>
                    <div className="field">
                      <label className="field__label">Contexto</label>
                      <select className="select" value={reviewForm.context} onChange={e => setReviewForm(f => ({...f, context: e.target.value}))}>
                        <option value="collaboration">Colaboração</option>
                        <option value="project">Projecto</option>
                        <option value="job">Trabalho</option>
                        <option value="mentorship">Mentoria</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="field__label">Comentário (opcional)</label>
                      <textarea className="textarea" rows={3}
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({...f, comment: e.target.value}))}
                        placeholder="Descreve a tua experiência de trabalho com esta pessoa..." />
                    </div>
                    <div style={{ display:'flex', gap:'var(--s3)', justifyContent:'flex-end' }}>
                      <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowReview(false)}>Cancelar</Button>
                      <Button type="submit" loading={saving} style={{ width:'auto' }}>Enviar avaliação</Button>
                    </div>
                  </form>
                </div>
              )}

              {reviews.length === 0 && (
                <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
                  Sem avaliações ainda.
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                {reviews.map((r, i) => (
                  <div key={i} className="card" style={{ padding:'var(--s5)' }}>
                    <div style={{ display:'flex', gap:'var(--s3)', alignItems:'flex-start' }}>
                      <Avatar name={r.reviewer_name} src={r.reviewer_avatar} size="sm" />
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap: 8 }}>
                          <div>
                            <span style={{ fontWeight:'var(--w-bold)', fontSize:'var(--t-sm)', color:'var(--ink-900)' }}>{r.reviewer_name}</span>
                            <Badge level={r.reviewer_level} style={{ marginLeft: 6 }} />
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                            <StarRating score={r.score} />
                            <span style={{ fontSize: 11, color:'var(--ink-400)' }}>{new Date(r.created_at).toLocaleDateString('pt-AO')}</span>
                          </div>
                        </div>
                        {r.comment && (
                          <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', marginTop:'var(--s2)', lineHeight:1.6 }}>{r.comment}</p>
                        )}
                        {r.context && (
                          <span style={{ fontSize: 11, color:'var(--ink-400)', marginTop: 4, display:'block' }}>Contexto: {r.context}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div></div>
    </div>
  );
}
