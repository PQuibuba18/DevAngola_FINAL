import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import Button from '../components/ui/Button';
import VerifiedBadge from '../components/ui/VerifiedBadge';
import {
  IconShield, IconUsers, IconHome, IconTrash,
  IconAward, IconBan, IconEdit, IconCheck, IconSearch,
} from '../components/ui/Icons';

const TABS = ['dashboard', 'utilizadores', 'posts', 'identidades'];

const SEAL_OPTIONS = [
  { value: 'gold',   label: 'Ouro'       },
  { value: 'silver', label: 'Prata'      },
  { value: 'red',    label: 'Destaque'   },
  { value: 'blue',   label: 'Inovador'   },
  { value: 'green',  label: 'Comunidade' },
];

// Rótulo do método OCR para o admin ler rapidamente
function ocrLabel(method, confidence) {
  if (method === 'automatic')    return { text: `OCR aprovou (${confidence}%)`, color: '#1A5C30', bg: '#E6F4EA' };
  if (method === 'manual_review')return { text: `OCR incerto (${confidence}%)`, color: '#7B4F00', bg: '#FEF7E0' };
  if (method === 'rejected')     return { text: `OCR rejeitou (${confidence}%)`, color: '#C41C00', bg: '#FEE2E2' };
  if (method === 'error')        return { text: 'OCR falhou',                    color: '#6B6B6B', bg: '#F0F0F0' };
  return                                { text: 'Revisão manual',               color: '#444',    bg: '#F5F5F5' };
}

