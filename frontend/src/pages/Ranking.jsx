import { useState, useEffect } from 'react';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import { useLang } from '../context/LanguageContext';

const POSITIONS = [
  { label:'1.º', textColor:'var(--amber-mid)', bgColor:'var(--amber-soft)', borderColor:'var(--amber-mid)' },
  { label:'2.º', textColor:'var(--ink-500)',   bgColor:'var(--ink-100)',    borderColor:'var(--ink-300)'   },
  { label:'3.º', textColor:'var(--amber)',      bgColor:'var(--amber-soft)', borderColor:'var(--amber)'     },
  { label:'4.º', textColor:'var(--ink-400)',   bgColor:'var(--ink-50)',     borderColor:'var(--ink-200)'   },
  { label:'5.º', textColor:'var(--ink-400)',   bgColor:'var(--ink-50)',     borderColor:'var(--ink-200)'   },
];

export default function Ranking() {
  const { lang }              = useLang();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    api.get('/ranking')
      .then(r => setRanking(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="page-container">

          <div className="page-header">
            <div className="page-header__text">
              <h1 className="page-header__title">
                {lang === 'en' ? 'Top Developers' : 'Top Programadores'}
              </h1>
              <p className="page-header__sub">
                {lang === 'en'
                  ? 'Ranked by activity: posts × 1pt + likes × 2pts'
                  : 'Ordenado por actividade: posts × 1pt + gostos × 2pts'}
              </p>
            </div>
          </div>

          {loading && <div className="spinner" />}

          {error && (
            <div className="card card--padded">
              {lang === 'en' ? 'Could not load ranking.' : 'Não foi possível carregar o ranking.'}
            </div>
          )}

          {!loading && !error && ranking.length === 0 && (
            <div className="card card--padded">
              {lang === 'en' ? 'No data yet.' : 'Sem dados ainda.'}
            </div>
          )}

          <div className="stack--sm">
            {ranking.map((dev, i) => {
              const pos = POSITIONS[i] || POSITIONS[4];
              return (
                <div key={dev.id} className="card card--accent-left card__body--lg"
                  style={{ borderLeftColor: pos.borderColor }}>
                  <div className="row" style={{ alignItems:'center', gap:'var(--s4)' }}>

                    {/* Posição */}
                    <div style={{
                      minWidth:44, height:44, borderRadius:'var(--r-sm)',
                      background: pos.bgColor, display:'flex',
                      alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      <span style={{
                        fontFamily:'var(--display)', fontWeight:'var(--w-black)',
                        fontSize:'var(--t-base)', color: pos.textColor,
                      }}>
                        {pos.label}
                      </span>
                    </div>

                    {/* Avatar */}
                    <Avatar name={dev.name} src={dev.avatar_url} size="md" />

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="row--wrap" style={{ marginBottom:'var(--s1)' }}>
                        <span className="heading-sm">{dev.name}</span>
                        {dev.badge && (
                          <span className={`seal seal--${dev.badge}`}>{dev.badge_label}</span>
                        )}
                      </div>
                      <div className="row--wrap">
                        <Badge level={dev.level} />
                        {dev.identifier && (
                          <span className="caption">{dev.identifier}</span>
                        )}
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="row" style={{ gap:'var(--s5)', flexShrink:0 }}>
                      <div className="stat-block">
                        <span className="stat-block__value" style={{ fontSize:'var(--t-md)' }}>
                          {dev.total_posts}
                        </span>
                        <span className="stat-block__label">posts</span>
                      </div>
                      <div className="stat-block">
                        <span className="stat-block__value" style={{ fontSize:'var(--t-md)', color:'var(--red)' }}>
                          {dev.total_likes}
                        </span>
                        <span className="stat-block__label">
                          {lang === 'en' ? 'likes' : 'gostos'}
                        </span>
                      </div>
                      <div className="stat-block" style={{ paddingLeft:'var(--s5)', borderLeft:'var(--line)' }}>
                        <span className="stat-block__value" style={{ fontSize:'var(--t-lg)', color: pos.textColor }}>
                          {dev.score}
                        </span>
                        <span className="stat-block__label">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div></div>
    </div>
  );
}
