import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import VerifiedBadge from '../components/ui/VerifiedBadge';

const CATEGORIES = ['Frontend','Backend','Mobile','Full Stack','DevOps','Design','Data','IA / ML','Outro'];
const STATUS_COLOR = { open:'#1A5C30', in_progress:'#1A3A8A', completed:'#444', cancelled:'#C41C00' };
const STATUS_LABEL = { open:'Aberto', in_progress:'Em progresso', completed:'Concluído', cancelled:'Cancelado' };

export default function WorkExchange() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', category:'Frontend', budget_min:'', budget_max:'', currency:'AOA', deadline:'' });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  useEffect(() => {
    api.get('/work').then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function ch(e) { setForm(f => ({...f, [e.target.name]: e.target.value})); }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.description) { setMsg('Título e descrição obrigatórios.'); return; }
    setSaving(true);
    try {
      const r = await api.post('/work', { ...form, budget_min: form.budget_min||null, budget_max: form.budget_max||null });
      setProjects(p => [r.data, ...p]);
      setShowForm(false);
      setForm({ title:'', description:'', category:'Frontend', budget_min:'', budget_max:'', currency:'AOA', deadline:'' });
      setMsg('Projecto publicado com sucesso!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.error || 'Erro ao publicar.'); }
    finally { setSaving(false); }
  }

  function budgetLabel(min, max, currency) {
    if (!min && !max) return 'Orçamento a negociar';
    if (min && max) return `${currency} ${Number(min).toLocaleString()} — ${Number(max).toLocaleString()}`;
    if (min) return `A partir de ${currency} ${Number(min).toLocaleString()}`;
    return `Até ${currency} ${Number(max).toLocaleString()}`;
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div style={{ maxWidth: 860, margin:'0 auto' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--s6)', flexWrap:'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily:'var(--display)', fontSize:'var(--t-2xl)', fontWeight:'var(--w-black)', letterSpacing:'-.03em', color:'var(--ink-900)', marginBottom: 4 }}>
                Work Exchange
              </h1>
              <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)' }}>
                Marketplace de trabalho tecnológico angolano — com confiança e transparência.
              </p>
            </div>
            {user && <Button style={{ width:'auto' }} onClick={() => setShowForm(!showForm)}>Publicar projecto</Button>}
          </div>

          {msg && <div style={{ background:'var(--ink-900)', color:'#fff', padding:'10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{msg}</div>}

          {showForm && (
            <div className="card" style={{ padding:'var(--s6)', marginBottom:'var(--s5)', borderLeft:'4px solid var(--red)' }}>
              <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-lg)', marginBottom:'var(--s5)' }}>Novo Projecto</h3>
              <form onSubmit={handleCreate} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s4)' }}>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label className="field__label">Título *</label>
                  <input className="input" name="title" value={form.title} onChange={ch} placeholder="Ex: Desenvolvimento de app mobile para clínica" />
                </div>
                <div className="field">
                  <label className="field__label">Categoria</label>
                  <select className="select" name="category" value={form.category} onChange={ch}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">Moeda</label>
                  <select className="select" name="currency" value={form.currency} onChange={ch}>
                    <option value="AOA">AOA (Kz)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">Orçamento mínimo</label>
                  <input className="input" name="budget_min" type="number" value={form.budget_min} onChange={ch} placeholder="Ex: 50000" />
                </div>
                <div className="field">
                  <label className="field__label">Orçamento máximo</label>
                  <input className="input" name="budget_max" type="number" value={form.budget_max} onChange={ch} placeholder="Ex: 150000" />
                </div>
                <div className="field">
                  <label className="field__label">Prazo</label>
                  <input className="input" name="deadline" type="date" value={form.deadline} onChange={ch} />
                </div>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label className="field__label">Descrição *</label>
                  <textarea className="textarea" rows={4} name="description" value={form.description} onChange={ch} placeholder="Descreve o projecto, requisitos, tecnologias preferidas..." />
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
            {projects.map(p => (
              <div key={p.id} className="card" style={{ padding:'var(--s5)', cursor:'pointer', borderLeft:`4px solid ${STATUS_COLOR[p.status]||'#888'}` }}
                onClick={() => navigate(`/work/${p.id}`)}>
                <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap: 8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap', marginBottom: 4 }}>
                      <h3 style={{ fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)', margin:0 }}>{p.title}</h3>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background: STATUS_COLOR[p.status]+'20', color: STATUS_COLOR[p.status] }}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap: 12, flexWrap:'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize:12, color:'var(--ink-600)', fontWeight:600 }}>{p.category}</span>
                      <span style={{ fontSize:12, color:'var(--ink-400)' }}>{budgetLabel(p.budget_min, p.budget_max, p.currency)}</span>
                      {p.deadline && <span style={{ fontSize:12, color:'var(--ink-400)' }}>Prazo: {new Date(p.deadline).toLocaleDateString('pt-AO')}</span>}
                      <span style={{ fontSize:12, color:'var(--ink-400)' }}>{p.proposals_count} propostas</span>
                    </div>
                    <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', lineHeight:1.5 }}>
                      {p.description?.slice(0, 150)}{p.description?.length > 150 ? '...' : ''}
                    </p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap: 8, flexShrink:0 }}>
                    <Avatar name={p.client_name} src={p.client_avatar} size="sm" />
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-900)' }}>{p.client_name}</div>
                      {p.client_verified && <VerifiedBadge size="sm" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!loading && projects.length === 0 && (
              <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
                Sem projectos publicados ainda. Sê o primeiro!
              </div>
            )}
          </div>
        </div>
      </div></div>
    </div>
  );
}
