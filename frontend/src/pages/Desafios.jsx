import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';

const CATEGORIES = ['frontend','backend','mobile','devops','data','security','ai'];
const DIFF_CLASS = {
  iniciante: 'tag--iniciante',
  junior:    'tag--junior',
  pleno:     'tag--pleno',
  senior:    'tag--senior',
};

function timeLeft(created, days) {
  const deadline = new Date(new Date(created).getTime() + days * 86400000);
  const diff = Math.ceil((deadline - Date.now()) / 86400000);
  if (diff <= 0) return 'Encerrado';
  return `${diff} dias restantes`;
}

export default function Desafios() {
  const { user }        = useAuth();
  const [challenges,    setChallenges]  = useState([]);
  const [filter,        setFilter]      = useState('');
  const [loading,       setLoading]     = useState(true);
  const [active,        setActive]      = useState(null);
  const [subForm,       setSubForm]     = useState({ repo_url:'', demo_url:'', description:'' });
  const [submitting,    setSubmitting]  = useState(false);
  const [msg,           setMsg]         = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/challenges', { params: filter ? { category: filter } : {} })
      .then(r => setChallenges(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleSubmit(challengeId) {
    if (!subForm.repo_url) { flash('URL do repositório obrigatório.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/challenges/${challengeId}/submit`, subForm);
      flash('Submissão enviada! Aguarda avaliação.');
      setActive(null);
      setChallenges(prev => prev.map(c =>
        c.id === challengeId ? { ...c, my_status:'submitted' } : c
      ));
    } catch (err) { flash(err.response?.data?.error || 'Erro ao submeter.'); }
    finally { setSubmitting(false); }
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
              <h1 className="page-header__title">Proof Lab</h1>
              <p className="page-header__sub">Não dizer que sabe. Provar que sabe. Completa desafios e adiciona provas reais ao teu perfil.</p>
            </div>
          </div>

          {/* Filtros de categoria */}
          <div className="filter-bar" style={{ marginBottom:'var(--s5)' }}>
            <button
              className={`chip${!filter ? ' chip--active' : ''}`}
              onClick={() => setFilter('')}>
              Todos
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat}
                className={`chip${filter===cat ? ' chip--active chip--red' : ''}`}
                onClick={() => setFilter(filter===cat ? '' : cat)}
                style={{ textTransform:'capitalize' }}>
                {cat}
              </button>
            ))}
          </div>

          {loading && <div className="spinner" />}

          <div className="stack--sm">
            {challenges.map(ch => (
              <div key={ch.id} className="card card--accent-left"
                style={{ borderLeftColor:`var(--level-${ch.difficulty}-text, var(--ink-200))` }}>
                <div className="card__body">
                  {ch.is_sponsored && (
                    <div style={{ marginBottom:'var(--s2)' }}>
                      <span className="tag tag--gold">Patrocinado por {ch.sponsor_name}</span>
                    </div>
                  )}

                  <div className="row--between" style={{ alignItems:'flex-start', flexWrap:'wrap', gap:'var(--s3)' }}>
                    <div className="stack--xs" style={{ flex:1 }}>
                      <h3 className="heading-sm">{ch.title}</h3>
                      <div className="meta-line">
                        <span className={`tag ${DIFF_CLASS[ch.difficulty] || 'tag--neutral'}`}>{ch.difficulty}</span>
                        <span>{ch.category}</span>
                        <span>{ch.submissions_count} submissões · {ch.approved_count} aprovadas</span>
                        <span>{timeLeft(ch.created_at, ch.deadline_days)}</span>
                      </div>
                      <p className="body-sm">{ch.description}</p>
                    </div>

                    <div className="stack--xs" style={{ alignItems:'flex-end', flexShrink:0 }}>
                      {ch.my_status ? (
                        <span className={`tag ${ch.my_status==='approved' ? 'tag--green' : ch.my_status==='rejected' ? 'tag--red' : 'tag--neutral'}`}>
                          {ch.my_status === 'approved' ? 'Aprovado' : ch.my_status === 'rejected' ? 'Rejeitado' : 'Submetido'}
                        </span>
                      ) : user ? (
                        <Button style={{ width:'auto' }} onClick={() => setActive(active===ch.id ? null : ch.id)}>
                          {active===ch.id ? 'Fechar' : 'Submeter solução'}
                        </Button>
                      ) : null}
                      <button className="btn-back" style={{ margin:0 }}
                        onClick={() => setActive(active===ch.id ? null : ch.id)}>
                        {active===ch.id ? '▲ Fechar' : '▼ Ver instruções'}
                      </button>
                    </div>
                  </div>

                  {active === ch.id && (
                    <div style={{ marginTop:'var(--s4)', borderTop:'var(--line)', paddingTop:'var(--s4)' }}>
                      <h4 className="heading-sm" style={{ marginBottom:'var(--s3)' }}>Instruções</h4>
                      <p className="body-sm" style={{ lineHeight:1.7, whiteSpace:'pre-wrap', marginBottom:'var(--s5)' }}>
                        {ch.instructions}
                      </p>

                      {user && !ch.my_status && (
                        <div className="card" style={{ background:'var(--bg)' }}>
                          <div className="card__body stack">
                            <h4 className="heading-sm">A tua solução</h4>
                            <div className="field">
                              <label className="field__label">URL do Repositório *</label>
                              <input className="input" value={subForm.repo_url}
                                onChange={e => setSubForm(s=>({...s,repo_url:e.target.value}))}
                                placeholder="https://github.com/..." />
                            </div>
                            <div className="field">
                              <label className="field__label">URL da Demo (opcional)</label>
                              <input className="input" value={subForm.demo_url}
                                onChange={e => setSubForm(s=>({...s,demo_url:e.target.value}))}
                                placeholder="https://..." />
                            </div>
                            <div className="field">
                              <label className="field__label">Descrição (opcional)</label>
                              <textarea className="textarea" rows={3} value={subForm.description}
                                onChange={e => setSubForm(s=>({...s,description:e.target.value}))}
                                placeholder="Explica as tuas escolhas técnicas..." />
                            </div>
                            <div style={{ display:'flex', justifyContent:'flex-end' }}>
                              <Button loading={submitting} style={{ width:'auto' }}
                                onClick={() => handleSubmit(ch.id)}>
                                Submeter solução
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!loading && challenges.length === 0 && (
              <div className="card card--padded">Sem desafios disponíveis nesta categoria.</div>
            )}
          </div>
        </div>
      </div></div>
    </div>
  );
}
