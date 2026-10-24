import Phaser from 'phaser';
import { PHYS, PLAYER_BODY, TEX_RES } from '../config';
import { HEAD_PIVOT, HEAD_RIM, LAMP_COLORS, SPRITES } from '../art/sprites';
import { input } from '../systems/InputController';
import { audio } from '../systems/AudioManager';
import { DEPTH } from '../world/background';

export interface Surface {
  ice?: boolean;
  conveyor?: number;
}

const approach = (v: number, target: number, step: number) =>
  v < target ? Math.min(v + step, target) : Math.max(v - step, target);

/**
 * Luchik the lamp. Physics is an invisible Arcade body; the look is a container
 * of a base, a hinged neck (redrawn every frame), and a lamp shade with eyes.
 */
export class LampPlayer {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private visual: Phaser.GameObjects.Container;
  private shadow: Phaser.GameObjects.Ellipse;
  private base: Phaser.GameObjects.Image;
  private arms: Phaser.GameObjects.Graphics;
  private headC: Phaser.GameObjects.Container;
  private eyes: Phaser.GameObjects.Graphics;
  private cone: Phaser.GameObjects.Image;
  private halo: Phaser.GameObjects.Image;

  facing = 1;
  frozen = false;
  private lastGroundedAt = -Infinity;
  private wasGrounded = false;
  private airTime = 0;
  // Squash-and-stretch spring
  private squash = 1;
  private squashVel = 0;
  private runPhase = 0;
  private lookX = 1;
  private blinkTimer = 2.5;
  private blink = 0;
  private time = 0;
  private jumpVelocity: number;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    glow: number,
    physics: { jumpScale?: number; fallScale?: number } = {},
  ) {
    this.jumpVelocity = PHYS.jumpVelocity * (physics.jumpScale ?? 1);
    this.sprite = scene.physics.add.image(x, y, 'blank').setVisible(false);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER_BODY.w, PLAYER_BODY.h, true);
    body.setMaxVelocity(600, PHYS.maxFall * (physics.fallScale ?? 1));
    body.setCollideWorldBounds(true);

    this.shadow = scene.add.ellipse(x, y, 60, 12, 0x000000, 0.16).setDepth(DEPTH.player - 1);
    this.visual = scene.add.container(x, y).setDepth(DEPTH.player);

    this.halo = scene.add
      .image(0, -60, 'halo')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(glow * 0.9)
      .setScale(1.6);
    this.base = scene.add.image(0, 0, 'lampBase').setOrigin(0.5, 1).setScale(1 / TEX_RES);
    this.arms = scene.add.graphics();

    const head = SPRITES.lampHead;
    const headImg = scene.add
      .image(0, 0, 'lampHead')
      .setOrigin(HEAD_PIVOT.x / head.w, HEAD_PIVOT.y / head.h)
      .setScale(1 / TEX_RES);
    this.cone = scene.add
      .image(HEAD_RIM.x - HEAD_PIVOT.x, HEAD_RIM.y - HEAD_PIVOT.y, 'cone')
      .setOrigin(0, 0.5)
      .setScale(0.85, 0.75)
      .setAlpha(glow)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.eyes = scene.add.graphics();
    this.headC = scene.add.container(0, 0, [this.cone, headImg, this.eyes]);

    this.visual.add([this.halo, this.base, this.arms, this.headC]);
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get feetY(): number {
    return this.body.bottom;
  }

  get onGround(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  /** Controls — called in the scene's update. */
  update(dt: number, surface: Surface = {}): void {
    const b = this.body;
    const now = performance.now();
    const grounded = this.onGround;
    if (grounded) this.lastGroundedAt = now;

    let dir = 0;
    if (!this.frozen) dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    // A conveyor adds a gentle drift; the lamp can still walk against it.
    const drift = grounded ? (surface.conveyor ?? 0) : 0;
    const target = dir * PHYS.runSpeed + drift;
    let accel: number;
    if (dir !== 0) {
      accel = grounded ? PHYS.accelGround : PHYS.accelAir;
      // Turning around is faster so the controls feel responsive.
      if (Math.sign(b.velocity.x) === -dir) accel *= 1.6;
    } else {
      accel = grounded ? PHYS.decelGround : PHYS.decelAir;
    }
    // Ice: same speed, but softer acceleration and braking — the slide is predictable.
    if (grounded && surface.ice) accel *= dir !== 0 ? 0.55 : 0.2;
    b.setVelocityX(approach(b.velocity.x, target, accel * dt));
    if (dir !== 0) this.facing = dir;

    const canJump = !this.frozen && now - this.lastGroundedAt <= PHYS.coyoteMs;
    if (canJump && input.consumeJump(PHYS.jumpBufferMs)) {
      b.setVelocityY(-this.jumpVelocity);
      this.lastGroundedAt = -Infinity;
      this.squash = 1.22;
      this.squashVel = 0;
      audio.play('jump');
      this.dust(4);
    }

    if (grounded && !this.wasGrounded && this.airTime > 0.18) {
      this.squashVel = -6 - Math.min(6, this.airTime * 8);
      audio.play('land');
      this.dust(6);
    }
    this.airTime = grounded ? 0 : this.airTime + dt;
    this.wasGrounded = grounded;
  }

  private dust(n: number): void {
    const p = this.scene.add.particles(this.x, this.feetY, 'dot', {
      speedX: { min: -90, max: 90 },
      speedY: { min: -60, max: -10 },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: 0xffffff,
      lifespan: 420,
      emitting: false,
    });
    p.setDepth(DEPTH.player - 2);
    p.explode(n);
    this.scene.time.delayedCall(600, () => p.destroy());
  }

  /** Appearance — called after the physics step. */
  syncVisual(dt: number): void {
    this.time += dt;
    const b = this.body;
    const grounded = this.onGround;
    const speedRatio = Math.min(1, Math.abs(b.velocity.x) / PHYS.runSpeed);

    // Squash spring: stretches up in the air, returns to 1 on the ground.
    let target = 1;
    if (!grounded) target = b.velocity.y < 0 ? 1.12 : 1.04;
    else target = 1 + Math.sin(this.time * 2.4) * 0.025 * (1 - speedRatio);
    this.squashVel += ((target - this.squash) * 220 - this.squashVel * 16) * dt;
    this.squash += this.squashVel * dt;
    const s = Phaser.Math.Clamp(this.squash, 0.6, 1.4);

    // Walk cycle — the lamp hops on its base.
    let hop = 0;
    if (grounded && speedRatio > 0.1) {
      this.runPhase += dt * 15 * speedRatio;
      hop = Math.abs(Math.sin(this.runPhase)) * 7 * speedRatio;
    } else {
      this.runPhase = 0;
    }

    const f = this.facing;
    this.visual.setPosition(this.x, this.feetY - hop);
    this.shadow.setPosition(this.x, this.feetY + 2);
    this.shadow.setVisible(grounded);
    this.shadow.setScale(1 - hop / 30, 1);

    this.base.setScale((f / TEX_RES) * (1 + (1 - s) * 0.25), (1 / TEX_RES) * (1 - (1 - s) * 0.35));

    // Neck: the lower arm leans back, the upper arm forward.
    const lean = grounded ? speedRatio * 0.25 : Phaser.Math.Clamp(-b.velocity.y / 2000, -0.2, 0.25);
    const j0x = 0;
    const j0y = -19 * (1 - (1 - s) * 0.35);
    const l1 = 34 * s;
    const l2 = 31 * s;
    const a1 = -0.38 + lean;
    const a2 = 0.78 + lean * 0.5;
    const ex = j0x + Math.sin(a1) * l1 * f;
    const ey = j0y - Math.cos(a1) * l1;
    const nx = ex + Math.sin(a2) * l2 * f;
    const ny = ey - Math.cos(a2) * l2;

    const g = this.arms;
    g.clear();
    g.lineStyle(8, Phaser.Display.Color.HexStringToColor(LAMP_COLORS.arm).color, 1);
    g.lineBetween(j0x, j0y, ex, ey);
    g.lineBetween(ex, ey, nx, ny);
    g.lineStyle(2.5, Phaser.Display.Color.HexStringToColor(LAMP_COLORS.armLight).color, 1);
    g.lineBetween(j0x - 1.5, j0y - 1, ex - 1.5, ey - 1);
    g.lineBetween(ex - 1.5, ey - 1, nx - 1.5, ny - 1);
    g.fillStyle(0x2d4a60, 1).fillCircle(ex, ey, 6.5);
    g.fillStyle(0x9fb7cc, 1).fillCircle(ex, ey, 2.5);

    // Head: tilts down; looks up when jumping, forward when running.
    let headAngle = 0.16 + Math.sin(this.time * 1.7) * 0.03;
    if (!grounded) headAngle = b.velocity.y < 0 ? -0.15 : 0.25;
    else if (speedRatio > 0.1) headAngle = 0.05 + Math.sin(this.runPhase * 2) * 0.05;
    this.headC.setPosition(nx, ny);
    this.headC.setScale(f, 1);
    this.headC.setRotation(headAngle * f);
    this.halo.setPosition(nx + 30 * f, ny);

    this.drawEyes(dt, grounded);
  }

  private drawEyes(dt: number, grounded: boolean): void {
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blink = 0.16;
      this.blinkTimer = 2 + Math.random() * 3;
    }
    this.blink = Math.max(0, this.blink - dt);
    const open = this.blink > 0 ? 0.15 : 1;
    const vy = this.body.velocity.y;
    this.lookX += ((Math.abs(this.body.velocity.x) > 20 ? 1.2 : 0.4) - this.lookX) * Math.min(1, dt * 8);
    const lookY = grounded ? 0.5 : Phaser.Math.Clamp(vy / 300, -2, 2);

    const g = this.eyes;
    g.clear();
    const eyes: [number, number, number][] = [
      [36 - HEAD_PIVOT.x, 30 - HEAD_PIVOT.y, 7.5],
      [50 - HEAD_PIVOT.x, 28 - HEAD_PIVOT.y, 8],
    ];
    for (const [ex, ey, r] of eyes) {
      g.fillStyle(0xffffff, 1).fillEllipse(ex, ey, r * 2, r * 2 * open);
      g.lineStyle(1.5, 0x4a2a1a, 1).strokeEllipse(ex, ey, r * 2, r * 2 * open);
      if (open > 0.5) {
        const px = ex + 2.2 * this.lookX;
        const py = ey + lookY;
        g.fillStyle(0x2b2440, 1).fillCircle(px, py, r * 0.52);
        g.fillStyle(0xffffff, 1).fillCircle(px + 1.3, py - 1.5, r * 0.2);
      }
    }
    // Smile
    g.lineStyle(1.8, 0x4a2a1a, 1);
    g.beginPath();
    g.arc(44 - HEAD_PIVOT.x, 40 - HEAD_PIVOT.y, 4, 0.3, Math.PI - 0.3);
    g.strokePath();
  }

  teleport(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.body.reset(x, y);
    this.body.setVelocity(0, 0);
    this.squash = 0.8;
  }

  /** Animation of entering the portal. */
  enterPortal(px: number, py: number, onDone: () => void): void {
    this.frozen = true;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.shadow.setVisible(false);
    this.scene.tweens.add({
      targets: this.visual,
      x: px,
      y: py + 40,
      scale: 0.1,
      angle: 360,
      duration: 900,
      ease: 'Cubic.in',
      onComplete: onDone,
    });
  }

  /** Launch by a trampoline. */
  launch(velocity: number): void {
    this.body.setVelocityY(-velocity);
    this.lastGroundedAt = -Infinity;
    this.squash = 0.7;
    this.squashVel = 8;
    this.wasGrounded = false;
    this.airTime = 0.2;
  }

  /** A joyful hop in place (after a correct answer). */
  cheer(): void {
    this.squash = 1.3;
    this.squashVel = 0;
    if (this.onGround) this.body.setVelocityY(-380);
  }

  setGlow(glow: number): void {
    this.cone.setAlpha(glow);
    this.halo.setAlpha(glow * 0.9);
  }

  /** Separate synchronization when the visual is "frozen" by the portal animation. */
  get isAnimatingPortal(): boolean {
    return this.frozen && !this.body.allowGravity;
  }
}
