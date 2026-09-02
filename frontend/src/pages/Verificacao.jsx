import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../services/api';

export default function Verificacao() {
  const { user, updateUser } = useAuth();
  const { lang }             = useLang();
  const navigate             = useNavigate();

  const [status,   setStatus]   = useState(null); // null=loading
  const [file,     setFile]     = useState(null);
  const [side,     setSide]     = useState('frente'); // 'frente' ou 'verso'
  const [fileBack, setFileBack] = useState(null);
  const [step,     setStep]     = useState('upload'); // 'upload' | 'processing' | 'done'
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  // Se já está verificado, vai para o feed
  useEffect(() => {
    if (user?.verified) { navigate('/feed'); return; }

    // Admin: verificação automática sem documento
    if (user?.role === 'admin') {
      api.post('/verification/submit', new FormData(), {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => {
        if (r.data.verified) updateUser({ verified: true });
        navigate('/feed');
      }).catch(() => navigate('/feed'));
      return;
    }

    api.get('/verification/status').then(r => setStatus(r.data)).catch(() => setStatus({ status: 'not_submitted' }));
  }, [user, navigate]);

  function skip() { navigate('/feed'); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError(lang === 'en' ? 'Select your ID document.' : 'Selecciona o teu documento de identificação.'); return; }

    setStep('processing'); setError('');
    try {
      const fd = new FormData();
      fd.append('document', file);
      if (fileBack) fd.append('document_back', fileBack);

      const r = await api.post('/verification/submit', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000, // 90s para dar tempo ao OCR
      });

      setResult(r.data);
      setStep('done');

      if (r.data.verified) {
        updateUser({ verified: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Erro ao enviar documento.');
      setStep('upload');
    }
  }

  if (status === null) return (
    <div style={s.page}><div className="spinner" /></div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoDev}>Dev</span>
          <span style={s.logoAngola}>Angola</span>
        </div>

        {step === 'upload' && (
          <>
            <div style={s.badge}>
              {lang === 'en' ? '🇦🇴 Identity Verification' : '🇦🇴 Verificação de Identidade'}
            </div>
            <h1 style={s.title}>
              {lang === 'en' ? 'Verify your Angolan identity' : 'Verifica a tua identidade angolana'}
            </h1>
            <p style={s.desc}>
              {lang === 'en'
                ? 'The DevAngola is an exclusive platform for Angolan developers. Upload your Angolan ID (BI) or Passport to receive the Verified badge on your profile.'
                : 'O DevAngola é uma plataforma exclusiva para programadores angolanos. Envia o teu Bilhete de Identidade (BI) ou Passaporte angolano para receber o selo Verificado no teu perfil.'}
            </p>

            {/* Info privacidade */}
            <div style={s.privacyBox}>
              <span style={s.privacyIcon}>🔒</span>
              <div>
                <strong style={{ fontSize: 13 }}>
                  {lang === 'en' ? 'Your privacy is protected' : 'A tua privacidade está protegida'}
                </strong>
                <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: '4px 0 0' }}>
                  {lang === 'en'
                    ? 'The document is analysed automatically and deleted immediately after. Only the result "Verified: yes/no" is stored. The ID number is never stored.'
                    : 'O documento é analisado automaticamente e eliminado de imediato. Apenas o resultado "Verificado: sim/não" é guardado. O número do BI nunca é armazenado.'}
                </p>
              </div>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Frente */}
              <div style={s.uploadArea}>
                <label style={s.uploadLabel}>
                  {lang === 'en' ? 'BI / Passport (front)' : 'BI / Passaporte (frente)'}
                  <span style={s.req}>*</span>
                </label>
                <div
                  style={{ ...s.dropZone, borderColor: file ? '#1E5631' : 'var(--ink-200)' }}
                  onClick={() => document.getElementById('file-front').click()}
                >
                  {file ? (
                    <div style={s.fileSelected}>
                      <span style={{ fontSize: 24 }}>✅</span>
                      <span style={{ fontSize: 13, color: '#1E5631', fontWeight: 600 }}>{file.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>{(file.size/1024/1024).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <div style={s.dropContent}>
                      <span style={{ fontSize: 32 }}>📄</span>
                      <span style={{ fontSize: 14, color: 'var(--ink-600)', fontWeight: 600 }}>
                        {lang === 'en' ? 'Click to select' : 'Clica para seleccionar'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>
                        PDF, JPG, PNG · máx. 10 MB
                      </span>
                    </div>
                  )}
                </div>
                <input id="file-front" type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFile(e.target.files[0] || null)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Verso (opcional) */}
              <div style={s.uploadArea}>
                <label style={s.uploadLabel}>
                  {lang === 'en' ? 'BI back (optional)' : 'Verso do BI (opcional)'}
                </label>
                <div
                  style={{ ...s.dropZone, borderColor: fileBack ? '#1E5631' : 'var(--ink-200)' }}
                  onClick={() => document.getElementById('file-back').click()}
                >
                  {fileBack ? (
                    <div style={s.fileSelected}>
                      <span style={{ fontSize: 24 }}>✅</span>
                      <span style={{ fontSize: 13, color: '#1E5631', fontWeight: 600 }}>{fileBack.name}</span>
                    </div>
                  ) : (
                    <div style={s.dropContent}>
                      <span style={{ fontSize: 28 }}>📄</span>
                      <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>
                        {lang === 'en' ? 'Click to add back' : 'Clica para adicionar o verso'}
                      </span>
                    </div>
                  )}
                </div>
                <input id="file-back" type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFileBack(e.target.files[0] || null)}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                <button type="submit" style={s.btnPrimary}>
                  {lang === 'en' ? 'Submit for verification' : 'Enviar para verificação'}
                </button>
                <button type="button" style={s.btnSkip} onClick={skip}>
                  {lang === 'en' ? 'Skip for now' : 'Ignorar por agora'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'processing' && (
          <div style={s.processing}>
            <div style={s.spinner} />
            <h2 style={s.title}>{lang === 'en' ? 'Analysing document...' : 'A analisar o documento...'}</h2>
            <p style={s.desc}>
              {lang === 'en'
                ? 'This may take a few seconds. Do not close this page.'
                : 'Pode demorar alguns segundos. Não fechas esta página.'}
            </p>
            <div style={s.steps}>
              {[
                lang === 'en' ? '📄 Reading document' : '📄 A ler o documento',
                lang === 'en' ? '🔍 Extracting text (OCR)' : '🔍 A extrair texto (OCR)',
                lang === 'en' ? '🇦🇴 Verifying nationality' : '🇦🇴 A verificar nacionalidade',
              ].map((t, i) => (
                <div key={i} style={s.stepItem}>
                  <div style={s.stepDot} />
                  <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div style={s.result}>
            {result.verified ? (
              <>
                <div style={s.successIcon}>✅</div>
                <h2 style={{ ...s.title, color: '#1E5631' }}>
                  {lang === 'en' ? 'Identity verified!' : 'Identidade verificada!'}
                </h2>
                <p style={s.desc}>
                  {lang === 'en'
                    ? 'Your profile now shows the ✓ Verified Angolan badge. You have full access to the platform.'
                    : 'O teu perfil recebeu o selo ✓ Angolano Verificado. Tens acesso completo à plataforma.'}
                </p>
                {result.confidence > 0 && (
                  <div style={s.confidenceBadge}>
                    {lang === 'en' ? `Confidence: ${result.confidence}%` : `Confiança OCR: ${result.confidence}%`}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={s.pendingIcon}>⏳</div>
                <h2 style={s.title}>
                  {lang === 'en' ? 'Pending review' : 'Em análise manual'}
                </h2>
                <p style={s.desc}>{result.message}</p>
              </>
            )}
            <button style={s.btnPrimary} onClick={() => navigate('/feed')}>
              {lang === 'en' ? 'Go to Feed' : 'Ir para o Feed'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:           { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card:           { background: 'var(--surface)', borderRadius: 16, padding: 40, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-md)', border: 'var(--line)' },
  logo:           { display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 24 },
  logoDev:        { fontWeight: 900, fontSize: 26, color: 'var(--ink-900)' },
  logoAngola:     { fontWeight: 900, fontSize: 26, color: 'var(--red)' },
  badge:          { display: 'inline-block', background: '#FEF7E0', color: '#7B4F00', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999, marginBottom: 16 },
  title:          { fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 12 },
  desc:           { fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.6, marginBottom: 20 },
  privacyBox:     { display: 'flex', gap: 12, background: 'var(--ink-50)', borderRadius: 8, padding: 12, marginBottom: 24 },
  privacyIcon:    { fontSize: 20, flexShrink: 0 },
  error:          { background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 8, marginBottom: 16 },
  uploadArea:     { marginBottom: 16 },
  uploadLabel:    { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8 },
  req:            { color: 'var(--red)', marginLeft: 4 },
  dropZone:       { border: '1.5px dashed', borderRadius: 10, cursor: 'pointer', padding: 20, textAlign: 'center', transition: 'border-color .15s' },
  dropContent:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  fileSelected:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  btnPrimary:     { width: '100%', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  btnSkip:        { width: '100%', background: 'none', color: 'var(--ink-400)', border: '1.5px solid var(--ink-200)', borderRadius: 8, padding: '12px 0', fontSize: 14, cursor: 'pointer' },
  processing:     { textAlign: 'center' },
  spinner:        { width: 48, height: 48, border: '4px solid var(--ink-100)', borderTop: '4px solid var(--red)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' },
  steps:          { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24, textAlign: 'left' },
  stepItem:       { display: 'flex', alignItems: 'center', gap: 10 },
  stepDot:        { width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 },
  result:         { textAlign: 'center' },
  successIcon:    { fontSize: 56, marginBottom: 16 },
  pendingIcon:    { fontSize: 56, marginBottom: 16 },
  confidenceBadge:{ display: 'inline-block', background: '#E6F4EA', color: '#1E5631', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999, marginBottom: 20 },
};