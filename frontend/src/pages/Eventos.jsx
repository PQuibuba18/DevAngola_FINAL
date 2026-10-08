import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';

const CATEGORIES = ['meetup','hackathon','conference','workshop','bootcamp','webinar','competition','other'];
const CAT_LABEL  = { meetup:'Meetup', hackathon:'Hackathon', conference:'Conferência', workshop:'Workshop', bootcamp:'Bootcamp', webinar:'Webinar', competition:'Concurso', other:'Outro' };
const CITIES     = ['Luanda','Benguela','Huambo','Cabinda','Namibe','Online'];

function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-AO', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

export default function Eventos() {
  const { user }    = useAuth();
  const [events,    setEvents]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [showForm,  setShowForm] = useState(false);
  const [filter,    setFilter]   = useState({ category:'', city:'' });
  const [registering, setReg]    = useState(null);
  const [saving,    setSaving]   = useState(false);
  const [msg,       setMsg]      = useState('');
  const [form, setForm] = useState({
    title:'', description:'', category:'meetup', location_name:'',
    city:'Luanda', is_online:false, online_url:'', start_date:'',
    end_date:'', registration_url:'', max_participants:'', is_free:true, price:'',
  });

  useEffect(() => {
    setLoading(true);
    const params = { status:'upcoming' };
    if (filter.category) params.category = filter.category;
    if (filter.city)     params.city     = filter.city;
    api.get('/events', { params })
      .then(r => setEvents(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  function ch(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({...f, [e.target.name]: val}));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.description || !form.start_date) { flash('Preenche os campos obrigatórios.'); return; }
    setSaving(true);
    try {
      const r = await api.post('/events', { ...form, max_participants: form.max_participants||null, price: form.price||null });
      setEvents(ev => [r.data, ...ev]);
      setShowForm(false);
      flash('Evento criado!');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  async function toggleRegister(ev) {
    setReg(ev.id);
    try {
      if (ev.is_registered) {
        await api.delete(`/events/${ev.id}/register`);
        setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_registered:false, participants_count:e.participants_count-1 } : e));
      } else {
        await api.post(`/events/${ev.id}/register`);
        setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_registered:true, participants_count:e.participants_count+1 } : e));
      }
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
    finally { setReg(null); }
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="page-container">

          {msg && <div className="feedback feedback--success" style={{ position:'fixed', top:'calc(var(--nav-h) + 12px)', right:'var(--s5)', zIndex:999 }}>{msg}</div>}

          <div className="page-header">
            <div className="page-header__text">
              <h1 className="page-header__title">Eventos Tech Angola</h1>
              <p className="page-header__sub">Meetups, hackathons, workshops e conferências do ecossistema angolano.</p>
            </div>
            {user && <Button style={{ width:'auto' }} onClick={() => setShowForm(!showForm)}>Criar evento</Button>}
          </div>

          {/* Filtros */}
          <div className="row--wrap" style={{ marginBottom:'var(--s5)' }}>
            <select className="select" style={{ width:'auto', minWidth:160 }} value={filter.category} onChange={e => setFilter(f=>({...f,category:e.target.value}))}>
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
            <select className="select" style={{ width:'auto', minWidth:140 }} value={filter.city} onChange={e => setFilter(f=>({...f,city:e.target.value}))}>
              <option value="">Todas as cidades</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Formulário */}
          {showForm && (
            <div className="card card--accent-left card__body--lg" style={{ borderLeftColor:'var(--red)', marginBottom:'var(--s5)' }}>
              <h3 className="section-header">Novo Evento</h3>
              <form onSubmit={handleCreate} className="form-grid">
                <div className="field field-full">
                  <label className="field__label">Título *</label>
                  <input className="input" name="title" value={form.title} onChange={ch} placeholder="Ex: Meetup React Angola #5" />
                </div>
                <div className="field">
                  <label className="field__label">Categoria</label>
                  <select className="select" name="category" value={form.category} onChange={ch}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">Cidade</label>
                  <select className="select" name="city" value={form.city} onChange={ch}>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">Data de início *</label>
                  <input className="input" type="datetime-local" name="start_date" value={form.start_date} onChange={ch} />
                </div>
                <div className="field">
                  <label className="field__label">Data de fim</label>
                  <input className="input" type="datetime-local" name="end_date" value={form.end_date} onChange={ch} />
                </div>
                <div className="field">
                  <label className="field__label">Local (nome)</label>
                  <input className="input" name="location_name" value={form.location_name} onChange={ch} placeholder="Ex: UTANGA, Talatona" />
                </div>
                <div className="field">
                  <label className="field__label">Máx. participantes</label>
                  <input className="input" type="number" name="max_participants" value={form.max_participants} onChange={ch} placeholder="Sem limite" />
                </div>
                <div className="field">
                  <label className="field__label">Link de inscrição</label>
                  <input className="input" name="registration_url" value={form.registration_url} onChange={ch} placeholder="https://..." />
                </div>
                <div className="field">
                  <label className="field__label">Entrada</label>
                  <label style={{ display:'flex', alignItems:'center', gap:'var(--s2)', marginTop:'var(--s2)', cursor:'pointer' }}>
                    <input type="checkbox" name="is_free" checked={form.is_free} onChange={ch} />
                    <span className="body-sm">Gratuita</span>
                  </label>
                </div>
                <div className="field field-full">
                  <label className="field__label">Descrição *</label>
                  <textarea className="textarea" rows={4} name="description" value={form.description} onChange={ch} placeholder="Descreve o evento, programa, oradores..." />
                </div>
                <div className="field-actions">
                  <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} style={{ width:'auto' }}>Criar evento</Button>
                </div>
              </form>
            </div>
          )}

          {loading && <div className="spinner" />}

          <div className="stack--sm">
            {events.map(ev => (
              <div key={ev.id} className="card card__body--lg">
                <div className="row" style={{ alignItems:'flex-start', gap:'var(--s5)' }}>
                  {/* Data */}
                  <div style={{ textAlign:'center', minWidth:52, flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-2xl)', color:'var(--red)', lineHeight:1 }}>
                      {new Date(ev.start_date).getDate()}
                    </div>
                    <div className="caption" style={{ textTransform:'uppercase', marginTop:2 }}>
                      {new Date(ev.start_date).toLocaleDateString('pt-AO', { month:'short' })}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="row--wrap" style={{ marginBottom:'var(--s1)' }}>
                      {ev.is_featured && <span className="tag tag--gold">Destaque</span>}
                      <span className="tag tag--red">{CAT_LABEL[ev.category]}</span>
                      <span className="tag tag--neutral">{ev.is_online ? 'Online' : ev.city}</span>
                      <span className={`tag ${ev.is_free ? 'tag--green' : 'tag--neutral'}`}>{ev.is_free ? 'Gratuito' : 'Pago'}</span>
                    </div>
                    <h3 className="heading-sm" style={{ marginBottom:'var(--s1)' }}>{ev.title}</h3>
                    <p className="body-sm" style={{ marginBottom:'var(--s3)' }}>
                      {ev.description?.slice(0,140)}{ev.description?.length>140?'...':''}
                    </p>
                    <div className="meta-line">
                      <Avatar name={ev.organizer_name} src={ev.organizer_avatar} size="xs" />
                      <span>{ev.organizer_name}</span>
                      <span>{ev.participants_count} inscritos</span>
                      <span>{fmtDate(ev.start_date)}</span>
                    </div>
                  </div>

                  {/* Acção */}
                  <div style={{ flexShrink:0 }}>
                    {user ? (
                      <Button
                        loading={registering === ev.id}
                        variant={ev.is_registered ? 'secondary' : 'primary'}
                        style={{ width:'auto', fontSize:'var(--t-sm)' }}
                        onClick={() => toggleRegister(ev)}>
                        {ev.is_registered ? 'Inscrito' : 'Inscrever'}
                      </Button>
                    ) : ev.registration_url ? (
                      <a href={ev.registration_url} target="_blank" rel="noreferrer"
                        className="body-sm" style={{ color:'var(--red)', fontWeight:'var(--w-bold)', textDecoration:'none' }}>
                        Ver evento →
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {!loading && events.length === 0 && (
              <div className="card card--padded">Sem eventos próximos. Cria o primeiro!</div>
            )}
          </div>

        </div>
      </div></div>
    </div>
  );
}
