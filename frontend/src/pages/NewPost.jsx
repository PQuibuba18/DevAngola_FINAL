import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input  from '../components/ui/Input';
import { IconArrowLeft, IconUpload, IconAttach, IconOpenSource } from '../components/ui/Icons';

export default function NewPost() {
  const { t }    = useLang();
  const nav      = useNavigate();
  const [form,       setForm]      = useState({ title:'', content:'' });
  const [imgFile,    setImgFile]   = useState(null);
  const [attFile,    setAttFile]   = useState(null);
  const [preview,    setPreview]   = useState(null);
  const [openSource, setOpenSource] = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);
  const [error,      setError]     = useState('');
  const [loading,    setLoading]   = useState(false);

  function ch(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  function handleImg(e) {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f);
    const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f);
  }

  async function submit(e) {
    e.preventDefault(); setError('');
    if (!form.title.trim() || !form.content.trim()) { setError(t.titleRequired); return; }
    if (attFile?.name.endsWith('.zip') && !confirmed) { setError(t.openSourceRequired); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title); fd.append('content', form.content);
      fd.append('is_open_source', String(openSource));
      if (imgFile) fd.append('image', imgFile);
      if (attFile) fd.append('file',  attFile);
      await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      nav('/feed');
    } catch (err) { setError(err.response?.data?.error || t.genericError); }
    finally { setLoading(false); }
  }

  const hasZip = attFile?.name.endsWith('.zip');

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner"><div className="newpost-wrap">
        <Link to="/feed" className="newpost-back">
          <IconArrowLeft className="icon icon--sm" /> {t.backToFeed}
        </Link>
        <div className="newpost-card card">
          <h1 className="newpost-title">{t.publishPost}</h1>
          <p className="newpost-sub">{t.publishSubtitle}</p>
          {error && <div className="error-banner">{error}</div>}
          <form className="newpost-form" onSubmit={submit}>
            <Input label={t.titleLabel} type="text" name="title"
              placeholder={t.titlePlaceholder} value={form.title} onChange={ch} required />
            <div className="field">
              <label className="field__label">{t.descLabel}</label>
              <textarea className="textarea" name="content" placeholder={t.descPlaceholder}
                value={form.content} onChange={ch} rows={5} required />
            </div>
            <div className="field">
              <label className="field__label">{t.imageLabel} <span style={{ color:'var(--ink-400)', fontWeight:400 }}>{t.imageOptional}</span></label>
              <div className="upload-zone" onClick={() => document.getElementById('img-in').click()}>
                {preview
                  ? <img src={preview} alt="Preview" className="upload-zone__preview" />
                  : <div className="upload-zone__inner">
                      <IconUpload className="icon icon--xl" style={{ color:'var(--ink-300)' }} />
                      <span className="upload-zone__label">{t.imageHint}</span>
                      <span className="upload-zone__hint">{t.imageSubHint}</span>
                    </div>
                }
              </div>
              <input id="img-in" type="file" accept="image/*" onChange={handleImg} style={{ display:'none' }} />
            </div>
            <div className="field">
              <label className="field__label">{t.fileLabel}</label>
              <div className="file-row">
                <Button variant="secondary" size="sm" type="button"
                  onClick={() => document.getElementById('att-in').click()}>
                  <IconAttach className="icon icon--sm" /> {t.selectFile}
                </Button>
                {attFile && <span className="file-chip"><IconAttach className="icon icon--sm" />{attFile.name}</span>}
              </div>
              <span className="field__hint">{t.fileHint}</span>
              <input id="att-in" type="file" accept=".pdf,.zip,.doc,.docx,.txt"
                onChange={e => setAttFile(e.target.files[0]||null)} style={{ display:'none' }} />
            </div>
            {hasZip && (
              <div className="open-source-box">
                <div className="open-source-box__header">
                  <IconOpenSource className="icon icon--md" style={{ color:'var(--gold)' }} />
                  <strong>{t.openSourceTitle}</strong>
                </div>
                <p className="open-source-box__text">{t.openSourceText}</p>
                <label className="open-source-box__check">
                  <input type="checkbox" checked={confirmed}
                    onChange={e => { setConfirmed(e.target.checked); setOpenSource(e.target.checked); }} />
                  <span>{t.openSourceConfirm}</span>
                </label>
              </div>
            )}
            <div className="newpost-actions">
              <Button variant="secondary" type="button" onClick={() => nav('/feed')}>{t.cancel}</Button>
              <Button type="submit" loading={loading}>
                <IconUpload className="icon icon--sm" /> {t.publishPost}
              </Button>
            </div>
          </form>
        </div>
      </div></div></div>
    </div>
  );
}
