import Phaser from 'phaser';
import { PHYS } from './config';
import { BootScene, BOOTED_EVENT } from './scenes/BootScene';
import { LevelScene } from './scenes/LevelScene';

// Один экземпляр Phaser.Game на всё приложение: WebGL-контекст не пересоздаётся
// при каждом входе в уровень (Safari ограничивает их число).

let game: Phaser.Game | null = null;
let booted: Promise<void> | null = null;
let observer: ResizeObserver | null = null;

const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

function measure(el: HTMLElement): { w: number; h: number } {
  const r = el.getBoundingClientRect();
  return {
    w: Math.max(1, Math.round(r.width || window.innerWidth)),
    h: Math.max(1, Math.round(r.height || window.innerHeight)),
  };
}

export function mountGame(container: HTMLElement): void {
  const { w, h } = measure(container);
  const ratio = dpr();
  if (!game) {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      backgroundColor: '#7ec8f5',
      banner: false,
      // Канвас рендерится в физических пикселях, а показывается в CSS-размере.
      scale: { mode: Phaser.Scale.NONE, width: w * ratio, height: h * ratio, zoom: 1 / ratio },
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: PHYS.gravity }, debug: false } },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      audio: { noAudio: true },
      render: { antialias: true, powerPreference: 'high-performance' },
      scene: [BootScene, LevelScene],
    });
    const g = game;
    booted = new Promise((resolve) => g.events.once(BOOTED_EVENT, () => resolve()));
  } else {
    if (game.canvas) container.appendChild(game.canvas);
    game.scale.resize(w * ratio, h * ratio);
    game.loop.wake();
  }
  observer?.disconnect();
  observer = new ResizeObserver(() => {
    if (!game) return;
    const m = measure(container);
    const r = dpr();
    if (game.scale.zoom !== 1 / r) game.scale.setZoom(1 / r);
    game.scale.resize(m.w * r, m.h * r);
  });
  observer.observe(container);
}

export async function startLevel(levelId: number): Promise<void> {
  if (!game || !booted) return;
  await booted;
  const sm = game.scene;
  if (sm.isActive('Level') || sm.isPaused('Level') || sm.isSleeping('Level')) {
    sm.stop('Level');
  }
  sm.start('Level', { levelId });
}

export function pauseLevel(): void {
  if (game?.scene.isActive('Level')) game.scene.pause('Level');
}

export function resumeLevel(): void {
  if (game?.scene.isPaused('Level')) game.scene.resume('Level');
}

export function unmountGame(): void {
  observer?.disconnect();
  observer = null;
  if (!game) return;
  if (game.scene.isActive('Level') || game.scene.isPaused('Level')) game.scene.stop('Level');
  game.loop.sleep();
}
