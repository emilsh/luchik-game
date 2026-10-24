import Phaser from 'phaser';
import { TEX_RES } from '../config';
import { addSprite } from '../art/textures';
import { SPRITES } from '../art/sprites';
import type { GateDef, NpcKind } from '../../types/game';
import { DEPTH } from '../world/background';

const FONT = '"SF Pro Rounded", ui-rounded, "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif';

export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number,
  color = '#ffffff',
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      resolution: 3,
      align: 'center',
    })
    .setOrigin(0.5, 0.5);
}

// ---------- Контрольная точка ----------

export class Checkpoint {
  private img: Phaser.GameObjects.Image;
  private light: Phaser.GameObjects.Image;
  active = false;

  constructor(
    private scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
  ) {
    this.img = addSprite(scene, x, y + 4, 'checkpointOff').setDepth(DEPTH.item);
    this.light = scene.add
      .image(x, y - 94, 'halo')
      .setDepth(DEPTH.item - 1)
      .setScale(0.6)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.img.setTexture('checkpointOn');
    this.scene.tweens.add({ targets: this.light, alpha: 1, scale: 0.9, duration: 400 });
    this.scene.tweens.add({ targets: this.img, scaleY: this.img.scaleY * 1.1, duration: 120, yoyo: true });
  }
}

// ---------- Портал ----------

