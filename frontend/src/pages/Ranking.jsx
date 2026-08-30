import { useState, useEffect } from 'react';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import { useLang } from '../context/LanguageContext';
import { IconTrophy, IconHeart, IconHome } from '../components/ui/Icons';

const PODIUM = [
  { medal: '🥇', colorClass: 'rank-pos--gold',   label: '1.º' },
  { medal: '🥈', colorClass: 'rank-pos--silver', label: '2.º' },
  { medal: '🥉', colorClass: 'rank-pos--bronze', label: '3.º' },
  { medal: null,  colorClass: 'rank-pos--default', label: '4.º' },
  { medal: null,  colorClass: 'rank-pos--default', label: '5.º' },
];

function TrophyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 32c-7.18 0-13-5.82-13-13V10h26v9c0 7.18-5.82 13-13 13Z" fill="#F5D060" stroke="#C8860A" strokeWidth="1.5"/>
      <path d="M11 14H7a4 4 0 0 0 4 4v-4ZM37 14h4a4 4 0 0 1-4 4v-4Z" fill="#F5D060" stroke="#C8860A" strokeWidth="1.5"/>
      <rect x="19" y="32" width="10" height="6" rx="1" fill="#C8860A"/>
      <rect x="15" y="38" width="18" height="3" rx="1.5" fill="#C8860A"/>
    </svg>
  );
}

export default function Ranking() {
  const { t, lang }           = useLang();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    api.get('/ranking')
      .then(r => setRanking(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const top3    = ranking.slice(0, 3);
  const rest    = ranking.slice(3);

  return (
    <div className="page">
      <Navbar />
      <div className="page-body">
        <div className="page-inner">
          <div className="rank-wrap">

            {/* ── Header ── */}
            <div className="rank-header">
              <div className="rank-header__trophy"><TrophyIcon /></div>
              <div className="rank-header__text">
                <h1 className="rank-header__title">{t.rankingTitle || 'Top 5 Developers'}</h1>
                <p  className="rank-header__sub">{t.rankingSubtitle || 'Os melhores da comunidade DevAngola'}</p>
              </div>
            </div>

            {/* ── Fórmula ── */}
            <div className="rank-formula card">
              <span className="rank-formula__label">{lang==='en'?'Score formula:':'Fórmula de pontuação:'}</span>
              <div className="rank-formula__eq">
                <span className="rank-formula__item rank-formula__item--posts">
                  <IconHome className="icon icon--sm" /> Posts × 1pt
                </span>
                <span className="rank-formula__plus">+</span>
                <span className="rank-formula__item rank-formula__item--likes">
                  <IconHeart className="icon icon--sm" /> {lang==='en'?'Likes':'Gostos'} × 2pts
                </span>
              </div>
            </div>

            {loading && <div className="spinner" style={{ margin: '3rem auto' }} />}

            {error && (
              <div className="rank-error card">
                <p>{lang==='en'?'Failed to load ranking. Try refreshing.':'Erro ao carregar o ranking. Tenta atualizar a página.'}</p>
              </div>
            )}

            {!loading && !error && ranking.length === 0 && (
              <div className="rank-empty card">
                <TrophyIcon />
                <p>{lang==='en'?'No developers in the ranking yet.':'Ainda não há developers no ranking.'}</p>
              </div>
            )}

            {/* ── Pódio (top 3) ── */}
            {!loading && top3.length > 0 && (
              <div className="rank-podium">
                {/* Reordenação visual: 2.º | 1.º | 3.º */}
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((dev, visualIdx) => {
                  const realIdx  = ranking.indexOf(dev);
                  const pd       = PODIUM[realIdx];
                  const isFst    = realIdx === 0;
                  return (
                    <div key={dev.id}
                      className={`rank-podium__item ${isFst ? 'rank-podium__item--first' : ''} ${visualIdx===1 ? 'rank-podium__item--center' : ''}`}>
                      <div className="rank-podium__medal">{pd.medal}</div>
                      <div className={`rank-podium__avatar-wrap ${isFst ? 'rank-podium__avatar-wrap--first' : ''}`}>
                        <Avatar name={dev.name} src={dev.avatar_url} size={isFst ? 'xl' : 'lg'} />
                        <div className={`rank-podium__pos ${pd.colorClass}`}>{pd.label}</div>
                      </div>
                      <div className="rank-podium__name">{dev.name}</div>
                      <div className="rank-podium__meta">
                        <Badge level={dev.level} lang={lang} />
                        {dev.badge && <span className={`seal seal--${dev.badge}`}>{dev.badge_label}</span>}
                      </div>
                      <div className={`rank-podium__score ${isFst ? 'rank-podium__score--first' : ''}`}>
                        {dev.score} <small>{lang==='en'?'pts':'pts'}</small>
                      </div>
                      <div className="rank-podium__mini-stats">
                        <span><IconHome  className="icon icon--sm" /> {dev.total_posts}</span>
                        <span><IconHeart className="icon icon--sm" /> {dev.total_likes}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Lista (4.º e 5.º) ── */}
            {!loading && rest.length > 0 && (
              <div className="rank-list">
                {rest.map((dev, i) => {
                  const realIdx = i + 3;
                  const pd      = PODIUM[realIdx];
                  return (
                    <div key={dev.id} className="rank-row card">
                      <div className={`rank-row__pos ${pd.colorClass}`}>{pd.label}</div>
                      <Avatar name={dev.name} src={dev.avatar_url} size="md" />
                      <div className="rank-row__info">
                        <div className="rank-row__name">{dev.name}</div>
                        <div className="rank-row__meta">
                          <Badge level={dev.level} lang={lang} />
                          {dev.badge && <span className={`seal seal--${dev.badge}`}>{dev.badge_label}</span>}
                          {dev.identifier && <span className="rank-row__id">{dev.identifier}</span>}
                        </div>
                      </div>
                      <div className="rank-row__stats">
                        <span className="rank-row__stat">
                          <IconHome  className="icon icon--sm" />
                          <strong>{dev.total_posts}</strong>
                          <small>{t.posts || 'posts'}</small>
                        </span>
                        <span className="rank-row__stat">
                          <IconHeart className="icon icon--sm" />
                          <strong>{dev.total_likes}</strong>
                          <small>{t.likes || 'gostos'}</small>
                        </span>
                        <span className="rank-row__score">
                          <strong>{dev.score}</strong>
                          <small>pts</small>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Nota ── */}
            {!loading && ranking.length > 0 && (
              <p className="rank-note">
                {lang==='en'
                  ? '★ Ranking updates automatically as posts are published and likes are given. Only the top 5 are shown.'
                  : '★ O ranking actualiza automaticamente à medida que posts são publicados e gostos dados. Apenas o top 5 é exibido.'}
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