export default function Admin() {
  const { isAdmin }   = useAuth();
  const { lang }      = useLang();
  const navigate      = useNavigate();

  const [tab,          setTab]         = useState('dashboard');
  const [stats,        setStats]       = useState(null);
  const [users,        setUsers]       = useState([]);
  const [posts,        setPosts]       = useState([]);
  const [verifications,setVerifications] = useState([]);
  const [search,       setSearch]      = useState('');
  const [loading,      setLoading]     = useState(false);
  const [msg,          setMsg]         = useState('');

  const [pwModal,    setPwModal]    = useState(null);
  const [newPw,      setNewPw]      = useState('');
  const [badgeModal, setBadgeModal] = useState(null);
  const [badgeType,  setBadgeType]  = useState('gold');
  const [badgeLabel, setBadgeLabel] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason,setRejectReason]= useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/feed'); return; }
    loadAll();
  }, [isAdmin]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, p, v] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/posts'),
        api.get('/verification/admin/pending'),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setPosts(p.data);
      setVerifications(v.data);
    } catch { flash('Erro ao carregar dados.'); }
    finally { setLoading(false); }
  }, []);

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 4000); }

  // ── Utilizadores ──────────────────────────────────────────
  async function changePassword() {
    if (!newPw || newPw.length < 6) { flash('Mínimo 6 caracteres.'); return; }
    try {
      await api.put(`/admin/users/${pwModal}/password`, { new_password: newPw });
      flash('Senha alterada.'); setPwModal(null); setNewPw('');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function toggleActive(id, current) {
    try {
      await api.put(`/admin/users/${id}/active`, { is_active: !current });
      setUsers(u => u.map(x => x.id === id ? { ...x, is_active: !current } : x));
      flash(!current ? 'Utilizador activado.' : 'Utilizador suspenso.');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function changeRole(id, newRole) {
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      setUsers(u => u.map(x => x.id === id ? { ...x, role: newRole } : x));
      flash(`Role alterado para ${newRole}.`);
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function deleteUser(id, name) {
    if (!window.confirm(`Eliminar "${name}" permanentemente?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x.id !== id));
      flash('Utilizador eliminado.');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function assignBadge() {
    if (!badgeLabel.trim()) { flash('Escreve o nome do selo.'); return; }
    try {
      await api.put(`/admin/users/${badgeModal}/badge`, { badge: badgeType, badge_label: badgeLabel });
      setUsers(u => u.map(x => x.id === badgeModal ? { ...x, badge: badgeType, badge_label: badgeLabel } : x));
      flash('Selo atribuído!'); setBadgeModal(null); setBadgeLabel('');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function removeBadge(id) {
    try {
      await api.delete(`/admin/users/${id}/badge`);
      setUsers(u => u.map(x => x.id === id ? { ...x, badge: null, badge_label: null } : x));
      flash('Selo removido.');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  // ── Posts ─────────────────────────────────────────────────
  async function deletePost(id, title) {
    if (!window.confirm(`Eliminar "${title}"?`)) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts(p => p.filter(x => x.id !== id));
      flash('Post eliminado.');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  // ── Identidades ───────────────────────────────────────────
  async function approveVerification(id) {
    try {
      await api.put(`/verification/admin/${id}/approve`);
      setVerifications(v => v.filter(x => x.id !== id));
      flash('Identidade aprovada.');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function rejectVerification() {
    if (!rejectReason.trim()) { flash('Motivo obrigatório.'); return; }
    try {
      await api.put(`/verification/admin/${rejectModal}/reject`, { reason: rejectReason });
      setVerifications(v => v.filter(x => x.id !== rejectModal));
      flash('Pedido rejeitado.'); setRejectModal(null); setRejectReason('');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  // ── Filtros ───────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.author_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const TAB_LABELS = {
    dashboard:    'Dashboard',
    utilizadores: lang === 'en' ? 'Users' : 'Utilizadores',
    posts:        'Posts',
    identidades:  lang === 'en' ? `Identities (${verifications.length})` : `Identidades (${verifications.length})`,
  };

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner"><div className="admin-wrap">

        {/* Cabeçalho */}
        <div className="admin-header">
          <div className="admin-header__icon">
            <IconShield className="icon icon--lg" style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <h1 className="admin-header__title">Painel de Administração</h1>
            <p className="admin-header__sub">DevAngola — Gestão total</p>
          </div>
        </div>

        {msg && (
          <div className={`admin-flash${msg.toLowerCase().includes('erro') ? ' admin-flash--error' : ''}`}>
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {TABS.map(t => (
            <button key={t}
              className={`admin-tab${tab === t ? ' admin-tab--active' : ''}`}
              onClick={() => { setTab(t); setSearch(''); }}
            >
              {t === 'identidades' && verifications.length > 0 && (
                <span style={{
                  display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--red)', marginRight: 4,
                }} />
              )}
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {loading && <div className="spinner" />}

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && stats && (
          <div className="admin-stats">
            {[
              { label: 'Utilizadores',  value: stats.users,    icon: <IconUsers className="icon icon--lg" /> },
              { label: 'Posts',         value: stats.posts,    icon: <IconHome  className="icon icon--lg" /> },
              { label: 'Comentários',   value: stats.comments, icon: <IconEdit  className="icon icon--lg" /> },
              { label: 'Gostos',        value: stats.likes,    icon: <IconAward className="icon icon--lg" /> },
            ].map(s => (
              <div key={s.label} className="stat-card card">
                <div className="stat-card__icon">{s.icon}</div>
                <div className="stat-card__value">{s.value}</div>
                <div className="stat-card__label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── UTILIZADORES ── */}
        {tab === 'utilizadores' && (
          <>
            <div className="admin-search card">
              <div style={{ position: 'relative', flex: 1 }}>
                <IconSearch className="icon icon--sm" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', pointerEvents:'none' }} />
                <input className="input" style={{ paddingLeft: 36, height: 38 }}
                  placeholder="Buscar por nome ou email..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <span style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>
                {filteredUsers.length} utilizadores
              </span>
            </div>
            <div className="admin-table card">
              <table className="a-table">
                <thead><tr>
                  <th>Utilizador</th><th>Nível</th><th>Posts</th>
                  <th>Identidade</th><th>Selo</th><th>Role</th>
                  <th>Estado</th><th>Acções</th>
                </tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={!u.is_active ? 'a-table__row--banned' : ''}>
                      <td>
                        <div className="a-user-cell">
                          <Avatar name={u.name} src={u.avatar_url} size="sm" />
                          <div>
                            <div className="a-user-name">{u.name}</div>
                            <div className="a-user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge level={u.level} /></td>
                      <td><span className="a-count">{u.total_posts}</span></td>
                      <td>
                        {u.verified
                          ? <VerifiedBadge size="sm" lang={lang} />
                          : <span className="a-none">—</span>
                        }
                      </td>
                      <td>
                        {u.badge
                          ? <span className={`seal seal--${u.badge}`}>{u.badge_label}</span>
                          : <span className="a-none">—</span>
                        }
                      </td>
                      <td>
                        <select className="select a-select" value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`a-status ${u.is_active ? 'a-status--active' : 'a-status--banned'}`}>
                          {u.is_active ? 'Activo' : 'Suspenso'}
                        </span>
                      </td>
                      <td>
                        <div className="a-actions">
                          <button className="a-btn a-btn--gray" title="Alterar senha"
                            onClick={() => { setPwModal(u.id); setNewPw(''); }}>
                            <IconEdit className="icon icon--sm" />
                          </button>
                          <button className="a-btn a-btn--gold" title="Atribuir selo"
                            onClick={() => { setBadgeModal(u.id); setBadgeLabel(''); }}>
                            <IconAward className="icon icon--sm" />
                          </button>
                          {u.badge && (
                            <button className="a-btn a-btn--gray" title="Remover selo"
                              onClick={() => removeBadge(u.id)}>
                              ×
                            </button>
                          )}
                          <button className={`a-btn ${u.is_active ? 'a-btn--red' : 'a-btn--green'}`}
                            onClick={() => toggleActive(u.id, u.is_active)}>
                            <IconBan className="icon icon--sm" />
                          </button>
                          <button className="a-btn a-btn--red"
                            onClick={() => deleteUser(u.id, u.name)}>
                            <IconTrash className="icon icon--sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── POSTS ── */}
        {tab === 'posts' && (
          <>
            <div className="admin-search card">
              <div style={{ position: 'relative', flex: 1 }}>
                <IconSearch className="icon icon--sm" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', pointerEvents:'none' }} />
                <input className="input" style={{ paddingLeft: 36, height: 38 }}
                  placeholder="Buscar por título ou autor..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <span style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>
                {filteredPosts.length} posts
              </span>
            </div>
            <div className="admin-table card">
              <table className="a-table">
                <thead><tr>
                  <th>Post</th><th>Autor</th><th>Gostos</th>
                  <th>Coment.</th><th>Data</th><th>Acção</th>
                </tr></thead>
                <tbody>
                  {filteredPosts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="a-post-title">{p.title}</div>
                        <div className="a-post-excerpt">{p.content?.slice(0, 60)}...</div>
                      </td>
                      <td>
                        <div className="a-user-cell">
                          <Avatar name={p.author_name} src={p.author_avatar} size="xs" />
                          <span className="a-user-name">{p.author_name}</span>
                        </div>
                      </td>
                      <td><span className="a-count">{p.likes_count}</span></td>
                      <td><span className="a-count">{p.comments_count}</span></td>
                      <td className="a-date">{new Date(p.created_at).toLocaleDateString('pt-AO')}</td>
                      <td>
                        <button className="a-btn a-btn--red" onClick={() => deletePost(p.id, p.title)}>
                          <IconTrash className="icon icon--sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── IDENTIDADES ── */}
        {tab === 'identidades' && (
          <>
            <div style={{ marginBottom: 'var(--s4)' }}>
              <p style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-500)', lineHeight: 1.6 }}>
                Todos os pedidos de verificação chegam aqui, mesmo os que o OCR aprovou.
                O admin tem sempre a palavra final. O documento é eliminado após a decisão.
              </p>
            </div>

            {verifications.length === 0 && (
              <div className="card card--padded" style={{ textAlign: 'center', color: 'var(--ink-400)' }}>
                Sem pedidos pendentes.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              {verifications.map(v => {
                const ocr = ocrLabel(v.ocr_method, v.ocr_confidence);
                return (
                  <div key={v.id} className="card" style={{ padding: 'var(--s5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>

                      {/* Info do utilizador */}
                      <div style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'center', flex: 1 }}>
                        <Avatar name={v.user_name} size="md" />
                        <div>
                          <div style={{ fontWeight: 'var(--w-bold)', color: 'var(--ink-900)', fontSize: 'var(--t-base)' }}>
                            {v.user_name}
                          </div>
                          <div style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-400)' }}>{v.user_email}</div>
                          <div style={{ marginTop: 4 }}>
                            <Badge level={v.user_level} />
                          </div>
                        </div>
                      </div>

                      {/* Resultado do OCR */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block', fontSize: 12, fontWeight: 700,
                          padding: '3px 10px', borderRadius: 999,
                          background: ocr.bg, color: ocr.color,
                          marginBottom: 4,
                        }}>
                          {ocr.text}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>
                          Submetido: {new Date(v.submitted_at).toLocaleDateString('pt-AO')}
                        </div>
                        {v.ocr_reason && (
                          <div style={{ fontSize: 11, color: 'var(--ink-500)', maxWidth: 260, marginTop: 2 }}>
                            {v.ocr_reason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documento (link para visualizar se existir) */}
                    {v.document_ref && (
                      <div style={{
                        margin: 'var(--s3) 0', padding: 'var(--s3)',
                        background: 'var(--ink-50)', borderRadius: 'var(--r-sm)',
                        fontSize: 12, color: 'var(--ink-500)',
                      }}>
                        Documento disponível para revisão.
                        {v.document_ref.startsWith('http') && (
                          <a href={v.document_ref} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--red)', fontWeight: 700, marginLeft: 8 }}>
                            Ver documento
                          </a>
                        )}
                      </div>
                    )}

                    {/* Acções */}
                    <div style={{ display: 'flex', gap: 'var(--s3)', marginTop: 'var(--s3)', borderTop: 'var(--line)', paddingTop: 'var(--s3)' }}>
                      <Button onClick={() => approveVerification(v.id)} style={{ width: 'auto' }}>
                        <IconCheck className="icon icon--sm" /> Aprovar
                      </Button>
                      <Button variant="secondary"
                        style={{ width: 'auto', color: 'var(--red)', borderColor: 'var(--red-border)' }}
                        onClick={() => { setRejectModal(v.id); setRejectReason(''); }}>
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div></div></div>

      {/* Modal senha */}
      {pwModal && (
        <div className="modal-overlay" onClick={() => setPwModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Alterar Senha</h3>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="field__label">Nova senha (mínimo 6 caracteres)</label>
              <input className="input" type="password"
                value={newPw} onChange={e => setNewPw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && changePassword()} />
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setPwModal(null)}>Cancelar</Button>
              <Button onClick={changePassword}><IconCheck className="icon icon--sm" /> Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal selo */}
      {badgeModal && (
        <div className="modal-overlay" onClick={() => setBadgeModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Atribuir Selo</h3>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="field__label">Tipo</label>
              <div className="seal-options">
                {SEAL_OPTIONS.map(s => (
                  <button key={s.value}
                    className={`seal-opt${badgeType === s.value ? ' seal-opt--active' : ''}`}
                    onClick={() => setBadgeType(s.value)}>
                    <span className={`seal seal--${s.value}`}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="field__label">Nome do selo</label>
              <input className="input" placeholder="Ex: Programador do Ano"
                value={badgeLabel} onChange={e => setBadgeLabel(e.target.value)} />
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-500)' }}>
              Pré-visualização: <span className={`seal seal--${badgeType}`}>{badgeLabel || '...'}</span>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setBadgeModal(null)}>Cancelar</Button>
              <Button onClick={assignBadge}><IconAward className="icon icon--sm" /> Atribuir</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rejeição de identidade */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Rejeitar Verificação</h3>
            <p className="modal-desc">
              O utilizador receberá este motivo e poderá submeter novamente.
            </p>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="field__label">Motivo da rejeição *</label>
              <textarea className="textarea" rows={3}
                placeholder="Ex: Documento ilegível. Enviaste o documento correcto? Certifica-te de que está bem iluminado e legível."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancelar</Button>
              <Button
                style={{ background: 'var(--red)' }}
                onClick={rejectVerification}>
                Rejeitar pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
