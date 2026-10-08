import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api          from '../services/api';
import Navbar       from '../components/Navbar';
import Avatar       from '../components/ui/Avatar';
import Badge        from '../components/ui/Badge';
import Button       from '../components/ui/Button';
import VerifiedBadge from '../components/ui/VerifiedBadge';

export default function Perfil() {
  const { user, updateUser } = useAuth();
  const { lang }             = useLang();

  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState({
    name:       user?.name       || '',
    email:      user?.email      || '',
    identifier: user?.identifier || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState('');
  const [error,      setError]      = useState('');

  function handleAvatarChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim())  { setError(lang==='en' ? 'Name required.' : 'Nome obrigatório.');  return; }
    if (!form.email.trim()) { setError(lang==='en' ? 'Email required.' : 'Email obrigatório.'); return; }

    setSaving(true); setMsg(''); setError('');
    try {
      const r = await api.put('/users/me', {
        name:       form.name.trim(),
        email:      form.email.trim(),
        identifier: form.identifier.trim(),
      });
      updateUser(r.data);

      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const av = await api.post('/users/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser({ avatar_url: av.data.avatar_url });
      }

      setMsg(lang==='en' ? 'Profile updated!' : 'Perfil actualizado!');
      setEditing(false);
      setAvatarFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.error || (lang==='en' ? 'Error saving.' : 'Erro ao guardar.'));
    } finally {
      setSaving(false);
    }
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(
      lang==='en' ? 'en-GB' : 'pt-AO',
      { month:'long', year:'numeric' }
    );
  }

  const API       = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api','');
  const avatarSrc = preview
    || (user?.avatar_url
      ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API}${user.avatar_url}`)
      : null);

  const FIELDS = [
    { key:'name',       label: lang==='en' ? 'Full Name'              : 'Nome Completo',              type:'text',  placeholder: lang==='en' ? 'Your name' : 'O teu nome' },
    { key:'email',      label: 'E-mail',                                                               type:'email', placeholder: 'email@exemplo.com' },
    { key:'identifier', label: lang==='en' ? 'Identifier (optional)'  : 'Identificador (opcional)',   type:'text',  placeholder: lang==='en' ? 'Ex: React Developer' : 'Ex: Programador React' },
  ];

  const INFO_ROWS = [
    { label: lang==='en' ? 'Name'         : 'Nome',           value: user?.name },
    { label: 'E-mail',                                          value: user?.email },
    { label: lang==='en' ? 'Level'        : 'Nível',          value: <Badge level={user?.level} /> },
    { label: lang==='en' ? 'Identifier'   : 'Identificador',  value: user?.identifier || '—' },
    { label: lang==='en' ? 'Member since' : 'Membro desde',   value: fmtDate(user?.created_at) },
  ];

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="settings-wrap">
          <div className="card settings-card">

            {/* Avatar */}
            <div style={{ textAlign:'center', marginBottom:'var(--s6)' }}>
              <div style={{ position:'relative', display:'inline-block', marginBottom:'var(--s3)' }}>
                <Avatar name={user?.name} src={avatarSrc} size="2xl" />
                <button
                  type="button"
                  onClick={() => document.getElementById('av-input').click()}
                  style={{
                    position:'absolute', bottom:0, right:0,
                    width:32, height:32, borderRadius:'50%',
                    background:'var(--ink-900)', border:'2px solid var(--surface)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
              </div>
              <input id="av-input" type="file" accept="image/*"
                onChange={handleAvatarChange} style={{ display:'none' }} />

              <div>
                <div className="heading-lg" style={{ marginBottom:'var(--s2)' }}>{user?.name}</div>
                <div className="row--wrap" style={{ justifyContent:'center' }}>
                  <Badge level={user?.level} />
                  {user?.badge && <span className={`seal seal--${user.badge}`}>{user.badge_label}</span>}
                  {user?.verified && <VerifiedBadge lang={lang} />}
                </div>
                {user?.identifier && (
                  <p className="body-sm" style={{ marginTop:'var(--s2)' }}>{user.identifier}</p>
                )}
              </div>
            </div>

            {msg   && <div className="feedback feedback--success">{msg}</div>}
            {error && <div className="feedback feedback--error">{error}</div>}

            {editing ? (
              <form onSubmit={handleSave} className="stack">
                {FIELDS.map(field => (
                  <div key={field.key} className="field">
                    <label className="field__label">{field.label}</label>
                    <input
                      className="input"
                      type={field.type}
                      value={form[field.key]}
                      onChange={e => setForm(f => ({...f, [field.key]: e.target.value}))}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <div className="row" style={{ justifyContent:'flex-end' }}>
                  <Button type="button" variant="secondary" style={{ width:'auto' }}
                    onClick={() => {
                      setEditing(false);
                      setForm({ name: user?.name||'', email: user?.email||'', identifier: user?.identifier||'' });
                      setPreview(null); setAvatarFile(null); setError('');
                    }}>
                    {lang==='en' ? 'Cancel' : 'Cancelar'}
                  </Button>
                  <Button type="submit" loading={saving} style={{ width:'auto' }}>
                    {lang==='en' ? 'Save' : 'Guardar'}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div>
                  {INFO_ROWS.map(row => (
                    <div key={row.label} className="info-row">
                      <span className="info-row__label">{row.label}</span>
                      <span className="info-row__value">{row.value}</span>
                    </div>
                  ))}
                  <div className="info-row">
                    <span className="info-row__label">{lang==='en' ? 'Identity' : 'Identidade'}</span>
                    <span className="info-row__value">
                      {user?.verified
                        ? <VerifiedBadge size="sm" lang={lang} />
                        : <span className="caption" style={{ fontStyle:'italic' }}>
                            {lang==='en' ? 'Not verified' : 'Não verificada'}
                          </span>
                      }
                    </span>
                  </div>
                </div>

                <div className="row--wrap" style={{ marginTop:'var(--s6)' }}>
                  <Button style={{ width:'auto' }} onClick={() => setEditing(true)}>
                    {lang==='en' ? 'Edit profile' : 'Editar perfil'}
                  </Button>
                  {!user?.verified && (
                    <Button variant="secondary" style={{ width:'auto' }}
                      onClick={() => { window.location.href = '/verificacao'; }}>
                      {lang==='en' ? 'Verify identity' : 'Verificar identidade'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div></div>
    </div>
  );
}
