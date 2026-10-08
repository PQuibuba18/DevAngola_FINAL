import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import Avatar from './ui/Avatar';

// ── Ícones SVG — apenas para bottom nav mobile e drawer ──────
function Ico({ d, d2 }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>{d2 && <path d={d2}/>}
    </svg>
  );
}
const ICONS = {
  home:      () => <Ico d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" d2="M9 22V12h6v10" />,
  briefcase: () => <Ico d="M16 20V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" d2="M2 9h20v11a2 2 0 01-2 2H4a2 2 0 01-2-2z" />,
  plus:      () => <Ico d="M12 5v14M5 12h14" />,
  compass:   () => <Ico d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" d2="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />,
  user:      () => <Ico d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" d2="M12 11a4 4 0 100-8 4 4 0 000 8z" />,
  grid:      () => <Ico d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  users:     () => <Ico d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" d2="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  trophy:    () => <Ico d="M18 2H6v7a6 6 0 0012 0V2z" d2="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />,
  msg:       () => <Ico d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  zap:       () => <Ico d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  exchange:  () => <Ico d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />,
  search:    () => <Ico d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  calendar:  () => <Ico d="M3 4h18v18H3zM16 2v4M8 2v4M3 10h18" />,
  rocket:    () => <Ico d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" d2="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />,
  git:       () => <Ico d="M6 3v12" d2="M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9" />,
  shield:    () => <Ico d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  settings:  () => <Ico d="M12 15a3 3 0 100-6 3 3 0 000 6z" d2="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />,
  logout:    () => <Ico d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
  x:         () => <Ico d="M18 6L6 18M6 6l12 12" />,
  passport:  () => <Ico d="M2 5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2z" d2="M12 11a3 3 0 100-6 3 3 0 000 6zM7 17s.5-3 5-3 5 3 5 3" />,
};

// ── Grupos do mega-menu / drawer ─────────────────────────────
const EXPLORE_GROUPS = [
  {
    label: 'Comunidade',
    color: 'var(--blue)',
    items: [
      { to:'/salas',     Icon: ICONS.grid,     label:'Salas' },
      { to:'/usuarios',  Icon: ICONS.users,    label:'Utilizadores' },
      { to:'/ranking',   Icon: ICONS.trophy,   label:'Ranking' },
      { to:'/mensagens', Icon: ICONS.msg,      label:'Mensagens' },
    ],
  },
  {
    label: 'Oportunidades',
    color: 'var(--red)',
    items: [
      { to:'/vagas',    Icon: ICONS.briefcase, label:'Vagas' },
      { to:'/work',     Icon: ICONS.exchange,  label:'Work Exchange' },
      { to:'/desafios', Icon: ICONS.zap,       label:'Proof Lab' },
    ],
  },
  {
    label: 'Ecossistema',
    color: 'var(--green)',
    items: [
      { to:'/questions',   Icon: ICONS.search,   label:'Tech Stack Angola' },
      { to:'/eventos',     Icon: ICONS.calendar, label:'Eventos' },
      { to:'/startups',    Icon: ICONS.rocket,   label:'Startups' },
      { to:'/open-source', Icon: ICONS.git,      label:'Open Source' },
    ],
  },
];

// ── Estilos base ─────────────────────────────────────────────
const NAV_H = 56;

