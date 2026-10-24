import Phaser from 'phaser';
import { loadTextures } from '../art/textures';

export const BOOTED_EVENT = 'lq-booted';

/** Prepares all textures once when the game starts. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    void loadTextures(this).then(() => this.game.events.emit(BOOTED_EVENT));
  }
}