export class Portal {
  private ring: Phaser.GameObjects.Image;
  private swirl: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter;
  active = false;
  readonly cx: number;
  readonly cy: number;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    this.cx = x;
    this.cy = y - 96;
    this.glow = scene.add
      .image(x, this.cy, 'halo')
      .setDepth(DEPTH.portal - 1)
      .setScale(1.6, 2)
      .setAlpha(0.15)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.swirl = addSprite(scene, x, this.cy, 'portalSwirl', 0.5, 0.5).setDepth(DEPTH.portal).setAlpha(0.25);
    this.swirl.setTint(0x9a9ab0);
    this.ring = addSprite(scene, x, y + 4, 'portalRing').setDepth(DEPTH.portal + 0.1);
    this.ring.setTint(0xb0b0b0);
    scene.tweens.add({ targets: this.swirl, angle: 360, duration: 6000, repeat: -1 });
    this.particles = scene.add.particles(x, this.cy, 'spark', {
      x: { min: -50, max: 50 },
      y: { min: -70, max: 70 },
      speed: { min: 10, max: 40 },
      scale: { start: 0.35, end: 0 },
      lifespan: 1200,
      frequency: 90,
      tint: [0xe3ccff, 0xffffff, 0xfff3a0],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.particles.setDepth(DEPTH.portal + 0.2);
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.ring.clearTint();
    this.swirl.clearTint();
    this.scene.tweens.add({ targets: this.swirl, alpha: 1, duration: 800 });
    this.scene.tweens.add({ targets: this.glow, alpha: 0.7, duration: 800 });
    this.scene.tweens.add({
      targets: this.ring,
      scale: this.ring.scale * 1.08,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    this.particles.start();
  }
}

// ---------- Ворота ----------

const GATE_SPRITE = {
  hedge: 'gateHedge',
  vines: 'gateVines',
  door: 'gateDoor',
  crystal: 'gateCrystal',
  ice: 'gateIce',
  bookcase: 'gateBookcase',
} as const;

const GATE_TINT: Record<string, number[]> = {
  door: [0xcfd8e3, 0xffd45c],
  bookcase: [0xffd45c, 0xe0533d, 0x4f81bd],
  crystal: [0xc9f7ff, 0xb054e8, 0xffffff],
  ice: [0xe8fbff, 0xa9e6ff, 0xffffff],
};

export class Gate {
  readonly zone: Phaser.GameObjects.Zone;
  private img: Phaser.GameObjects.Image;
  opened = false;

  constructor(
    private scene: Phaser.Scene,
    readonly def: GateDef,
  ) {
    this.img = addSprite(scene, def.x, def.y + 6, GATE_SPRITE[def.kind]).setDepth(DEPTH.gate);
    // Тело ворот — до самого верха мира, чтобы их нельзя было перепрыгнуть.
    const w = 110;
    this.zone = scene.add.zone(def.x, def.y / 2, w, def.y);
    scene.physics.add.existing(this.zone, true);
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    (this.zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    const h = SPRITES[GATE_SPRITE[this.def.kind]].h;
    const p = this.scene.add.particles(this.def.x, this.def.y - 10, 'dot', {
      x: { min: -70, max: 70 },
      speedY: { min: -160, max: -40 },
      speedX: { min: -60, max: 60 },
      scale: { start: 0.7, end: 0 },
      lifespan: 900,
      tint: GATE_TINT[this.def.kind] ?? [0x7ccb76, 0xfff3a0, 0xff8fb1],
      emitting: false,
    });
    p.setDepth(DEPTH.fx);
    p.explode(40);
    this.scene.time.delayedCall(1200, () => p.destroy());
    if (this.def.kind === 'door' || this.def.kind === 'bookcase') {
      this.scene.tweens.add({ targets: this.img, y: this.img.y - h + 40, duration: 1400, ease: 'Cubic.inOut' });
    } else {
      this.scene.tweens.add({
        targets: this.img,
        y: this.img.y + h,
        alpha: 0.2,
        duration: 1400,
        ease: 'Cubic.in',
        onComplete: () => this.img.setVisible(false),
      });
    }
  }
}

// ---------- Персонаж / объект станции ----------

const NPC_SPRITE: Partial<Record<NpcKind | 'keyhole', keyof typeof SPRITES>> = {
  sign: 'sign',
  snail: 'snail',
  robot: 'robot',
  owl: 'owl',
  machine: 'machine',
  lever: 'leverOff',
  firefly: 'firefly',
  numlock: 'numlock',
  penguin: 'penguin',
  turtle: 'turtle',
  telescope: 'telescope',
  bookstand: 'bookstand',
};

/** Неживые объекты не «дышат». */
const STATIC_NPC = new Set(['machine', 'lever', 'sign', 'numlock', 'telescope', 'bookstand']);

export class StationView {
  readonly img: Phaser.GameObjects.Image | null = null;
  private bubble: Phaser.GameObjects.Container;
  readonly topY: number;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    npc: NpcKind | 'keyhole',
    bubbleText: string,
  ) {
    const key = NPC_SPRITE[npc];
    let top = y - 140;
    if (key) {
      const flyer = npc === 'firefly';
      this.img = addSprite(scene, x, flyer ? y - 70 : y + 4, key).setDepth(DEPTH.station);
      top = (flyer ? y - 70 : y) - SPRITES[key].h;
      if (flyer) {
        scene.tweens.add({ targets: this.img, y: y - 90, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      } else if (!STATIC_NPC.has(npc)) {
        // Живые персонажи слегка «дышат».
        scene.tweens.add({
          targets: this.img,
          scaleY: this.img.scaleY * 1.04,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });
      }
    }
    this.topY = top;

    const circle = scene.add.graphics();
    circle.fillStyle(0xffffff, 1).fillCircle(0, 0, 22);
    circle.lineStyle(4, 0xffb547, 1).strokeCircle(0, 0, 22);
    circle.fillStyle(0xffffff, 1).fillTriangle(-8, 18, 8, 18, 0, 32);
    const txt = label(scene, 0, 1, bubbleText, 28, '#E0662E');
    this.bubble = scene.add.container(x, top - 34, [circle, txt]).setDepth(DEPTH.bubble);
    scene.tweens.add({ targets: this.bubble, y: top - 46, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  setBubbleVisible(on: boolean): void {
    this.bubble.setVisible(on);
  }

  bounce(): void {
    if (!this.img) return;
    const sy = this.img.scaleY;
    this.scene.tweens.add({ targets: this.img, y: this.img.y - 18, duration: 160, yoyo: true, ease: 'Quad.out' });
    this.scene.tweens.add({ targets: this.img, scaleY: sy * 0.9, duration: 90, yoyo: true });
  }
}

// ---------- Табличка со словом ----------

export class WordBoard {
  private c: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    emoji: string,
    word: string,
  ) {
    const board = addSprite(scene, 0, 0, 'wordBoard');
    const pic = label(scene, 0, -102, emoji, 44);
    const w = label(scene, 0, -64, word, 22, '#FFE27A');
    this.c = scene.add.container(x, y + 4, [board, pic, w]).setDepth(DEPTH.station);
  }

  bounce(): void {
    this.scene.tweens.add({ targets: this.c, scale: 1.12, duration: 140, yoyo: true, ease: 'Quad.out' });
  }
}

// ---------- Постамент с картинкой ----------

export class Pedestal {
  private pic: Phaser.GameObjects.Text;
  private glow: Phaser.GameObjects.Image;

  constructor(
    private scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
    emoji: string,
    style: 'stone' | 'ground' = 'stone',
  ) {
    // Несколько эмодзи (например, «дерево и три цветка») рисуем чуть мельче.
    const many = Array.from(emoji).length > 2;
    const lift = style === 'stone' ? 120 : 64;
    if (style === 'stone') {
      addSprite(scene, x, y + 4, 'pedestal').setDepth(DEPTH.station);
    } else {
      scene.add.ellipse(x, y + 2, 150, 18, 0xffffff, 0.25).setDepth(DEPTH.station);
    }
    this.glow = scene.add
      .image(x, y - lift, 'spark')
      .setDepth(DEPTH.station - 0.1)
      .setScale(many ? 3.4 : 2.4)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.pic = label(scene, x, y - lift, emoji, many ? 42 : 60).setDepth(DEPTH.station + 0.1);
    scene.tweens.add({ targets: [this.pic, this.glow], y: y - lift - 10, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  shake(): void {
    this.scene.tweens.add({ targets: this.pic, angle: { from: -12, to: 12 }, duration: 80, yoyo: true, repeat: 2, onComplete: () => this.pic.setAngle(0) });
  }

  celebrate(): void {
    this.scene.tweens.killTweensOf([this.pic, this.glow]);
    this.scene.tweens.add({ targets: this.pic, y: this.y - 200, scale: 1.6, duration: 600, ease: 'Back.out' });
    this.scene.tweens.add({ targets: this.glow, y: this.y - 200, scale: 4, alpha: 0.9, duration: 600 });
    const p = this.scene.add.particles(this.x, this.y - 200, 'spark', {
      speed: { min: 60, max: 240 },
      scale: { start: 0.5, end: 0 },
      lifespan: 900,
      tint: [0xfff3a0, 0xffffff, 0xb8f0ff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    p.setDepth(DEPTH.fx);
    this.scene.time.delayedCall(300, () => p.explode(30));
    this.scene.time.delayedCall(1500, () => p.destroy());
  }
}

/** Детали, встающие в машину (уровень 4). */
export function machineParts(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Image[] {
  const left = x - SPRITES.machine.w / 2;
  const top = y - SPRITES.machine.h;
  const parts: [keyof typeof SPRITES, number, number][] = [
    ['gear', 62, 130],
    ['spring', 110, 130],
    ['bulb', 158, 130],
  ];
  return parts.map(([key, px, py]) =>
    addSprite(scene, left + px, top + py, key, 0.5, 0.5)
      .setDepth(DEPTH.station + 0.2)
      .setAlpha(0)
      .setScale(0.9 / TEX_RES),
  );
}