const S = {
  header: {
    position:'fixed', top:0, left:0, right:0, zIndex:200,
    background:'var(--surface)',
    borderBottom:'1px solid var(--ink-100)',
    height: NAV_H,
  },
  inner: {
    maxWidth:1200, margin:'0 auto', height:'100%',
    display:'flex', alignItems:'center',
    padding:'0 var(--s5)', gap:'var(--s1)',
  },
  logo: {
    textDecoration:'none', display:'flex',
    alignItems:'baseline', gap:1, marginRight:'var(--s4)',
    flexShrink:0,
  },
  logoDev:    { fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-xl)', color:'var(--ink-900)' },
  logoAngola: { fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-xl)', color:'var(--red)' },
  spacer: { flex:1 },
  publishBtn: {
    display:'flex', alignItems:'center', gap:'var(--s2)',
    background:'var(--red)', color:'var(--white)',
    padding:'7px 16px', borderRadius:'var(--r-sm)',
    fontSize:'var(--t-sm)', fontWeight:'var(--w-bold)',
    textDecoration:'none', whiteSpace:'nowrap', flexShrink:0,
  },
  avatarBtn: {
    display:'flex', alignItems:'center', gap:'var(--s2)',
    background:'none', border:'1.5px solid var(--ink-100)',
    borderRadius:'var(--r-full)', padding:'4px 12px 4px 4px',
    cursor:'pointer', flexShrink:0,
  },
  avatarName: {
    fontSize:'var(--t-sm)', fontWeight:'var(--w-bold)',
    color:'var(--ink-900)', maxWidth:80,
    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
  },
  dropMenu: {
    position:'absolute', top:'calc(100% + 8px)', right:0,
    background:'var(--surface)', border:'1px solid var(--ink-100)',
    borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-lg)',
    minWidth:220, zIndex:300, overflow:'hidden',
  },
  dropHeader: {
    padding:'var(--s4) var(--s4) var(--s3)',
    borderBottom:'1px solid var(--ink-100)',
  },
  dropName:  { fontWeight:'var(--w-bold)', fontSize:'var(--t-sm)', color:'var(--ink-900)' },
  dropEmail: { fontSize:'var(--t-xs)', color:'var(--ink-400)', marginTop:2 },
};

function NavLink({ to, label, isActive }) {
  return (
    <Link to={to} style={{
      display:'flex', alignItems:'center',
      fontSize:'var(--t-sm)', fontWeight:'var(--w-bold)',
      padding:'6px 10px', borderRadius:'var(--r-sm)',
      textDecoration:'none', whiteSpace:'nowrap',
      color: isActive ? 'var(--red)' : 'var(--ink-600)',
      background: isActive ? 'var(--red-soft)' : 'none',
      transition:'background var(--t-fast), color var(--t-fast)',
    }}>
      {label}
    </Link>
  );
}

