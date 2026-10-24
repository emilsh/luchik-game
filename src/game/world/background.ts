import Phaser from 'phaser';
import { TEX_RES, WORLD_H } from '../config';
import { addSprite, skyTexture } from '../art/textures';
import type { LevelDef } from '../../types/game';
import type { Theme } from './themes';

// Level background: sky, far and middle layers with parallax, decor on the ground.

export const DEPTH = {
  sky: -100,
  far: -80,
  mid: -60,
  decor: -10,
  platform: 0,
  gate: 4,
  station: 6,
  darkness: 8,
  portal: 9,
  item: 10,
  player: 20,
  fx: 30,
  bubble: 40,
};

interface Anchored {
  obj: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject;
  fx: number;
  fy: number;
  fill?: boolean;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class Backdrop {
  private anchored: Anchored[] = [];
  darkness: Phaser.GameObjects.Rectangle | null = null;
  /** Workshop lamp lights — they turn on in the finale. */
  lampLights: Phaser.GameObjects.Image[] = [];

  constructor(
    private scene: Phaser.Scene,
    private theme: Theme,
    private level: LevelDef,
  ) {
    this.build();
  }

  /** Anchoring an object to a fraction of the screen (scrollFactor 0 + accounting for the camera zoom). */
  private anchor(obj: Anchored['obj'], fx: number, fy: number, fill = false) {
    (obj as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor(0);
    this.anchored.push({ obj, fx, fy, fill });
  }

  layout(cam: Phaser.Cameras.Scene2D.Camera): void {
    const vw = cam.width / cam.zoom;
    const vh = cam.height / cam.zoom;
    for (const a of this.anchored) {
      a.obj.x = cam.width / 2 + (a.fx - 0.5) * vw;
      a.obj.y = cam.height / 2 + (a.fy - 0.5) * vh;
      if (a.fill) {
        const sized = a.obj as unknown as Phaser.GameObjects.Components.Size;
        sized.setDisplaySize(vw + 8, vh + 8);
      }
    }
  }

  private build(): void {
    const s = this.scene;
    const t = this.theme;
    const skyKey = `sky-${t.id}`;
    skyTexture(s, skyKey, t.sky[0], t.sky[1]);
    const sky = s.add.image(0, 0, skyKey).setDepth(DEPTH.sky);
    this.anchor(sky, 0.5, 0.5, true);

    switch (t.id) {
      case 'valley':
        this.buildValley();
        break;
      case 'canyon':
        this.buildCanyon();
        break;
      case 'forest':
        this.buildForest();
        break;
      case 'workshop':
        this.buildWorkshop();
        break;
      case 'enchanted':
        this.buildEnchanted();
        break;
      case 'cave':
        this.buildCave();
        break;
      case 'sky':
        this.buildSkyIslands();
        break;
      case 'library':
        this.buildLibrary();
        break;
      case 'factory':
        this.buildFactory();
        break;
      case 'ice':
        this.buildIce();
        break;
      case 'underwater':
        this.buildUnderwater();
        break;
      case 'observatory':
        this.buildObservatory();
        break;
    }
    this.groundDecor();

    if (t.darkness > 0) {
      this.darkness = s.add
        .rectangle(0, 0, 10, 10, 0x0b1030, t.darkness)
        .setDepth(DEPTH.darkness);
      this.anchor(this.darkness, 0.5, 0.5, true);
    }
  }

  /** Width that a layer with the given parallax factor must cover. */
  private span(sf: number): number {
    return this.level.width * sf + 6000;
  }

  private hills(sf: number, color: number, baseY: number, rx: number, ry: number, step: number, seed: number) {
    const g = this.scene.add.graphics().setScrollFactor(sf, 1).setDepth(sf < 0.4 ? DEPTH.far : DEPTH.mid);
    const r = rng(seed);
    g.fillStyle(color, 1);
    const end = this.span(sf);
    for (let x = -600; x < end; x += step) {
      g.fillEllipse(x + r() * 80, baseY + r() * 40, rx * (0.8 + r() * 0.4), ry * (0.8 + r() * 0.4));
    }
    g.fillRect(-600, baseY, end + 600, WORLD_H);
    return g;
  }

  private buildValley(): void {
    const s = this.scene;
    const sunGlow = s.add.image(0, 0, 'halo').setDepth(DEPTH.sky + 1).setScale(1.5).setBlendMode(Phaser.BlendModes.ADD);
    this.anchor(sunGlow, 0.85, 0.16);
    const sun = s.add.graphics().setDepth(DEPTH.sky + 1);
    sun.fillStyle(0xffe36b, 1).fillCircle(0, 0, 56);
    sun.fillStyle(0xfff3a8, 1).fillCircle(-12, -12, 30);
    this.anchor(sun, 0.85, 0.16);
    const r = rng(11);
    for (let x = -200; x < this.span(0.12); x += 520 + r() * 300) {
      const c = addSprite(s, x, 80 + r() * 140, 'cloud', 0.5, 0.5)
        .setScrollFactor(0.12, 1)
        .setDepth(DEPTH.sky + 2)
        .setAlpha(0.95);
      c.setScale((0.6 + r() * 0.6) / TEX_RES);
      s.tweens.add({ targets: c, x: c.x + 60, duration: 6000 + r() * 4000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    this.hills(0.25, this.theme.far, 520, 640, 340, 300, 3);
    this.hills(0.5, this.theme.mid, 590, 560, 260, 360, 7);
    const rt = rng(5);
    for (let x = 100; x < this.span(0.5); x += 380 + rt() * 400) {
      addSprite(s, x, 560 + rt() * 30, 'tree')
        .setScrollFactor(0.5, 1)
        .setDepth(DEPTH.mid + 1)
        .setScale((0.6 + rt() * 0.3) / TEX_RES);
    }
  }

  private buildCanyon(): void {
    const s = this.scene;
    const sunGlow = s.add.image(0, 0, 'halo').setDepth(DEPTH.sky + 1).setScale(2.2).setBlendMode(Phaser.BlendModes.ADD);
    this.anchor(sunGlow, 0.72, 0.32);
    const sun = s.add.graphics().setDepth(DEPTH.sky + 1);
    sun.fillStyle(0xffd36b, 1).fillCircle(0, 0, 80);
    this.anchor(sun, 0.72, 0.32);
    const mesas = (sf: number, color: number, top: number, seed: number) => {
      const g = s.add.graphics().setScrollFactor(sf, 1).setDepth(sf < 0.4 ? DEPTH.far : DEPTH.mid);
      const r = rng(seed);
      g.fillStyle(color, 1);
      const end = this.span(sf);
      for (let x = -600; x < end; x += 420 + r() * 260) {
        const w = 220 + r() * 220;
        const ty = top + r() * 90;
        g.fillPoints(
          [
            new Phaser.Math.Vector2(x, WORLD_H),
            new Phaser.Math.Vector2(x + 40, ty + 20),
            new Phaser.Math.Vector2(x + 60, ty),
            new Phaser.Math.Vector2(x + w - 60, ty),
            new Phaser.Math.Vector2(x + w - 40, ty + 20),
            new Phaser.Math.Vector2(x + w, WORLD_H),
          ],
          true,
        );
        g.fillStyle(0xffffff, 0.12);
        g.fillRect(x + 60, ty, w - 120, 10);
        g.fillStyle(color, 1);
      }
      g.fillRect(-600, 620, end + 600, WORLD_H);
    };
    mesas(0.22, this.theme.far, 330, 21);
    mesas(0.48, this.theme.mid, 430, 29);
  }

  private buildForest(): void {
    const s = this.scene;
    const stars = s.add.graphics().setScrollFactor(0.05, 1).setDepth(DEPTH.sky + 1);
    const r = rng(31);
    for (let i = 0; i < 160; i++) {
      stars.fillStyle(0xffffff, 0.4 + r() * 0.6);
      stars.fillCircle(-300 + r() * this.span(0.05), 10 + r() * 330, 1 + r() * 1.8);
    }
    const moon = s.add.graphics().setDepth(DEPTH.sky + 2);
    moon.fillStyle(0xfff6d5, 1).fillCircle(0, 0, 54);
    moon.fillStyle(0xe8dcb0, 1).fillCircle(-16, -10, 10).fillCircle(14, 14, 7);
    this.anchor(moon, 0.8, 0.18);
    const moonGlow = s.add.image(0, 0, 'halo').setDepth(DEPTH.sky + 1).setScale(1.6).setBlendMode(Phaser.BlendModes.ADD);
    this.anchor(moonGlow, 0.8, 0.18);

    const pines = (sf: number, tint: number, scale: number, seed: number, depth: number) => {
      const rp = rng(seed);
      for (let x = -300; x < this.span(sf); x += 110 + rp() * 120) {
        addSprite(s, x, 660, 'pine')
          .setScrollFactor(sf, 1)
          .setDepth(depth)
          .setTint(tint)
          .setScale((scale * (0.8 + rp() * 0.4)) / TEX_RES);
      }
    };
    pines(0.25, 0x5577aa, 1.3, 41, DEPTH.far);
    const mist = s.add.graphics().setScrollFactor(0.25, 1).setDepth(DEPTH.far + 1);
    mist.fillStyle(0x6a8ccc, 0.18).fillRect(-600, 470, this.span(0.25) + 600, 300);
    pines(0.5, 0x7fb0a8, 1.6, 43, DEPTH.mid);

    s.add.particles(0, 0, 'spark', {
      x: { min: 0, max: this.level.width },
      y: { min: 80, max: 560 },
      lifespan: 5000,
      speedX: { min: -18, max: 18 },
      speedY: { min: -14, max: 14 },
      scale: { start: 0.22, end: 0.05 },
      alpha: { start: 1, end: 0 },
      tint: [0xfff3a0, 0xb8ffde, 0xffe27a],
      frequency: 45,
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(DEPTH.decor + 1);
  }

  private buildWorkshop(): void {
    const s = this.scene;
    const sf = 0.3;
    const g = s.add.graphics().setScrollFactor(sf, 1).setDepth(DEPTH.far);
    const end = this.span(sf);
    g.fillStyle(0xdcae7d, 1).fillRect(-600, 0, end + 600, WORLD_H);
    g.fillStyle(0xc99863, 1);
    for (let x = -600; x < end; x += 120) g.fillRect(x, 0, 6, WORLD_H);
    g.fillStyle(0xa8703f, 1).fillRect(-600, 430, end + 600, WORLD_H);
    g.fillStyle(0x8a5530, 1).fillRect(-600, 420, end + 600, 14);
    const r = rng(51);
    for (let x = 200; x < end; x += 700 + r() * 200) {
      addSprite(s, x, 260, 'window').setScrollFactor(sf, 1).setDepth(DEPTH.far + 1).setScale(0.9 / TEX_RES);
    }
    for (let x = 500; x < this.span(0.38); x += 900 + r() * 300) {
      const gear = addSprite(s, x, 200 + r() * 160, 'bigGear', 0.5, 0.5)
        .setScrollFactor(0.38, 1)
        .setDepth(DEPTH.far + 2)
        .setAlpha(0.85);
      gear.setScale((0.6 + r() * 0.6) / TEX_RES);
      s.tweens.add({ targets: gear, angle: r() > 0.5 ? 360 : -360, duration: 16000 + r() * 8000, repeat: -1 });
    }
    for (let x = 300; x < this.span(0.6); x += 900 + r() * 400) {
      addSprite(s, x, 420, 'shelfJars').setScrollFactor(0.6, 1).setDepth(DEPTH.mid).setScale(0.9 / TEX_RES);
    }
    for (let x = 400; x < this.span(0.75); x += 620) {
      addSprite(s, x, 0, 'hangLamp', 0.5, 0).setScrollFactor(0.75, 1).setDepth(DEPTH.mid + 1);
      const light = s.add
        .image(x, 130, 'halo')
        .setScrollFactor(0.75, 1)
        .setDepth(DEPTH.mid + 2)
        .setScale(1.4)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.lampLights.push(light);
    }
  }

  // ---------- Chapter 2 ----------

  private starfield(count: number, seed: number, maxY = 330): void {
    const g = this.scene.add.graphics().setScrollFactor(0.05, 1).setDepth(DEPTH.sky + 1);
    const r = rng(seed);
    for (let i = 0; i < count; i++) {
      g.fillStyle(0xffffff, 0.4 + r() * 0.6);
      g.fillCircle(-300 + r() * this.span(0.05), 10 + r() * maxY, 1 + r() * 1.8);
    }
  }

  private glowDisc(color: number, fx: number, fy: number, r: number, glow = 1.6): void {
    const s = this.scene;
    const halo = s.add.image(0, 0, 'halo').setDepth(DEPTH.sky + 1).setScale(glow).setBlendMode(Phaser.BlendModes.ADD);
    this.anchor(halo, fx, fy);
    const disc = s.add.graphics().setDepth(DEPTH.sky + 2);
    disc.fillStyle(color, 1).fillCircle(0, 0, r);
    this.anchor(disc, fx, fy);
  }

  private spriteRow(
    key: Parameters<typeof addSprite>[3],
    sf: number,
    y: number,
    step: number,
    scale: number,
    seed: number,
    tint?: number,
    depth = sf < 0.4 ? DEPTH.far : DEPTH.mid,
  ): Phaser.GameObjects.Image[] {
    const r = rng(seed);
    const out: Phaser.GameObjects.Image[] = [];
    for (let x = -200; x < this.span(sf); x += step * (0.7 + r() * 0.6)) {
      const img = addSprite(this.scene, x, y + r() * 30, key)
        .setScrollFactor(sf, 1)
        .setDepth(depth)
        .setScale((scale * (0.8 + r() * 0.4)) / TEX_RES);
      if (tint !== undefined) img.setTint(tint);
      out.push(img);
    }
    return out;
  }

  private motes(tint: number[], speedY: [number, number], frequency = 60, key = 'spark'): void {
    this.scene.add
      .particles(0, 0, key, {
        x: { min: 0, max: this.level.width },
        y: { min: 40, max: 600 },
        lifespan: 5000,
        speedX: { min: -16, max: 16 },
        speedY: { min: speedY[0], max: speedY[1] },
        scale: { start: 0.22, end: 0.05 },
        alpha: { start: 0.9, end: 0 },
        tint,
        frequency,
        blendMode: key === 'spark' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
      })
      .setDepth(DEPTH.decor + 1);
  }

  /** Hanging lamps that turn on in the finale of the level. */
  private hangingLamps(sf: number, step: number): void {
    for (let x = 400; x < this.span(sf); x += step) {
      addSprite(this.scene, x, 0, 'hangLamp', 0.5, 0).setScrollFactor(sf, 1).setDepth(DEPTH.mid + 1);
      const light = this.scene.add
        .image(x, 130, 'halo')
        .setScrollFactor(sf, 1)
        .setDepth(DEPTH.mid + 2)
        .setScale(1.4)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.lampLights.push(light);
    }
  }

  private buildEnchanted(): void {
    this.starfield(120, 61);
    this.glowDisc(0xf3e9ff, 0.82, 0.18, 46);
    this.spriteRow('pine', 0.25, 660, 120, 1.3, 63, 0x6a5ab0);
    this.hills(0.4, 0x3d3470, 610, 600, 240, 380, 67);
    this.spriteRow('tree', 0.5, 600, 340, 1.3, 65, 0x9a8af0);
    this.motes([0xfff3a0, 0xb8ffde, 0xffb8f0], [-14, 14], 40);
  }

  private buildCave(): void {
    const s = this.scene;
    const g = s.add.graphics().setScrollFactor(0.3, 1).setDepth(DEPTH.far);
    const r = rng(71);
    g.fillStyle(this.theme.far, 1);
    for (let x = -600; x < this.span(0.3); x += 90 + r() * 80) {
      const w = 50 + r() * 60;
      g.fillTriangle(x, 0, x + w, 0, x + w / 2, 90 + r() * 160);
    }
    g.fillRect(-600, 0, this.span(0.3) + 600, 20);
    this.hills(0.3, this.theme.far, 640, 500, 260, 320, 73);
    const crystals = this.spriteRow('crystal', 0.45, 610, 260, 1.2, 75, undefined, DEPTH.mid);
    crystals.forEach((c, i) =>
      s.tweens.add({ targets: c, alpha: 0.55, duration: 1400 + (i % 5) * 300, yoyo: true, repeat: -1 }),
    );
    this.hills(0.55, this.theme.mid, 670, 420, 200, 360, 77);
    this.motes([0x9fd8ff, 0xe3ccff], [-8, 8], 90);
  }

  private buildSkyIslands(): void {
    const s = this.scene;
    this.glowDisc(0xfff3a8, 0.18, 0.2, 60, 2);
    const r = rng(81);
    for (const sf of [0.08, 0.15, 0.3]) {
      for (let x = -200; x < this.span(sf); x += 360 + r() * 360) {
        addSprite(s, x, 80 + r() * 380, 'cloud', 0.5, 0.5)
          .setScrollFactor(sf, 1)
          .setDepth(DEPTH.sky + 3 + sf * 10)
          .setAlpha(0.6 + sf)
          .setScale((0.5 + r() * 0.8) / TEX_RES);
      }
    }
    const g = s.add.graphics().setScrollFactor(0.22, 1).setDepth(DEPTH.far);
    for (let x = -300; x < this.span(0.22); x += 500 + r() * 300) {
      const w = 140 + r() * 120;
      const y = 260 + r() * 200;
      g.fillStyle(0xb8a0d8, 0.8);
      g.fillTriangle(x, y, x + w, y, x + w / 2, y + w * 0.7);
      g.fillStyle(0xa8e0a0, 0.9);
      g.fillEllipse(x + w / 2, y, w + 10, 26);
    }
    this.spriteRow('windmill', 0.45, 520, 1100, 0.6, 83, 0xe8e0ff);
  }

  private buildLibrary(): void {
    const s = this.scene;
    const sf = 0.3;
    const g = s.add.graphics().setScrollFactor(sf, 1).setDepth(DEPTH.far);
    g.fillStyle(0x8a4e2e, 1).fillRect(-600, 0, this.span(sf) + 600, WORLD_H);
    for (let x = -400; x < this.span(sf); x += 260) {
      addSprite(s, x, 520, 'bookshelfBg').setScrollFactor(sf, 1).setDepth(DEPTH.far + 1).setScale(1.2 / TEX_RES);
    }
    this.spriteRow('window', 0.3, 230, 1300, 0.8, 91);
    const books = this.spriteRow('floatingBook', 0.55, 260, 700, 1, 93, undefined, DEPTH.mid);
    books.forEach((b, i) =>
      s.tweens.add({ targets: b, y: b.y - 30, angle: 6, duration: 1800 + (i % 4) * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' }),
    );
    this.hangingLamps(0.7, 700);
    this.motes([0xfff3a0], [-6, 6], 140);
  }

  private buildFactory(): void {
    const s = this.scene;
    const sf = 0.3;
    const g = s.add.graphics().setScrollFactor(sf, 1).setDepth(DEPTH.far);
    const end = this.span(sf);
    g.fillStyle(0x5a6b80, 1).fillRect(-600, 0, end + 600, WORLD_H);
    g.fillStyle(0x4e5d70, 1);
    for (let x = -600; x < end; x += 160) g.fillRect(x, 0, 10, WORLD_H);
    g.fillStyle(0x7f8fa3, 1).fillRect(-600, 140, end + 600, 18).fillRect(-600, 190, end + 600, 10);
    g.fillStyle(0xe07b39, 1).fillRect(-600, 380, end + 600, 14);
    const r = rng(101);
    for (let x = 300; x < this.span(0.38); x += 700 + r() * 300) {
      const gear = addSprite(s, x, 260 + r() * 140, 'bigGear', 0.5, 0.5)
        .setScrollFactor(0.38, 1)
        .setDepth(DEPTH.far + 2)
        .setTint(0x9fb3c8)
        .setScale((0.5 + r() * 0.6) / TEX_RES);
      s.tweens.add({ targets: gear, angle: r() > 0.5 ? 360 : -360, duration: 9000 + r() * 6000, repeat: -1 });
    }
    this.spriteRow('robot', 0.5, 560, 900, 1.4, 103, 0x6a7a8e, DEPTH.mid);
    this.hangingLamps(0.7, 800);
  }

  private buildIce(): void {
    const s = this.scene;
    this.glowDisc(0xffffff, 0.8, 0.16, 44);
    const mountains = (sf: number, color: number, base: number, seed: number) => {
      const g = s.add.graphics().setScrollFactor(sf, 1).setDepth(sf < 0.4 ? DEPTH.far : DEPTH.mid);
      const r = rng(seed);
      for (let x = -600; x < this.span(sf); x += 260 + r() * 200) {
        const w = 360 + r() * 260;
        const peak = base - 160 - r() * 160;
        g.fillStyle(color, 1).fillTriangle(x, WORLD_H, x + w, WORLD_H, x + w / 2, peak);
        g.fillStyle(0xffffff, 0.95).fillTriangle(x + w * 0.38, peak + (WORLD_H - peak) * 0.24, x + w * 0.62, peak + (WORLD_H - peak) * 0.24, x + w / 2, peak);
      }
    };
    mountains(0.2, this.theme.far, 480, 111);
    mountains(0.4, 0x9cc8e4, 560, 113);
    this.spriteRow('snowPine', 0.55, 640, 260, 1.1, 115);
    this.motes([0xffffff], [20, 50], 50, 'dot');
  }

  private buildUnderwater(): void {
    const s = this.scene;
    const rays = s.add.graphics().setDepth(DEPTH.sky + 1);
    rays.fillStyle(0xffffff, 0.07);
    for (let i = 0; i < 5; i++) {
      const x = -600 + i * 330;
      rays.fillPoints([new Phaser.Math.Vector2(x, -400), new Phaser.Math.Vector2(x + 120, -400), new Phaser.Math.Vector2(x + 380, 500), new Phaser.Math.Vector2(x + 200, 500)], true);
    }
    this.anchor(rays, 0.5, 0.5);
    const g = s.add.graphics().setScrollFactor(0.25, 1).setDepth(DEPTH.far);
    const r = rng(121);
    g.fillStyle(this.theme.far, 1);
    for (let x = -400; x < this.span(0.25); x += 420 + r() * 200) {
      const w = 200 + r() * 160;
      const top = 280 + r() * 120;
      g.fillRect(x, top, w, WORLD_H - top);
      g.fillStyle(0x0e3a62, 1).fillEllipse(x + w / 2, top + 80, w * 0.4, 110);
      g.fillStyle(this.theme.far, 1);
      g.fillTriangle(x - 10, top, x + w + 10, top, x + w / 2, top - 70);
    }
    this.spriteRow('seaweed', 0.5, 640, 200, 1.4, 123, 0x7fd0b0);
    this.spriteRow('coral', 0.5, 640, 520, 1.2, 125, 0xffc0d0);
    for (let i = 0; i < 8; i++) {
      const fish = s.add
        .text(r() * this.span(0.4), 100 + r() * 380, '🐟', { fontSize: '36px', resolution: 2 })
        .setScrollFactor(0.4, 1)
        .setDepth(DEPTH.mid)
        .setAlpha(0.8);
      s.tweens.add({ targets: fish, x: fish.x + 300, duration: 9000 + r() * 5000, yoyo: true, repeat: -1, flipX: true, ease: 'Sine.inOut' });
    }
    this.motes([0xffffff], [-60, -30], 70, 'bubble');
  }

  private buildObservatory(): void {
    const s = this.scene;
    this.starfield(220, 131, 500);
    const planets = s.add.graphics().setScrollFactor(0.06, 1).setDepth(DEPTH.sky + 2);
    planets.fillStyle(0xffb547, 1).fillCircle(700, 140, 46);
    planets.lineStyle(6, 0xffe27a, 0.8).strokeEllipse(700, 140, 150, 30);
    planets.fillStyle(0x7fd3ff, 1).fillCircle(1700, 90, 26);
    planets.fillStyle(0xff8fb1, 1).fillCircle(2600, 180, 34);
    const g = s.add.graphics().setScrollFactor(0.3, 1).setDepth(DEPTH.far);
    const r = rng(133);
    g.fillStyle(this.theme.far, 1);
    for (let x = -300; x < this.span(0.3); x += 520 + r() * 260) {
      g.fillRect(x, 420, 260, WORLD_H);
      g.fillCircle(x + 130, 420, 130);
      g.fillStyle(0x3a3e88, 1).fillRect(x + 120, 290, 20, 140);
      g.fillStyle(this.theme.far, 1);
    }
    for (let x = -300; x < this.span(0.5); x += 300) {
      const col = s.add.graphics().setScrollFactor(0.5, 1).setDepth(DEPTH.mid);
      col.fillStyle(0x3a3e88, 1).fillRect(x, 300, 34, WORLD_H);
      col.fillStyle(0x4a4ea8, 1).fillRect(x - 8, 292, 50, 14);
    }
    s.add
      .particles(0, 0, 'spark', {
        x: { min: 0, max: this.level.width },
        y: { min: 0, max: 200 },
        speedX: { min: 300, max: 420 },
        speedY: { min: 120, max: 180 },
        lifespan: 900,
        scale: { start: 0.4, end: 0 },
        frequency: 1400,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0.1, 1)
      .setDepth(DEPTH.sky + 3);
    this.hangingLamps(0.7, 900);
  }

  /** Decor on ground platforms: bushes, flowers, cacti, glowing mushrooms. */
  private groundDecor(): void {
    const s = this.scene;
    const r = rng(this.level.id * 101);
    const grounds = this.level.platforms.filter((p) => (p.kind ?? 'ground') === 'ground' && !p.showWhen);
    const busy = [
      ...this.level.stations.map((st) => st.x),
      ...this.level.gates.map((g) => g.x),
      this.level.portal.x,
    ];
    for (const p of grounds) {
      for (let x = p.x + 60; x < p.x + p.w - 60; x += 140 + r() * 180) {
        if (busy.some((bx) => Math.abs(bx - x) < 130)) continue;
        const roll = r();
        let key: Parameters<typeof addSprite>[3];
        switch (this.theme.id) {
          case 'valley':
            key = roll < 0.45 ? 'flower' : roll < 0.85 ? 'bush' : 'tree';
            break;
          case 'canyon':
            key = roll < 0.5 ? 'rock' : 'cactus';
            break;
          case 'forest':
          case 'enchanted':
            key = roll < 0.7 ? 'glowShroom' : 'flower';
            break;
          case 'cave':
            key = roll < 0.6 ? 'crystal' : 'glowShroom';
            break;
          case 'sky':
            key = roll < 0.6 ? 'flower' : 'bush';
            break;
          case 'ice':
            key = 'snowPine';
            if (roll < 0.5) continue;
            break;
          case 'underwater':
            key = roll < 0.5 ? 'coral' : 'seaweed';
            break;
          case 'library':
          case 'factory':
          case 'observatory':
            continue;
          default:
            key = 'shelfJars';
            if (roll < 0.6) continue;
        }
        const scale =
          key === 'tree' ? 0.9 : key === 'shelfJars' ? 0.6 : key === 'snowPine' ? 0.6 : key === 'crystal' ? 0.6 : 0.8 + r() * 0.4;
        addSprite(s, x, p.y + 6, key)
          .setDepth(DEPTH.decor)
          .setScale(scale / TEX_RES)
          .setAlpha(key === 'tree' ? 0.95 : 1);
      }
    }
  }
}
