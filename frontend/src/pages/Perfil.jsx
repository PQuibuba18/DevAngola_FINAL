import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { IconCamera, IconEdit, IconCheck } from '../components/ui/Icons';

export default function Perfil() {
  const { user, updateUser }   = useAuth();
  const { t, lang }            = useLang();
  const [file,      setFile]       = useState(null);
  const [preview,   setPreview]    = useState(null);
  const [uploading, setUploading]  = useState(false);
  const [avatarMsg, setAvatarMsg]  = useState('');
  const [identifier,    setIdentifier]    = useState(user?.identifier || '');
  const [editId,        setEditId]        = useState(false);
  const [savingId,      setSavingId]      = useState(false);
  const [identifierMsg, setIdentifierMsg] = useState('');

  function handleFile(e) {
    const f = e.target.files[0]; if (!f) return;
    setFile(f);
    const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f);
  }

  async function uploadAvatar(e) {
    e.preventDefault(); if (!file) return;
    setUploading(true); setAvatarMsg('');
    try {
      const fd = new FormData(); fd.append('avatar', file);
      const r  = await api.post('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ avatar_url: r.data.avatar_url });
      setAvatarMsg(t.photoUpdated); setFile(null); setPreview(null);
    } catch { setAvatarMsg(t.genericError); }
    finally { setUploading(false); }
  }

  async function saveIdentifier() {
    if (!identifier.trim()) return;
    setSavingId(true); setIdentifierMsg('');
    try {
      const r = await api.put('/users/identifier', { identifier });
      updateUser({ identifier: r.data.identifier });
      setIdentifierMsg(t.identifierUpdated); setEditId(false);
    } catch (err) { setIdentifierMsg(err.response?.data?.error || t.genericError); }
    finally { setSavingId(false); }
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pt-AO', { month:'long', year:'numeric' });
  }

  const rows = [
    { label: lang==='en'?'Name':'Nome',               value: user?.name },
    { label: lang==='en'?'Email':'E-mail',             value: user?.email },
    { label: lang==='en'?'Level':'Nível',              value: <Badge level={user?.level} lang={lang} /> },
    { label: lang==='en'?'Nationality':'Nacionalidade',value: `🇦🇴 ${user?.nationality}` },
    { label: t.memberSince,                            value: fmtDate(user?.created_at) },
  ];

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner"><div className="profile-wrap">
        <div className="profile-card card">
          <h1 className="profile-title">{t.myProfile}</h1>
          <div className="profile-avatar-wrap">
            <Avatar name={user?.name} src={preview || user?.avatar_url} size="2xl" className="profile-avatar" />
            {user?.badge && <span className={`seal seal--${user.badge}`}>{user.badge_label}</span>}
            <button className="profile-edit-btn" onClick={() => document.getElementById('av-in').click()}>
              <IconCamera className="icon icon--sm" /> {t.changePhoto}
            </button>
            <input id="av-in" type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
            {file && (
              <form onSubmit={uploadAvatar} className="profile-upload-bar">
                <span style={{ fontSize:'var(--t-sm)', color:'var(--ink-600)' }}>{file.name}</span>
                <Button type="submit" size="sm" loading={uploading}>{t.save}</Button>
              </form>
            )}
            {avatarMsg && <div className="profile-msg">{avatarMsg}</div>}
          </div>

          {/* Identificador */}
          <div className="profile-identifier-wrap">
            <div className="profile-identifier-header">
              <span className="profile-row__label">{t.identifierLabel}</span>
              {!editId && (
                <button className="profile-edit-btn" style={{ fontSize:'var(--t-xs)', padding:'3px 10px' }} onClick={() => setEditId(true)}>
                  <IconEdit className="icon icon--sm" /> {t.editIdentifier}
                </button>
              )}
            </div>
            {editId ? (
              <div className="profile-identifier-form">
                <input className="input" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder={t.identifierPlaceholder} maxLength={100} />
                <div className="profile-identifier-actions">
                  <Button size="sm" loading={savingId} onClick={saveIdentifier}>
                    <IconCheck className="icon icon--sm" /> {t.save}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setEditId(false); setIdentifier(user?.identifier||''); }}>
                    {t.cancel}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="profile-identifier-value">
                {user?.identifier
                  ? <span className="profile-identifier-chip">{user.identifier}</span>
                  : <span style={{ color:'var(--ink-400)', fontStyle:'italic', fontSize:'var(--t-sm)' }}>
                      {lang==='en' ? 'No identifier — click Edit to add one' : 'Sem identificador — clica em Editar para adicionar'}
                    </span>
                }
              </div>
            )}
            {identifierMsg && <div className="profile-msg">{identifierMsg}</div>}
          </div>

          <div className="profile-info">
            {rows.map(row => (
              <div key={row.label} className="profile-row">
                <span className="profile-row__label">{row.label}</span>
                <span className="profile-row__value">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div></div></div>
    </div>
  );
}
