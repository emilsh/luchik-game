import { CH2_SPRITES } from './sprites2';

// Оригинальные SVG-спрайты Lamp Quest. Используются и в Phaser (растеризуются
// в текстуры), и в React (как <img>). Каждый спрайт — внутренняя разметка + размер.

export interface SpriteDef {
  w: number;
  h: number;
  body: string;
}

const LAMP_ARM = '#3E5C76';
const LAMP_ARM_LIGHT = '#7FA3C2';

// Абажур Лучика без глаз (глаза рисуются отдельно, чтобы моргать и смотреть).
// Точка крепления шеи — (18, 40).
const HEAD_BODY = `
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFC75F"/>
      <stop offset="0.55" stop-color="#FF8A3D"/>
      <stop offset="1" stop-color="#E5582A"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.4" cy="0.5" r="0.7">
      <stop offset="0" stop-color="#FFFFF0"/>
      <stop offset="0.6" stop-color="#FFF1A6"/>
      <stop offset="1" stop-color="#FFC94A"/>
    </radialGradient>
  </defs>
  <path d="M22 13 C6 15 4 49 22 51 L66 60 C76 52 76 14 66 6 Z" fill="url(#shade)" stroke="#C4461F" stroke-width="2.5" stroke-linejoin="round"/>
  <ellipse cx="67" cy="33" rx="7" ry="26" fill="url(#glow)" stroke="#D9622B" stroke-width="2.5"/>
  <ellipse cx="66" cy="33" rx="3.5" ry="15" fill="#FFFFFF" opacity="0.85"/>
  <path d="M24 16 C34 12 46 10 58 9" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.55" fill="none"/>
  <ellipse cx="44" cy="44" rx="5.5" ry="3" fill="#FF5E7E" opacity="0.45"/>
  <circle cx="18" cy="40" r="6" fill="#2D4A60"/>
  <circle cx="18" cy="40" r="2.5" fill="#9FB7CC"/>
`;

const EYES_SVG = `
  <circle cx="36" cy="30" r="7.5" fill="#FFFFFF" stroke="#4A2A1A" stroke-width="1.5"/>
  <circle cx="50" cy="28" r="8" fill="#FFFFFF" stroke="#4A2A1A" stroke-width="1.5"/>
  <circle cx="38.5" cy="30.5" r="4" fill="#2B2440"/>
  <circle cx="52.5" cy="28.5" r="4.2" fill="#2B2440"/>
  <circle cx="39.8" cy="29" r="1.5" fill="#FFFFFF"/>
  <circle cx="53.8" cy="27" r="1.6" fill="#FFFFFF"/>
  <path d="M40 42 Q44 46 48 42" stroke="#4A2A1A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
`;

const BASE_BODY = `
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5FD0D6"/>
      <stop offset="1" stop-color="#2D7F97"/>
    </linearGradient>
  </defs>
  <path d="M4 24 C6 7 64 7 66 24 Z" fill="url(#base)" stroke="#1F5A70" stroke-width="2"/>
  <rect x="1" y="21" width="68" height="7" rx="3.5" fill="#24607A"/>
  <ellipse cx="24" cy="14" rx="10" ry="3" fill="#FFFFFF" opacity="0.4"/>
  <circle cx="52" cy="17" r="2.6" fill="#FFE26B"/>
  <circle cx="35" cy="9" r="5" fill="#2D4A60"/>
  <circle cx="35" cy="9" r="2" fill="#9FB7CC"/>
`;

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? outer : inner;
    const a = ((-90 + 36 * k) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

function gearTeeth(cx: number, cy: number, n: number, rIn: number, tw: number, th: number, fill: string): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `<rect x="${cx - tw / 2}" y="${cy - rIn - th + 2}" width="${tw}" height="${th}" rx="2" fill="${fill}" transform="rotate(${(360 / n) * i} ${cx} ${cy})"/>`;
  }
  return out;
}

