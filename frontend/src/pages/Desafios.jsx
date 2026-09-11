import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Badge  from '../components/ui/Badge';

const CATEGORIES = ['frontend','backend','mobile','devops','data','security','ai'];
const DIFF_COLOR = { iniciante:'#1E5631', junior:'#1A3A8A', pleno:'#7B4F00', senior:'#4A1580' };

function timeAgo(created, days) {
  const deadline = new Date(new Date(created).getTime() + days * 86400000);
  const diff = Math.ceil((deadline - Date.now()) / 86400000);
  if (diff <= 0) return 'Encerrado';
  return `${diff} dias restantes`;
}

export default function Desafios() {
  const { user }  = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState(null); // desafio expandido
  const [submitting, setSubmitting] = useState(false);
  const [subForm, setSubForm] = useState({ repo_url:'', demo_url:'', description:'' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/challenges', { params: filter ? { category: filter } : {} })
      .then(r => setChallenges(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleSubmit(challengeId) {
    if (!subForm.repo_url) { setMsg('URL do repositório obrigatório.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/challenges/${challengeId}/submit`, subForm);
      setMsg('Submissão enviada! Aguarda avaliação.');
      setActive(null);
      setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, my_status: 'submitted' } : c));
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erro ao submeter.');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          <div style={{ marginBottom: 'var(--s6)' }}>
            <h1 style={{ fontFamily:'var(--display)', fontSize:'var(--t-2xl)', fontWeight:'var(--w-black)', letterSpacing:'-.03em', color:'var(--ink-900)', marginBottom: 4 }}>
              Proof Lab
            </h1>
            <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)' }}>
              Não dizer que sabe. Provar que sabe. Completa desafios e adiciona provas reais ao teu perfil.
            </p>
          </div>

          {msg && (
            <div style={{ background:'var(--ink-900)', color:'#fff', padding:'10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              {msg}
            </div>
          )}

          {/* Filtros de categoria */}
          <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginBottom:'var(--s5)' }}>
            <button onClick={() => setFilter('')}
              style={{ padding:'4px 14px', borderRadius:999, border:'1.5px solid', fontSize:12, fontWeight:700, cursor:'pointer', background: !filter ? 'var(--ink-900)' : 'none', color: !filter ? '#fff' : 'var(--ink-600)', borderColor: !filter ? 'var(--ink-900)' : 'var(--ink-200)' }}>
              Todos
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                style={{ padding:'4px 14px', borderRadius:999, border:'1.5px solid', fontSize:12, fontWeight:700, cursor:'pointer', textTransform:'capitalize', background: filter===cat ? 'var(--red)' : 'none', color: filter===cat ? '#fff' : 'var(--ink-600)', borderColor: filter===cat ? 'var(--red)' : 'var(--ink-200)' }}>
                {cat}
              </button>
            ))}
          </div>

          {loading && <div className="spinner" />}

          <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
            {challenges.map(ch => (
              <div key={ch.id} className="card" style={{ padding:'var(--s5)', borderLeft:`4px solid ${DIFF_COLOR[ch.difficulty]||'#888'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap: 8 }}>
                  <div style={{ flex:1 }}>
                    {ch.is_sponsored && (
                      <div style={{ fontSize:11, fontWeight:700, color:'#C8860A', background:'#FEF7E0', display:'inline-block', padding:'2px 8px', borderRadius:999, marginBottom: 6 }}>
                        Patrocinado por {ch.sponsor_name}
                      </div>
                    )}
                    <h3 style={{ fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)', marginBottom: 4 }}>{ch.title}</h3>
                    <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background: DIFF_COLOR[ch.difficulty]+'20', color: DIFF_COLOR[ch.difficulty] }}>
                        {ch.difficulty}
                      </span>
                      <span style={{ fontSize:11, color:'var(--ink-400)' }}>{ch.category}</span>
                      <span style={{ fontSize:11, color:'var(--ink-400)' }}>{ch.submissions_count} submissões · {ch.approved_count} aprovadas</span>
                      <span style={{ fontSize:11, color: ch.deadline_days ? 'var(--ink-400)' : 'var(--red)' }}>
                        {timeAgo(ch.created_at, ch.deadline_days)}
                      </span>
                    </div>
                    <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', lineHeight:1.5 }}>{ch.description}</p>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap: 8, alignItems:'flex-end' }}>
                    {ch.my_status ? (
                      <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:999, background:'#E6F4EA', color:'#1A5C30' }}>
                        {ch.my_status === 'approved' ? 'Aprovado' : ch.my_status === 'rejected' ? 'Rejeitado' : 'Submetido'}
                      </span>
                    ) : user ? (
                      <Button style={{ width:'auto' }} onClick={() => setActive(active===ch.id ? null : ch.id)}>
                        {active===ch.id ? 'Fechar' : 'Submeter solução'}
                      </Button>
                    ) : null}
                    <button onClick={() => setActive(active===ch.id ? null : ch.id)}
                      style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer' }}>
                      {active===ch.id ? '▲ Fechar' : '▼ Ver instruções'}
                    </button>
                  </div>
                </div>

                {/* Instruções + form de submissão */}
                {active === ch.id && (
                  <div style={{ marginTop:'var(--s4)', borderTop:'var(--line)', paddingTop:'var(--s4)' }}>
                    <h4 style={{ fontWeight:'var(--w-bold)', fontSize:'var(--t-sm)', color:'var(--ink-900)', marginBottom: 8 }}>Instruções</h4>
                    <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-600)', lineHeight:1.7, whiteSpace:'pre-wrap', marginBottom:'var(--s5)' }}>{ch.instructions}</p>

                    {user && !ch.my_status && (
                      <div style={{ background:'var(--bg)', borderRadius:'var(--r-sm)', padding:'var(--s5)', border:'var(--line)' }}>
                        <h4 style={{ fontWeight:'var(--w-bold)', fontSize:'var(--t-sm)', color:'var(--ink-900)', marginBottom:'var(--s4)' }}>A tua solução</h4>
                        {[
                          { key:'repo_url',    label:'URL do Repositório *', placeholder:'https://github.com/...' },
                          { key:'demo_url',    label:'URL da Demo (opcional)', placeholder:'https://...' },
                          { key:'description', label:'Descrição (opcional)', placeholder:'Explica as tuas escolhas técnicas...' },
                        ].map(f => (
                          <div key={f.key} className="field" style={{ marginBottom:'var(--s3)' }}>
                            <label className="field__label">{f.label}</label>
                            {f.key === 'description'
                              ? <textarea className="textarea" rows={3} value={subForm[f.key]} placeholder={f.placeholder}
                                  onChange={e => setSubForm(s => ({...s, [f.key]: e.target.value}))} />
                              : <input className="input" value={subForm[f.key]} placeholder={f.placeholder}
                                  onChange={e => setSubForm(s => ({...s, [f.key]: e.target.value}))} />
                            }
                          </div>
                        ))}
                        <Button loading={submitting} style={{ width:'auto' }} onClick={() => handleSubmit(ch.id)}>
                          Submeter solução
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {!loading && challenges.length === 0 && (
              <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
                Sem desafios disponíveis nesta categoria.
              </div>
            )}
          </div>
        </div>
      </div></div>
    </div>
  );
}
