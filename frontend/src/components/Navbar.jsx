import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import Avatar from './ui/Avatar';
import {
  IconHome, IconGrid, IconUsers, IconMessage, IconPlus,
  IconUser, IconLogout, IconSettings, IconShield, IconTrophy,
  IconBriefcase, IconSearch, IconEdit, IconAward,
} from './ui/Icons';

// Ícones SVG simples para as novas secções
function IconCode({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}
function IconZap({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function IconCalendar({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconRocket({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
    </svg>
  );
}
function IconGitBranch({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/>
    </svg>
  );
}
function IconExchange({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { t }   = useLang();
  const loc     = useLocation();
  const nav     = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function cls(path) {
    return `navbar__link${loc.pathname === path || loc.pathname.startsWith(path + '/') ? ' navbar__link--active' : ''}`;
  }

  // Agrupamento do menu em secções
  const NAV_SECTIONS = [
    {
      label: 'Comunidade',
      links: [
        { to:'/feed',       icon: IconHome,     label: t.feed || 'Feed' },
        { to:'/salas',      icon: IconGrid,     label: t.rooms || 'Salas' },
        { to:'/usuarios',   icon: IconUsers,    label: t.users || 'Utilizadores' },
        { to:'/ranking',    icon: IconTrophy,   label: t.ranking || 'Ranking' },
        { to:'/mensagens',  icon: IconMessage,  label: t.messages || 'Mensagens' },
      ],
    },
    {
      label: 'Oportunidades',
      links: [
        { to:'/vagas',      icon: IconBriefcase, label: t.jobs || 'Vagas' },
        { to:'/work',       icon: IconExchange,  label: 'Work Exchange' },
        { to:'/desafios',   icon: IconZap,       label: 'Proof Lab' },
      ],
    },
    {
      label: 'Ecossistema',
      links: [
        { to:'/questions',  icon: IconSearch,    label: 'Tech Stack Angola' },
        { to:'/eventos',    icon: IconCalendar,  label: 'Eventos' },
        { to:'/startups',   icon: IconRocket,    label: 'Startups' },
        { to:'/open-source',icon: IconGitBranch, label: 'Open Source' },
      ],
    },
  ];

  return (
    <header className="navbar">
      <div className="navbar__inner">

        {/* Logo */}
        <Link to="/feed" className="navbar__logo">
          <span className="navbar__logo-dev">Dev</span>
          <span className="navbar__logo-angola">Angola</span>
        </Link>

        {/* Nav principal — links mais usados visíveis directamente */}
        <nav className="navbar__nav">
          <Link to="/feed"      className={cls('/feed')}>
            <IconHome      className="icon icon--sm" /> {t.feed || 'Feed'}
          </Link>
          <Link to="/vagas"     className={cls('/vagas')}>
            <IconBriefcase className="icon icon--sm" /> {t.jobs || 'Vagas'}
          </Link>
          <Link to="/desafios"  className={cls('/desafios')}>
            <IconZap       className="icon icon--sm" /> Proof Lab
          </Link>
          <Link to="/questions" className={cls('/questions')}>
            <IconSearch    className="icon icon--sm" /> Tech Stack
          </Link>
          <Link to="/eventos"   className={cls('/eventos')}>
            <IconCalendar  className="icon icon--sm" /> Eventos
          </Link>
          <Link to="/startups"  className={cls('/startups')}>
            <IconRocket    className="icon icon--sm" /> Startups
          </Link>
          <Link to="/open-source" className={cls('/open-source')}>
            <IconGitBranch className="icon icon--sm" /> Open Source
          </Link>
          {isAdmin && (
            <Link to="/admin" className={cls('/admin')} style={{ color:'var(--red)', fontWeight:700 }}>
              <IconShield className="icon icon--sm" /> Admin
            </Link>
          )}
        </nav>

        {/* Acções direita */}
        <div className="navbar__actions">
          <Link to="/novo-post" className="navbar__new">
            <IconPlus className="icon icon--sm" />
            <span>{t.publish || 'Publicar'}</span>
          </Link>

          <div className="navbar__user">
            <button className="navbar__trigger" onClick={() => setMenuOpen(m => !m)}>
              <Avatar name={user?.name} src={user?.avatar_url} size="sm" />
              <span className="navbar__trigger-name">{user?.name?.split(' ')[0]}</span>
            </button>

            {menuOpen && (
              <div className="navbar__drop" onClick={() => setMenuOpen(false)}>
                <div className="navbar__drop-header">
                  <div className="navbar__drop-name">{user?.name}</div>
                  <div className="navbar__drop-email">{user?.email}</div>
                </div>
                <Link to="/perfil" className="navbar__drop-item">
                  <IconUser     className="icon icon--sm" /> {t.profile || 'Perfil'}
                </Link>
                <Link to={`/passport/${user?.id}`} className="navbar__drop-item">
                  <IconShield   className="icon icon--sm" style={{ color:'var(--red)' }} /> Passport Profissional
                </Link>
                <Link to="/work" className="navbar__drop-item">
                  <IconExchange className="icon icon--sm" /> Work Exchange
                </Link>
                <Link to="/configuracoes" className="navbar__drop-item">
                  <IconSettings className="icon icon--sm" /> {t.settings || 'Configurações'}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="navbar__drop-item">
                    <IconShield className="icon icon--sm" /> Administração
                  </Link>
                )}
                <button
                  className="navbar__drop-item navbar__drop-item--red"
                  onClick={() => { logout(); nav('/login'); }}
                >
                  <IconLogout className="icon icon--sm" /> {t.logout || 'Sair'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
