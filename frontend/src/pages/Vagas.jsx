import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Badge  from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { IconSearch, IconPlus, IconClose } from '../components/ui/Icons';

const LEVELS = ['iniciante','junior','pleno','senior','qualquer'];
const TYPES  = ['full-time','part-time','freelance','remoto'];

const TYPE_LABEL = {
  'full-time': 'Tempo Inteiro',
  'part-time': 'Meio Tempo',
  'freelance': 'Freelance',
  'remoto':    'Remoto',
};

const LEVEL_COLOR = {
  iniciante: { bg:'#e6f4ea', color:'#1e5631' },
  junior:    { bg:'#e8f0fe', color:'#1a3a8a' },
  pleno:     { bg:'#fff3cd', color:'#7b4f00' },
  senior:    { bg:'#1a1a1a', color:'#ffffff' },
  qualquer:  { bg:'#f0f0f0', color:'#444444' },
};

function fmtDate(d, locale) {
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (diff === 0) return locale === 'pt-AO' ? 'hoje' : 'today';
  if (diff === 1) return locale === 'pt-AO' ? 'ontem' : 'yesterday';
  if (diff < 7)  return `${diff}d`;
  return new Date(d).toLocaleDateString(locale, { day:'2-digit', month:'short' });
}

function Modal({ job, onClose, lang }) {
  if (!job) return null;
  const locale = lang === 'en' ? 'en-GB' : 'pt-AO';
  const lc     = LEVEL_COLOR[job.level_required] || LEVEL_COLOR.qualquer;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-box__head">
          <div>
            <h2 className="modal-box__title">{job.title}</h2>
            <p className="modal-box__company">{job.company_name}</p>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>
            <IconClose className="icon icon--sm" />
          </button>
        </div>
        <div className="modal-box__tags">
          <span className="job-tag" style={{ background: lc.bg, color: lc.color }}>
            {job.level_required}
          </span>
          <span className="job-tag job-tag--type">{TYPE_LABEL[job.type] || job.type}</span>
          <span className="job-tag job-tag--loc">{job.location}</span>
        </div>
        <div className="modal-box__body">
          <p className="modal-box__desc">{job.description}</p>
        </div>
        <div className="modal-box__foot">
          <span style={{ fontSize:'var(--t-xs)', color:'var(--ink-400)' }}>
            {lang === 'en' ? 'Published' : 'Publicado'} {fmtDate(job.created_at, locale)}
          </span>
          <a
            href={`mailto:${job.contact_email}?subject=Candidatura: ${encodeURIComponent(job.title)}`}
            className="btn btn--primary btn--md"
          >
            {lang === 'en' ? 'Apply now' : 'Candidatar-me'}
          </a>
        </div>
      </div>
    </div>
  );
}

