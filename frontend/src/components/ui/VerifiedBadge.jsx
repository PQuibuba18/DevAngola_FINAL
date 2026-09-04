// VerifiedBadge.jsx
// Selo de identidade verificada — aparece no perfil próprio e público.
// Sem emojis. Sem vibe coding. Design institucional.

export default function VerifiedBadge({ size = 'sm', lang = 'pt' }) {
  const label = lang === 'en' ? 'Verified Angolan' : 'Angolano Verificado';

  const styles = {
    sm: {
      fontSize: 11,
      padding:  '2px 8px',
      gap:      4,
      iconSize: 10,
    },
    md: {
      fontSize: 13,
      padding:  '4px 12px',
      gap:      6,
      iconSize: 13,
    },
  };

  const s = styles[size] || styles.sm;

  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            s.gap,
      fontSize:       s.fontSize,
      fontWeight:     700,
      letterSpacing:  '.03em',
      padding:        s.padding,
      borderRadius:   999,
      // Verde escuro — cor de confiança, não de celebração
      background:     '#E6F4EA',
      color:          '#1A5C30',
      border:         '1px solid #B7DFBF',
      whiteSpace:     'nowrap',
      userSelect:     'none',
    }}>
      {/* Ícone SVG limpo — sem emoji */}
      <svg
        width={s.iconSize} height={s.iconSize}
        viewBox="0 0 16 16" fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Escudo com marca de verificação */}
        <path
          d="M8 1L2 3.5V8c0 3 2.5 5.5 6 6.5C14 13.5 14 11 14 8V3.5L8 1Z"
          fill="#1A5C30" fillOpacity=".15"
          stroke="#1A5C30" strokeWidth="1.2"
        />
        <path
          d="M5.5 8l2 2 3-3"
          stroke="#1A5C30" strokeWidth="1.4"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}
