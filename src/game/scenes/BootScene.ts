import Phaser from 'phaser';
import { loadTextures } from '../art/textures';

export const BOOTED_EVENT = 'lq-booted';

/** Готовит все текстуры один раз при запуске игры. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    void loadTextures(this).then(() => this.game.events.emit(BOOTED_EVENT));
  }
}
