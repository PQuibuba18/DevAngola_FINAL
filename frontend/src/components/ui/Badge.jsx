// Badge de nível — usa tradução se lang for passado
const LABELS = {
  pt: { iniciante:'Iniciante', junior:'Júnior', pleno:'Pleno', senior:'Sénior' },
  en: { iniciante:'Beginner',  junior:'Junior',  pleno:'Mid-level', senior:'Senior' },
};
export default function Badge({ level, lang = 'pt' }) {
  const label = (LABELS[lang] || LABELS.pt)[level] || level;
  return <span className={`badge badge--${level}`}>{label}</span>;
}
