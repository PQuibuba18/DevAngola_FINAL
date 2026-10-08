// Avatar.jsx — componente de avatar com tamanhos fixos e object-fit
// Nunca renderiza a imagem além do contentor definido

const SIZES = {
  xs:  { width: 24,  height: 24,  fontSize: 9,  fontWeight: 700 },
  sm:  { width: 32,  height: 32,  fontSize: 12, fontWeight: 700 },
  md:  { width: 40,  height: 40,  fontSize: 15, fontWeight: 700 },
  lg:  { width: 52,  height: 52,  fontSize: 18, fontWeight: 800 },
  xl:  { width: 72,  height: 72,  fontSize: 24, fontWeight: 800 },
  '2xl': { width: 96, height: 96, fontSize: 32, fontWeight: 800 },
};

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Paleta de cores determinística baseada no nome
const PALETTE = [
  ['#1a3a8a', '#dce8ff'],
  ['#1a5c30', '#d6f0e0'],
  ['#7b4f00', '#fff3d6'],
  ['#4a1580', '#f0e4ff'],
  ['#c41c00', '#ffe4e0'],
  ['#444444', '#f0f0f0'],
];

function colorFor(name) {
  if (!name) return PALETTE[5];
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTE[code % PALETTE.length];
}

export default function Avatar({ name, src, size = 'md', style = {} }) {
  const s   = SIZES[size] || SIZES.md;
  const [fg, bg] = colorFor(name);

  const base = {
    width:        s.width,
    height:       s.height,
    borderRadius: '50%',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,   // nunca encolhe num flex container
    overflow:     'hidden',
    userSelect:   'none',
    ...style,
  };

  if (src) {
    return (
      <div style={{ ...base, background: bg }}>
        <img
          src={src}
          alt={name || 'avatar'}
          style={{
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',     // cobre o círculo sem distorcer
            objectPosition: 'center top', // centra no rosto
            display:    'block',
            flexShrink: 0,
          }}
          onError={e => {
            // Se a imagem falhar, esconde e mostra as iniciais
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ ...base, background: bg }}>
      <span style={{
        fontSize:   s.fontSize,
        fontWeight: s.fontWeight,
        color:      fg,
        lineHeight: 1,
        fontFamily: 'var(--display, sans-serif)',
        letterSpacing: '-.01em',
      }}>
        {initials(name)}
      </span>
    </div>
  );
}
