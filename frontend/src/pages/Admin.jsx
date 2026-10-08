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

const TABS = ['dashboard','utilizadores','posts','identidades'];
const SEAL_OPTIONS = [
  { value:'gold',   label:'Ouro'       },
  { value:'silver', label:'Prata'      },
  { value:'red',    label:'Destaque'   },
  { value:'blue',   label:'Inovador'   },
  { value:'green',  label:'Comunidade' },
];

function ocrLabel(method, confidence) {
  if (method === 'automatic')     return { text:'OCR aprovou',   cls:'tag--green'  };
  if (method === 'manual_review') return { text:`OCR incerto (${confidence}%)`, cls:'tag--amber' };
  if (method === 'rejected')      return { text:'OCR rejeitou',  cls:'tag--red'    };
  return                                 { text:'Revisão manual',cls:'tag--neutral' };
}

// Ícones SVG inline mínimos
function Ico({ d, d2 }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>{d2&&<path d={d2}/>}
    </svg>
  );
}
const I = {
  shield:  () => <Ico d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  users:   () => <Ico d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" d2="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  home:    () => <Ico d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" d2="M9 22V12h6v10" />,
  edit:    () => <Ico d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" d2="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />,
  award:   () => <Ico d="M12 15a7 7 0 100-14 7 7 0 000 14z" d2="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />,
  ban:     () => <Ico d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" d2="M4.93 4.93l14.14 14.14" />,
  trash:   () => <Ico d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />,
  check:   () => <Ico d="M20 6L9 17l-5-5" />,
  search:  () => <Ico d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  comment: () => <Ico d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  heart:   () => <Ico d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
};

