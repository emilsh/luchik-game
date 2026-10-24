import Phaser from 'phaser';
import { GROUND_Y, WORLD_H } from '../config';
import type { PlatformKind } from '../../types/game';
import type { Theme } from './themes';

// Platforms are drawn on canvas (gradients, soft shapes) and cut into pieces
// so as not to exceed the texture size limit on the iPad.

const RES = 2;
const CHUNK = 1000;
/** Headroom for grass blades and railings. */
export const PAD_TOP = 40;

const hex = (n: number, a = 1) => {
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, t: Theme, rand: () => number) {
  const body = ctx.createLinearGradient(0, 0, 0, h);
  body.addColorStop(0, hex(t.groundBody));
  body.addColorStop(1, hex(t.groundDark));
  ctx.fillStyle = body;
  rr(ctx, 0, 6, w, h + 40, 14);
  ctx.fill();

  // Edges slightly darker — volume.
  const edgeL = ctx.createLinearGradient(0, 0, 14, 0);
  edgeL.addColorStop(0, hex(t.groundDark, 0.6));
  edgeL.addColorStop(1, hex(t.groundDark, 0));
  ctx.fillStyle = edgeL;
  ctx.fillRect(0, 10, 14, h);
  const edgeR = ctx.createLinearGradient(w - 14, 0, w, 0);
  edgeR.addColorStop(0, hex(t.groundDark, 0));
  edgeR.addColorStop(1, hex(t.groundDark, 0.6));
  ctx.fillStyle = edgeR;
  ctx.fillRect(w - 14, 10, 14, h);

  if (t.id === 'workshop' || t.id === 'library') {
    ctx.strokeStyle = hex(t.groundDark, 0.7);
    ctx.lineWidth = 3;
    for (let x = 64; x < w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.fillStyle = hex(0x3b2412, 0.6);
      ctx.beginPath();
      ctx.arc(x - 10, 34, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (t.id === 'factory') {
    ctx.strokeStyle = hex(t.groundDark, 0.8);
    ctx.lineWidth = 3;
    for (let x = 0; x < w; x += 90) ctx.strokeRect(x + 4, 30, 82, Math.max(10, h - 40));
    ctx.fillStyle = hex(t.groundTopLight, 0.8);
    for (let x = 12; x < w; x += 45) {
      ctx.beginPath();
      ctx.arc(x, 38, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (t.id === 'observatory') {
    ctx.strokeStyle = hex(t.groundTopLight, 0.25);
    ctx.lineWidth = 3;
    for (let x = 80; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 24);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.lineTo(w, 70);
    ctx.stroke();
  } else if (t.id === 'canyon') {
    ctx.strokeStyle = hex(t.groundTopLight, 0.35);
    ctx.lineWidth = 6;
    for (const yy of [48, 92, 150]) {
      ctx.beginPath();
      ctx.moveTo(0, yy);
      for (let x = 0; x <= w; x += 40) ctx.lineTo(x, yy + Math.sin(x * 0.02 + yy) * 5);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < w / 45; i++) {
      ctx.fillStyle = hex(t.speck, 0.55);
      ctx.beginPath();
      ctx.ellipse(rand() * w, 40 + rand() * (h - 40), 4 + rand() * 6, 3 + rand() * 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Top layer: grass / sand / moss / planks.
  ctx.fillStyle = hex(t.groundTop);
  rr(ctx, 0, 0, w, 24, 12);
  ctx.fill();
  if (['valley', 'forest', 'enchanted', 'sky', 'ice'].includes(t.id)) {
    for (let x = 12; x < w - 4; x += 24) {
      ctx.beginPath();
      ctx.arc(x, 22, 11 + rand() * 3, 0, Math.PI);
      ctx.fill();
    }
  }
  if (t.id === 'forest' || t.id === 'enchanted' || t.id === 'cave') {
    for (let i = 0; i < w / 60; i++) {
      ctx.fillStyle = hex(t.groundTopLight, 0.9);
      ctx.beginPath();
      ctx.arc(rand() * w, 8 + rand() * 14, 2 + rand() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (t.id === 'workshop' || t.id === 'library' || t.id === 'factory' || t.id === 'observatory') {
    ctx.fillStyle = hex(t.groundDark, 0.5);
    ctx.fillRect(0, 18, w, 4);
  }
  if (t.id === 'factory') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, 10);
    ctx.clip();
    for (let x = -10; x < w; x += 28) {
      ctx.fillStyle = '#FFD45C';
      ctx.fillRect(x, 0, 14, 10);
    }
    ctx.restore();
  }
  if (t.id === 'ice') icicles(ctx, w, 26, rand);
  ctx.fillStyle = hex(t.groundTopLight, 0.85);
  rr(ctx, 6, 3, Math.max(0, w - 12), 7, 4);
  ctx.fill();

  if (t.id === 'valley') {
    // Grass blades
    ctx.fillStyle = hex(t.groundTop);
    for (let x = 20; x < w - 20; x += 70 + rand() * 60) {
      for (let k = 0; k < 3; k++) {
        const bx = x + k * 6;
        ctx.beginPath();
        ctx.moveTo(bx - 3, 2);
        ctx.lineTo(bx + (k - 1) * 3, -10 - rand() * 6);
        ctx.lineTo(bx + 3, 2);
        ctx.fill();
      }
    }
  }
}

function icicles(ctx: CanvasRenderingContext2D, w: number, y: number, rand: () => number) {
  ctx.fillStyle = 'rgba(220,245,255,0.95)';
  for (let x = 10; x < w - 10; x += 22 + rand() * 18) {
    const len = 8 + rand() * 16;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x, y + len);
    ctx.closePath();
    ctx.fill();
  }
}

function drawIce(ctx: CanvasRenderingContext2D, w: number, rand: () => number) {
  const g = ctx.createLinearGradient(0, 0, 0, 28);
  g.addColorStop(0, '#E8FBFF');
  g.addColorStop(1, '#7FC8E8');
  ctx.fillStyle = g;
  rr(ctx, 0, 0, w, 26, 10);
  ctx.fill();
  ctx.strokeStyle = '#4FA0C8';
  ctx.lineWidth = 2;
  rr(ctx, 1, 1, w - 2, 24, 10);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  rr(ctx, 6, 3, w - 12, 5, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  for (let x = 20; x < w - 20; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 12);
    ctx.lineTo(x + 14, 20);
    ctx.stroke();
  }
  icicles(ctx, w, 25, rand);
}

function drawConveyor(ctx: CanvasRenderingContext2D, w: number, dir: number) {
  ctx.fillStyle = '#2E3640';
  rr(ctx, 0, 0, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#4E5A6A';
  rr(ctx, 4, 3, w - 8, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#FFD45C';
  for (let x = 24; x < w - 16; x += 40) {
    ctx.beginPath();
    const tip = x + 8 * dir;
    ctx.moveTo(x - 6 * dir, 4);
    ctx.lineTo(tip, 7);
    ctx.lineTo(x - 6 * dir, 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#8FA3B8';
  for (let x = 13; x < w; x += 26) {
    ctx.beginPath();
    ctx.arc(x, 18, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2E3640';
  for (let x = 13; x < w; x += 26) {
    ctx.beginPath();
    ctx.arc(x, 18, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBlock(ctx: CanvasRenderingContext2D, w: number, h: number, t: Theme, rand: () => number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, hex(t.groundBody));
  g.addColorStop(1, hex(t.groundDark));
  ctx.fillStyle = g;
  rr(ctx, 0, 0, w, h, 14);
  ctx.fill();
  for (let i = 0; i < (w * h) / 2500; i++) {
    ctx.fillStyle = hex(t.speck, 0.5);
    ctx.beginPath();
    ctx.ellipse(10 + rand() * (w - 20), 16 + rand() * Math.max(1, h - 26), 3 + rand() * 5, 2 + rand() * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = hex(t.groundTop);
  rr(ctx, 0, 0, w, 14, 7);
  ctx.fill();
  ctx.fillStyle = hex(t.groundTopLight, 0.8);
  rr(ctx, 6, 3, Math.max(0, w - 12), 4, 2);
  ctx.fill();
}

function drawBooks(ctx: CanvasRenderingContext2D, w: number) {
  const colors = ['#C0504D', '#4F81BD', '#9BBB59', '#F2C14E', '#8064A2', '#E88AB5'];
  ctx.fillStyle = '#8A5530';
  rr(ctx, 0, 0, w, 14, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(4, 2, w - 8, 3);
  for (let x = 6, i = 0; x < w - 16; x += 17, i++) {
    const hh = 22 + ((i * 7) % 4) * 3;
    ctx.fillStyle = colors[i % colors.length];
    rr(ctx, x, 14, 14, hh, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(x + 3, 18, 8, 2);
  }
}

function drawIsland(ctx: CanvasRenderingContext2D, w: number, t: Theme, rand: () => number) {
  const g = ctx.createLinearGradient(0, 0, 0, 100);
  g.addColorStop(0, hex(t.groundBody));
  g.addColorStop(1, hex(t.groundDark));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(w, 10);
  ctx.quadraticCurveTo(w * 0.8, 60, w * 0.55, 96);
  ctx.lineTo(w * 0.45, 96);
  ctx.quadraticCurveTo(w * 0.2, 60, 0, 10);
  ctx.fill();
  for (let i = 0; i < w / 40; i++) {
    ctx.fillStyle = hex(t.speck, 0.6);
    ctx.beginPath();
    ctx.arc(w * 0.2 + rand() * w * 0.6, 24 + rand() * 40, 3 + rand() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = hex(t.groundTop);
  rr(ctx, -2, 0, w + 4, 20, 10);
  ctx.fill();
  for (let x = 12; x < w - 4; x += 24) {
    ctx.beginPath();
    ctx.arc(x, 18, 9, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = hex(t.groundTopLight, 0.85);
  rr(ctx, 6, 3, w - 12, 5, 3);
  ctx.fill();
}

function drawLedge(ctx: CanvasRenderingContext2D, w: number, h: number, t: Theme, rand: () => number) {
  const g = ctx.createLinearGradient(0, 0, 0, h + 14);
  g.addColorStop(0, hex(t.ledgeBody));
  g.addColorStop(1, hex(t.groundDark));
  ctx.fillStyle = g;
  rr(ctx, 2, 6, w - 4, h, 12);
  ctx.fill();
  // Lumps below
  for (let x = 18; x < w - 12; x += 26) {
    ctx.beginPath();
    ctx.arc(x, h + 4, 6 + rand() * 5, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = hex(t.ledgeTop);
  rr(ctx, 0, 0, w, 16, 8);
  ctx.fill();
  ctx.fillStyle = hex(t.groundTopLight, 0.85);
  rr(ctx, 6, 3, w - 12, 5, 3);
  ctx.fill();
}

function drawShelf(ctx: CanvasRenderingContext2D, w: number, _h: number, t: Theme) {
  const g = ctx.createLinearGradient(0, 0, 0, 20);
  g.addColorStop(0, hex(t.ledgeTop));
  g.addColorStop(1, hex(t.ledgeBody));
  ctx.fillStyle = g;
  rr(ctx, 0, 0, w, 20, 5);
  ctx.fill();
  ctx.strokeStyle = '#46576b';
  ctx.lineWidth = 2.5;
  rr(ctx, 1, 1, w - 2, 18, 5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(6, 3, w - 12, 3);
  ctx.fillStyle = '#46576b';
  for (let x = 12; x < w; x += 30) {
    ctx.beginPath();
    ctx.arc(x, 13, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Yellow-black stripe below
  ctx.save();
  rr(ctx, 4, 20, w - 8, 8, 3);
  ctx.clip();
  ctx.fillStyle = '#FFD45C';
  ctx.fillRect(0, 20, w, 8);
  ctx.fillStyle = '#3b3b48';
  for (let x = -8; x < w; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 28);
    ctx.lineTo(x + 8, 20);
    ctx.lineTo(x + 14, 20);
    ctx.lineTo(x + 6, 28);
    ctx.fill();
  }
  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, w: number) {
  ctx.fillStyle = '#DDEBFA';
  rr(ctx, 4, 14, w - 8, 22, 11);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, 0, 4, w, 24, 12);
  ctx.fill();
  for (let x = 22; x < w - 10; x += 34) {
    ctx.beginPath();
    ctx.arc(x, 6, 16, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
}

function drawBridge(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Railings
  ctx.strokeStyle = '#7A4A22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(w, -26);
  ctx.stroke();
  for (let x = 10; x < w; x += 70) {
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(x - 3, -30, 6, 32);
  }
  for (let x = 0, i = 0; x < w; x += 28, i++) {
    ctx.fillStyle = i % 2 ? '#B07A4A' : '#C48A55';
    rr(ctx, x + 1, 0, 26, h - 6, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 4, 3, 20, 3);
    ctx.fillStyle = '#5E3A1A';
    ctx.beginPath();
    ctx.arc(x + 14, 14, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMushroom(ctx: CanvasRenderingContext2D, w: number, stemH: number, bouncy = false) {
  ctx.fillStyle = '#EDE6F2';
  rr(ctx, w / 2 - 13, 20, 26, stemH, 10);
  ctx.fill();
  if (bouncy) {
    // A spring on the stem — it is visible that the mushroom bounces.
    ctx.strokeStyle = '#8C7CC9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let y = 34, k = 0; y < Math.min(stemH, 90); y += 10, k++) ctx.lineTo(w / 2 + (k % 2 ? 11 : -11), y);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, 0, 0, 34);
  g.addColorStop(0, bouncy ? '#9FFFE6' : '#FF9BD0');
  g.addColorStop(1, bouncy ? '#2FB89A' : '#C14F94');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.quadraticCurveTo(0, -6, w / 2, -6);
  ctx.quadraticCurveTo(w, -6, w, 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  for (const [dx, dy, r] of [[0.25, 10, 5], [0.55, 4, 6], [0.8, 14, 4]] as const) {
    ctx.beginPath();
    ctx.arc(w * dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCrystal(ctx: CanvasRenderingContext2D, w: number) {
  const g = ctx.createLinearGradient(0, 0, w, 30);
  g.addColorStop(0, 'rgba(201,247,255,0.95)');
  g.addColorStop(0.5, 'rgba(127,211,255,0.9)');
  g.addColorStop(1, 'rgba(140,108,255,0.9)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(w - 8, 0);
  ctx.lineTo(w, 10);
  ctx.lineTo(w * 0.6, 34);
  ctx.lineTo(w * 0.4, 34);
  ctx.lineTo(0, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5A49C9';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(10, 3, w - 20, 4);
}

let texCounter = 0;

/**
 * Creates a platform visual: a container with image chunks.
 * Container coordinates are the top-left corner of the surface.
 */
export function createPlatformVisual(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: PlatformKind,
  theme: Theme,
  seed: number,
  opts: { conveyorDir?: number } = {},
): { container: Phaser.GameObjects.Container; textureKeys: string[] } {
  const container = scene.add.container(x, y);
  const textureKeys: string[] = [];
  let visH: number;
  switch (kind) {
    case 'ground':
      visH = Math.min(h, WORLD_H + 40 - y);
      break;
    case 'mushroom':
    case 'bouncy':
      visH = Math.max(40, GROUND_Y - y + 30);
      break;
    case 'bridge':
    case 'block':
      visH = h;
      break;
    case 'island':
      visH = 100;
      break;
    case 'books':
      visH = 50;
      break;
    default:
      visH = 44;
  }
  const totalH = visH + PAD_TOP;

  for (let cx = 0; cx < w; cx += CHUNK) {
    const cw = Math.min(CHUNK, w - cx);
    const key = `plat-${++texCounter}`;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil((cw + 8) * RES);
    canvas.height = Math.ceil(totalH * RES);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(RES, RES);
      ctx.translate(-cx + 4, PAD_TOP);
      const rand = rng(seed * 997 + 13);
      switch (kind) {
        case 'ground':
          drawGround(ctx, w, visH, theme, rand);
          break;
        case 'ledge':
          drawLedge(ctx, w, 24, theme, rand);
          break;
        case 'shelf':
          drawShelf(ctx, w, 24, theme);
          break;
        case 'cloud':
          drawCloud(ctx, w);
          break;
        case 'bridge':
          drawBridge(ctx, w, h);
          break;
        case 'mushroom':
          drawMushroom(ctx, w, visH);
          break;
        case 'crystal':
          drawCrystal(ctx, w);
          break;
        case 'bouncy':
          drawMushroom(ctx, w, visH, true);
          break;
        case 'ice':
          drawIce(ctx, w, rand);
          break;
        case 'conveyor':
          drawConveyor(ctx, w, opts.conveyorDir ?? 1);
          break;
        case 'block':
          drawBlock(ctx, w, visH, theme, rand);
          break;
        case 'books':
          drawBooks(ctx, w);
          break;
        case 'island':
          drawIsland(ctx, w, theme, rand);
          break;
      }
    }
    scene.textures.addCanvas(key, canvas);
    textureKeys.push(key);
    const img = scene.add.image(cx - 4, -PAD_TOP, key).setOrigin(0, 0).setScale(1 / RES);
    container.add(img);
  }
  return { container, textureKeys };
}
