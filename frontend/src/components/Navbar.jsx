import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import Avatar from './ui/Avatar';
import { IconHome, IconGrid, IconUsers, IconMessage, IconPlus,
         IconUser, IconLogout, IconSettings, IconShield, IconTrophy } from './ui/Icons';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useLang();
  const loc   = useLocation();
  const nav   = useNavigate();

  function cls(path) {
    return `navbar__link${loc.pathname.startsWith(path) ? ' navbar__link--active' : ''}`;
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/feed" className="navbar__logo">
          <span className="navbar__logo-dev">Dev</span>
          <span className="navbar__logo-angola">Angola</span>
        </Link>
        <nav className="navbar__nav">
          <Link to="/feed"       className={cls('/feed')}>      <IconHome    className="icon icon--sm" /> {t.feed}      </Link>
          <Link to="/salas"      className={cls('/salas')}>     <IconGrid    className="icon icon--sm" /> {t.rooms}     </Link>
          <Link to="/usuarios"   className={cls('/usuarios')}>  <IconUsers   className="icon icon--sm" /> {t.users}     </Link>
          <Link to="/ranking"    className={cls('/ranking')}>   <IconTrophy  className="icon icon--sm" /> {t.ranking}   </Link>
          <Link to="/mensagens"  className={cls('/mensagens')}> <IconMessage className="icon icon--sm" /> {t.messages}  </Link>
          {isAdmin && (
            <Link to="/admin" className={cls('/admin')} style={{ color:'var(--red)', fontWeight:700 }}>
              <IconShield className="icon icon--sm" /> Admin
            </Link>
          )}
        </nav>
        <div className="navbar__actions">
          <Link to="/novo-post" className="navbar__new">
            <IconPlus className="icon icon--sm" /><span>{t.publish}</span>
          </Link>
          <div className="navbar__user">
            <button className="navbar__trigger">
              <Avatar name={user?.name} src={user?.avatar_url} size="sm" />
              <span className="navbar__trigger-name">{user?.name?.split(' ')[0]}</span>
            </button>
            <div className="navbar__drop">
              <div className="navbar__drop-header">
                <div className="navbar__drop-name">{user?.name}</div>
                <div className="navbar__drop-email">{user?.email}</div>
              </div>
              <Link to="/perfil"        className="navbar__drop-item"><IconUser     className="icon icon--sm" /> {t.profile}</Link>
              <Link to="/configuracoes" className="navbar__drop-item"><IconSettings className="icon icon--sm" /> {t.settings}</Link>
              {isAdmin && <Link to="/admin" className="navbar__drop-item"><IconShield className="icon icon--sm" /> {t.adminPanel}</Link>}
              <button className="navbar__drop-item navbar__drop-item--red"
                onClick={() => { logout(); nav('/login'); }}>
                <IconLogout className="icon icon--sm" /> {t.logout}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