function DropItem({ to, Icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:'var(--s3)',
      padding:'10px var(--s4)', textDecoration:'none',
      fontSize:'var(--t-sm)', fontWeight:'var(--w-medium)',
      color:'var(--ink-700)',
      borderBottom:'1px solid var(--ink-50)',
      transition:'background var(--t-fast)',
    }}
      onMouseEnter={e => e.currentTarget.style.background='var(--ink-50)'}
      onMouseLeave={e => e.currentTarget.style.background='none'}
    >
      <span style={{ color:'var(--ink-400)', display:'flex', flexShrink:0 }}><Icon /></span>
      {label}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { t }    = useLang();
  const loc      = useLocation();
  const nav      = useNavigate();

  const [exploreOpen,      setExploreOpen]      = useState(false);
  const [userDropDesktop, setUserDropDesktop] = useState(false); // só desktop
  const [userDropMobile,  setUserDropMobile]  = useState(false); // só mobile
  const [drawerOpen,      setDrawerOpen]      = useState(false);

  const exploreRef = useRef(null);
  const userRef    = useRef(null);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function h(e) {
      if (exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false);
      if (userRef.current    && !userRef.current.contains(e.target))    setUserDropDesktop(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Fecha tudo na navegação
  useEffect(() => {
    setExploreOpen(false);
    setUserDropDesktop(false);
    setUserDropMobile(false);
    setDrawerOpen(false);
  }, [loc.pathname]);

  function active(path) {
    return loc.pathname === path || loc.pathname.startsWith(path + '/');
  }

  const exploreActive = EXPLORE_GROUPS.some(g => g.items.some(i => active(i.to)));

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          HEADER — partilhado desktop e mobile
          Em mobile: só logo + publicar + avatar (sem os links nav)
      ══════════════════════════════════════════════════════ */}
      <header style={S.header}>
        <div style={S.inner}>

          {/* Logo */}
          <Link to="/feed" style={S.logo}>
            <span style={S.logoDev}>Dev</span>
            <span style={S.logoAngola}>Angola</span>
          </Link>

          {/* ── Links desktop — escondidos em mobile via CSS ── */}
          <nav className="nav-desktop">
            <NavLink to="/feed" label="Feed" isActive={active('/feed')} />

            {/* Explorar com mega-menu */}
            <div ref={exploreRef} style={{ position:'relative' }}>
              <button
                onClick={() => setExploreOpen(o => !o)}
                style={{
                  display:'flex', alignItems:'center', gap:'var(--s1)',
                  fontSize:'var(--t-sm)', fontWeight:'var(--w-bold)',
                  padding:'6px 10px', borderRadius:'var(--r-sm)',
                  background: exploreOpen || exploreActive ? 'var(--ink-50)' : 'none',
                  border:'none', cursor:'pointer',
                  color: exploreActive ? 'var(--red)' : 'var(--ink-600)',
                  whiteSpace:'nowrap',
                  transition:'background var(--t-fast)',
                }}
              >
                Explorar
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d={exploreOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
                </svg>
              </button>

              {exploreOpen && (
                <div style={{
                  position:'absolute', top:'calc(100% + 8px)', left:0,
                  background:'var(--surface)', border:'1px solid var(--ink-100)',
                  borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-lg)',
                  padding:'var(--s5)', zIndex:300,
                  display:'grid', gridTemplateColumns:'repeat(3, 176px)',
                  gap:'var(--s6)',
                }}>
                  {EXPLORE_GROUPS.map(group => (
                    <div key={group.label}>
                      <div style={{
                        fontSize:'var(--t-xs)', fontWeight:'var(--w-black)',
                        letterSpacing:'.10em', textTransform:'uppercase',
                        color: group.color, marginBottom:'var(--s3)',
                      }}>
                        {group.label}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        {group.items.map(item => (
                          <Link key={item.to} to={item.to}
                            style={{
                              display:'flex', alignItems:'center', gap:'var(--s3)',
                              padding:'7px var(--s2)', borderRadius:'var(--r-sm)',
                              textDecoration:'none',
                              fontSize:'var(--t-sm)', fontWeight:'var(--w-medium)',
                              color: active(item.to) ? 'var(--red)' : 'var(--ink-700)',
                              background: active(item.to) ? 'var(--red-soft)' : 'none',
                              transition:'background var(--t-fast)',
                            }}
                            onMouseEnter={e => { if (!active(item.to)) e.currentTarget.style.background = 'var(--ink-50)'; }}
                            onMouseLeave={e => { if (!active(item.to)) e.currentTarget.style.background = active(item.to) ? 'var(--red-soft)' : 'none'; }}
                          >
                            <span style={{ color: group.color, opacity:.8, display:'flex', flexShrink:0 }}>
                              <item.Icon />
                            </span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <NavLink to="/admin" label="Admin" isActive={active('/admin')} />
            )}
          </nav>

          <div style={S.spacer} />

          {/* Publicar */}
          <Link to="/novo-post" style={S.publishBtn}>
            + Publicar
          </Link>

          {/* Avatar + dropdown */}
          <div ref={userRef} style={{ position:'relative' }}>
            <button style={S.avatarBtn} onClick={() => setUserDropDesktop(o => !o)}>
              <Avatar name={user?.name} src={user?.avatar_url} size="sm" />
              <span style={S.avatarName}>{user?.name?.split(' ')[0]}</span>
            </button>

            {userDropDesktop && (
              <div style={S.dropMenu}>
                <div style={S.dropHeader}>
                  <div style={S.dropName}>{user?.name}</div>
                  <div style={S.dropEmail}>{user?.email}</div>
                </div>

                <DropItem to="/perfil"               Icon={ICONS.user}     label={t.profile || 'O Meu Perfil'} />
                <DropItem to={`/passport/${user?.id}`} Icon={ICONS.passport} label="Passport Profissional" />
                <DropItem to="/mensagens"             Icon={ICONS.msg}      label="Mensagens" />
                <DropItem to="/configuracoes"         Icon={ICONS.settings} label={t.settings || 'Configurações'} />

                {isAdmin && (
                  <DropItem to="/admin" Icon={ICONS.shield} label="Administração" />
                )}

                <button
                  onClick={() => { logout(); nav('/login'); }}
                  style={{
                    display:'flex', alignItems:'center', gap:'var(--s3)',
                    width:'100%', padding:'10px var(--s4)',
                    background:'none', border:'none', cursor:'pointer',
                    fontSize:'var(--t-sm)', fontWeight:'var(--w-medium)',
                    color:'var(--red)', textAlign:'left',
                    transition:'background var(--t-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--red-soft)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <span style={{ display:'flex', flexShrink:0 }}><ICONS.logout /></span>
                  {t.logout || 'Sair'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          BOTTOM NAV — apenas mobile
      ══════════════════════════════════════════════════════ */}
      <nav className="bottom-nav">
        {/* Feed */}
        <Link to="/feed" className={`bnav-item${active('/feed') ? ' bnav-item--active' : ''}`}>
          <ICONS.home />
          <span>Feed</span>
        </Link>

        {/* Vagas */}
        <Link to="/vagas" className={`bnav-item${active('/vagas') ? ' bnav-item--active' : ''}`}>
          <ICONS.briefcase />
          <span>Vagas</span>
        </Link>

        {/* Publicar — botão central */}
        <Link to="/novo-post" className="bnav-publish">
          <div className="bnav-publish__circle">
            <ICONS.plus />
          </div>
        </Link>

        {/* Explorar — abre drawer */}
        <button
          className={`bnav-item${drawerOpen || exploreActive ? ' bnav-item--active' : ''}`}
          onClick={() => setDrawerOpen(true)}
        >
          <ICONS.compass />
          <span>Explorar</span>
        </button>

        {/* Perfil */}
        <button
          className={`bnav-item${active('/perfil') || active(`/passport/${user?.id}`) ? ' bnav-item--active' : ''}`}
          onClick={() => setUserDropMobile(o => !o)}
        >
          <Avatar name={user?.name} src={user?.avatar_url} size="xs" />
          <span>Perfil</span>
        </button>
      </nav>

      {/* ── User dropdown mobile ── */}
      {userDropMobile && (
        <div className="mobile-overlay" onClick={() => setUserDropMobile(false)}>
          <div className="mobile-drop" onClick={e => e.stopPropagation()}>
            <div style={{ padding:'var(--s3) var(--s4)', borderBottom:'1px solid var(--ink-100)' }}>
              <div style={S.dropName}>{user?.name}</div>
              <div style={S.dropEmail}>{user?.email}</div>
            </div>
            {[
              { to:'/perfil',               label:'O Meu Perfil' },
              { to:`/passport/${user?.id}`,  label:'Passport' },
              { to:'/mensagens',             label:'Mensagens' },
              { to:'/configuracoes',         label:'Configurações' },
            ].map(item => (
              <Link key={item.to} to={item.to} onClick={() => setUserDropMobile(false)}
                onClick={() => setUserDropMobile(false)}
              style={{ display:'block', padding:'10px var(--s4)', textDecoration:'none', fontSize:'var(--t-sm)', fontWeight:'var(--w-medium)', color:'var(--ink-700)', borderBottom:'1px solid var(--ink-50)' }}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    )}

      {/* ══════════════════════════════════════════════════════
          DRAWER mobile — Explorar
      ══════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer">
            <div className="drawer__handle-bar" />

            <div className="drawer__header">
              <span className="drawer__title">Explorar</span>
              <button className="drawer__close" onClick={() => setDrawerOpen(false)}>
                <ICONS.x />
              </button>
            </div>

            {EXPLORE_GROUPS.map(group => (
              <div key={group.label} className="drawer__group">
                <div className="drawer__group-label" style={{ color: group.color }}>
                  {group.label}
                </div>
                <div className="drawer__group-items">
                  {group.items.map(item => (
                    <Link key={item.to} to={item.to}
                      onClick={() => setDrawerOpen(false)}
                      className={`drawer__item${active(item.to) ? ' drawer__item--active' : ''}`}
                    >
                      <span style={{ color: group.color, display:'flex', flexShrink:0 }}><item.Icon /></span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="drawer__footer">
              {isAdmin && (
                <Link to="/admin" onClick={() => setDrawerOpen(false)} className="drawer__item">
                  <span style={{ display:'flex' }}><ICONS.shield /></span> Administração
                </Link>
              )}
              <Link to="/configuracoes" onClick={() => setDrawerOpen(false)} className="drawer__item">
                <span style={{ display:'flex' }}><ICONS.settings /></span> Configurações
              </Link>
              <button onClick={() => { logout(); nav('/login'); setDrawerOpen(false); }}
                className="drawer__item drawer__item--red">
                <span style={{ display:'flex' }}><ICONS.logout /></span> Sair
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── CSS embutido ── */}
      <style>{`
        /* Desktop nav */
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        /* Bottom nav */
        .bottom-nav {
          display: none;
        }
        .bnav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          flex: 1;
          padding: 6px 0;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--ink-400);
          font-size: 10px;
          font-weight: 700;
          font-family: inherit;
          transition: color var(--t-fast);
        }
        .bnav-item--active { color: var(--red); }
        .bnav-item span { font-size: 10px; font-weight: 700; }
        .bnav-publish {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          text-decoration: none;
        }
        .bnav-publish__circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--red);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(196,28,0,.35);
          color: white;
        }

        /* Drawer mobile */
        .drawer-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,.45);
          backdrop-filter: blur(2px);
        }
        .drawer {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 301;
          background: var(--surface);
          border-radius: 16px 16px 0 0;
          padding-bottom: 70px;
          max-height: 88vh;
          overflow-y: auto;
          animation: slideUp 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .drawer__handle-bar {
          width: 36px; height: 4px;
          border-radius: 9999px;
          background: var(--ink-200);
          margin: 12px auto 4px;
        }
        .drawer__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px var(--s5) var(--s4);
        }
        .drawer__title {
          font-family: var(--display);
          font-size: var(--t-xl);
          font-weight: var(--w-black);
          color: var(--ink-900);
        }
        .drawer__close {
          background: none; border: none;
          cursor: pointer; color: var(--ink-400);
          display: flex;
        }
        .drawer__group { margin-bottom: var(--s5); }
        .drawer__group-label {
          font-size: var(--t-xs);
          font-weight: var(--w-black);
          letter-spacing: .10em;
          text-transform: uppercase;
          padding: 0 var(--s5);
          margin-bottom: var(--s2);
        }
        .drawer__group-items {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          padding: 0 var(--s3);
        }
        .drawer__item {
          display: flex;
          align-items: center;
          gap: var(--s3);
          padding: 12px var(--s3);
          border-radius: var(--r-md);
          text-decoration: none;
          font-size: var(--t-sm);
          font-weight: var(--w-medium);
          color: var(--ink-800);
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          width: 100%;
          text-align: left;
          transition: background var(--t-fast);
        }
        .drawer__item--active { color: var(--red); background: var(--red-soft); }
        .drawer__item--red    { color: var(--red); }
        .drawer__footer {
          padding: var(--s3) var(--s3) 0;
          border-top: var(--line);
          margin-top: var(--s3);
        }

        /* User dropdown mobile */
        .mobile-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,.3);
        }
        .mobile-drop {
          position: absolute;
          bottom: 70px; right: 12px;
          background: var(--surface);
          border-radius: var(--r-lg);
          border: var(--line);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          min-width: 200px;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* Breakpoints */
        @media (max-width: 768px) {
          .nav-desktop  { display: none !important; }
          .bottom-nav   {
            display: flex !important;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 200;
            background: var(--surface);
            border-top: var(--line);
            height: 60px;
            align-items: stretch;
          }
          .page-body    { padding-bottom: 70px; }
        }
        @media (min-width: 769px) {
          .bottom-nav    { display: none !important; }
          .mobile-overlay{ display: none !important; }
          .drawer-overlay{ display: none !important; }
          .drawer        { display: none !important; }
        }
      `}</style>
    </>
  );
}