export default function Admin() {
  const { isAdmin } = useAuth();
  const { lang }    = useLang();
  const navigate    = useNavigate();

  const [tab,            setTab]          = useState('dashboard');
  const [stats,          setStats]        = useState(null);
  const [users,          setUsers]        = useState([]);
  const [posts,          setPosts]        = useState([]);
  const [verifications,  setVerifications]= useState([]);
  const [search,         setSearch]       = useState('');
  const [loading,        setLoading]      = useState(false);
  const [msg,            setMsg]          = useState('');
  const [pwModal,        setPwModal]      = useState(null);
  const [newPw,          setNewPw]        = useState('');
  const [badgeModal,     setBadgeModal]   = useState(null);
  const [badgeType,      setBadgeType]    = useState('gold');
  const [badgeLabel,     setBadgeLabel]   = useState('');
  const [rejectModal,    setRejectModal]  = useState(null);
  const [rejectReason,   setRejectReason] = useState('');

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

  async function changePassword() {
    if (!newPw || newPw.length < 6) { flash('Mínimo 6 caracteres.'); return; }
    try {
      await api.put(`/admin/users/${pwModal}/password`, { new_password: newPw });
      flash('Senha alterada.'); setPwModal(null); setNewPw('');
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
      setUsers(u => u.map(x => x.id === id ? { ...x, badge:null, badge_label:null } : x));
      flash('Selo removido.');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function deletePost(id, title) {
    if (!window.confirm(`Eliminar "${title}"?`)) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts(p => p.filter(x => x.id !== id));
      flash('Post eliminado.');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.author_name||'').toLowerCase().includes(search.toLowerCase())
  );

  const TAB_LABELS = {
    dashboard:    'Dashboard',
    utilizadores: 'Utilizadores',
    posts:        'Posts',
    identidades:  `Identidades${verifications.length > 0 ? ` (${verifications.length})` : ''}`,
  };

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="admin-wrap">

          {/* Cabeçalho */}
          <div className="admin-header">
            <div className="admin-header__icon"><I.shield /></div>
            <div>
              <h1 className="admin-header__title">Painel de Administração</h1>
              <p className="admin-header__sub">DevAngola — Gestão total da plataforma</p>
            </div>
          </div>

          {msg && <div className={`admin-flash${msg.toLowerCase().includes('erro') ? ' admin-flash--error' : ''}`}>{msg}</div>}

          {/* Tabs */}
          <div className="admin-tabs">
            {TABS.map(t => (
              <button key={t}
                className={`admin-tab${tab===t ? ' admin-tab--active' : ''}`}
                onClick={() => { setTab(t); setSearch(''); }}>
                {t === 'identidades' && verifications.length > 0 && (
                  <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'var(--red)', marginRight:'var(--s1)' }} />
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
                { label:'Utilizadores', value: stats.users,    icon: I.users   },
                { label:'Posts',        value: stats.posts,    icon: I.home    },
                { label:'Comentários',  value: stats.comments, icon: I.comment },
                { label:'Gostos',       value: stats.likes,    icon: I.heart   },
              ].map(s => (
                <div key={s.label} className="card stat-card">
                  <div className="stat-card__icon"><s.icon /></div>
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
                <div style={{ position:'relative', flex:1 }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', pointerEvents:'none' }}><I.search /></span>
                  <input className="input" style={{ paddingLeft:36, height:38 }}
                    placeholder="Nome ou email..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <span className="caption">{filteredUsers.length} utilizadores</span>
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
                        <td>{u.verified ? <VerifiedBadge size="sm" lang={lang} /> : <span className="a-none">—</span>}</td>
                        <td>
                          {u.badge
                            ? <span className={`seal seal--${u.badge}`}>{u.badge_label}</span>
                            : <span className="a-none">—</span>}
                        </td>
                        <td>
                          <select className="select a-select" value={u.role} onChange={e => changeRole(u.id, e.target.value)}>
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td><span className={`a-status ${u.is_active ? 'a-status--active' : 'a-status--banned'}`}>{u.is_active ? 'Activo' : 'Suspenso'}</span></td>
                        <td>
                          <div className="a-actions">
                            <button className="a-btn a-btn--gray" title="Alterar senha" onClick={() => { setPwModal(u.id); setNewPw(''); }}><I.edit /></button>
                            <button className="a-btn a-btn--gold" title="Atribuir selo" onClick={() => { setBadgeModal(u.id); setBadgeLabel(''); }}><I.award /></button>
                            {u.badge && <button className="a-btn a-btn--gray" title="Remover selo" onClick={() => removeBadge(u.id)} style={{ fontSize:'var(--t-base)', fontWeight:'var(--w-black)' }}>×</button>}
                            <button className={`a-btn ${u.is_active ? 'a-btn--red' : 'a-btn--green'}`} onClick={() => toggleActive(u.id, u.is_active)}><I.ban /></button>
                            <button className="a-btn a-btn--red" onClick={() => deleteUser(u.id, u.name)}><I.trash /></button>
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
                <div style={{ position:'relative', flex:1 }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', pointerEvents:'none' }}><I.search /></span>
                  <input className="input" style={{ paddingLeft:36, height:38 }}
                    placeholder="Título ou autor..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <span className="caption">{filteredPosts.length} posts</span>
              </div>
              <div className="admin-table card">
                <table className="a-table">
                  <thead><tr>
                    <th>Post</th><th>Autor</th><th>Gostos</th><th>Coment.</th><th>Data</th><th>Acção</th>
                  </tr></thead>
                  <tbody>
                    {filteredPosts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="a-post-title">{p.title}</div>
                          <div className="a-post-excerpt">{p.content?.slice(0,60)}...</div>
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
                        <td><button className="a-btn a-btn--red" onClick={() => deletePost(p.id, p.title)}><I.trash /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── IDENTIDADES ── */}
          {tab === 'identidades' && (
            <div className="stack">
              <p className="body-sm" style={{ color:'var(--ink-500)' }}>
                Todos os pedidos chegam aqui, mesmo os que o OCR aprovou. O admin tem sempre a palavra final.
                O documento é eliminado após a decisão.
              </p>
              {verifications.length === 0 && <div className="card card--padded">Sem pedidos pendentes.</div>}
              {verifications.map(v => {
                const ocr = ocrLabel(v.ocr_method, v.ocr_confidence);
                return (
                  <div key={v.id} className="card card__body--lg">
                    <div className="row--between" style={{ flexWrap:'wrap', gap:'var(--s4)', alignItems:'flex-start', marginBottom:'var(--s4)' }}>
                      <div className="row" style={{ gap:'var(--s3)', flex:1 }}>
                        <Avatar name={v.user_name} size="md" />
                        <div className="stack--xs">
                          <span className="heading-sm">{v.user_name}</span>
                          <span className="caption">{v.user_email}</span>
                          <Badge level={v.user_level} />
                        </div>
                      </div>
                      <div className="stack--xs" style={{ alignItems:'flex-end' }}>
                        <span className={`tag ${ocr.cls}`}>{ocr.text}</span>
                        <span className="caption">Submetido: {new Date(v.submitted_at).toLocaleDateString('pt-AO')}</span>
                        {v.ocr_reason && <span className="caption" style={{ maxWidth:260, textAlign:'right' }}>{v.ocr_reason}</span>}
                      </div>
                    </div>
                    {v.document_ref && v.document_ref.startsWith('http') && (
                      <div className="feedback feedback--info" style={{ marginBottom:'var(--s3)' }}>
                        <a href={v.document_ref} target="_blank" rel="noreferrer"
                          style={{ color:'var(--blue)', fontWeight:'var(--w-bold)', textDecoration:'none' }}>
                          Ver documento →
                        </a>
                      </div>
                    )}
                    <div className="row" style={{ paddingTop:'var(--s3)', borderTop:'var(--line)' }}>
                      <Button style={{ width:'auto' }} onClick={() => approveVerification(v.id)}>
                        <I.check /> Aprovar
                      </Button>
                      <Button variant="secondary"
                        style={{ width:'auto', color:'var(--red)', borderColor:'var(--red-border)' }}
                        onClick={() => { setRejectModal(v.id); setRejectReason(''); }}>
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div></div>

      {/* ── Modais ── */}
      {pwModal && (
        <div className="modal-overlay" onClick={() => setPwModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Alterar Senha</h3>
            <div className="field" style={{ marginTop:'var(--s4)' }}>
              <label className="field__label">Nova senha (mínimo 6 caracteres)</label>
              <input className="input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                onKeyDown={e => e.key==='Enter' && changePassword()} />
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setPwModal(null)}>Cancelar</Button>
              <Button onClick={changePassword}><I.check /> Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {badgeModal && (
        <div className="modal-overlay" onClick={() => setBadgeModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Atribuir Selo</h3>
            <div className="field" style={{ marginTop:'var(--s4)' }}>
              <label className="field__label">Tipo</label>
              <div className="seal-options">
                {SEAL_OPTIONS.map(s => (
                  <button key={s.value}
                    className={`seal-opt${badgeType===s.value ? ' seal-opt--active' : ''}`}
                    onClick={() => setBadgeType(s.value)}>
                    <span className={`seal seal--${s.value}`}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ marginTop:'var(--s4)' }}>
              <label className="field__label">Nome do selo</label>
              <input className="input" placeholder="Ex: Programador do Ano"
                value={badgeLabel} onChange={e => setBadgeLabel(e.target.value)} />
            </div>
            {badgeLabel && (
              <p className="body-sm" style={{ marginTop:'var(--s2)' }}>
                Pré-visualização: <span className={`seal seal--${badgeType}`}>{badgeLabel}</span>
              </p>
            )}
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setBadgeModal(null)}>Cancelar</Button>
              <Button onClick={assignBadge}><I.award /> Atribuir</Button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Rejeitar Verificação</h3>
            <p className="modal-desc">O utilizador receberá este motivo e poderá submeter novamente.</p>
            <div className="field">
              <label className="field__label">Motivo da rejeição *</label>
              <textarea className="textarea" rows={3}
                placeholder="Ex: Documento ilegível. Envia uma fotografia mais nítida."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancelar</Button>
              <Button style={{ background:'var(--red)' }} onClick={rejectVerification}>Rejeitar pedido</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
