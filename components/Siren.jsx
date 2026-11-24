import { useId } from 'react';

// 직접 그린 세이렌(쌍꼬리 인어) 엠블럼. ring=true면 바깥 링에 글자를 넣는다.
export default function Siren({ size = 40, ring = false, title = '세이렌 엠블럼' }) {
  const uid = useId().replace(/:/g, '');
  const ringId = `ring-${uid}`;
  const G = '#00704a';
  const W = '#ffffff';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={title} style={{ display: 'block' }}>
      <circle cx="100" cy="100" r="100" fill={G} />
      {ring && (
        <>
          <defs>
            <path id={ringId} d="M100,100 m-81,0 a81,81 0 1,1 162,0 a81,81 0 1,1 -162,0" />
          </defs>
          <circle cx="100" cy="100" r="66" fill="none" stroke={W} strokeWidth="3" />
          <text fill={W} fontSize="20" fontWeight="700" letterSpacing="3" fontFamily="Arial, Helvetica, sans-serif">
            <textPath href={`#${ringId}`} startOffset="2%">STARBUCKS ★ TYCOON ★</textPath>
          </text>
        </>
      )}
      <g transform={ring ? 'translate(100 100) scale(0.62) translate(-100 -100)' : undefined}>
        {/* 왼쪽·오른쪽 꼬리 (오른쪽은 대칭) */}
        {[false, true].map((mirror) => (
          <g key={String(mirror)} transform={mirror ? 'translate(200 0) scale(-1 1)' : undefined}>
            <path d="M90 140 C66 160 40 146 40 112 C40 92 46 76 54 62" fill="none" stroke={W} strokeWidth="11" strokeLinecap="round" />
            <path d="M54 62 C44 56 38 44 40 34 C48 42 54 44 60 42 C62 50 66 56 74 58 C66 62 60 62 54 62 Z" fill={W} />
            {/* 꼬리 비늘 줄무늬 */}
            <path d="M44 100 L36 98 M45 116 L37 118 M52 132 L46 138" stroke={G} strokeWidth="3" strokeLinecap="round" />
            {/* 흘러내리는 머리카락 */}
            <path d="M88 78 C72 86 84 100 72 112 C62 122 74 130 66 142" fill="none" stroke={W} strokeWidth="7" strokeLinecap="round" />
            <path d="M92 86 C84 94 92 104 84 114 C78 122 86 128 82 136" fill="none" stroke={W} strokeWidth="5" strokeLinecap="round" />
            {/* 꼬리를 잡은 손 */}
            <circle cx="80" cy="136" r="6" fill={W} />
          </g>
        ))}
        {/* 몸통 */}
        <path d="M88 108 Q100 116 112 108 L110 136 Q100 142 90 136 Z" fill={W} />
        {/* 얼굴 */}
        <ellipse cx="100" cy="92" rx="13" ry="16" fill={W} />
        <path d="M93 90 q3 2.5 6 0 M101 90 q3 2.5 6 0" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M100 92 L99 98 L101 98" fill="none" stroke={G} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M96 102 q4 3 8 0" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" />
        {/* 왕관과 별 */}
        <path d="M85 77 L86 62 L93 70 L100 56 L107 70 L114 62 L115 77 Z" fill={W} />
        <path d="M100 40 l3.5 7.5 8 0.8 -6 5.4 1.8 8 -7.3 -4.2 -7.3 4.2 1.8 -8 -6 -5.4 8 -0.8 Z" fill={W} />
      </g>
    </svg>
  );
}
