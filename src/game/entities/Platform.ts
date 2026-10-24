import Phaser from 'phaser';
import { WORLD_H } from '../config';
import type { PlatformDef } from '../../types/game';
import { createPlatformVisual } from '../world/platformArt';
import { DEPTH } from '../world/background';
import type { Theme } from '../world/themes';

/**
 * Платформа: визуал + тело. Земля сталкивается со всех сторон, остальные
 * платформы — только сверху (можно запрыгнуть снизу сквозь них).
 */
export class Platform {
  readonly visual: Phaser.GameObjects.Container;
  readonly textureKeys: string[];
  /** Статическое тело (для неподвижных платформ). */
  readonly zone: Phaser.GameObjects.Zone | null = null;
  /** Подвижное тело (для едущих платформ). */
  readonly mover: Phaser.Physics.Arcade.Image | null = null;
  shown: boolean;
  private h: number;

  constructor(
    private scene: Phaser.Scene,
    readonly def: PlatformDef,
    theme: Theme,
    seed: number,
  ) {
    const kind = def.kind ?? 'ground';
    this.h = def.h ?? (kind === 'ground' ? WORLD_H + 200 - def.y : kind === 'block' ? 60 : 24);
    const { container, textureKeys } = createPlatformVisual(scene, def.x, def.y, def.w, this.h, kind, theme, seed, {
      conveyorDir: Math.sign(def.conveyor ?? 1) || 1,
    });
    this.visual = container.setDepth(DEPTH.platform);
    this.textureKeys = textureKeys;
    this.shown = !def.showWhen;

    const oneWay = kind !== 'ground' && kind !== 'block';
    if (def.move) {
      const m = scene.physics.add.image(def.x + def.w / 2, def.y + this.h / 2, 'blank').setVisible(false);
      const b = m.body as Phaser.Physics.Arcade.Body;
      b.setSize(def.w, this.h, true);
      b.setAllowGravity(false);
      b.setImmovable(true);
      if (def.move.dy) b.setVelocityY(def.move.speed);
      else b.setVelocityX(def.move.speed);
      if (oneWay) this.makeOneWay(b);
      this.mover = m;
    } else {
      const z = scene.add.zone(def.x + def.w / 2, def.y + this.h / 2, def.w, this.h);
      scene.physics.add.existing(z, true);
      if (oneWay) this.makeOneWay(z.body as Phaser.Physics.Arcade.StaticBody);
      this.zone = z;
    }

    if (!this.shown) {
      this.setBodyEnabled(false);
      this.visual.setAlpha(0);
    }
  }

  private makeOneWay(b: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody): void {
    b.checkCollision.down = false;
    b.checkCollision.left = false;
    b.checkCollision.right = false;
  }

  get collider(): Phaser.GameObjects.GameObject {
    return (this.zone ?? this.mover) as Phaser.GameObjects.GameObject;
  }

  private setBodyEnabled(on: boolean): void {
    const body = (this.zone?.body ?? this.mover?.body) as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.enable = on;
  }

  /** Появление платформы с анимацией (после решённого задания). */
  reveal(delay = 0): void {
    if (this.shown) return;
    this.shown = true;
    this.setBodyEnabled(true);
    const v = this.visual;
    v.y = this.def.y + 60;
    v.setScale(1, 0.6);
    this.scene.tweens.add({
      targets: v,
      alpha: 1,
      y: this.def.y,
      scaleY: 1,
      delay,
      duration: 650,
      ease: 'Back.out',
    });
    const p = this.scene.add.particles(this.def.x + this.def.w / 2, this.def.y, 'spark', {
      x: { min: -this.def.w / 2, max: this.def.w / 2 },
      speedY: { min: -120, max: -30 },
      scale: { start: 0.5, end: 0 },
      lifespan: 900,
      tint: [0xffffff, 0xfff3a0, 0xb8f0ff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    p.setDepth(DEPTH.fx);
    this.scene.time.delayedCall(delay, () => p.explode(24));
    this.scene.time.delayedCall(delay + 1200, () => p.destroy());
  }

  /** Движение туда-обратно (по горизонтали или вертикали). */
  update(): void {
    const m = this.mover;
    const mv = this.def.move;
    if (!m || !mv) return;
    const b = m.body as Phaser.Physics.Arcade.Body;
    if (mv.dy) {
      const top = this.def.y;
      const bottom = this.def.y + mv.dy;
      if (b.y >= bottom && b.velocity.y > 0) b.setVelocityY(-mv.speed);
      else if (b.y <= top && b.velocity.y < 0) b.setVelocityY(mv.speed);
    } else {
      const left = this.def.x;
      const right = this.def.x + (mv.dx ?? 0);
      if (b.x >= right && b.velocity.x > 0) b.setVelocityX(-mv.speed);
      else if (b.x <= left && b.velocity.x < 0) b.setVelocityX(mv.speed);
    }
  }

  /** Визуал едущей платформы следует за телом (после шага физики). */
  sync(): void {
    if (this.mover) {
      const b = this.mover.body as Phaser.Physics.Arcade.Body;
      this.visual.x = b.x;
      this.visual.y = b.y;
    }
  }

  /** Текущая верхняя поверхность (у лифтов меняется). */
  get top(): number {
    return this.mover ? (this.mover.body as Phaser.Physics.Arcade.Body).y : this.def.y;
  }

  get left(): number {
    return this.mover ? (this.mover.body as Phaser.Physics.Arcade.Body).x : this.def.x;
  }

  /** Стоит ли лампа на этой платформе (ноги у верхней грани, по x внутри). */
  supports(x: number, feetY: number): boolean {
    if (!this.shown) return false;
    const l = this.left;
    return Math.abs(feetY - this.top) < 6 && x > l - 18 && x < l + this.def.w + 18;
  }
}
