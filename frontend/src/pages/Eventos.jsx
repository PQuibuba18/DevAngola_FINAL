import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

const CATEGORIES = ['meetup','hackathon','conference','workshop','bootcamp','webinar','competition','other'];
const CAT_LABEL  = { meetup:'Meetup', hackathon:'Hackathon', conference:'Conferência', workshop:'Workshop', bootcamp:'Bootcamp', webinar:'Webinar', competition:'Concurso', other:'Outro' };
const CITIES     = ['Luanda','Benguela','Huambo','Cabinda','Namibe','Online'];

function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-AO', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

export default function Eventos() {
  const { user } = useAuth();
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter,   setFilter]   = useState({ category:'', city:'' });
  const [form, setForm] = useState({
    title:'', description:'', category:'meetup', location_name:'', city:'Luanda',
    is_online: false, online_url:'', start_date:'', end_date:'',
    registration_url:'', max_participants:'', is_free: true, price:'',
  });
  const [saving,    setSaving]   = useState(false);
  const [registering, setReg]   = useState(null);
  const [msg,       setMsg]      = useState('');

  useEffect(() => {
    const params = { status:'upcoming' };
    if (filter.category) params.category = filter.category;
    if (filter.city)     params.city     = filter.city;
    api.get('/events', { params }).then(r => setEvents(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  function ch(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({...f, [e.target.name]: val}));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.description || !form.start_date) { setMsg('Preenche os campos obrigatórios.'); return; }
    setSaving(true);
    try {
      const r = await api.post('/events', { ...form, max_participants: form.max_participants||null, price: form.price||null });
      setEvents(ev => [r.data, ...ev]);
      setShowForm(false);
      setMsg('Evento criado com sucesso!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.error || 'Erro.'); }
    finally { setSaving(false); }
  }

  async function toggleRegister(ev) {
    setReg(ev.id);
    try {
      if (ev.is_registered) {
        await api.delete(`/events/${ev.id}/register`);
        setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_registered: false, participants_count: e.participants_count - 1 } : e));
      } else {
        await api.post(`/events/${ev.id}/register`);
        setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_registered: true, participants_count: e.participants_count + 1 } : e));
      }
    } catch (err) { setMsg(err.response?.data?.error || 'Erro.'); }
    finally { setReg(null); }
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div style={{ maxWidth: 860, margin:'0 auto' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--s6)', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontFamily:'var(--display)', fontSize:'var(--t-2xl)', fontWeight:'var(--w-black)', letterSpacing:'-.03em', color:'var(--ink-900)', marginBottom:4 }}>Eventos Tech Angola</h1>
              <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)' }}>Meetups, hackathons, workshops e conferências do ecossistema angolano.</p>
            </div>
            {user && <Button style={{ width:'auto' }} onClick={() => setShowForm(!showForm)}>Criar evento</Button>}
          </div>

          {msg && <div style={{ background:'var(--ink-900)', color:'#fff', padding:'10px 16px', borderRadius:8, fontSize:13, fontWeight:600, marginBottom:16 }}>{msg}</div>}

          {/* Filtros */}
          <div style={{ display:'flex', gap:'var(--s3)', flexWrap:'wrap', marginBottom:'var(--s5)' }}>
            <select className="select" style={{ width:'auto', minWidth:160 }} value={filter.category} onChange={e => setFilter(f=>({...f,category:e.target.value}))}>
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
            <select className="select" style={{ width:'auto', minWidth:140 }} value={filter.city} onChange={e => setFilter(f=>({...f,city:e.target.value}))}>
              <option value="">Todas as cidades</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {showForm && (
            <div className="card" style={{ padding:'var(--s6)', marginBottom:'var(--s5)', borderLeft:'4px solid var(--red)' }}>
              <h3 style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', marginBottom:'var(--s5)' }}>Novo Evento</h3>
              <form onSubmit={handleCreate} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s3)' }}>
                <div className="field" style={{ gridColumn:'1/-1' }}>
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
                  <label className="field__label">É gratuito?</label>
                  <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, cursor:'pointer' }}>
                    <input type="checkbox" name="is_free" checked={form.is_free} onChange={ch} />
                    <span style={{ fontSize:14 }}>Entrada gratuita</span>
                  </label>
                </div>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label className="field__label">Descrição *</label>
                  <textarea className="textarea" rows={4} name="description" value={form.description} onChange={ch} placeholder="Descreve o evento, programa, oradores..." />
                </div>
                <div style={{ gridColumn:'1/-1', display:'flex', gap:'var(--s3)', justifyContent:'flex-end' }}>
                  <Button type="button" variant="secondary" style={{ width:'auto' }} onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" loading={saving} style={{ width:'auto' }}>Criar evento</Button>
                </div>
              </form>
            </div>
          )}

          {loading && <div className="spinner" />}

          <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
            {events.map(ev => (
              <div key={ev.id} className="card" style={{ padding:'var(--s5)' }}>
                <div style={{ display:'flex', gap:'var(--s4)', alignItems:'flex-start' }}>
                  <div style={{ width:56, textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:24, color:'var(--red)', lineHeight:1 }}>
                      {new Date(ev.start_date).getDate()}
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-400)', textTransform:'uppercase' }}>
                      {new Date(ev.start_date).toLocaleDateString('pt-AO', { month:'short' })}
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      {ev.is_featured && <span style={{ fontSize:11, fontWeight:700, color:'#C8860A', background:'#FEF7E0', padding:'1px 7px', borderRadius:999 }}>Destaque</span>}
                      <span style={{ fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:999, background:'var(--red-soft)', color:'var(--red)' }}>{CAT_LABEL[ev.category]}</span>
                      <span style={{ fontSize:11, color:'var(--ink-400)' }}>{ev.is_online ? 'Online' : ev.city}</span>
                      {ev.is_free ? <span style={{ fontSize:11, color:'#1A5C30', fontWeight:700 }}>Gratuito</span> : <span style={{ fontSize:11, color:'var(--ink-400)' }}>Pago</span>}
                    </div>
                    <h3 style={{ fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)', marginBottom:4 }}>{ev.title}</h3>
                    <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)', lineHeight:1.5, marginBottom:6 }}>
                      {ev.description?.slice(0,140)}{ev.description?.length>140?'...':''}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Avatar name={ev.organizer_name} src={ev.organizer_avatar} size="xs" />
                        <span style={{ fontSize:12, color:'var(--ink-400)' }}>{ev.organizer_name}</span>
                      </div>
                      <span style={{ fontSize:12, color:'var(--ink-400)' }}>{ev.participants_count} inscritos</span>
                      <span style={{ fontSize:12, color:'var(--ink-400)' }}>{fmtDate(ev.start_date)}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink:0 }}>
                    {user ? (
                      <Button
                        loading={registering === ev.id}
                        variant={ev.is_registered ? 'secondary' : 'primary'}
                        style={{ width:'auto', fontSize:13 }}
                        onClick={() => toggleRegister(ev)}
                      >
                        {ev.is_registered ? 'Inscrito ✓' : 'Inscrever'}
                      </Button>
                    ) : ev.registration_url ? (
                      <a href={ev.registration_url} target="_blank" rel="noreferrer"
                        style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>
                        Ver evento →
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {!loading && events.length === 0 && (
              <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
                Sem eventos próximos. Cria o primeiro!
              </div>
            )}
          </div>
        </div>
      </div></div>
    </div>
  );
}
