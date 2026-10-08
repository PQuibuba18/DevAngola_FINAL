import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../services/api';

export default function Verificacao() {
  const { user, updateUser } = useAuth();
  const { lang }             = useLang();
  const navigate             = useNavigate();

  const [status,   setStatus]   = useState(null);
  const [file,     setFile]     = useState(null);
  const [fileBack, setFileBack] = useState(null);
  const [step,     setStep]     = useState('upload');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (user?.verified) { navigate('/feed'); return; }
    if (user?.role === 'admin') {
      api.post('/verification/submit', new FormData(), {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => {
        if (r.data.verified) updateUser({ verified: true });
        navigate('/feed');
      }).catch(() => navigate('/feed'));
      return;
    }
    api.get('/verification/status')
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ status:'not_submitted' }));
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError(lang==='en' ? 'Select your ID document.' : 'Selecciona o teu documento de identificação.'); return; }
    setStep('processing'); setError('');
    try {
      const fd = new FormData();
      fd.append('document', file);
      if (fileBack) fd.append('document_back', fileBack);
      const r = await api.post('/verification/submit', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });
      setResult(r.data);
      setStep('done');
      if (r.data.verified) updateUser({ verified: true });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Erro ao enviar documento.');
      setStep('upload');
    }
  }

  if (status === null) return (
    <div className="auth-page"><div className="spinner" /></div>
  );

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <span className="auth-logo__dev">Dev</span>
        <span className="auth-logo__angola">Angola</span>
      </div>

      <div className="auth-card" style={{ maxWidth:480 }}>

        {/* Upload */}
        {step === 'upload' && (
          <>
            <div style={{ marginBottom:'var(--s4)' }}>
              <span className="tag tag--gold" style={{ marginBottom:'var(--s3)', display:'inline-block' }}>
                {lang==='en' ? 'Identity Verification' : 'Verificação de Identidade'}
              </span>
              <h1 className="auth-card__title">
                {lang==='en' ? 'Verify your Angolan identity' : 'Verifica a tua identidade angolana'}
              </h1>
              <p className="auth-card__sub" style={{ margin:0 }}>
                {lang==='en'
                  ? 'The DevAngola is an exclusive platform for Angolan developers. Upload your BI or Passport to receive the Verified badge.'
                  : 'O DevAngola é uma plataforma exclusiva para programadores angolanos. Envia o teu BI ou Passaporte para receber o selo Verificado.'}
              </p>
            </div>

            {/* Privacidade */}
            <div className="feedback feedback--info" style={{ display:'flex', gap:'var(--s3)', alignItems:'flex-start', marginBottom:'var(--s5)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink:0, marginTop:1 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div>
                <strong style={{ fontSize:'var(--t-xs)', display:'block', marginBottom:2 }}>
                  {lang==='en' ? 'Your privacy is protected' : 'A tua privacidade está protegida'}
                </strong>
                <span className="caption">
                  {lang==='en'
                    ? 'Document analysed and deleted immediately. Only the result is stored. ID number is never kept.'
                    : 'Documento analisado e eliminado de imediato. Só o resultado é guardado. O número do BI nunca é armazenado.'}
                </span>
              </div>
            </div>

            {error && <div className="feedback feedback--error">{error}</div>}

            <form onSubmit={handleSubmit} className="stack">
              {/* Frente */}
              <div className="field">
                <label className="field__label">
                  {lang==='en' ? 'BI / Passport (front)' : 'BI / Passaporte (frente)'}
                  <span style={{ color:'var(--red)', marginLeft:4 }}>*</span>
                </label>
                <div className="upload-zone" onClick={() => document.getElementById('file-front').click()}>
                  <div className="upload-zone__inner">
                    {file ? (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span className="upload-zone__label" style={{ color:'var(--green)' }}>{file.name}</span>
                        <span className="upload-zone__hint">{(file.size/1024/1024).toFixed(2)} MB</span>
                      </>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                        <span className="upload-zone__label">{lang==='en' ? 'Click to select' : 'Clica para seleccionar'}</span>
                        <span className="upload-zone__hint">PDF, JPG, PNG · máx. 10 MB</span>
                      </>
                    )}
                  </div>
                </div>
                <input id="file-front" type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFile(e.target.files[0]||null)} style={{ display:'none' }} />
              </div>

              {/* Verso */}
              <div className="field">
                <label className="field__label">
                  {lang==='en' ? 'BI back (optional)' : 'Verso do BI (opcional)'}
                </label>
                <div className="upload-zone" onClick={() => document.getElementById('file-back').click()}>
                  <div className="upload-zone__inner">
                    {fileBack ? (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span className="upload-zone__label" style={{ color:'var(--green)' }}>{fileBack.name}</span>
                      </>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span className="upload-zone__label" style={{ color:'var(--ink-400)' }}>
                          {lang==='en' ? 'Click to add back' : 'Clica para adicionar o verso'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <input id="file-back" type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFileBack(e.target.files[0]||null)} style={{ display:'none' }} />
              </div>

              <button type="submit" className="btn btn--primary btn--full">
                {lang==='en' ? 'Submit for verification' : 'Enviar para verificação'}
              </button>
              <button type="button" className="btn btn--secondary btn--full" onClick={() => navigate('/feed')}>
                {lang==='en' ? 'Skip for now' : 'Ignorar por agora'}
              </button>
            </form>
          </>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div style={{ textAlign:'center' }}>
            <div className="spinner" style={{ margin:'0 auto var(--s5)' }} />
            <h2 className="auth-card__title">{lang==='en' ? 'Analysing document...' : 'A analisar o documento...'}</h2>
            <p className="auth-card__sub">{lang==='en' ? 'Do not close this page.' : 'Não fechas esta página.'}</p>
            <div className="stack--sm" style={{ marginTop:'var(--s5)', textAlign:'left' }}>
              {[
                lang==='en' ? 'Reading document' : 'A ler o documento',
                lang==='en' ? 'Extracting text (OCR)' : 'A extrair texto (OCR)',
                lang==='en' ? 'Verifying nationality' : 'A verificar nacionalidade',
              ].map((t, i) => (
                <div key={i} className="row--sm">
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)', flexShrink:0 }} />
                  <span className="body-sm">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && result && (
          <div style={{ textAlign:'center' }}>
            {result.verified ? (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" style={{ margin:'0 auto var(--s4)' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10" strokeWidth="2"/>
                </svg>
                <h2 className="auth-card__title" style={{ color:'var(--green)' }}>
                  {lang==='en' ? 'Identity verified!' : 'Identidade verificada!'}
                </h2>
                <p className="auth-card__sub">
                  {lang==='en'
                    ? 'Your profile now shows the Verified Angolan badge.'
                    : 'O teu perfil recebeu o selo Angolano Verificado.'}
                </p>
                {result.confidence > 0 && (
                  <span className="tag tag--green" style={{ marginBottom:'var(--s5)', display:'inline-block' }}>
                    {lang==='en' ? `Confidence: ${result.confidence}%` : `Confiança OCR: ${result.confidence}%`}
                  </span>
                )}
              </>
            ) : (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--amber-mid)" strokeWidth="1.5" strokeLinecap="round" style={{ margin:'0 auto var(--s4)' }}>
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <h2 className="auth-card__title">{lang==='en' ? 'Pending review' : 'Em análise manual'}</h2>
                <p className="auth-card__sub">{result.message}</p>
              </>
            )}
            <button className="btn btn--primary btn--full" onClick={() => navigate('/feed')}>
              {lang==='en' ? 'Go to Feed' : 'Ir para o Feed'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
