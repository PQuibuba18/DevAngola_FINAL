import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import Button from '../components/ui/Button';

const POPULAR_TAGS = ['nodejs','react','postgresql','multicaixa','angola','api','mobile','python','docker','javascript'];

function VoteButton({ value, current, onClick }) {
  const active = current === value;
  return (
    <button onClick={onClick} style={{
      width:28, height:28, borderRadius:4, border:`1.5px solid ${active ? 'var(--red)' : 'var(--ink-200)'}`,
      background: active ? 'var(--red-soft)' : 'none', color: active ? 'var(--red)' : 'var(--ink-400)',
      cursor:'pointer', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center',
    }}>{value === 1 ? '▲' : '▼'}</button>
  );
}

export default function TechStack() {
  const { user }    = useAuth();
  const [questions, setQuestions]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [tag,       setTag]         = useState('');
  const [angolaOnly, setAngolaOnly] = useState(false);
  const [search,    setSearch]      = useState('');
  const [showForm,  setShowForm]    = useState(false);
  const [active,    setActive]      = useState(null);
  const [detail,    setDetail]      = useState(null);
  const [form, setForm] = useState({ title:'', body:'', tags:'', angola_context: false });
  const [answerText, setAnswerText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (tag) params.tag = tag;
    if (angolaOnly) params.angola_only = 'true';
    if (search) params.q = search;
    api.get('/questions', { params })
      .then(r => setQuestions(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tag, angolaOnly, search]);

  async function loadDetail(id) {
    try {
      const r = await api.get(`/questions/${id}`);
      setDetail(r.data);
      setActive(id);
    } catch {}
  }

  async function submitQuestion(e) {
    e.preventDefault();
    if (!form.title || !form.body) { setMsg('Título e descrição obrigatórios.'); return; }
    setSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const r = await api.post('/questions', { ...form, tags });
      setQuestions(q => [r.data, ...q]);
      setShowForm(false);
      setForm({ title:'', body:'', tags:'', angola_context: false });
      setMsg('Pergunta publicada!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  async function submitAnswer(questionId) {
    if (!answerText.trim()) return;
    setSaving(true);
    try {
      const r = await api.post(`/questions/${questionId}/answers`, { body: answerText.trim() });
      setDetail(d => d ? { ...d, answers: [...d.answers, r.data] } : d);
      setAnswerText('');
      setMsg('Resposta publicada!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) { setMsg(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  async function acceptAnswer(questionId, answerId) {
    try {
      await api.put(`/questions/${questionId}/answers/${answerId}/accept`);
      setDetail(d => d ? { ...d, is_solved: true, answers: d.answers.map(a => ({ ...a, is_accepted: a.id === answerId })) } : d);
    } catch {}
  }

  async function vote(questionId, answerId, value) {
    if (!user) return;
    try {
      await api.post('/questions/vote', { question_id: questionId||null, answer_id: answerId||null, value });
      if (questionId && !answerId) {
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, vote_score: (q.vote_score||0) + value } : q));
        if (detail?.id === questionId) setDetail(d => ({ ...d, vote_score: (d.vote_score||0) + value }));
      }
      if (answerId && detail) {
        setDetail(d => ({ ...d, answers: d.answers.map(a => a.id === answerId ? { ...a, vote_score: (a.vote_score||0) + value } : a) }));
      }
    } catch {}
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div style={{ maxWidth: 860, margin:'0 auto' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--s4)', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontFamily:'var(--display)', fontSize:'var(--t-2xl)', fontWeight:'var(--w-black)', letterSpacing:'-.03em', color:'var(--ink-900)', marginBottom:4 }}>
                Tech Stack Angola
              </h1>
              <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)' }}>
                Perguntas e respostas com contexto angolano — Multicaixa, bancos, APIs locais, legislação.
              </p>
            </div>
            {user && <Button style={{ width:'auto' }} onClick={() => setShowForm(!showForm)}>Fazer pergunta</Button>}
          </div>

          {msg && <div style={{ background:'var(--ink-900)', color:'#fff', padding:'10px 16px', borderRadius:8, fontSize:13, fontWeight:600, marginBottom:16 }}>{msg}</div>}

          {showForm && (
            <div className="card" style={{ padding:'var(--s6)', marginBottom:'var(--s5)', borderLeft:'4px solid var(--red)' }}>
              <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', marginBottom:'var(--s4)' }}>Nova Pergunta</h3>
              <form onSubmit={submitQuestion} style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
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
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.angola_context} onChange={e => setForm(f=>({...f,angola_context:e.target.checked}))} />
                  <span style={{ fontWeight:600, color:'var(--ink-600)' }}>Pergunta específica de Angola (Multicaixa, bancos, legislação, serviços locais...)</span>
                </label>
                <div style={{ display:'flex', gap:'var(--s3)', justifyContent:'flex-end' }}>
                  <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} style={{ width:'auto' }}>Publicar</Button>
                </div>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display:'flex', gap:'var(--s3)', flexWrap:'wrap', marginBottom:'var(--s4)', alignItems:'center' }}>
            <input className="input" style={{ flex:1, minWidth:200, height:36 }}
              placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} />
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, cursor:'pointer', color:'var(--ink-600)', whiteSpace:'nowrap' }}>
              <input type="checkbox" checked={angolaOnly} onChange={e => setAngolaOnly(e.target.checked)} />
              Apenas Angola
            </label>
          </div>

          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'var(--s4)' }}>
            <button onClick={() => setTag('')}
              style={{ padding:'3px 10px', borderRadius:999, border:'1.5px solid', fontSize:11, fontWeight:700, cursor:'pointer', background:!tag?'var(--ink-900)':'none', color:!tag?'#fff':'var(--ink-500)', borderColor:!tag?'var(--ink-900)':'var(--ink-200)' }}>
              Todos
            </button>
            {POPULAR_TAGS.map(t => (
              <button key={t} onClick={() => setTag(tag===t?'':t)}
                style={{ padding:'3px 10px', borderRadius:999, border:'1.5px solid', fontSize:11, fontWeight:700, cursor:'pointer', background:tag===t?'var(--red)':'none', color:tag===t?'#fff':'var(--ink-500)', borderColor:tag===t?'var(--red)':'var(--ink-200)' }}>
                {t}
              </button>
            ))}
          </div>

          {loading && <div className="spinner" />}

          {/* Lista de perguntas */}
          {!active && (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--s2)' }}>
              {questions.map(q => (
                <div key={q.id} className="card" style={{ padding:'var(--s4)', cursor:'pointer' }}
                  onClick={() => loadDetail(q.id)}>
                  <div style={{ display:'flex', gap:'var(--s4)', alignItems:'flex-start' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:48, textAlign:'center' }}>
                      <span style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-lg)', color: q.vote_score > 0 ? '#1A5C30' : q.vote_score < 0 ? 'var(--red)' : 'var(--ink-400)' }}>{q.vote_score||0}</span>
                      <span style={{ fontSize:10, color:'var(--ink-400)' }}>votos</span>
                      <span style={{ fontFamily:'var(--display)', fontWeight:'var(--w-bold)', fontSize:'var(--t-base)', color: q.answers_count > 0 ? '#1A3A8A' : 'var(--ink-300)' }}>{q.answers_count}</span>
                      <span style={{ fontSize:10, color:'var(--ink-400)' }}>resp.</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                        {q.is_solved && <span style={{ fontSize:11, fontWeight:700, color:'#1A5C30', background:'#E6F4EA', padding:'1px 7px', borderRadius:999 }}>Resolvido</span>}
                        {q.angola_context && <span style={{ fontSize:11, fontWeight:700, color:'#C8860A', background:'#FEF7E0', padding:'1px 7px', borderRadius:999 }}>Angola</span>}
                        <h3 style={{ fontWeight:'var(--w-bold)', fontSize:'var(--t-base)', color:'var(--ink-900)', margin:0 }}>{q.title}</h3>
                      </div>
                      <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', lineHeight:1.5, marginBottom:6 }}>
                        {q.body?.slice(0,120)}{q.body?.length>120?'...':''}
                      </p>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {(q.tags||[]).map(t => (
                          <span key={t} style={{ fontSize:11, padding:'1px 7px', borderRadius:999, background:'var(--ink-100)', color:'var(--ink-600)', fontWeight:600 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <Avatar name={q.author_name} src={q.author_avatar} size="xs" />
                      <div style={{ fontSize:11, color:'var(--ink-400)', marginTop:2 }}>{q.views} views</div>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && questions.length === 0 && (
                <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
                  Sem perguntas. Sê o primeiro!
                </div>
              )}
            </div>
          )}

          {/* Detalhe da pergunta */}
          {active && detail && (
            <div>
              <button onClick={() => { setActive(null); setDetail(null); }}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--ink-400)', fontWeight:600, marginBottom:'var(--s4)', display:'flex', alignItems:'center', gap:4 }}>
                ← Voltar às perguntas
              </button>

              <div className="card" style={{ padding:'var(--s6)', marginBottom:'var(--s3)' }}>
                <div style={{ display:'flex', gap:'var(--s4)' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <VoteButton value={1}  current={null} onClick={() => vote(detail.id, null, 1)} />
                    <span style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-lg)', color:'var(--ink-900)' }}>{detail.vote_score||0}</span>
                    <VoteButton value={-1} current={null} onClick={() => vote(detail.id, null, -1)} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, marginBottom:'var(--s2)', flexWrap:'wrap' }}>
                      {detail.is_solved && <span style={{ fontSize:11, fontWeight:700, color:'#1A5C30', background:'#E6F4EA', padding:'2px 8px', borderRadius:999 }}>Resolvido</span>}
                      {detail.angola_context && <span style={{ fontSize:11, fontWeight:700, color:'#C8860A', background:'#FEF7E0', padding:'2px 8px', borderRadius:999 }}>Contexto Angola</span>}
                    </div>
                    <h2 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-xl)', color:'var(--ink-900)', marginBottom:'var(--s4)' }}>{detail.title}</h2>
                    <p style={{ fontSize:'var(--t-base)', color:'var(--ink-600)', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{detail.body}</p>
                    <div style={{ display:'flex', gap:6, marginTop:'var(--s3)', flexWrap:'wrap' }}>
                      {(detail.tags||[]).map(t => <span key={t} style={{ fontSize:11, padding:'2px 8px', borderRadius:999, background:'var(--ink-100)', color:'var(--ink-600)', fontWeight:600 }}>{t}</span>)}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:'var(--s4)', borderTop:'var(--line)', paddingTop:'var(--s3)' }}>
                      <Avatar name={detail.author_name} src={detail.author_avatar} size="xs" />
                      <span style={{ fontSize:12, color:'var(--ink-400)' }}>{detail.author_name} · <Badge level={detail.author_level} /></span>
                    </div>
                  </div>
                </div>
              </div>

              <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)', margin:'var(--s5) 0 var(--s3)' }}>
                {detail.answers?.length || 0} Resposta{detail.answers?.length !== 1 ? 's' : ''}
              </h3>

              {detail.answers?.map(a => (
                <div key={a.id} className="card" style={{ padding:'var(--s5)', marginBottom:'var(--s2)', borderLeft: a.is_accepted ? '4px solid #1A5C30' : '4px solid var(--ink-100)' }}>
                  <div style={{ display:'flex', gap:'var(--s4)' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <VoteButton value={1}  current={null} onClick={() => vote(null, a.id, 1)} />
                      <span style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', color:'var(--ink-900)' }}>{a.vote_score||0}</span>
                      <VoteButton value={-1} current={null} onClick={() => vote(null, a.id, -1)} />
                      {a.is_accepted && <span style={{ fontSize:11, color:'#1A5C30', fontWeight:800 }}>✓</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      {a.is_accepted && (
                        <div style={{ fontSize:11, fontWeight:700, color:'#1A5C30', marginBottom:6 }}>Resposta aceite</div>
                      )}
                      <p style={{ fontSize:'var(--t-base)', color:'var(--ink-700)', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{a.body}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:'var(--s3)', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Avatar name={a.author_name} src={a.author_avatar} size="xs" />
                          <span style={{ fontSize:12, color:'var(--ink-400)' }}>{a.author_name}</span>
                          <Badge level={a.author_level} />
                        </div>
                        {!detail.is_solved && user?.id === detail.user_id && (
                          <button onClick={() => acceptAnswer(detail.id, a.id)}
                            style={{ fontSize:12, color:'#1A5C30', fontWeight:700, background:'none', border:'1.5px solid #1A5C30', padding:'3px 10px', borderRadius:999, cursor:'pointer' }}>
                            Aceitar resposta
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {user && (
                <div className="card" style={{ padding:'var(--s5)', marginTop:'var(--s4)' }}>
                  <h4 style={{ fontWeight:'var(--w-bold)', marginBottom:'var(--s3)' }}>A tua resposta</h4>
                  <textarea className="textarea" rows={5} value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Escreve uma resposta clara e detalhada..." />
                  <div style={{ marginTop:'var(--s3)', display:'flex', justifyContent:'flex-end' }}>
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
