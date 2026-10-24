// Chapter 2 sprites: items, characters, gates, and decor of the eight locations.
// Same style as in sprites.ts: soft gradients, dark outline, highlight.

interface Def {
  w: number;
  h: number;
  body: string;
}

function gem(cx: number, top: number, w: number, h: number, a: string, b: string, stroke: string, id: string): string {
  const l = cx - w / 2;
  const r = cx + w / 2;
  return `
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <polygon points="${cx},${top} ${r},${top + h * 0.3} ${cx + w * 0.3},${top + h} ${cx - w * 0.3},${top + h} ${l},${top + h * 0.3}" fill="url(#${id})" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <polygon points="${cx},${top} ${cx + w * 0.15},${top + h * 0.3} ${cx},${top + h} ${cx - w * 0.15},${top + h * 0.3}" fill="#fff" opacity="0.3"/>`;
}

export const CH2_SPRITES = {
  // ---------- Items ----------
  light: {
    w: 48,
    h: 48,
    body: `
      <defs><radialGradient id="lo" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#FFF3A6"/><stop offset="1" stop-color="#FFB547"/></radialGradient></defs>
      <circle cx="24" cy="24" r="15" fill="url(#lo)" stroke="#E8901A" stroke-width="2.5"/>
      <path d="M24 3 V13 M24 35 V45 M3 24 H13 M35 24 H45" stroke="#FFE27A" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="19" cy="18" rx="4" ry="2.5" fill="#fff" opacity="0.9" transform="rotate(-30 19 18)"/>`,
  },
  gem: {
    w: 44,
    h: 52,
    body: gem(22, 3, 38, 46, '#FFC7F2', '#B054E8', '#7A2FB0', 'gm'),
  },
  page: {
    w: 46,
    h: 54,
    body: `
      <path d="M6 6 H34 L40 12 V48 H6 Z" fill="#FFF4DC" stroke="#B58A4A" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M34 6 V12 H40" fill="#F2D59A" stroke="#B58A4A" stroke-width="2"/>
      <path d="M12 20 H34 M12 28 H32 M12 36 H28" stroke="#C9A77C" stroke-width="3" stroke-linecap="round"/>
      <path d="M38 40 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z" fill="#FFD45C" transform="translate(-8 -2) scale(0.8)"/>`,
  },
  battery: {
    w: 36,
    h: 58,
    body: `
      <defs><linearGradient id="bt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8FF0A8"/><stop offset="1" stop-color="#2FA457"/></linearGradient></defs>
      <rect x="12" y="2" width="12" height="7" rx="2" fill="#5E6E82"/>
      <rect x="4" y="8" width="28" height="47" rx="7" fill="url(#bt)" stroke="#1F6B3A" stroke-width="2.5"/>
      <path d="M20 16 L12 33 H19 L15 47 L26 28 H19 Z" fill="#FFF7C2" stroke="#E0A51A" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="8" y="12" width="4" height="36" rx="2" fill="#fff" opacity="0.5"/>`,
  },
  pearl: {
    w: 40,
    h: 40,
    body: `
      <defs><radialGradient id="pr2" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#F3E9FF"/><stop offset="1" stop-color="#C9B6EA"/></radialGradient></defs>
      <circle cx="20" cy="20" r="16" fill="url(#pr2)" stroke="#9A86C4" stroke-width="2"/>
      <ellipse cx="14" cy="13" rx="5" ry="3" fill="#fff" transform="rotate(-30 14 13)"/>
      <ellipse cx="25" cy="27" rx="5" ry="2" fill="#FFB8E0" opacity="0.5" transform="rotate(-30 25 27)"/>`,
  },
  lens: {
    w: 50,
    h: 50,
    body: `
      <defs><radialGradient id="ln" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="1" stop-color="#9FD8FF" stop-opacity="0.8"/></radialGradient></defs>
      <circle cx="25" cy="25" r="20" fill="url(#ln)" stroke="#D9A21C" stroke-width="5"/>
      <circle cx="25" cy="25" r="20" fill="none" stroke="#FFE27A" stroke-width="1.5"/>
      <path d="M15 18 Q20 12 28 12" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  },
  shard: {
    w: 44,
    h: 64,
    body: `
      <defs><linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8FBFF"/><stop offset="0.45" stop-color="#7FE3FF"/><stop offset="1" stop-color="#6C7CFF"/></linearGradient></defs>
      <polygon points="22,2 38,22 30,62 12,58 6,20" fill="url(#sh)" stroke="#3F4FC9" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="22,2 26,22 21,60 16,22" fill="#fff" opacity="0.4"/>
      <ellipse cx="14" cy="20" rx="3" ry="6" fill="#fff" opacity="0.9" transform="rotate(25 14 20)"/>`,
  },

  // ---------- Characters and mechanisms ----------
  numlock: {
    w: 112,
    h: 160,
    body: `
      <defs><linearGradient id="nl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD3E8"/><stop offset="1" stop-color="#3C7F99"/></linearGradient></defs>
      ${gem(30, 2, 22, 30, '#E3CCFF', '#8C6CFF', '#5A49C9', 'nl1')}
      ${gem(80, 8, 18, 24, '#C9F7FF', '#4FB8E8', '#2D7F97', 'nl2')}
      <rect x="10" y="28" width="92" height="128" rx="16" fill="url(#nl)" stroke="#24546A" stroke-width="4"/>
      <rect x="20" y="40" width="72" height="34" rx="8" fill="#16303D"/>
      <text x="56" y="66" font-family="Arial Rounded MT Bold, Arial" font-size="26" font-weight="900" fill="#6FF3FF" text-anchor="middle">? ? ?</text>
      <g fill="#E8F7FF" stroke="#24546A" stroke-width="2">
        <rect x="22" y="84" width="20" height="16" rx="5"/><rect x="46" y="84" width="20" height="16" rx="5"/><rect x="70" y="84" width="20" height="16" rx="5"/>
        <rect x="22" y="106" width="20" height="16" rx="5"/><rect x="46" y="106" width="20" height="16" rx="5"/><rect x="70" y="106" width="20" height="16" rx="5"/>
      </g>
      <circle cx="56" cy="138" r="8" fill="#FFD45C" stroke="#A86B08" stroke-width="2"/>`,
  },
  penguin: {
    w: 84,
    h: 104,
    body: `
      <ellipse cx="42" cy="100" rx="30" ry="4" fill="#000" opacity="0.15"/>
      <ellipse cx="42" cy="58" rx="32" ry="40" fill="#2B3550"/>
      <ellipse cx="42" cy="66" rx="22" ry="30" fill="#FFFFFF"/>
      <ellipse cx="12" cy="62" rx="8" ry="20" fill="#2B3550" transform="rotate(20 12 62)"/>
      <ellipse cx="72" cy="62" rx="8" ry="20" fill="#2B3550" transform="rotate(-20 72 62)"/>
      <circle cx="33" cy="40" r="7" fill="#fff"/><circle cx="51" cy="40" r="7" fill="#fff"/>
      <circle cx="34" cy="41" r="3.5" fill="#1B1B2A"/><circle cx="52" cy="41" r="3.5" fill="#1B1B2A"/>
      <path d="M36 50 L48 50 L42 58 Z" fill="#FFB547"/>
      <ellipse cx="32" cy="98" rx="9" ry="4" fill="#FFB547"/><ellipse cx="52" cy="98" rx="9" ry="4" fill="#FFB547"/>
      <path d="M14 26 Q42 4 70 26 L64 30 Q42 16 20 30 Z" fill="#E0533D"/>
      <circle cx="42" cy="12" r="6" fill="#fff"/>`,
  },
  turtle: {
    w: 128,
    h: 96,
    body: `
      <defs><radialGradient id="tt" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#9FE07A"/><stop offset="1" stop-color="#3F9B4A"/></radialGradient></defs>
      <ellipse cx="22" cy="74" rx="14" ry="8" fill="#7FCB88" transform="rotate(-20 22 74)"/>
      <ellipse cx="88" cy="80" rx="14" ry="8" fill="#7FCB88" transform="rotate(20 88 80)"/>
      <ellipse cx="56" cy="56" rx="44" ry="30" fill="url(#tt)" stroke="#2F7F3B" stroke-width="3"/>
      <path d="M56 30 L70 44 L64 64 L48 64 L42 44 Z" fill="#5DBE5F" stroke="#2F7F3B" stroke-width="2"/>
      <path d="M42 44 L20 50 M70 44 L92 50 M48 64 L36 80 M64 64 L76 80" stroke="#2F7F3B" stroke-width="2"/>
      <ellipse cx="108" cy="48" rx="18" ry="15" fill="#9FE0A8" stroke="#2F7F3B" stroke-width="2.5"/>
      <circle cx="112" cy="44" r="5" fill="#fff"/><circle cx="113" cy="45" r="2.8" fill="#1B1B2A"/>
      <path d="M106 56 Q112 60 118 55" stroke="#2F7F3B" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  },
  telescope: {
    w: 150,
    h: 176,
    body: `
      <defs><linearGradient id="tl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#C98A2A"/></linearGradient></defs>
      <path d="M75 100 L40 172 M75 100 L110 172 M75 100 V172" stroke="#5A4636" stroke-width="7" stroke-linecap="round"/>
      <g transform="rotate(-28 75 90)">
        <rect x="20" y="72" width="110" height="36" rx="14" fill="url(#tl)" stroke="#8A5A1E" stroke-width="3"/>
        <rect x="118" y="66" width="24" height="48" rx="8" fill="#3E5C76" stroke="#24364A" stroke-width="3"/>
        <ellipse cx="142" cy="90" rx="5" ry="18" fill="#BFE9FF"/>
        <rect x="8" y="80" width="16" height="20" rx="5" fill="#3E5C76"/>
        <rect x="40" y="78" width="70" height="6" rx="3" fill="#fff" opacity="0.5"/>
      </g>
      <circle cx="75" cy="98" r="9" fill="#3E5C76"/>`,
  },
  bookstand: {
    w: 100,
    h: 124,
    body: `
      <rect x="44" y="60" width="12" height="58" fill="#7A4A22"/>
      <rect x="26" y="114" width="48" height="10" rx="4" fill="#5E3A1A"/>
      <path d="M8 40 L50 54 L92 40 L92 66 L50 78 L8 66 Z" fill="#9C4A3A" stroke="#5E2A1A" stroke-width="3" stroke-linejoin="round"/>
      <path d="M12 34 Q30 30 50 44 L50 70 Q30 58 12 60 Z" fill="#FFF8E6" stroke="#B58A4A" stroke-width="2"/>
      <path d="M88 34 Q70 30 50 44 L50 70 Q70 58 88 60 Z" fill="#FFF8E6" stroke="#B58A4A" stroke-width="2"/>
      <path d="M20 42 L42 50 M20 50 L42 56 M58 50 L80 42 M58 56 L80 50" stroke="#C9A77C" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="50" cy="18" r="10" fill="#FFF3A6" opacity="0.8"/>`,
  },

  // ---------- Gates ----------
  gateCrystal: {
    w: 140,
    h: 430,
    body: `
      <rect x="18" y="20" width="104" height="410" rx="24" fill="#3B2A6B" opacity="0.6"/>
      ${gem(40, 300, 50, 130, '#E3CCFF', '#8C6CFF', '#5A49C9', 'gc1')}
      ${gem(98, 260, 54, 170, '#C9F7FF', '#4FB8E8', '#2D7F97', 'gc2')}
      ${gem(68, 120, 60, 200, '#FFC7F2', '#B054E8', '#7A2FB0', 'gc3')}
      ${gem(36, 40, 44, 150, '#C9F7FF', '#4FB8E8', '#2D7F97', 'gc4')}
      ${gem(104, 10, 40, 140, '#E3CCFF', '#8C6CFF', '#5A49C9', 'gc5')}`,
  },
  gateIce: {
    w: 140,
    h: 430,
    body: `
      <defs><linearGradient id="gi" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E8FBFF"/><stop offset="0.5" stop-color="#A9E6FF"/><stop offset="1" stop-color="#6FC1E8"/></linearGradient></defs>
      <path d="M10 430 V60 L40 10 L70 40 L100 0 L130 50 V430 Z" fill="url(#gi)" stroke="#3E8DB8" stroke-width="4" stroke-linejoin="round"/>
      <path d="M30 120 L60 90 L90 130 M40 240 L80 200 L110 250 M24 340 L64 310 L100 350" stroke="#fff" stroke-width="4" fill="none" opacity="0.8"/>
      <rect x="30" y="60" width="8" height="300" rx="4" fill="#fff" opacity="0.5"/>
      <circle cx="70" cy="180" r="24" fill="#FFB547" opacity="0.35"/>
      <text x="70" y="190" font-size="28" text-anchor="middle">⚙</text>`,
  },
  gateBookcase: {
    w: 150,
    h: 430,
    body: `
      <rect x="6" y="0" width="138" height="430" rx="8" fill="#7A4A22" stroke="#4A2A12" stroke-width="5"/>
      ${[30, 110, 190, 270, 350]
        .map(
          (y, i) =>
            `<rect x="14" y="${y + 60}" width="122" height="10" fill="#5E3A1A"/>` +
            [0, 1, 2, 3, 4, 5]
              .map(
                (k) =>
                  `<rect x="${18 + k * 20}" y="${y + 6 + ((k + i) % 3) * 4}" width="16" height="${54 - ((k + i) % 3) * 4}" rx="3" fill="${['#E0533D', '#3F9BD6', '#5DBE5F', '#FFC93C', '#9B6BFF', '#FF8FB1'][(k + i) % 6]}"/>`,
              )
              .join(''),
        )
        .join('')}
      <circle cx="120" cy="230" r="8" fill="#FFD45C" stroke="#A86B08" stroke-width="2"/>`,
  },

  // ---------- Decor ----------
  windmill: {
    w: 140,
    h: 260,
    body: `
      <path d="M44 260 L56 90 H84 L96 260 Z" fill="#F2E3C8" stroke="#A8865A" stroke-width="3"/>
      <path d="M50 90 L70 60 L90 90 Z" fill="#E0533D" stroke="#9C2E1F" stroke-width="3"/>
      <rect x="62" y="200" width="16" height="60" rx="6" fill="#8B5A33"/>
      <circle cx="70" cy="140" r="9" fill="#BFE9FF" stroke="#A8865A" stroke-width="2"/>`,
  },
  windBlades: {
    w: 170,
    h: 170,
    body: `
      <g fill="#FFFFFF" stroke="#A8865A" stroke-width="3">
        <path d="M85 85 L75 8 H95 Z"/><path d="M85 85 L162 75 V95 Z"/>
        <path d="M85 85 L95 162 H75 Z"/><path d="M85 85 L8 95 V75 Z"/>
      </g>
      <circle cx="85" cy="85" r="10" fill="#8B5A33"/>`,
  },
  lighthouse: {
    w: 120,
    h: 300,
    body: `
      <path d="M30 300 L42 90 H78 L90 300 Z" fill="#FFFFFF" stroke="#7A8CA8" stroke-width="3"/>
      <path d="M38 160 L82 160 L85 200 L35 200 Z M33 240 L87 240 L89 280 L31 280 Z M41 110 H79 L80 130 H40 Z" fill="#E0533D"/>
      <rect x="36" y="56" width="48" height="36" rx="6" fill="#FFF3A6" stroke="#3E5C76" stroke-width="3"/>
      <path d="M30 56 L60 24 L90 56 Z" fill="#3E5C76"/>
      <rect x="28" y="88" width="64" height="8" rx="3" fill="#3E5C76"/>`,
  },
  coral: {
    w: 100,
    h: 90,
    body: `
      <path d="M50 90 V50 M50 60 L30 30 M50 55 L70 25 M30 30 L22 12 M30 30 L40 14 M70 25 L84 12 M70 25 L62 8" stroke="#FF7E9A" stroke-width="9" stroke-linecap="round" fill="none"/>
      <path d="M20 90 Q14 70 24 60 M80 90 Q88 70 78 58" stroke="#FFB547" stroke-width="10" stroke-linecap="round" fill="none"/>`,
  },
  seaweed: {
    w: 50,
    h: 150,
    body: `
      <path d="M18 150 C4 120 32 100 18 70 C6 44 30 26 22 4" stroke="#2F9A6B" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M34 150 C46 126 24 108 36 84 C46 62 30 50 38 30" stroke="#4FBF8A" stroke-width="8" fill="none" stroke-linecap="round"/>`,
  },
  bookshelfBg: {
    w: 220,
    h: 320,
    body: `
      <rect x="0" y="0" width="220" height="320" rx="6" fill="#6B3E22"/>
      ${[0, 1, 2, 3]
        .map(
          (r) =>
            `<rect x="8" y="${r * 78 + 70}" width="204" height="10" fill="#4A2A12"/>` +
            Array.from(
              { length: 9 },
              (_, k) =>
                `<rect x="${12 + k * 22}" y="${r * 78 + 14 + ((k * 7 + r) % 4) * 3}" width="18" height="${56 - ((k * 7 + r) % 4) * 3}" rx="2" fill="${['#C0504D', '#4F81BD', '#9BBB59', '#F2C14E', '#8064A2', '#E88AB5'][(k + r * 2) % 6]}"/>`,
            ).join(''),
        )
        .join('')}`,
  },
  floatingBook: {
    w: 80,
    h: 44,
    body: `
      <path d="M40 12 Q22 2 4 8 V38 Q22 32 40 42 Q58 32 76 38 V8 Q58 2 40 12 Z" fill="#FFF8E6" stroke="#9C4A3A" stroke-width="3" stroke-linejoin="round"/>
      <path d="M40 12 V42" stroke="#9C4A3A" stroke-width="2"/>
      <path d="M12 16 H32 M12 23 H30 M48 16 H68 M50 23 H68" stroke="#C9A77C" stroke-width="2"/>`,
  },
  snowPine: {
    w: 140,
    h: 260,
    body: `
      <rect x="62" y="200" width="16" height="60" rx="5" fill="#5A4636"/>
      <path d="M70 8 L118 92 L22 92 Z" fill="#3F8F8A"/>
      <path d="M70 52 L130 150 L10 150 Z" fill="#357F7A"/>
      <path d="M70 100 L138 210 L2 210 Z" fill="#2E726E"/>
      <path d="M70 8 L92 46 Q70 40 48 46 Z M36 92 Q70 80 104 92 L96 80 Q70 72 44 80 Z M24 150 Q70 136 116 150 L104 136 Q70 128 36 136 Z M10 210 Q70 194 130 210 L116 194 Q70 186 24 194 Z" fill="#FFFFFF"/>`,
  },
  centralCrystal: {
    w: 180,
    h: 260,
    body: `
      <rect x="40" y="214" width="100" height="46" rx="10" fill="#3E4A7A" stroke="#22284A" stroke-width="4"/>
      <rect x="54" y="200" width="72" height="20" rx="6" fill="#5A68A8"/>
      ${gem(90, 10, 110, 190, '#FFFFFF', '#7FE3FF', '#3F4FC9', 'cc')}
      <path d="M90 10 L90 200 M35 67 L145 67" stroke="#3F4FC9" stroke-width="2" opacity="0.5"/>`,
  },
} satisfies Record<string, Def>;
