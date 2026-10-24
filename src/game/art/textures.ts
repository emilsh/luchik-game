import Phaser from 'phaser';
import { TEX_RES } from '../config';
import { SPRITES, svgMarkup, type SpriteDef, type SpriteKey } from './sprites';

// Растеризация SVG-спрайтов в текстуры Phaser в повышенном разрешении,
// чтобы на Retina-экранах iPad всё оставалось чётким.

function rasterize(scene: Phaser.Scene, key: string, def: SpriteDef): Promise<void> {
  return new Promise((resolve) => {
    const cw = Math.round(def.w * TEX_RES);
    const ch = Math.round(def.h * TEX_RES);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const done = () => {
      if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
      resolve();
    };
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, cw, ch);
      done();
    };
    img.onerror = () => {
      // Запасной вариант, чтобы игра не сломалась: простой цветной блок.
      if (ctx) {
        ctx.fillStyle = '#ffb547';
        ctx.fillRect(0, 0, cw, ch);
      }
      done();
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup(def, TEX_RES))}`;
  });
}

function canvasTexture(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  scene.textures.addCanvas(key, canvas);
}

function proceduralTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'blank', 4, 4, () => undefined);

  canvasTexture(scene, 'spark', 64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });

  canvasTexture(scene, 'dot', 24, 24, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(12, 12, 11, 0, Math.PI * 2);
    ctx.fill();
  });

  canvasTexture(scene, 'bubble', 32, 32, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,240,255,0.25)';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(11, 11, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Мягкий конус света из абажура (вершина слева по центру).
  canvasTexture(scene, 'cone', 320, 200, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, 88);
    ctx.lineTo(320, 0);
    ctx.lineTo(320, 200);
    ctx.lineTo(0, 112);
    ctx.closePath();
    ctx.clip();
    const g = ctx.createRadialGradient(0, 100, 0, 0, 100, 320);
    g.addColorStop(0, 'rgba(255,246,200,0.9)');
    g.addColorStop(0.5, 'rgba(255,236,170,0.35)');
    g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 320, 200);
  });

  // Большое мягкое свечение вокруг лампы (для тёмных уровней).
  canvasTexture(scene, 'halo', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,240,190,0.55)');
    g.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
}

/** Вертикальный градиент неба для темы. */
export function skyTexture(scene: Phaser.Scene, key: string, top: string, bottom: string): void {
  canvasTexture(scene, key, 8, 512, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 512);
  });
}

export async function loadTextures(scene: Phaser.Scene): Promise<void> {
  proceduralTextures(scene);
  await Promise.all(
    (Object.keys(SPRITES) as SpriteKey[]).map((k) => rasterize(scene, k, SPRITES[k])),
  );
}

/** Изображение спрайта в логическом размере; origin по умолчанию — низ по центру. */
export function addSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: SpriteKey,
  originX = 0.5,
  originY = 1,
): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key).setOrigin(originX, originY).setScale(1 / TEX_RES);
}