export const SPRITES = {
  lampHead: { w: 80, h: 64, body: HEAD_BODY },
  lampBase: { w: 70, h: 28, body: BASE_BODY },

  /** Цельная лампа для меню и экранов интерфейса. */
  lampFull: {
    w: 150,
    h: 160,
    body: `
      <ellipse cx="70" cy="155" rx="44" ry="5" fill="#000" opacity="0.15"/>
      <g transform="translate(35 128)">${BASE_BODY}</g>
      <path d="M70 137 L54 96 L86 62" stroke="${LAMP_ARM}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M70 137 L54 96 L86 62" stroke="${LAMP_ARM_LIGHT}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(-1.5 -1)"/>
      <circle cx="54" cy="96" r="6.5" fill="#2D4A60"/>
      <circle cx="54" cy="96" r="2.5" fill="#9FB7CC"/>
      <g transform="translate(68 22) rotate(10 18 40)">${HEAD_BODY}${EYES_SVG}</g>
    `,
  },

  star: {
    w: 48,
    h: 48,
    body: `
      <defs>
        <radialGradient id="sg" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stop-color="#FFFBD0"/>
          <stop offset="0.5" stop-color="#FFD84A"/>
          <stop offset="1" stop-color="#F5A623"/>
        </radialGradient>
      </defs>
      <polygon points="${starPoints(24, 25.5, 21, 10)}" fill="url(#sg)" stroke="#E08A12" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="20" cy="25" rx="1.8" ry="2.6" fill="#7A4A12"/>
      <ellipse cx="28" cy="25" rx="1.8" ry="2.6" fill="#7A4A12"/>
      <path d="M21 30 Q24 33 27 30" stroke="#7A4A12" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="18" cy="17" rx="4" ry="2" fill="#FFFFFF" opacity="0.7" transform="rotate(-30 18 17)"/>
    `,
  },

  key: {
    w: 76,
    h: 40,
    body: `
      <defs>
        <linearGradient id="kg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFF0A0"/>
          <stop offset="0.5" stop-color="#FFC93C"/>
          <stop offset="1" stop-color="#E09A12"/>
        </linearGradient>
      </defs>
      <rect x="26" y="15" width="44" height="10" rx="4" fill="url(#kg)" stroke="#A86B08" stroke-width="2"/>
      <rect x="52" y="22" width="7" height="12" rx="2" fill="url(#kg)" stroke="#A86B08" stroke-width="2"/>
      <rect x="62" y="22" width="7" height="9" rx="2" fill="url(#kg)" stroke="#A86B08" stroke-width="2"/>
      <circle cx="18" cy="20" r="14" fill="url(#kg)" stroke="#A86B08" stroke-width="2"/>
      <circle cx="18" cy="20" r="6" fill="#FFF6D5" stroke="#A86B08" stroke-width="2"/>
      <ellipse cx="12" cy="12" rx="4" ry="2" fill="#FFFFFF" opacity="0.8" transform="rotate(-35 12 12)"/>
    `,
  },

  gear: {
    w: 52,
    h: 52,
    body: `
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#E6EEF6"/>
          <stop offset="1" stop-color="#7D90A8"/>
        </linearGradient>
      </defs>
      ${gearTeeth(26, 26, 8, 16, 10, 10, '#8A9DB4')}
      <circle cx="26" cy="26" r="17" fill="url(#gg)" stroke="#55657A" stroke-width="2.5"/>
      <circle cx="26" cy="26" r="6" fill="#3E4A5C"/>
      <ellipse cx="20" cy="17" rx="5" ry="2.2" fill="#FFFFFF" opacity="0.7" transform="rotate(-30 20 17)"/>
    `,
  },

  spring: {
    w: 48,
    h: 56,
    body: `
      <path d="M10 48 L38 42 L10 35 L38 28 L10 21 L38 14 L10 8" stroke="#4A5D74" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 48 L38 42 L10 35 L38 28 L10 21 L38 14 L10 8" stroke="#B7CBE0" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 47 L34 42 M12 34 L34 29 M12 20 L34 15" stroke="#FFFFFF" stroke-width="1.5" opacity="0.7" stroke-linecap="round"/>
    `,
  },

  bulb: {
    w: 44,
    h: 60,
    body: `
      <defs>
        <radialGradient id="bg" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stop-color="#FFFFFF"/>
          <stop offset="0.5" stop-color="#FFF3A6"/>
          <stop offset="1" stop-color="#FFC93C"/>
        </radialGradient>
      </defs>
      <circle cx="22" cy="21" r="18" fill="url(#bg)" stroke="#D99A1C" stroke-width="2.5"/>
      <path d="M16 24 Q19 16 22 24 Q25 16 28 24" stroke="#E07B1A" stroke-width="2" fill="none"/>
      <rect x="14" y="36" width="16" height="7" fill="#FFE27A" stroke="#D99A1C" stroke-width="2"/>
      <rect x="13" y="42" width="18" height="13" rx="3" fill="#A9B7C7" stroke="#5E6E82" stroke-width="2"/>
      <path d="M13 47 H31 M13 51 H31" stroke="#5E6E82" stroke-width="1.5"/>
      <ellipse cx="15" cy="13" rx="4" ry="2.4" fill="#FFFFFF" opacity="0.9" transform="rotate(-35 15 13)"/>
    `,
  },

  crystal: {
    w: 60,
    h: 80,
    body: `
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#C9F7FF"/>
          <stop offset="0.5" stop-color="#7FD3FF"/>
          <stop offset="1" stop-color="#8C6CFF"/>
        </linearGradient>
      </defs>
      <polygon points="30,3 54,26 44,74 16,74 6,26" fill="url(#cg)" stroke="#5A49C9" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="30,3 38,26 30,74 22,26" fill="#FFFFFF" opacity="0.35"/>
      <path d="M6 26 H54" stroke="#5A49C9" stroke-width="1.5" opacity="0.6"/>
      <ellipse cx="18" cy="18" rx="4" ry="2" fill="#FFFFFF" opacity="0.9" transform="rotate(-45 18 18)"/>
    `,
  },

  checkpointOff: {
    w: 44,
    h: 120,
    body: `
      <rect x="19" y="40" width="6" height="80" rx="2" fill="#6B4F3A"/>
      <rect x="12" y="112" width="20" height="8" rx="3" fill="#57402F"/>
      <path d="M14 10 Q22 0 30 10" stroke="#3E5C76" stroke-width="3" fill="none"/>
      <rect x="9" y="10" width="26" height="32" rx="7" fill="#91A6BA" stroke="#3E5C76" stroke-width="3"/>
      <rect x="15" y="16" width="14" height="20" rx="4" fill="#C9D6E2"/>
    `,
  },

  checkpointOn: {
    w: 44,
    h: 120,
    body: `
      <rect x="19" y="40" width="6" height="80" rx="2" fill="#6B4F3A"/>
      <rect x="12" y="112" width="20" height="8" rx="3" fill="#57402F"/>
      <path d="M14 10 Q22 0 30 10" stroke="#3E5C76" stroke-width="3" fill="none"/>
      <rect x="9" y="10" width="26" height="32" rx="7" fill="#FFB547" stroke="#3E5C76" stroke-width="3"/>
      <rect x="15" y="16" width="14" height="20" rx="4" fill="#FFF7C2"/>
    `,
  },

  sign: {
    w: 104,
    h: 112,
    body: `
      <rect x="24" y="50" width="9" height="62" rx="3" fill="#8B5A33"/>
      <rect x="71" y="50" width="9" height="62" rx="3" fill="#8B5A33"/>
      <rect x="6" y="6" width="92" height="58" rx="12" fill="#F0C27F" stroke="#9C6534" stroke-width="4"/>
      <rect x="14" y="13" width="76" height="44" rx="8" fill="#F8D9A5"/>
      <path d="M24 26 H80 M24 36 H72 M24 46 H62" stroke="#9C6534" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
    `,
  },

  snail: {
    w: 124,
    h: 96,
    body: `
      <defs>
        <radialGradient id="shell" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stop-color="#F3D1FF"/>
          <stop offset="0.5" stop-color="#C77DFF"/>
          <stop offset="1" stop-color="#7B4FD6"/>
        </radialGradient>
      </defs>
      <ellipse cx="62" cy="92" rx="54" ry="4" fill="#000" opacity="0.15"/>
      <rect x="8" y="70" width="108" height="20" rx="10" fill="#F9B98F" stroke="#D98563" stroke-width="2"/>
      <path d="M95 34 L91 13 M106 34 L110 13" stroke="#F9B98F" stroke-width="5" stroke-linecap="round"/>
      <rect x="88" y="30" width="26" height="54" rx="13" fill="#F9B98F" stroke="#D98563" stroke-width="2"/>
      <circle cx="91" cy="11" r="7" fill="#FFFFFF" stroke="#7A4A3A" stroke-width="1.5"/>
      <circle cx="110" cy="11" r="7" fill="#FFFFFF" stroke="#7A4A3A" stroke-width="1.5"/>
      <circle cx="93" cy="12" r="3.5" fill="#2B2440"/>
      <circle cx="112" cy="12" r="3.5" fill="#2B2440"/>
      <path d="M96 56 Q102 61 108 56" stroke="#7A4A3A" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="94" cy="50" rx="4" ry="2.5" fill="#FF7E9A" opacity="0.5"/>
      <circle cx="50" cy="50" r="32" fill="url(#shell)" stroke="#5E39B0" stroke-width="2.5"/>
      <path d="M50 50 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -20 0 a16 16 0 1 1 32 0 a22 22 0 1 1 -44 0" stroke="#FBEAFF" stroke-width="3.5" fill="none" opacity="0.75" stroke-linecap="round"/>
    `,
  },

  robot: {
    w: 92,
    h: 124,
    body: `
      <defs>
        <linearGradient id="rh" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#C6EBF7"/>
          <stop offset="1" stop-color="#7FBFD8"/>
        </linearGradient>
      </defs>
      <ellipse cx="46" cy="120" rx="36" ry="4" fill="#000" opacity="0.15"/>
      <path d="M46 6 V18" stroke="#3E6A85" stroke-width="3"/>
      <circle cx="46" cy="6" r="5.5" fill="#FF6B6B"/>
      <rect x="16" y="17" width="60" height="44" rx="13" fill="url(#rh)" stroke="#3E6A85" stroke-width="3"/>
      <rect x="24" y="25" width="44" height="28" rx="9" fill="#1F3B4D"/>
      <rect x="32" y="31" width="9" height="11" rx="4" fill="#6FF3FF"/>
      <rect x="51" y="31" width="9" height="11" rx="4" fill="#6FF3FF"/>
      <path d="M38 46 Q46 51 54 46" stroke="#6FF3FF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="8" y="66" width="13" height="30" rx="6" fill="#7FBFD8" stroke="#3E6A85" stroke-width="2.5"/>
      <rect x="71" y="66" width="13" height="30" rx="6" fill="#7FBFD8" stroke="#3E6A85" stroke-width="2.5"/>
      <rect x="22" y="62" width="48" height="42" rx="11" fill="#F2A65A" stroke="#A85E22" stroke-width="3"/>
      <circle cx="46" cy="82" r="8" fill="#FFD45C" stroke="#A85E22" stroke-width="2"/>
      <rect x="27" y="103" width="15" height="15" rx="5" fill="#3E6A85"/>
      <rect x="50" y="103" width="15" height="15" rx="5" fill="#3E6A85"/>
    `,
  },

  owl: {
    w: 104,
    h: 118,
    body: `
      <defs>
        <linearGradient id="ob" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#B98A5E"/>
          <stop offset="1" stop-color="#7A5233"/>
        </linearGradient>
      </defs>
      <rect x="4" y="106" width="96" height="10" rx="5" fill="#6B4A2E"/>
      <path d="M22 24 L18 6 L38 18 Z M82 24 L86 6 L66 18 Z" fill="#7A5233"/>
      <ellipse cx="52" cy="62" rx="38" ry="46" fill="url(#ob)" stroke="#5A3A20" stroke-width="2.5"/>
      <ellipse cx="52" cy="76" rx="23" ry="28" fill="#F1D9B5"/>
      <path d="M42 70 l4 5 l4 -5 M54 70 l4 5 l4 -5 M46 82 l4 5 l4 -5" stroke="#C9A77C" stroke-width="2" fill="none"/>
      <circle cx="37" cy="44" r="14" fill="#FFFFFF" stroke="#F2B544" stroke-width="3.5"/>
      <circle cx="67" cy="44" r="14" fill="#FFFFFF" stroke="#F2B544" stroke-width="3.5"/>
      <circle cx="39" cy="45" r="7" fill="#2B1B10"/>
      <circle cx="69" cy="45" r="7" fill="#2B1B10"/>
      <circle cx="41" cy="42" r="2.5" fill="#FFFFFF"/>
      <circle cx="71" cy="42" r="2.5" fill="#FFFFFF"/>
      <path d="M47 55 L57 55 L52 64 Z" fill="#F2B544"/>
      <path d="M22 14 L52 2 L82 14 L52 26 Z" fill="#2B2F4A"/>
      <path d="M78 15 V30" stroke="#FFD45C" stroke-width="2.5"/>
      <circle cx="78" cy="31" r="3" fill="#FFD45C"/>
      <path d="M38 104 l-4 6 M42 104 v6 M62 104 v6 M66 104 l4 6" stroke="#F2B544" stroke-width="3" stroke-linecap="round"/>
    `,
  },

  firefly: {
    w: 64,
    h: 64,
    body: `
      <defs>
        <radialGradient id="fg" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#FFFBC2" stop-opacity="0.95"/>
          <stop offset="1" stop-color="#FFE45C" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="34" r="30" fill="url(#fg)"/>
      <ellipse cx="24" cy="22" rx="10" ry="6" fill="#E8F7FF" opacity="0.85" transform="rotate(-30 24 22)"/>
      <ellipse cx="40" cy="22" rx="10" ry="6" fill="#E8F7FF" opacity="0.85" transform="rotate(30 40 22)"/>
      <ellipse cx="32" cy="38" rx="11" ry="13" fill="#FFE45C" stroke="#E0A51A" stroke-width="2"/>
      <circle cx="32" cy="24" r="9" fill="#4A3B6B"/>
      <circle cx="29" cy="23" r="2.6" fill="#FFFFFF"/>
      <circle cx="36" cy="23" r="2.6" fill="#FFFFFF"/>
      <path d="M28 14 L24 6 M36 14 L40 6" stroke="#4A3B6B" stroke-width="2" stroke-linecap="round"/>
    `,
  },

  machine: {
    w: 220,
    h: 240,
    body: `
      <defs>
        <linearGradient id="mb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#A9CBE0"/>
          <stop offset="1" stop-color="#5D7F96"/>
        </linearGradient>
        <radialGradient id="dome" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/>
          <stop offset="1" stop-color="#BFE3F5" stop-opacity="0.6"/>
        </radialGradient>
      </defs>
      <rect x="40" y="222" width="22" height="18" rx="4" fill="#34505F"/>
      <rect x="158" y="222" width="22" height="18" rx="4" fill="#34505F"/>
      <path d="M64 56 A46 46 0 0 1 156 56 Z" fill="url(#dome)" stroke="#34505F" stroke-width="4"/>
      <rect x="20" y="54" width="180" height="170" rx="20" fill="url(#mb)" stroke="#34505F" stroke-width="4"/>
      <rect x="32" y="66" width="156" height="12" rx="6" fill="#FFFFFF" opacity="0.3"/>
      <circle cx="62" cy="130" r="24" fill="#2E4452" stroke="#1E2E38" stroke-width="3"/>
      <circle cx="110" cy="130" r="24" fill="#2E4452" stroke="#1E2E38" stroke-width="3"/>
      <circle cx="158" cy="130" r="24" fill="#2E4452" stroke="#1E2E38" stroke-width="3"/>
      <rect x="40" y="176" width="140" height="30" rx="10" fill="#2E4452"/>
      <circle cx="60" cy="191" r="6" fill="#FF6B6B"/>
      <circle cx="80" cy="191" r="6" fill="#FFD45C"/>
      <circle cx="100" cy="191" r="6" fill="#6FE38A"/>
      <rect x="118" y="185" width="52" height="12" rx="6" fill="#6FF3FF" opacity="0.5"/>
      <circle cx="32" cy="66" r="3" fill="#34505F"/><circle cx="188" cy="66" r="3" fill="#34505F"/>
      <circle cx="32" cy="212" r="3" fill="#34505F"/><circle cx="188" cy="212" r="3" fill="#34505F"/>
      <path d="M200 100 H212 V40 H190" stroke="#B87333" stroke-width="8" fill="none" stroke-linecap="round"/>
    `,
  },

  leverOff: {
    w: 96,
    h: 140,
    body: `
      <path d="M48 64 L22 14" stroke="#4A4A5A" stroke-width="8" stroke-linecap="round"/>
      <circle cx="22" cy="14" r="11" fill="#FF6B6B" stroke="#B83A3A" stroke-width="2.5"/>
      <rect x="10" y="58" width="76" height="80" rx="12" fill="#E0A84E" stroke="#8A5A1E" stroke-width="4"/>
      <path d="M14 120 L30 136 M30 120 L46 136 M46 120 L62 136 M62 120 L78 136" stroke="#3B2A1A" stroke-width="5" opacity="0.6"/>
      <circle cx="48" cy="88" r="11" fill="#3B2A1A"/>
      <rect x="44" y="92" width="8" height="16" rx="2" fill="#3B2A1A"/>
      <circle cx="74" cy="70" r="5" fill="#FF6B6B"/>
    `,
  },

  leverOn: {
    w: 96,
    h: 140,
    body: `
      <path d="M48 64 L74 14" stroke="#4A4A5A" stroke-width="8" stroke-linecap="round"/>
      <circle cx="74" cy="14" r="11" fill="#6FE38A" stroke="#2F9A50" stroke-width="2.5"/>
      <rect x="10" y="58" width="76" height="80" rx="12" fill="#E0A84E" stroke="#8A5A1E" stroke-width="4"/>
      <path d="M14 120 L30 136 M30 120 L46 136 M46 120 L62 136 M62 120 L78 136" stroke="#3B2A1A" stroke-width="5" opacity="0.6"/>
      <circle cx="48" cy="88" r="11" fill="#3B2A1A"/>
      <rect x="44" y="92" width="8" height="16" rx="2" fill="#3B2A1A"/>
      <circle cx="74" cy="70" r="5" fill="#6FE38A"/>
    `,
  },

  pedestal: {
    w: 100,
    h: 84,
    body: `
      <defs>
        <linearGradient id="pd" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#B9C3D6"/>
          <stop offset="1" stop-color="#8592AB"/>
        </linearGradient>
      </defs>
      <rect x="16" y="70" width="68" height="14" rx="5" fill="#6E7A93"/>
      <rect x="26" y="22" width="48" height="52" rx="6" fill="url(#pd)"/>
      <rect x="10" y="8" width="80" height="18" rx="8" fill="#C9D2E3" stroke="#6E7A93" stroke-width="2.5"/>
      <path d="M34 30 V66 M50 30 V66 M66 30 V66" stroke="#6E7A93" stroke-width="2" opacity="0.5"/>
    `,
  },

  wordBoard: {
    w: 120,
    h: 140,
    body: `
      <rect x="54" y="88" width="12" height="52" rx="4" fill="#5A4636"/>
      <rect x="6" y="6" width="108" height="92" rx="16" fill="#1E3557" stroke="#8FE3FF" stroke-width="4"/>
      <rect x="14" y="14" width="92" height="76" rx="11" fill="#27466E"/>
    `,
  },

  portalRing: {
    w: 150,
    h: 190,
    body: `
      <defs>
        <linearGradient id="pr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFE27A"/>
          <stop offset="0.5" stop-color="#FFB547"/>
          <stop offset="1" stop-color="#E07B1A"/>
        </linearGradient>
      </defs>
      <ellipse cx="75" cy="96" rx="62" ry="86" fill="none" stroke="url(#pr)" stroke-width="14"/>
      <ellipse cx="75" cy="96" rx="62" ry="86" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.5" stroke-dasharray="10 18"/>
      <circle cx="75" cy="10" r="9" fill="#FF6BB5" stroke="#B8327A" stroke-width="2"/>
      <circle cx="16" cy="96" r="7" fill="#7FD3FF" stroke="#3A8BC9" stroke-width="2"/>
      <circle cx="134" cy="96" r="7" fill="#7FD3FF" stroke="#3A8BC9" stroke-width="2"/>
    `,
  },

  portalSwirl: {
    w: 124,
    h: 172,
    body: `
      <defs>
        <radialGradient id="ps" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#FFFFFF"/>
          <stop offset="0.35" stop-color="#E3CCFF"/>
          <stop offset="0.75" stop-color="#9B6BFF"/>
          <stop offset="1" stop-color="#5B3FD9"/>
        </radialGradient>
      </defs>
      <ellipse cx="62" cy="86" rx="58" ry="82" fill="url(#ps)"/>
      <path d="M62 86 m0 -8 a8 8 0 1 1 -8 8 a18 18 0 1 1 18 18 a30 30 0 1 1 -30 -30 a44 44 0 1 1 44 44" stroke="#FFFFFF" stroke-width="4" fill="none" opacity="0.55" stroke-linecap="round"/>
    `,
  },

  gateHedge: {
    w: 150,
    h: 470,
    body: `
      <defs>
        <linearGradient id="hd" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#3F9B4A"/>
          <stop offset="0.5" stop-color="#55B85E"/>
          <stop offset="1" stop-color="#2F7F3B"/>
        </linearGradient>
      </defs>
      <rect x="8" y="30" width="134" height="440" rx="40" fill="url(#hd)"/>
      <circle cx="30" cy="40" r="24" fill="#55B85E"/><circle cx="75" cy="26" r="26" fill="#62C46A"/><circle cx="120" cy="40" r="24" fill="#4CAF55"/>
      <circle cx="40" cy="120" r="14" fill="#62C46A" opacity="0.8"/><circle cx="110" cy="170" r="16" fill="#62C46A" opacity="0.7"/>
      <circle cx="50" cy="230" r="12" fill="#2F7F3B" opacity="0.7"/><circle cx="100" cy="90" r="10" fill="#2F7F3B" opacity="0.6"/>
      <circle cx="36" cy="80" r="5" fill="#FF8FB1"/><circle cx="112" cy="128" r="5" fill="#FFE26B"/><circle cx="60" cy="190" r="5" fill="#FF8FB1"/>
      <path d="M32 470 V330 Q75 290 118 330 V470 Z" fill="#B5743E" stroke="#7A4A22" stroke-width="5"/>
      <path d="M54 320 V470 M75 312 V470 M96 320 V470" stroke="#7A4A22" stroke-width="3" opacity="0.6"/>
      <circle cx="75" cy="400" r="14" fill="#FFC93C" stroke="#A86B08" stroke-width="3"/>
      <circle cx="75" cy="397" r="4" fill="#5A3A10"/>
      <rect x="73" y="399" width="4" height="9" fill="#5A3A10"/>
    `,
  },

  gateVines: {
    w: 140,
    h: 430,
    body: `
      <rect x="10" y="0" width="120" height="14" rx="7" fill="#4A3B2A"/>
      <path d="M24 10 C10 80 38 140 22 210 C8 280 36 340 24 430" stroke="#2F8F5B" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M58 10 C72 90 44 150 60 230 C74 300 46 360 58 430" stroke="#3FA86A" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M92 10 C78 70 104 150 90 220 C78 300 104 350 92 430" stroke="#2F8F5B" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M122 10 C134 90 110 170 124 240 C136 320 112 370 120 430" stroke="#3FA86A" stroke-width="12" fill="none" stroke-linecap="round"/>
      <ellipse cx="30" cy="70" rx="12" ry="6" fill="#5CCB86" transform="rotate(30 30 70)"/>
      <ellipse cx="66" cy="160" rx="12" ry="6" fill="#5CCB86" transform="rotate(-30 66 160)"/>
      <ellipse cx="96" cy="260" rx="12" ry="6" fill="#5CCB86" transform="rotate(30 96 260)"/>
      <ellipse cx="22" cy="330" rx="12" ry="6" fill="#5CCB86" transform="rotate(-30 22 330)"/>
      <ellipse cx="116" cy="120" rx="12" ry="6" fill="#5CCB86" transform="rotate(-30 116 120)"/>
      <circle cx="60" cy="100" r="7" fill="#FF8FE1"/><circle cx="100" cy="190" r="7" fill="#8FE3FF"/>
      <circle cx="30" cy="260" r="7" fill="#FFE26B"/><circle cx="86" cy="370" r="7" fill="#FF8FE1"/>
    `,
  },

  gateDoor: {
    w: 140,
    h: 430,
    body: `
      <defs>
        <linearGradient id="dr" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#95A9BE"/>
          <stop offset="0.5" stop-color="#B8CADB"/>
          <stop offset="1" stop-color="#7D90A8"/>
        </linearGradient>
      </defs>
      <rect x="8" y="0" width="124" height="430" rx="10" fill="url(#dr)" stroke="#4E6178" stroke-width="5"/>
      <circle cx="70" cy="190" r="26" fill="#2E4452" stroke="#4E6178" stroke-width="5"/>
      <circle cx="70" cy="190" r="16" fill="#FFB547" opacity="0.5"/>
      <path d="M8 380 L48 430 M40 380 L88 430 M80 380 L128 430 M112 380 L132 404" stroke="#FFD45C" stroke-width="12"/>
      <path d="M8 380 H132" stroke="#4E6178" stroke-width="4"/>
      <circle cx="24" cy="20" r="4" fill="#4E6178"/><circle cx="116" cy="20" r="4" fill="#4E6178"/>
      <circle cx="24" cy="360" r="4" fill="#4E6178"/><circle cx="116" cy="360" r="4" fill="#4E6178"/>
    `,
  },

  // ---------- Декор фонов ----------

  tree: {
    w: 160,
    h: 220,
    body: `
      <rect x="70" y="120" width="20" height="100" rx="6" fill="#8B5A33"/>
      <circle cx="80" cy="80" r="62" fill="#4FAF54"/>
      <circle cx="44" cy="104" r="40" fill="#5DBE5F"/>
      <circle cx="118" cy="100" r="42" fill="#46A24D"/>
      <circle cx="80" cy="50" r="40" fill="#6ACB68"/>
      <circle cx="62" cy="40" r="14" fill="#8EE07E" opacity="0.7"/>
      <circle cx="56" cy="88" r="6" fill="#FF6B6B"/><circle cx="104" cy="70" r="6" fill="#FF6B6B"/><circle cx="90" cy="118" r="6" fill="#FF6B6B"/>
    `,
  },

  bush: {
    w: 120,
    h: 64,
    body: `
      <ellipse cx="34" cy="42" rx="32" ry="24" fill="#4CAF55"/>
      <ellipse cx="80" cy="38" rx="38" ry="28" fill="#5DBE5F"/>
      <ellipse cx="60" cy="30" rx="26" ry="22" fill="#6ACB68"/>
      <circle cx="40" cy="30" r="4" fill="#FFE26B"/><circle cx="88" cy="26" r="4" fill="#FF8FB1"/>
      <rect x="2" y="56" width="116" height="8" rx="4" fill="#3F9B4A"/>
    `,
  },

  flower: {
    w: 36,
    h: 56,
    body: `
      <path d="M18 24 Q16 40 18 56" stroke="#3F9B4A" stroke-width="3.5" fill="none"/>
      <ellipse cx="12" cy="42" rx="6" ry="3" fill="#4CAF55" transform="rotate(-30 12 42)"/>
      <circle cx="18" cy="10" r="7" fill="#FF8FB1"/><circle cx="8" cy="18" r="7" fill="#FF8FB1"/>
      <circle cx="28" cy="18" r="7" fill="#FF8FB1"/><circle cx="12" cy="28" r="7" fill="#FF8FB1"/>
      <circle cx="24" cy="28" r="7" fill="#FF8FB1"/>
      <circle cx="18" cy="19" r="6" fill="#FFE26B"/>
    `,
  },

  cloud: {
    w: 200,
    h: 90,
    body: `
      <ellipse cx="100" cy="66" rx="92" ry="22" fill="#FFFFFF"/>
      <circle cx="60" cy="50" r="32" fill="#FFFFFF"/>
      <circle cx="108" cy="38" r="38" fill="#FFFFFF"/>
      <circle cx="150" cy="54" r="26" fill="#FFFFFF"/>
      <ellipse cx="100" cy="78" rx="80" ry="10" fill="#DCEBFA"/>
    `,
  },

  cactus: {
    w: 80,
    h: 130,
    body: `
      <rect x="28" y="10" width="24" height="120" rx="12" fill="#5FAF6A" stroke="#3E8A4A" stroke-width="3"/>
      <path d="M28 70 H16 Q8 70 8 60 V36" stroke="#5FAF6A" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M52 56 H64 Q72 56 72 46 V28" stroke="#5FAF6A" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M40 18 V122" stroke="#7FCB88" stroke-width="3" opacity="0.7"/>
      <circle cx="40" cy="10" r="7" fill="#FF8FB1"/>
    `,
  },

  rock: {
    w: 100,
    h: 60,
    body: `
      <path d="M6 58 Q4 26 30 16 Q52 4 72 14 Q96 24 94 58 Z" fill="#C98A5A" stroke="#9C6534" stroke-width="3"/>
      <path d="M26 26 Q40 18 56 20" stroke="#E8B98A" stroke-width="4" fill="none" stroke-linecap="round"/>
    `,
  },

  pine: {
    w: 140,
    h: 260,
    body: `
      <rect x="62" y="200" width="16" height="60" rx="5" fill="#3A2D2A"/>
      <path d="M70 8 L118 92 L22 92 Z" fill="#1F5F63"/>
      <path d="M70 52 L130 150 L10 150 Z" fill="#1A5357"/>
      <path d="M70 100 L138 210 L2 210 Z" fill="#164A4E"/>
      <path d="M70 8 L94 50 L70 44 Z" fill="#2E7B7F" opacity="0.8"/>
    `,
  },

  glowShroom: {
    w: 60,
    h: 60,
    body: `
      <defs>
        <radialGradient id="gs" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#8FFFE6" stop-opacity="0.7"/>
          <stop offset="1" stop-color="#8FFFE6" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="30" fill="url(#gs)"/>
      <rect x="25" y="30" width="10" height="26" rx="4" fill="#E8F0E6"/>
      <path d="M8 34 Q30 0 52 34 Z" fill="#4FE0C1" stroke="#2A9C88" stroke-width="2"/>
      <circle cx="22" cy="24" r="3" fill="#FFFFFF"/><circle cx="36" cy="20" r="2.5" fill="#FFFFFF"/>
    `,
  },

  hangLamp: {
    w: 80,
    h: 160,
    body: `
      <path d="M40 0 V96" stroke="#3B2A1A" stroke-width="3"/>
      <path d="M14 126 Q40 86 66 126 Z" fill="#B87333" stroke="#7A4A22" stroke-width="3"/>
      <ellipse cx="40" cy="128" rx="18" ry="6" fill="#FFF3B0"/>
    `,
  },

  window: {
    w: 160,
    h: 180,
    body: `
      <rect x="6" y="6" width="148" height="168" rx="70" fill="#2B3F6B" stroke="#7A4A22" stroke-width="10"/>
      <circle cx="104" cy="58" r="16" fill="#FFF3B0" opacity="0.8"/>
      <path d="M80 10 V170 M10 96 H150" stroke="#7A4A22" stroke-width="8"/>
      <circle cx="40" cy="40" r="2" fill="#FFFFFF"/><circle cx="56" cy="130" r="2" fill="#FFFFFF"/><circle cx="124" cy="140" r="2" fill="#FFFFFF"/>
    `,
  },

  shelfJars: {
    w: 200,
    h: 110,
    body: `
      <rect x="0" y="92" width="200" height="14" rx="4" fill="#8A5530"/>
      <rect x="14" y="40" width="34" height="52" rx="8" fill="#8FE3FF" opacity="0.8" stroke="#3E5C76" stroke-width="3"/>
      <rect x="18" y="32" width="26" height="10" rx="3" fill="#B87333"/>
      <rect x="62" y="56" width="30" height="36" rx="6" fill="#FF8FB1" opacity="0.85" stroke="#3E5C76" stroke-width="3"/>
      <rect x="106" y="20" width="40" height="72" rx="6" fill="#FFD45C" stroke="#7A4A22" stroke-width="3"/>
      <path d="M112 36 H140 M112 50 H134" stroke="#7A4A22" stroke-width="3"/>
      <circle cx="172" cy="74" r="18" fill="#6FE38A" opacity="0.8" stroke="#3E5C76" stroke-width="3"/>
    `,
  },

  bigGear: {
    w: 200,
    h: 200,
    body: `
      ${gearTeeth(100, 100, 12, 74, 26, 22, '#C98A5A')}
      <circle cx="100" cy="100" r="76" fill="#C98A5A"/>
      <circle cx="100" cy="100" r="54" fill="#B5763F"/>
      <circle cx="100" cy="100" r="18" fill="#7A4A22"/>
      <path d="M100 46 V154 M46 100 H154" stroke="#C98A5A" stroke-width="14"/>
    `,
  },
  ...CH2_SPRITES,
} satisfies Record<string, SpriteDef>;

export type SpriteKey = keyof typeof SPRITES;

/** Полная SVG-разметка спрайта нужного пиксельного размера. */
export function svgMarkup(def: SpriteDef, scale = 1): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.w} ${def.h}" width="${Math.round(def.w * scale)}" height="${Math.round(def.h * scale)}">${def.body}</svg>`;
}

export function svgDataUri(key: SpriteKey, scale = 1): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup(SPRITES[key], scale))}`;
}

/** Точка крепления шеи на абажуре (в координатах lampHead). */
export const HEAD_PIVOT = { x: 18, y: 40 };
/** Центр светящегося отверстия абажура. */
export const HEAD_RIM = { x: 67, y: 33 };
export const LAMP_COLORS = { arm: LAMP_ARM, armLight: LAMP_ARM_LIGHT };
