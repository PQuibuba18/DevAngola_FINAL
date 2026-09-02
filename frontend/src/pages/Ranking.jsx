import { useState, useEffect } from 'react';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import { useLang } from '../context/LanguageContext';

const POSITIONS = [
  { label:'1.º', color:'#C8860A', bg:'#FEF7E0' },
  { label:'2.º', color:'#6B6B6B', bg:'#F0F0F0' },
  { label:'3.º', color:'#A0522D', bg:'#FDF0E8' },
  { label:'4.º', color:'#909090', bg:'#F5F5F5' },
  { label:'5.º', color:'#909090', bg:'#F5F5F5' },
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
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Cabeçalho limpo */}
          <div style={{ marginBottom: 'var(--s8)' }}>
            <h1 style={{
              fontFamily: 'var(--display)', fontSize: 'var(--t-2xl)',
              fontWeight: 'var(--w-black)', letterSpacing: '-.03em',
              color: 'var(--ink-900)', marginBottom: 'var(--s2)',
            }}>
              {lang === 'en' ? 'Top Developers' : 'Top Programadores'}
            </h1>
            <p style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-400)' }}>
              {lang === 'en'
                ? 'Ranked by activity: posts × 1pt + likes × 2pts'
                : 'Ordenado por actividade: posts × 1pt + gostos × 2pts'}
            </p>
          </div>

          {loading && <div className="spinner" />}

          {error && (
            <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
              {lang === 'en' ? 'Could not load ranking.' : 'Não foi possível carregar o ranking.'}
            </div>
          )}

          {!loading && !error && ranking.length === 0 && (
            <div className="card card--padded" style={{ textAlign:'center', color:'var(--ink-400)' }}>
              {lang === 'en' ? 'No data yet.' : 'Sem dados ainda.'}
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
            {ranking.map((dev, i) => {
              const pos = POSITIONS[i] || POSITIONS[4];
              return (
                <div key={dev.id} className="card" style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--s4)',
                  padding: 'var(--s4) var(--s6)',
                  borderLeft: `4px solid ${pos.color}`,
                }}>
                  {/* Posição */}
                  <div style={{
                    minWidth: 44, height: 44, borderRadius: 'var(--r-sm)',
                    background: pos.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color: pos.color }}>
                      {pos.label}
                    </span>
                  </div>

                  {/* Avatar */}
                  <Avatar name={dev.name} src={dev.avatar_url} size="md" />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--s2)', marginBottom: 4, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:'var(--w-black)', fontSize:'var(--t-base)', color:'var(--ink-900)' }}>
                        {dev.name}
                      </span>
                      {dev.badge && (
                        <span className={`seal seal--${dev.badge}`}>{dev.badge_label}</span>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)', flexWrap:'wrap' }}>
                      <Badge level={dev.level} />
                      {dev.identifier && (
                        <span style={{ fontSize:'var(--t-xs)', color:'var(--ink-400)' }}>{dev.identifier}</span>
                      )}
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div style={{ display:'flex', gap:'var(--s5)', flexShrink: 0 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-md)', color:'var(--ink-900)', lineHeight:1 }}>
                        {dev.total_posts}
                      </div>
                      <div style={{ fontSize:'var(--t-xs)', color:'var(--ink-400)', marginTop: 2 }}>
                        posts
                      </div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-md)', color:'var(--red)', lineHeight:1 }}>
                        {dev.total_likes}
                      </div>
                      <div style={{ fontSize:'var(--t-xs)', color:'var(--ink-400)', marginTop: 2 }}>
                        {lang === 'en' ? 'likes' : 'gostos'}
                      </div>
                    </div>
                    <div style={{ textAlign:'center', borderLeft:'var(--line)', paddingLeft:'var(--s5)' }}>
                      <div style={{ fontFamily:'var(--display)', fontWeight:'var(--w-black)', fontSize:'var(--t-lg)', color: pos.color, lineHeight:1 }}>
                        {dev.score}
                      </div>
                      <div style={{ fontSize:'var(--t-xs)', color:'var(--ink-400)', marginTop: 2 }}>pts</div>
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
