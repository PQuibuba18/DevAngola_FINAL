import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  IconShield, IconUsers, IconHome, IconTrash, IconAward,
  IconBan, IconEdit, IconCheck, IconSearch, IconSettings,
} from '../components/ui/Icons';

const TABS = ['dashboard','utilizadores','posts'];
const SEAL_OPTIONS = [
  { value:'gold',   label:'Ouro'       },
  { value:'silver', label:'Prata'      },
  { value:'red',    label:'Destaque'   },
  { value:'blue',   label:'Inovador'   },
  { value:'green',  label:'Comunidade' },
];

export default function Admin() {
  const { isAdmin }   = useAuth();
  const { lang }      = useLang();
  const navigate      = useNavigate();
  const [tab,     setTab]     = useState('dashboard');
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [posts,   setPosts]   = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [pwModal,    setPwModal]    = useState(null);
  const [newPw,      setNewPw]      = useState('');
  const [badgeModal, setBadgeModal] = useState(null);
  const [badgeType,  setBadgeType]  = useState('gold');
  const [badgeLabel, setBadgeLabel] = useState('Programador do Ano');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, p] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/posts'),
      ]);
      setStats(s.data); setUsers(u.data); setPosts(p.data);
    } catch (err) {
      const code = err.response?.status;
      if (code === 401 || code === 403) {
        setMsg('Sessão expirada. Faz login novamente.');
      } else {
        setMsg(lang==='en'?'Error loading data.':'Erro ao carregar dados.');
      }
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    if (!isAdmin) { navigate('/feed'); return; }
    loadAll();
  }, [isAdmin, navigate, loadAll]);

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3500); }

  async function changePassword() {
    if (!newPw || newPw.length < 6) { flash(lang==='en'?'Min 6 characters.':'Mínimo 6 caracteres.'); return; }
    try {
      await api.put(`/admin/users/${pwModal}/password`, { new_password: newPw });
      flash(lang==='en'?'Password changed.':'Senha alterada.');
      setPwModal(null); setNewPw('');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function toggleActive(id, current) {
    try {
      await api.put(`/admin/users/${id}/active`, { is_active: !current });
      setUsers(u => u.map(x => x.id===id ? { ...x, is_active: !current } : x));
      flash(!current ? (lang==='en'?'User activated.':'Utilizador activado.') : (lang==='en'?'User suspended.':'Utilizador suspenso.'));
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function changeRole(id, newRole) {
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      setUsers(u => u.map(x => x.id===id ? { ...x, role: newRole } : x));
      flash(`Role → ${newRole}`);
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function deleteUser(id, name) {
    if (!window.confirm(`${lang==='en'?'Delete':'Eliminar'} "${name}"?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x.id !== id));
      flash(lang==='en'?'User deleted.':'Utilizador eliminado.');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function assignBadge() {
    if (!badgeLabel.trim()) { flash(lang==='en'?'Badge name required.':'Nome do selo obrigatório.'); return; }
    try {
      await api.put(`/admin/users/${badgeModal}/badge`, { badge: badgeType, badge_label: badgeLabel });
      setUsers(u => u.map(x => x.id===badgeModal ? { ...x, badge: badgeType, badge_label: badgeLabel } : x));
      flash(lang==='en'?'Badge assigned!':'Selo atribuído!');
      setBadgeModal(null);
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function removeBadge(id) {
    try {
      await api.delete(`/admin/users/${id}/badge`);
      setUsers(u => u.map(x => x.id===id ? { ...x, badge:null, badge_label:null } : x));
      flash(lang==='en'?'Badge removed.':'Selo removido.');
    } catch (err) { flash(err.response?.data?.error || 'Erro.'); }
  }

  async function deletePost(id, title) {
    if (!window.confirm(`${lang==='en'?'Delete':'Eliminar'} "${title}"?`)) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts(p => p.filter(x => x.id !== id));
      flash(lang==='en'?'Post deleted.':'Post eliminado.');
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

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner"><div className="admin-wrap">

        <div className="admin-header">
          <div className="admin-header__icon"><IconShield className="icon icon--lg" style={{ color:'var(--red)' }} /></div>
          <div>
            <h1 className="admin-header__title">{lang==='en'?'Admin Panel':'Painel de Administração'}</h1>
            <p className="admin-header__sub">{lang==='en'?'Full system management':'Gestão total do DevAngola'}</p>
          </div>
        </div>

        {msg && <div className={`admin-flash${msg.toLowerCase().includes('erro')||msg.toLowerCase().includes('error') ? ' admin-flash--error' : ''}`}>{msg}</div>}

        <div className="admin-tabs">
          {TABS.map(tab_name => (
            <button key={tab_name}
              className={`admin-tab${tab===tab_name ? ' admin-tab--active' : ''}`}
              onClick={() => { setTab(tab_name); setSearch(''); }}>
              {tab_name==='dashboard'    && <IconSettings className="icon icon--sm" />}
              {tab_name==='utilizadores' && <IconUsers    className="icon icon--sm" />}
              {tab_name==='posts'        && <IconHome     className="icon icon--sm" />}
              {tab_name==='dashboard' ? 'Dashboard' : tab_name.charAt(0).toUpperCase()+tab_name.slice(1)}
            </button>
          ))}
        </div>

        {loading && <div className="spinner" />}

        {/* DASHBOARD */}
        {tab==='dashboard' && stats && (
          <div className="admin-stats">
            {[
              { label: lang==='en'?'Users':'Utilizadores',  value:stats.users,    icon:<IconUsers  className="icon icon--lg"/> },
              { label: lang==='en'?'Posts':'Posts',         value:stats.posts,    icon:<IconHome   className="icon icon--lg"/> },
              { label: lang==='en'?'Comments':'Comentários',value:stats.comments, icon:<IconEdit   className="icon icon--lg"/> },
              { label: lang==='en'?'Likes':'Gostos',        value:stats.likes,    icon:<IconAward  className="icon icon--lg"/> },
            ].map(s => (
              <div key={s.label} className="stat-card card">
                <div className="stat-card__icon">{s.icon}</div>
                <div className="stat-card__value">{s.value}</div>
                <div className="stat-card__label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* UTILIZADORES */}
        {tab==='utilizadores' && (
          <>
            <div className="admin-search card">
              <div style={{ position:'relative', flex:1 }}>
                <IconSearch className="icon icon--sm" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--ink-400)',pointerEvents:'none' }} />
                <input className="input" style={{ paddingLeft:36, height:38 }}
                  placeholder={lang==='en'?'Search by name or email...':'Buscar por nome ou email...'}
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <span style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)', whiteSpace:'nowrap' }}>{filteredUsers.length} {lang==='en'?'users':'utilizadores'}</span>
            </div>
            <div className="admin-table card">
              <table className="a-table">
                <thead><tr>
                  <th>{lang==='en'?'User':'Utilizador'}</th>
                  <th>{lang==='en'?'Level':'Nível'}</th>
                  <th>Posts</th>
                  <th>{lang==='en'?'Badge':'Selo'}</th>
                  <th>Role</th>
                  <th>{lang==='en'?'Status':'Estado'}</th>
                  <th>{lang==='en'?'Actions':'Acções'}</th>
                </tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={!u.is_active ? 'a-table__row--banned' : ''}>
                      <td>
                        <div className="a-user-cell">
                          <Avatar name={u.name} src={u.avatar_url} size="sm" />
                          <div><div className="a-user-name">{u.name}</div><div className="a-user-email">{u.email}</div></div>
                        </div>
                      </td>
                      <td><Badge level={u.level} lang={lang} /></td>
                      <td><span className="a-count">{u.total_posts}</span></td>
                      <td>{u.badge ? <span className={`seal seal--${u.badge}`}>{u.badge_label}</span> : <span className="a-none">—</span>}</td>
                      <td>
                        <select className="select a-select" value={u.role} onChange={e => changeRole(u.id, e.target.value)}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td><span className={`a-status ${u.is_active ? 'a-status--active' : 'a-status--banned'}`}>{u.is_active ? (lang==='en'?'Active':'Activo') : (lang==='en'?'Suspended':'Suspenso')}</span></td>
                      <td>
                        <div className="a-actions">
                          <button className="a-btn a-btn--gray" title={lang==='en'?'Change password':'Alterar senha'} onClick={() => { setPwModal(u.id); setNewPw(''); }}><IconEdit  className="icon icon--sm" /></button>
                          <button className="a-btn a-btn--gold" title={lang==='en'?'Assign badge':'Atribuir selo'}   onClick={() => setBadgeModal(u.id)}>                           <IconAward className="icon icon--sm" /></button>
                          {u.badge && <button className="a-btn a-btn--gray" title={lang==='en'?'Remove badge':'Remover selo'} onClick={() => removeBadge(u.id)}>✕</button>}
                          <button className={`a-btn ${u.is_active ? 'a-btn--red' : 'a-btn--green'}`} onClick={() => toggleActive(u.id, u.is_active)}><IconBan className="icon icon--sm" /></button>
                          <button className="a-btn a-btn--red" onClick={() => deleteUser(u.id, u.name)}><IconTrash className="icon icon--sm" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* POSTS */}
        {tab==='posts' && (
          <>
            <div className="admin-search card">
              <div style={{ position:'relative', flex:1 }}>
                <IconSearch className="icon icon--sm" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--ink-400)',pointerEvents:'none' }} />
                <input className="input" style={{ paddingLeft:36, height:38 }}
                  placeholder={lang==='en'?'Search by title or author...':'Buscar por título ou autor...'}
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <span style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)', whiteSpace:'nowrap' }}>{filteredPosts.length} posts</span>
            </div>
            <div className="admin-table card">
              <table className="a-table">
                <thead><tr>
                  <th>Post</th><th>{lang==='en'?'Author':'Autor'}</th>
                  <th>{lang==='en'?'Likes':'Gostos'}</th><th>{lang==='en'?'Comm.':'Coment.'}</th>
                  <th>{lang==='en'?'Date':'Data'}</th><th>{lang==='en'?'Action':'Acção'}</th>
                </tr></thead>
                <tbody>
                  {filteredPosts.map(p => (
                    <tr key={p.id}>
                      <td><div className="a-post-title">{p.title}</div><div className="a-post-excerpt">{p.content?.slice(0,60)}...</div></td>
                      <td><div className="a-user-cell"><Avatar name={p.author_name} src={p.author_avatar} size="xs" /><span className="a-user-name">{p.author_name}</span></div></td>
                      <td><span className="a-count">{p.likes_count}</span></td>
                      <td><span className="a-count">{p.comments_count}</span></td>
                      <td className="a-date">{new Date(p.created_at).toLocaleDateString(lang==='en'?'en-GB':'pt-AO')}</td>
                      <td><button className="a-btn a-btn--red" onClick={() => deletePost(p.id, p.title)}><IconTrash className="icon icon--sm" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div></div></div>

      {/* Modal senha */}
      {pwModal && (
        <div className="modal-overlay" onClick={() => setPwModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{lang==='en'?'Change Password':'Alterar Senha'}</h3>
            <div className="field" style={{ marginTop:16 }}>
              <label className="field__label">{lang==='en'?'New password (min 6 chars)':'Nova senha (mínimo 6 caracteres)'}</label>
              <input className="input" type="password" placeholder={lang==='en'?'New password...':'Nova senha...'}
                value={newPw} onChange={e => setNewPw(e.target.value)}
                onKeyDown={e => e.key==='Enter' && changePassword()} />
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setPwModal(null)}>{lang==='en'?'Cancel':'Cancelar'}</Button>
              <Button onClick={changePassword}><IconCheck className="icon icon--sm" /> {lang==='en'?'Confirm':'Confirmar'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal selo */}
      {badgeModal && (
        <div className="modal-overlay" onClick={() => setBadgeModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{lang==='en'?'Assign Badge':'Atribuir Selo'}</h3>
            <p className="modal-desc">{lang==='en'?'The badge stays permanently on the profile until removed.':'O selo fica permanentemente no perfil até ser removido.'}</p>
            <div className="field" style={{ marginTop:16 }}>
              <label className="field__label">{lang==='en'?'Badge type':'Tipo de selo'}</label>
              <div className="seal-options">
                {SEAL_OPTIONS.map(s => (
                  <button key={s.value} className={`seal-opt${badgeType===s.value?' seal-opt--active':''}`} onClick={() => setBadgeType(s.value)}>
                    <span className={`seal seal--${s.value}`}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ marginTop:16 }}>
              <label className="field__label">{lang==='en'?'Badge name':'Nome do selo'}</label>
              <input className="input" type="text"
                placeholder={lang==='en'?'Ex: Developer of the Year...':'Ex: Programador do Ano...'}
                value={badgeLabel} onChange={e => setBadgeLabel(e.target.value)} />
            </div>
            <div style={{ marginTop:12 }}>
              <span style={{ fontSize:'var(--t-sm)', color:'var(--ink-500)' }}>{lang==='en'?'Preview: ':'Pré-visualização: '}</span>
              <span className={`seal seal--${badgeType}`}>{badgeLabel||'...'}</span>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setBadgeModal(null)}>{lang==='en'?'Cancel':'Cancelar'}</Button>
              <Button onClick={assignBadge}><IconAward className="icon icon--sm" /> {lang==='en'?'Assign':'Atribuir'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}