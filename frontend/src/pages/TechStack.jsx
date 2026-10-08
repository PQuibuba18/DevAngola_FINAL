import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import Button from '../components/ui/Button';

const POPULAR_TAGS = ['nodejs','react','postgresql','multicaixa','angola','api','mobile','python','docker','javascript'];

function VoteBtn({ value, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:28, height:28, borderRadius:'var(--r-xs)',
      border:'var(--line)', background:'none',
      color:'var(--ink-400)', cursor:'pointer',
      fontWeight:'var(--w-bold)', fontSize:'var(--t-sm)',
      display:'flex', alignItems:'center', justifyContent:'center',
      transition:'background var(--t-fast)',
    }}
      onMouseEnter={e => e.currentTarget.style.background='var(--ink-50)'}
      onMouseLeave={e => e.currentTarget.style.background='none'}
    >
      {value === 1 ? '▲' : '▼'}
    </button>
  );
}

export default function TechStack() {
  const { user }  = useAuth();
  const [questions,  setQuestions]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tag,        setTag]        = useState('');
  const [angolaOnly, setAngolaOnly] = useState(false);
  const [search,     setSearch]     = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [active,     setActive]     = useState(null);
  const [detail,     setDetail]     = useState(null);
  const [form,       setForm]       = useState({ title:'', body:'', tags:'', angola_context:false });
  const [answerText, setAnswerText] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (tag)        params.tag         = tag;
    if (angolaOnly) params.angola_only = 'true';
    if (search)     params.q           = search;
    api.get('/questions', { params })
      .then(r => setQuestions(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tag, angolaOnly, search]);

  async function loadDetail(id) {
    try { const r = await api.get(`/questions/${id}`); setDetail(r.data); setActive(id); }
    catch {}
  }

  async function submitQuestion(e) {
    e.preventDefault();
    if (!form.title || !form.body) { flash('Título e descrição obrigatórios.'); return; }
    setSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const r = await api.post('/questions', { ...form, tags });
      setQuestions(q => [r.data, ...q]);
      setShowForm(false);
      setForm({ title:'', body:'', tags:'', angola_context:false });
      flash('Pergunta publicada!');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  async function submitAnswer(questionId) {
    if (!answerText.trim()) return;
    setSaving(true);
    try {
      const r = await api.post(`/questions/${questionId}/answers`, { body: answerText.trim() });
      setDetail(d => d ? { ...d, answers: [...d.answers, r.data] } : d);
      setAnswerText('');
      flash('Resposta publicada!');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  async function acceptAnswer(questionId, answerId) {
    try {
      await api.put(`/questions/${questionId}/answers/${answerId}/accept`);
      setDetail(d => d ? { ...d, is_solved:true, answers: d.answers.map(a => ({ ...a, is_accepted: a.id === answerId })) } : d);
    } catch {}
  }

  async function vote(questionId, answerId, value) {
    if (!user) return;
    try {
      await api.post('/questions/vote', { question_id: questionId||null, answer_id: answerId||null, value });
      if (questionId && !answerId) setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, vote_score: (q.vote_score||0) + value } : q));
      if (answerId && detail)     setDetail(d => ({ ...d, answers: d.answers.map(a => a.id === answerId ? { ...a, vote_score: (a.vote_score||0) + value } : a) }));
    } catch {}
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="page-container">

          {msg && <div className="feedback feedback--success" style={{ position:'fixed', top:'calc(var(--nav-h) + 12px)', right:'var(--s5)', zIndex:999 }}>{msg}</div>}

          {/* Header */}
          <div className="page-header">
            <div className="page-header__text">
              <h1 className="page-header__title">Tech Stack Angola</h1>
              <p className="page-header__sub">Perguntas e respostas com contexto angolano — Multicaixa, bancos, APIs locais, legislação.</p>
            </div>
            {user && !active && (
              <Button style={{ width:'auto' }} onClick={() => setShowForm(!showForm)}>Fazer pergunta</Button>
            )}
          </div>

          {/* Formulário de pergunta */}
          {showForm && !active && (
            <div className="card card--accent-left card__body--lg stack" style={{ borderLeftColor:'var(--red)', marginBottom:'var(--s5)' }}>
              <h3 className="section-header">Nova Pergunta</h3>
              <form onSubmit={submitQuestion} className="stack">
                <div className="field">
                  <label className="field__label">Título *</label>
                  <input className="input" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Como integrar Multicaixa Express numa API Node.js?" />
                </div>
                <div className="field">
                  <label className="field__label">Descrição detalhada *</label>
                  <textarea className="textarea" rows={5} value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))} placeholder="Descreve o problema com detalhes. Inclui código se relevante." />
                </div>
                <div className="field">
                  <label className="field__label">Tags (separadas por vírgula)</label>
                  <input className="input" value={form.tags} onChange={e => setForm(f=>({...f,tags:e.target.value}))} placeholder="nodejs, multicaixa, angola, api" />
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:'var(--s2)', cursor:'pointer' }}>
                  <input type="checkbox" checked={form.angola_context} onChange={e => setForm(f=>({...f,angola_context:e.target.checked}))} />
                  <span className="body-sm" style={{ fontWeight:'var(--w-bold)' }}>Contexto específico de Angola (Multicaixa, bancos, legislação...)</span>
                </label>
                <div className="row" style={{ justifyContent:'flex-end' }}>
                  <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} style={{ width:'auto' }}>Publicar</Button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de perguntas */}
          {!active && (
            <>
              {/* Filtros */}
              <div className="row--wrap" style={{ marginBottom:'var(--s4)', gap:'var(--s3)' }}>
                <input className="input" style={{ flex:1, minWidth:200, height:36 }}
                  placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} />
                <label style={{ display:'flex', alignItems:'center', gap:'var(--s2)', cursor:'pointer', whiteSpace:'nowrap' }}>
                  <input type="checkbox" checked={angolaOnly} onChange={e => setAngolaOnly(e.target.checked)} />
                  <span className="caption" style={{ fontWeight:'var(--w-black)' }}>Apenas Angola</span>
                </label>
              </div>

              <div className="filter-bar" style={{ marginBottom:'var(--s5)' }}>
                <button
                  className={`chip${!tag ? ' chip--active' : ''}`}
                  onClick={() => setTag('')}>
                  Todos
                </button>
                {POPULAR_TAGS.map(t => (
                  <button key={t}
                    className={`chip${tag===t ? ' chip--active chip--red' : ''}`}
                    onClick={() => setTag(tag===t ? '' : t)}>
                    {t}
                  </button>
                ))}
              </div>

              {loading && <div className="spinner" />}

              <div className="stack--sm">
                {questions.map(q => (
                  <div key={q.id} className="card card--interactive" onClick={() => loadDetail(q.id)}>
                    <div className="card__body" style={{ display:'flex', gap:'var(--s4)', alignItems:'flex-start' }}>
                      {/* Score + Respostas */}
                      <div className="stack--xs" style={{ alignItems:'center', minWidth:48, textAlign:'center', flexShrink:0 }}>
                        <span style={{
                          fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-lg)',
                          color: q.vote_score > 0 ? 'var(--green)' : q.vote_score < 0 ? 'var(--red)' : 'var(--ink-400)',
                          lineHeight:1,
                        }}>{q.vote_score||0}</span>
                        <span className="caption">votos</span>
                        <span style={{
                          fontFamily:'var(--display)', fontWeight:'var(--w-bold)', fontSize:'var(--t-base)',
                          color: q.answers_count > 0 ? 'var(--blue)' : 'var(--ink-300)',
                          lineHeight:1,
                        }}>{q.answers_count}</span>
                        <span className="caption">resp.</span>
                      </div>

                      {/* Conteúdo */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="row--wrap" style={{ marginBottom:'var(--s1)' }}>
                          {q.is_solved     && <span className="tag tag--green">Resolvido</span>}
                          {q.angola_context && <span className="tag tag--gold">Angola</span>}
                          <span className="heading-sm">{q.title}</span>
                        </div>
                        <p className="body-sm" style={{ marginBottom:'var(--s2)' }}>
                          {q.body?.slice(0,120)}{q.body?.length>120?'...':''}
                        </p>
                        <div className="row--wrap">
                          {(q.tags||[]).map(t => <span key={t} className="tag tag--neutral">{t}</span>)}
                        </div>
                      </div>

                      {/* Autor */}
                      <div className="stack--xs" style={{ alignItems:'center', flexShrink:0 }}>
                        <Avatar name={q.author_name} src={q.author_avatar} size="xs" />
                        <span className="caption">{q.views} views</span>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && questions.length === 0 && (
                  <div className="card card--padded">Sem perguntas. Sê o primeiro!</div>
                )}
              </div>
            </>
          )}

          {/* Detalhe da pergunta */}
          {active && detail && (
            <div className="stack">
              <button onClick={() => { setActive(null); setDetail(null); }}
                className="body-sm"
                style={{ display:'flex', alignItems:'center', gap:'var(--s2)', background:'none', border:'none', cursor:'pointer', color:'var(--ink-400)', fontWeight:'var(--w-bold)', alignSelf:'flex-start' }}>
                ← Voltar às perguntas
              </button>

              {/* Pergunta */}
              <div className="card card__body--lg">
                <div style={{ display:'flex', gap:'var(--s4)' }}>
                  <div className="stack--xs" style={{ alignItems:'center', flexShrink:0 }}>
                    <VoteBtn value={1}  onClick={() => vote(detail.id, null, 1)} />
                    <span style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-lg)', color:'var(--ink-900)', lineHeight:1 }}>{detail.vote_score||0}</span>
                    <VoteBtn value={-1} onClick={() => vote(detail.id, null, -1)} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="row--wrap" style={{ marginBottom:'var(--s2)' }}>
                      {detail.is_solved     && <span className="tag tag--green">Resolvido</span>}
                      {detail.angola_context && <span className="tag tag--gold">Contexto Angola</span>}
                    </div>
                    <h2 className="heading-lg" style={{ marginBottom:'var(--s4)' }}>{detail.title}</h2>
                    <p className="body" style={{ whiteSpace:'pre-wrap', marginBottom:'var(--s4)' }}>{detail.body}</p>
                    <div className="row--wrap" style={{ marginBottom:'var(--s4)' }}>
                      {(detail.tags||[]).map(t => <span key={t} className="tag tag--neutral">{t}</span>)}
                    </div>
                    <div className="row--sm" style={{ paddingTop:'var(--s3)', borderTop:'var(--line)' }}>
                      <Avatar name={detail.author_name} src={detail.author_avatar} size="xs" />
                      <span className="caption">{detail.author_name}</span>
                      <Badge level={detail.author_level} />
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="section-header">{detail.answers?.length || 0} Resposta{detail.answers?.length !== 1 ? 's' : ''}</h3>

              {detail.answers?.map(a => (
                <div key={a.id} className={`card card--accent-left card__body--lg`}
                  style={{ borderLeftColor: a.is_accepted ? 'var(--green)' : 'var(--ink-100)' }}>
                  <div style={{ display:'flex', gap:'var(--s4)' }}>
                    <div className="stack--xs" style={{ alignItems:'center', flexShrink:0 }}>
                      <VoteBtn value={1}  onClick={() => vote(null, a.id, 1)} />
                      <span style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', color:'var(--ink-900)', lineHeight:1 }}>{a.vote_score||0}</span>
                      <VoteBtn value={-1} onClick={() => vote(null, a.id, -1)} />
                      {a.is_accepted && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex:1 }}>
                      {a.is_accepted && <span className="caption" style={{ color:'var(--green)', fontWeight:'var(--w-black)', display:'block', marginBottom:'var(--s2)' }}>Resposta aceite</span>}
                      <p className="body" style={{ whiteSpace:'pre-wrap', marginBottom:'var(--s3)' }}>{a.body}</p>
                      <div className="row--between">
                        <div className="row--sm">
                          <Avatar name={a.author_name} src={a.author_avatar} size="xs" />
                          <span className="caption">{a.author_name}</span>
                          <Badge level={a.author_level} />
                        </div>
                        {!detail.is_solved && user?.id === detail.user_id && (
                          <button onClick={() => acceptAnswer(detail.id, a.id)}
                            className="caption"
                            style={{ color:'var(--green)', fontWeight:'var(--w-black)', background:'none', border:'1.5px solid var(--green-border)', padding:'3px 10px', borderRadius:'var(--r-full)', cursor:'pointer' }}>
                            Aceitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {user && (
                <div className="card card__body--lg stack">
                  <h4 className="heading-sm">A tua resposta</h4>
                  <textarea className="textarea" rows={5} value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Escreve uma resposta clara e detalhada..." />
                  <div className="row" style={{ justifyContent:'flex-end' }}>
                    <Button loading={saving} style={{ width:'auto' }} onClick={() => submitAnswer(detail.id)}>
                      Publicar resposta
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div></div>
    </div>
  );
}
