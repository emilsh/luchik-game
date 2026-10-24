// Shared control state: the keyboard and touch buttons write here,
// LampPlayer reads. Each source is tracked separately, so releasing
// one button does not reset another.

type MoveSource = 'kbLeft' | 'kbRight' | 'touchLeft' | 'touchRight';

const KEY_LEFT = new Set(['ArrowLeft', 'KeyA']);
const KEY_RIGHT = new Set(['ArrowRight', 'KeyD']);
const KEY_JUMP = new Set(['Space', 'ArrowUp', 'KeyW']);

class InputController {
  private held = new Set<MoveSource>();
  private jumpSources = new Set<string>();
  private jumpQueuedAt = -Infinity;
  private attached = false;
  /** Whether to capture game keys (only on the game screen with no windows open). */
  captureKeys = false;
  onPause: (() => void) | null = null;

  get left(): boolean {
    return this.held.has('kbLeft') || this.held.has('touchLeft');
  }

  get right(): boolean {
    return this.held.has('kbRight') || this.held.has('touchRight');
  }

  get jumpHeld(): boolean {
    return this.jumpSources.size > 0;
  }

  press(src: MoveSource): void {
    this.held.add(src);
  }

  release(src: MoveSource): void {
    this.held.delete(src);
  }

  pressJump(src: string): void {
    if (this.jumpSources.has(src)) return;
    this.jumpSources.add(src);
    this.jumpQueuedAt = performance.now();
  }

  releaseJump(src: string): void {
    this.jumpSources.delete(src);
  }

  /** Jump buffer: a press slightly before landing also counts. */
  consumeJump(windowMs: number): boolean {
    if (performance.now() - this.jumpQueuedAt <= windowMs) {
      this.jumpQueuedAt = -Infinity;
      return true;
    }
    return false;
  }

  reset(): void {
    this.held.clear();
    this.jumpSources.clear();
    this.jumpQueuedAt = -Infinity;
  }

  attachKeyboard(): void {
    if (this.attached) return;
    this.attached = true;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.onPause) {
          e.preventDefault();
          this.onPause();
        }
        return;
      }
      if (!this.captureKeys) return;
      if (KEY_LEFT.has(e.code)) this.press('kbLeft');
      else if (KEY_RIGHT.has(e.code)) this.press('kbRight');
      else if (KEY_JUMP.has(e.code)) {
        if (!e.repeat) this.pressJump(`kb:${e.code}`);
      } else return;
      // Don't let Space/arrows scroll the page or press a focused button.
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      if (KEY_LEFT.has(e.code)) this.release('kbLeft');
      else if (KEY_RIGHT.has(e.code)) this.release('kbRight');
      else if (KEY_JUMP.has(e.code)) this.releaseJump(`kb:${e.code}`);
      else return;
      if (this.captureKeys) e.preventDefault();
    });

    // Window focus lost — release everything so the lamp doesn't get "stuck".
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.reset();
    });
  }
}

export const input = new InputController();
