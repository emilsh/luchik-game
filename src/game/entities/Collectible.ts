import Phaser from 'phaser';
import { TEX_RES } from '../config';
import { addSprite } from '../art/textures';
import type { ItemDef } from '../../types/game';
import { DEPTH } from '../world/background';

/** A star or an item (key, gear, spring, bulb). */
export class Collectible {
  readonly img: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image;
  collected = false;

  constructor(
    private scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
    readonly kind: 'star' | ItemDef['kind'],
    readonly item?: ItemDef,
  ) {
    const big = kind !== 'star';
    this.glow = scene.add
      .image(x, y, 'spark')
      .setDepth(DEPTH.item - 1)
      .setScale(big ? 2.2 : 1.4)
      .setAlpha(big ? 0.75 : 0.5)
      .setTint(kind === 'star' ? 0xfff0a0 : 0xffffff)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.img = addSprite(scene, x, y, kind, 0.5, 0.5).setDepth(DEPTH.item);
    if (big) this.img.setScale(1.1 / TEX_RES);

    scene.tweens.add({
      targets: [this.img, this.glow],
      y: y - 8,
      duration: 900 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    scene.tweens.add({
      targets: this.glow,
      alpha: big ? 0.35 : 0.25,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
    if (kind === 'gear') scene.tweens.add({ targets: this.img, angle: 360, duration: 4000, repeat: -1 });
  }

  collect(targetX: number, targetY: number): void {
    this.collected = true;
    this.scene.tweens.killTweensOf([this.img, this.glow]);
    this.glow.destroy();
    const burst = this.scene.add.particles(this.img.x, this.img.y, 'spark', {
      speed: { min: 80, max: 220 },
      scale: { start: 0.45, end: 0 },
      lifespan: 500,
      tint: [0xfff3a0, 0xffffff, 0xffc94a],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    burst.setDepth(DEPTH.fx);
    burst.explode(this.kind === 'star' ? 12 : 22);
    this.scene.time.delayedCall(700, () => burst.destroy());
    this.scene.tweens.add({
      targets: this.img,
      x: targetX,
      y: targetY - 60,
      scale: this.img.scale * 1.6,
      alpha: 0,
      duration: 450,
      ease: 'Quad.out',
      onComplete: () => this.img.destroy(),
    });
  }
}