function AdminForm({ onSaved, onClose, lang }) {
  const [form, setForm] = useState({
    company_name: '', title: '', description: '',
    level_required: 'junior', location: 'Luanda',
    type: 'full-time', contact_email: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function ch(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const r = await api.post('/jobs', form);
      onSaved(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar vaga.');
    } finally {
      setSaving(false);
    }
  }

  const L = lang === 'en';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-box__head">
          <h2 className="modal-box__title">{L ? 'New Job Posting' : 'Nova Vaga'}</h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>
            <IconClose className="icon icon--sm" />
          </button>
        </div>
        {error && <div className="error-banner" style={{ margin:'0 0 var(--s3)' }}>{error}</div>}
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__row">
            <div className="admin-form__field">
              <label className="label">{L ? 'Company' : 'Empresa'}</label>
              <input className="input" name="company_name" value={form.company_name} onChange={ch} required />
            </div>
            <div className="admin-form__field">
              <label className="label">{L ? 'Job Title' : 'Titulo da Vaga'}</label>
              <input className="input" name="title" value={form.title} onChange={ch} required />
            </div>
          </div>
          <div className="admin-form__field">
            <label className="label">{L ? 'Description' : 'Descricao'}</label>
            <textarea className="textarea" name="description" rows={5} value={form.description} onChange={ch} required />
          </div>
          <div className="admin-form__row">
            <div className="admin-form__field">
              <label className="label">{L ? 'Level Required' : 'Nivel Exigido'}</label>
              <select className="select" name="level_required" value={form.level_required} onChange={ch}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="admin-form__field">
              <label className="label">{L ? 'Type' : 'Tipo'}</label>
              <select className="select" name="type" value={form.type} onChange={ch}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-form__row">
            <div className="admin-form__field">
              <label className="label">{L ? 'Location' : 'Localizacao'}</label>
              <input className="input" name="location" value={form.location} onChange={ch} required />
            </div>
            <div className="admin-form__field">
              <label className="label">{L ? 'Contact Email' : 'Email de Contacto'}</label>
              <input className="input" type="email" name="contact_email" value={form.contact_email} onChange={ch} required />
            </div>
          </div>
          <div className="modal-box__foot">
            <button type="button" className="btn btn--ghost btn--md" onClick={onClose}>
              {L ? 'Cancel' : 'Cancelar'}
            </button>
            <Button type="submit" loading={saving}>
              {L ? 'Publish Job' : 'Publicar Vaga'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Vagas() {
  const { user }    = useAuth();
  const { lang }    = useLang();
  const isAdmin     = user?.role === 'admin';
  const locale      = lang === 'en' ? 'en-GB' : 'pt-AO';
  const L           = lang === 'en';

  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [filters,   setFilters]   = useState({ level: '', type: '', search: '' });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.level) params.set('level', filters.level);
    if (filters.type)  params.set('type',  filters.type);
    api.get(`/jobs?${params.toString()}`)
      .then(r => setJobs(r.data))
      .finally(() => setLoading(false));
  }, [filters.level, filters.type]);

  useEffect(() => { load(); }, [load]);

  function fch(e) { setFilters(f => ({ ...f, [e.target.name]: e.target.value })); }

  const displayed = filters.search.trim()
    ? jobs.filter(j =>
        j.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        j.company_name.toLowerCase().includes(filters.search.toLowerCase()))
    : jobs;

  async function handleDelete(id) {
    try {
      await api.delete(`/jobs/${id}`);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch {}
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="vagas-wrap">

          <div className="vagas-head">
            <div>
              <h1 className="vagas-head__title">{L ? 'Job Opportunities' : 'Vagas de Emprego'}</h1>
              <p className="vagas-head__sub">
                {displayed.length} {L ? 'open positions' : 'vagas disponiveis'}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowForm(true)}>
                <IconPlus className="icon icon--sm" />
                {L ? 'New Job' : 'Nova Vaga'}
              </Button>
            )}
          </div>

          <div className="vagas-filters card">
            <div style={{ position:'relative', flex:1, minWidth:180 }}>
              <IconSearch className="icon icon--sm" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', pointerEvents:'none' }} />
              <input
                className="input"
                style={{ paddingLeft:36, height:38 }}
                placeholder={L ? 'Search jobs...' : 'Pesquisar vagas...'}
                name="search"
                value={filters.search}
                onChange={fch}
              />
            </div>
            <select className="select" style={{ height:38, minWidth:130 }} name="level" value={filters.level} onChange={fch}>
              <option value="">{L ? 'All levels' : 'Todos os niveis'}</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select className="select" style={{ height:38, minWidth:130 }} name="type" value={filters.type} onChange={fch}>
              <option value="">{L ? 'All types' : 'Todos os tipos'}</option>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </div>

          {loading && <div className="spinner" />}

          {!loading && displayed.length === 0 && (
            <div className="card" style={{ padding:'3rem', textAlign:'center', color:'var(--ink-400)' }}>
              <p>{L ? 'No jobs found.' : 'Nenhuma vaga encontrada.'}</p>
            </div>
          )}

          <div className="vagas-list">
            {displayed.map(job => {
              const lc = LEVEL_COLOR[job.level_required] || LEVEL_COLOR.qualquer;
              return (
                <div key={job.id} className="job-card card" onClick={() => setSelected(job)}>
                  <div className="job-card__body">
                    <div className="job-card__top">
                      <div>
                        <h3 className="job-card__title">{job.title}</h3>
                        <p className="job-card__company">{job.company_name}</p>
                      </div>
                      <div className="job-card__tags">
                        <span className="job-tag" style={{ background: lc.bg, color: lc.color }}>
                          {job.level_required}
                        </span>
                        <span className="job-tag job-tag--type">{TYPE_LABEL[job.type] || job.type}</span>
                      </div>
                    </div>
                    <p className="job-card__excerpt">
                      {job.description.slice(0, 130)}{job.description.length > 130 ? '...' : ''}
                    </p>
                    <div className="job-card__foot">
                      <span className="job-tag job-tag--loc">{job.location}</span>
                      <span className="job-card__date">{fmtDate(job.created_at, locale)}</span>
                      {isAdmin && (
                        <button
                          className="btn btn--ghost btn--sm"
                          style={{ marginLeft:'auto', color:'var(--red)' }}
                          onClick={e => { e.stopPropagation(); handleDelete(job.id); }}
                        >
                          {L ? 'Remove' : 'Remover'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div></div>

      {selected && <Modal job={selected} onClose={() => setSelected(null)} lang={lang} />}
      {showForm  && (
        <AdminForm
          lang={lang}
          onClose={() => setShowForm(false)}
          onSaved={job => { setJobs(prev => [job, ...prev]); setShowForm(false); }}
        />
      )}
    </div>
  );
}
