import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api           from '../services/api';
import Navbar        from '../components/Navbar';
import Avatar        from '../components/ui/Avatar';
import Badge         from '../components/ui/Badge';
import Button        from '../components/ui/Button';
import VerifiedBadge from '../components/ui/VerifiedBadge';

function dateRange(start, end, isCurrent) {
  const fmt = d => d ? new Date(d).toLocaleDateString('pt-AO', { month:'short', year:'numeric' }) : '';
  return isCurrent ? `${fmt(start)} — Presente` : `${fmt(start)}${end ? ` — ${fmt(end)}` : ''}`;
}

function ScoreBar({ label, value, max = 30, color = 'var(--red)' }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="score-bar">
      <div className="score-bar__header">
        <span className="score-bar__label">{label}</span>
        <span className="score-bar__value">{value}</span>
      </div>
      <div className="score-bar__track">
        <div className="score-bar__fill" style={{ width:`${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function StarRating({ score }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= score ? 'var(--amber-mid)' : 'var(--ink-200)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

const TYPE_LABEL = { work:'Emprego', education:'Educação', freelance:'Freelance', volunteer:'Voluntariado' };

const STATUS_TOKEN = {
  completed:   { text:'var(--green)',  bg:'var(--green-soft)',  label:'Concluído'     },
  in_progress: { text:'var(--blue)',   bg:'var(--blue-soft)',   label:'Em progresso'  },
  open:        { text:'var(--amber)',  bg:'var(--amber-soft)',  label:'Aberto'        },
  archived:    { text:'var(--ink-400)',bg:'var(--ink-100)',     label:'Arquivado'     },
};

export default function Passport() {
  const { userId }   = useParams();
  const { user: me } = useAuth();
  const { lang }     = useLang();
  const navigate     = useNavigate();
  const isOwn        = me && String(me.id) === String(userId);

  const [passport,    setPassport]  = useState(null);
  const [loading,     setLoading]   = useState(true);
  const [error,       setError]     = useState('');
  const [tab,         setTab]       = useState('overview');
  const [showExpForm, setShowExpForm] = useState(false);
  const [showReview,  setShowReview]  = useState(false);
  const [expForm,     setExpForm]   = useState({
    type:'work', title:'', organization:'', location:'',
    start_date:'', end_date:'', description:'', is_current:false,
  });
  const [reviewForm, setReviewForm] = useState({ score:5, comment:'', context:'collaboration' });
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get(`/passport/${userId}`);
      setPassport(r.data);
    } catch {
      setError('Passaporte não encontrado.');
    } finally { setLoading(false); }
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
      flash('Experiência adicionada!');
    } catch (err) { flash(err.response?.data?.error || 'Erro ao guardar.'); }
    finally { setSaving(false); }
  }

  async function deleteExp(id) {
    if (!window.confirm('Remover esta experiência?')) return;
    try { await api.delete(`/passport/experience/${id}`); await load(); }
    catch { flash('Erro ao remover.'); }
  }

  async function submitReview(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/passport/review/${userId}`, reviewForm);
      await load();
      setShowReview(false);
      flash('Avaliação enviada!');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  if (loading) return (
    <div className="page"><Navbar />
      <div className="page-body" style={{ display:'flex', justifyContent:'center', paddingTop:'var(--s16)' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  if (error || !passport) return (
    <div className="page"><Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="card card--padded">
          <p>{error || 'Não encontrado.'}</p>
          <Button variant="secondary" onClick={() => navigate(-1)} style={{ width:'auto', marginTop:'var(--s4)' }}>← Voltar</Button>
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
        <div className="page-container">

          {msg && <div className="feedback feedback--success" style={{ position:'fixed', top:'calc(var(--nav-h) + 12px)', right:'var(--s5)', zIndex:999, minWidth:240 }}>{msg}</div>}

          <button onClick={() => navigate(-1)} className="body-sm" style={{ display:'flex', alignItems:'center', gap:'var(--s2)', background:'none', border:'none', cursor:'pointer', marginBottom:'var(--s5)', color:'var(--ink-400)' }}>
            ← Voltar
          </button>

          {/* ── Hero ── */}
          <div className="card card__body--lg" style={{ marginBottom:'var(--s4)' }}>
            <div className="row" style={{ alignItems:'flex-start', flexWrap:'wrap', gap:'var(--s6)' }}>
              <Avatar name={user.name} src={user.avatar_url} size="2xl" />

              <div style={{ flex:1, minWidth:200 }}>
                <div className="row--wrap" style={{ marginBottom:'var(--s2)' }}>
                  <h1 className="heading-xl" style={{ margin:0 }}>{user.name}</h1>
                  {user.verified && <VerifiedBadge lang={lang} />}
                </div>
                {user.identifier && <p className="body-sm" style={{ marginBottom:'var(--s3)' }}>{user.identifier}</p>}
                <div className="row--wrap" style={{ marginBottom:'var(--s5)' }}>
                  <Badge level={user.level} />
                  {user.badge && <span className={`seal seal--${user.badge}`}>{user.badge_label}</span>}
                </div>
                <div className="row" style={{ gap:'var(--s8)', flexWrap:'wrap' }}>
                  {[
                    { label:'Posts',      value: activity.total_posts || 0 },
                    { label:'Seguidores', value: user.followers_count || 0 },
                    { label:'Projectos',  value: projects.length },
                    { label:'Avaliações', value: reviews.length },
                  ].map(s => (
                    <div key={s.label} className="stat-block">
                      <span className="stat-block__value">{s.value}</span>
                      <span className="stat-block__label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {talent_score && (
                <div style={{ textAlign:'center', background:'var(--bg)', borderRadius:'var(--r-md)', padding:'var(--s4) var(--s6)', border:'var(--line)' }}>
                  <div className="heading-display" style={{ color:'var(--red)', lineHeight:1 }}>{talent_score.score}</div>
                  <div className="caption" style={{ textTransform:'uppercase', letterSpacing:'.08em', marginTop:'var(--s1)' }}>Talent Score</div>
                </div>
              )}
            </div>

            {!isOwn && me && (
              <div className="row" style={{ marginTop:'var(--s5)', paddingTop:'var(--s4)', borderTop:'var(--line)' }}>
                <Button style={{ width:'auto' }} onClick={() => setShowReview(true)}>Avaliar profissional</Button>
                <Button variant="secondary" style={{ width:'auto' }}
                  onClick={async () => {
                    try { const r = await api.post('/messages/start', { targetUserId: Number(userId) }); navigate(`/mensagens/${r.data.conversationId}`); } catch {}
                  }}>
                  Enviar mensagem
                </Button>
              </div>
            )}
            {isOwn && (
              <div style={{ marginTop:'var(--s4)', paddingTop:'var(--s4)', borderTop:'var(--line)' }}>
                <Link to="/perfil" className="body-sm" style={{ color:'var(--red)', fontWeight:'var(--w-bold)' }}>Editar perfil →</Link>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:2, marginBottom:'var(--s5)', borderBottom:'var(--line)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`admin-tab${tab===t.key?' admin-tab--active':''}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s4)' }}>
              {talent_score && (
                <div className="card card__body--lg" style={{ gridColumn:'1/-1' }}>
                  <h3 className="section-header">Talent Score — {talent_score.score}/100</h3>
                  <ScoreBar label="Identidade verificada" value={talent_score.score_identity}    max={20} color="var(--green)" />
                  <ScoreBar label="Skills e Quiz"         value={talent_score.score_skills}      max={30} color="var(--blue)" />
                  <ScoreBar label="Projectos"             value={talent_score.score_projects}    max={25} color="var(--amber)" />
                  <ScoreBar label="Avaliações"            value={talent_score.score_reviews}     max={20} color="var(--amber-mid)" />
                  <ScoreBar label="Comunidade"            value={talent_score.score_community}   max={15} color="var(--red)" />
                  <ScoreBar label="Mentoria"              value={talent_score.score_mentorship}  max={15} color="var(--purple)" />
                  <ScoreBar label="Fiabilidade"           value={talent_score.score_reliability} max={10} color="var(--green)" />
                </div>
              )}

              <div className="card card__body--lg">
                <h3 className="section-header">Actividade</h3>
                {[
                  { label:'Posts publicados',   value: activity.total_posts || 0 },
                  { label:'Open Source',         value: activity.open_source_posts || 0 },
                  { label:'Gostos recebidos',    value: activity.total_likes_received || 0 },
                  { label:'Empregos aceites',    value: activity.jobs_accepted || 0 },
                  { label:'Mentees activos',     value: mentorship.mentees_active || 0 },
                ].map(r => (
                  <div key={r.label} className="stat-row">
                    <span className="stat-row__label">{r.label}</span>
                    <span className="stat-row__value">{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="card card__body--lg">
                <h3 className="section-header">Skills principais</h3>
                <div className="stack--sm">
                  {skills.slice(0,8).map(s => (
                    <div key={s.skill} className="stat-row">
                      <span className="body-sm" style={{ fontWeight:'var(--w-bold)', color:'var(--ink-800)' }}>{s.skill}</span>
                      <div style={{ display:'flex', gap:3 }}>
                        {[1,2,3,4,5].map(i => (
                          <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i<=s.level ? 'var(--red)' : 'var(--ink-100)' }} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {skills.length === 0 && <p className="caption">Sem skills declaradas.</p>}
                </div>
              </div>

              {avgReview && (
                <div className="card card__body--lg" style={{ gridColumn:'1/-1', display:'flex', gap:'var(--s6)', alignItems:'center' }}>
                  <div style={{ textAlign:'center', minWidth:80 }}>
                    <div className="heading-display" style={{ color:'var(--amber-mid)', lineHeight:1 }}>{avgReview}</div>
                    <div className="caption" style={{ marginTop:'var(--s1)' }}>de 5</div>
                  </div>
                  <div>
                    <StarRating score={Math.round(Number(avgReview))} />
                    <p className="body-sm" style={{ marginTop:'var(--s1)' }}>{reviews.length} avaliações profissionais</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Experiência ── */}
          {tab === 'experience' && (
            <div className="stack">
              {isOwn && (
                <div>
                  <Button style={{ width:'auto' }} onClick={() => setShowExpForm(!showExpForm)}>
                    + Adicionar experiência
                  </Button>
                </div>
              )}

              {showExpForm && (
                <div className="card card__body--lg" style={{ borderLeft:'3px solid var(--red)' }}>
                  <h3 className="section-header">Nova experiência</h3>
                  <form onSubmit={saveExperience} className="form-grid">
                    <div className="field">
                      <label className="field__label">Tipo</label>
                      <select className="select" value={expForm.type} onChange={e => setExpForm(f=>({...f,type:e.target.value}))}>
                        {Object.entries(TYPE_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label className="field__label">Cargo / Título *</label>
                      <input className="input" value={expForm.title} onChange={e => setExpForm(f=>({...f,title:e.target.value}))} placeholder="Ex: Desenvolvedor Full Stack" />
                    </div>
                    <div className="field">
                      <label className="field__label">Empresa *</label>
                      <input className="input" value={expForm.organization} onChange={e => setExpForm(f=>({...f,organization:e.target.value}))} placeholder="Ex: Unitel, BAI..." />
                    </div>
                    <div className="field">
                      <label className="field__label">Localização</label>
                      <input className="input" value={expForm.location} onChange={e => setExpForm(f=>({...f,location:e.target.value}))} placeholder="Ex: Luanda" />
                    </div>
                    <div className="field">
                      <label className="field__label">Data de início *</label>
                      <input className="input" type="date" value={expForm.start_date} onChange={e => setExpForm(f=>({...f,start_date:e.target.value}))} />
                    </div>
                    <div className="field">
                      <label className="field__label">Data de fim</label>
                      <input className="input" type="date" value={expForm.end_date} disabled={expForm.is_current} onChange={e => setExpForm(f=>({...f,end_date:e.target.value}))} />
                      <label className="field__hint" style={{ display:'flex', alignItems:'center', gap:'var(--s2)', marginTop:'var(--s1)', cursor:'pointer' }}>
                        <input type="checkbox" checked={expForm.is_current} onChange={e => setExpForm(f=>({...f,is_current:e.target.checked,end_date:''}))} />
                        Cargo actual
                      </label>
                    </div>
                    <div className="field field-full">
                      <label className="field__label">Descrição</label>
                      <textarea className="textarea" rows={3} value={expForm.description} onChange={e => setExpForm(f=>({...f,description:e.target.value}))} placeholder="Responsabilidades e conquistas..." />
                    </div>
                    <div className="field-actions">
                      <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowExpForm(false)}>Cancelar</Button>
                      <Button type="submit" loading={saving} style={{ width:'auto' }}>Guardar</Button>
                    </div>
                  </form>
                </div>
              )}

              {experience.length === 0 && !showExpForm && (
                <div className="card card--padded">
                  {isOwn ? 'Adiciona a tua experiência profissional.' : 'Sem experiência declarada.'}
                </div>
              )}

              {experience.map(exp => (
                <div key={exp.id} className="card card--accent-left card__body--lg" style={{ borderLeftColor:'var(--ink-200)' }}>
                  <div className="row--between" style={{ alignItems:'flex-start' }}>
                    <div className="stack--xs">
                      <span className="caption" style={{ textTransform:'uppercase', letterSpacing:'.06em' }}>{TYPE_LABEL[exp.type]}</span>
                      <span className="heading-sm">{exp.title}</span>
                      <span className="body-sm" style={{ fontWeight:'var(--w-bold)', color:'var(--ink-700)' }}>{exp.organization}</span>
                      <span className="caption">
                        {dateRange(exp.start_date, exp.end_date, exp.is_current)}
                        {exp.location && ` · ${exp.location}`}
                      </span>
                      {exp.description && <p className="body-sm" style={{ marginTop:'var(--s2)', lineHeight:1.6 }}>{exp.description}</p>}
                    </div>
                    {isOwn && (
                      <button onClick={() => deleteExp(exp.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:'var(--t-lg)', color:'var(--ink-300)', lineHeight:1, flexShrink:0 }}>×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Projectos ── */}
          {tab === 'projects' && (
            <div className="stack">
              {projects.length === 0 && <div className="card card--padded">Sem projectos ainda.</div>}
              {projects.map(p => {
                const st = STATUS_TOKEN[p.status] || STATUS_TOKEN.archived;
                return (
                  <div key={p.id} className="card card--accent-left card__body--lg" style={{ borderLeftColor: st.text }}>
                    <div className="row--wrap" style={{ marginBottom:'var(--s2)' }}>
                      <span className="heading-sm">{p.title}</span>
                      <span className="tag" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                    </div>
                    <div className="meta-line" style={{ marginBottom:'var(--s2)' }}>
                      <span>Papel: <strong>{p.member_role}</strong></span>
                      <span>{p.team_size} membros</span>
                    </div>
                    <p className="body-sm">{p.description?.slice(0,120)}{p.description?.length > 120 ? '...' : ''}</p>
                    {p.skills_used?.length > 0 && (
                      <div className="row--wrap" style={{ marginTop:'var(--s3)' }}>
                        {p.skills_used.map(s => <span key={s} className="tag tag--red">{s}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Skills ── */}
          {tab === 'skills' && (
            <div className="card card__body--lg">
              {skills.length === 0 && <p className="caption" style={{ textAlign:'center' }}>Sem skills declaradas.</p>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s2)' }}>
                {skills.map(s => (
                  <div key={s.skill} className="row--between" style={{ padding:'var(--s3)', background:'var(--bg)', borderRadius:'var(--r-sm)' }}>
                    <span className="body-sm" style={{ fontWeight:'var(--w-bold)', color:'var(--ink-900)' }}>{s.skill}</span>
                    <div style={{ display:'flex', gap:3 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: i<=s.level ? 'var(--red)' : 'var(--ink-100)' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {isOwn && (
                <div style={{ marginTop:'var(--s5)', paddingTop:'var(--s4)', borderTop:'var(--line)' }}>
                  <Link to="/perfil" className="body-sm" style={{ color:'var(--red)', fontWeight:'var(--w-bold)' }}>Gerir skills no perfil →</Link>
                </div>
              )}
            </div>
          )}

          {/* ── Avaliações ── */}
          {tab === 'reviews' && (
            <div className="stack">
              {!isOwn && me && !showReview && (
                <div>
                  <Button style={{ width:'auto' }} onClick={() => setShowReview(true)}>Escrever avaliação</Button>
                </div>
              )}

              {showReview && (
                <div className="card card--accent-left card__body--lg" style={{ borderLeftColor:'var(--red)' }}>
                  <h3 className="section-header">Avaliar {user.name}</h3>
                  <form onSubmit={submitReview} className="stack">
                    <div className="field">
                      <label className="field__label">Pontuação *</label>
                      <div className="row--sm">
                        {[1,2,3,4,5].map(i => (
                          <button key={i} type="button"
                            onClick={() => setReviewForm(f=>({...f,score:i}))}
                            style={{ width:40, height:40, borderRadius:'var(--r-sm)', border:`2px solid ${reviewForm.score >= i ? 'var(--amber-mid)' : 'var(--ink-200)'}`, background: reviewForm.score >= i ? 'var(--amber-soft)' : 'none', cursor:'pointer', fontSize:'var(--t-md)', color:'var(--amber-mid)' }}>
                            ★
                          </button>
                        ))}
                        <span className="caption">{reviewForm.score}/5</span>
                      </div>
                    </div>
                    <div className="field">
                      <label className="field__label">Contexto</label>
                      <select className="select" value={reviewForm.context} onChange={e => setReviewForm(f=>({...f,context:e.target.value}))}>
                        <option value="collaboration">Colaboração</option>
                        <option value="project">Projecto</option>
                        <option value="job">Trabalho</option>
                        <option value="mentorship">Mentoria</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="field__label">Comentário (opcional)</label>
                      <textarea className="textarea" rows={3} value={reviewForm.comment} onChange={e => setReviewForm(f=>({...f,comment:e.target.value}))} placeholder="Descreve a tua experiência..." />
                    </div>
                    <div className="row" style={{ justifyContent:'flex-end' }}>
                      <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowReview(false)}>Cancelar</Button>
                      <Button type="submit" loading={saving} style={{ width:'auto' }}>Enviar avaliação</Button>
                    </div>
                  </form>
                </div>
              )}

              {reviews.length === 0 && <div className="card card--padded">Sem avaliações ainda.</div>}

              {reviews.map((r, i) => (
                <div key={i} className="card card__body--lg">
                  <div className="row--between" style={{ marginBottom:'var(--s3)', flexWrap:'wrap', gap:'var(--s2)' }}>
                    <div className="row--sm">
                      <Avatar name={r.reviewer_name} src={r.reviewer_avatar} size="sm" />
                      <div>
                        <span className="body-sm" style={{ fontWeight:'var(--w-bold)', color:'var(--ink-900)' }}>{r.reviewer_name}</span>
                        <div className="meta-line"><Badge level={r.reviewer_level} /></div>
                      </div>
                    </div>
                    <div className="row--sm">
                      <StarRating score={r.score} />
                      <span className="caption">{new Date(r.created_at).toLocaleDateString('pt-AO')}</span>
                    </div>
                  </div>
                  {r.comment && <p className="body-sm" style={{ lineHeight:1.6 }}>{r.comment}</p>}
                  {r.context && <span className="caption" style={{ display:'block', marginTop:'var(--s2)' }}>Contexto: {r.context}</span>}
                </div>
              ))}
            </div>
          )}

        </div>
      </div></div>
    </div>
  );
}
