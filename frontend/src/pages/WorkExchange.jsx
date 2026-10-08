import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import VerifiedBadge from '../components/ui/VerifiedBadge';

const CATEGORIES = ['Frontend','Backend','Mobile','Full Stack','DevOps','Design','Data','IA / ML','Outro'];
const STATUS_TOKEN = {
  open:        { cls:'tag--green',  label:'Aberto'        },
  in_progress: { cls:'tag--blue',   label:'Em progresso'  },
  completed:   { cls:'tag--neutral',label:'Concluído'     },
  cancelled:   { cls:'tag--red',    label:'Cancelado'     },
};

export default function WorkExchange() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [form, setForm] = useState({
    title:'', description:'', category:'Frontend',
    budget_min:'', budget_max:'', currency:'AOA', deadline:'',
  });

  useEffect(() => {
    api.get('/work')
      .then(r => setProjects(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function ch(e) { setForm(f => ({...f, [e.target.name]: e.target.value})); }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.description) { flash('Título e descrição obrigatórios.'); return; }
    setSaving(true);
    try {
      const r = await api.post('/work', {
        ...form,
        budget_min: form.budget_min || null,
        budget_max: form.budget_max || null,
      });
      setProjects(p => [r.data, ...p]);
      setShowForm(false);
      setForm({ title:'', description:'', category:'Frontend', budget_min:'', budget_max:'', currency:'AOA', deadline:'' });
      flash('Projecto publicado!');
    } catch (err) { flash(err.response?.data?.error || 'Erro ao publicar.'); }
    finally { setSaving(false); }
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

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
        <div className="page-container">

          {msg && <div className="toast toast--success">{msg}</div>}

          <div className="page-header">
            <div className="page-header__text">
              <h1 className="page-header__title">Work Exchange</h1>
              <p className="page-header__sub">Marketplace de trabalho tecnológico angolano — com confiança e transparência.</p>
            </div>
            {user && (
              <Button style={{ width:'auto' }} onClick={() => setShowForm(!showForm)}>
                Publicar projecto
              </Button>
            )}
          </div>

          {showForm && (
            <div className="card card--accent-left card__body--lg" style={{ borderLeftColor:'var(--red)', marginBottom:'var(--s5)' }}>
              <h3 className="section-header">Novo Projecto</h3>
              <form onSubmit={handleCreate} className="form-grid">
                <div className="field field-full">
                  <label className="field__label">Título *</label>
                  <input className="input" name="title" value={form.title} onChange={ch}
                    placeholder="Ex: Desenvolvimento de app mobile para clínica" />
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
                <div className="field field-full">
                  <label className="field__label">Descrição *</label>
                  <textarea className="textarea" rows={4} name="description" value={form.description} onChange={ch}
                    placeholder="Descreve o projecto, requisitos, tecnologias preferidas..." />
                </div>
                <div className="field-actions">
                  <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} style={{ width:'auto' }}>Publicar</Button>
                </div>
              </form>
            </div>
          )}

          {loading && <div className="spinner" />}

          <div className="stack--sm">
            {projects.map(p => {
              const st = STATUS_TOKEN[p.status] || STATUS_TOKEN.open;
              return (
                <div key={p.id} className="card card--interactive card__body--lg"
                  onClick={() => navigate(`/work/${p.id}`)}>
                  <div className="row--between" style={{ alignItems:'flex-start', flexWrap:'wrap', gap:'var(--s4)' }}>
                    <div className="stack--xs" style={{ flex:1 }}>
                      <div className="row--wrap">
                        <span className="heading-sm">{p.title}</span>
                        <span className={`tag ${st.cls}`}>{st.label}</span>
                      </div>
                      <div className="meta-line">
                        <span>{p.category}</span>
                        <span>{budgetLabel(p.budget_min, p.budget_max, p.currency)}</span>
                        {p.deadline && <span>Prazo: {new Date(p.deadline).toLocaleDateString('pt-AO')}</span>}
                        <span>{p.proposals_count} propostas</span>
                      </div>
                      <p className="body-sm">
                        {p.description?.slice(0,150)}{p.description?.length > 150 ? '...' : ''}
                      </p>
                    </div>
                    <div className="row--sm" style={{ flexShrink:0 }}>
                      <Avatar name={p.client_name} src={p.client_avatar} size="sm" />
                      <div className="stack--xs">
                        <span className="body-sm" style={{ fontWeight:'var(--w-bold)' }}>{p.client_name}</span>
                        {p.client_verified && <VerifiedBadge size="sm" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && projects.length === 0 && (
              <div className="card card--padded">Sem projectos publicados. Sê o primeiro!</div>
            )}
          </div>
        </div>
      </div></div>
    </div>
  );
}
