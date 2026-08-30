
const API = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api','');

function initials(name='') {
  return name.trim().split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() || '?';
}

export default function Avatar({ name, src, size='md', className='' }) {
  const url = src ? (src.startsWith('http') ? src : `${API}${src}`) : null;
  return (
    <div className={`avatar avatar--${size} ${className}`} title={name}>
      {url
        ? <img src={url} alt={name} onError={e=>{e.target.style.display='none';}} />
        : initials(name)
      }
    </div>
  );
}
