// Synthesized sounds via the Web Audio API — no audio files.
// The context is created only after the first touch/keypress (a Safari requirement).

export type Sfx =
  | 'jump'
  | 'land'
  | 'star'
  | 'item'
  | 'correct'
  | 'wrong'
  | 'portal'
  | 'gate'
  | 'checkpoint'
  | 'click'
  | 'respawn'
  | 'win'
  | 'pop';

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  delay?: number;
  slideTo?: number;
  attack?: number;
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Main menu melody: eighth notes, null — a rest.
const MELODY: (number | null)[] = [
  72, 76, 79, 76, 74, 72, 74, null,
  72, 76, 79, 81, 79, 76, 74, null,
  76, 79, 81, 79, 76, 74, 72, 74,
  76, 74, 72, 67, 69, 72, null, null,
];
const BASS = [48, 43, 45, 41];
const STEP = 0.28;

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private soundOn = true;
  private musicOn = true;
  private musicWanted = false;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private nextNoteTime = 0;

  /** Called from a user gesture handler. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.8;
        this.master.connect(this.ctx.destination);
        document.addEventListener('visibilitychange', () => {
          if (!this.ctx) return;
          if (document.hidden) void this.ctx.suspend();
          else void this.ctx.resume();
        });
      }
      if (this.ctx.state !== 'running') void this.ctx.resume();
      if (this.musicWanted) this.startMusicLoop();
    } catch {
      this.ctx = null;
    }
  }

  setSound(on: boolean): void {
    this.soundOn = on;
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (on && this.musicWanted) this.startMusicLoop();
    if (!on) this.stopMusicLoop();
  }

  private tone(freq: number, dur: number, o: ToneOpts = {}): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
    const vol = o.vol ?? 0.15;
    const attack = o.attack ?? 0.01;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  play(name: Sfx): void {
    if (!this.soundOn || !this.ctx || this.ctx.state !== 'running') return;
    switch (name) {
      case 'jump':
        this.tone(330, 0.16, { slideTo: 700, vol: 0.12 });
        break;
      case 'land':
        this.tone(160, 0.08, { slideTo: 90, vol: 0.08 });
        break;
      case 'star':
        this.tone(1318, 0.09, { type: 'triangle', vol: 0.12 });
        this.tone(1760, 0.18, { type: 'triangle', vol: 0.12, delay: 0.07 });
        break;
      case 'item':
        [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, 0.14, { type: 'triangle', vol: 0.12, delay: i * 0.06 }));
        break;
      case 'correct':
        [72, 76, 79, 84].forEach((n, i) =>
          this.tone(midi(n), i === 3 ? 0.4 : 0.14, { type: 'triangle', vol: 0.16, delay: i * 0.09 }),
        );
        break;
      case 'wrong':
        // A soft "hm" — no harsh sounds.
        this.tone(392, 0.18, { vol: 0.08 });
        this.tone(330, 0.26, { vol: 0.08, delay: 0.14 });
        break;
      case 'portal':
        for (let i = 0; i < 6; i++) this.tone(midi(72 + i * 2), 0.35, { vol: 0.06, delay: i * 0.05 });
        this.tone(200, 0.6, { slideTo: 800, vol: 0.05, attack: 0.2 });
        break;
      case 'gate':
        this.tone(140, 0.5, { slideTo: 70, vol: 0.18, type: 'triangle' });
        this.tone(midi(79), 0.3, { vol: 0.08, delay: 0.3, type: 'triangle' });
        break;
      case 'checkpoint':
        this.tone(880, 0.12, { type: 'triangle', vol: 0.1 });
        this.tone(1175, 0.25, { type: 'triangle', vol: 0.1, delay: 0.1 });
        break;
      case 'click':
        this.tone(700, 0.06, { vol: 0.08 });
        break;
      case 'pop':
        this.tone(500, 0.1, { slideTo: 1000, vol: 0.1 });
        break;
      case 'respawn':
        [79, 84, 88].forEach((n, i) => this.tone(midi(n), 0.2, { vol: 0.08, delay: i * 0.08 }));
        break;
      case 'win':
        [60, 64, 67, 72, 76, 79, 84].forEach((n, i) =>
          this.tone(midi(n), i === 6 ? 0.8 : 0.18, { type: 'triangle', vol: 0.14, delay: i * 0.1 }),
        );
        [48, 55, 60].forEach((n) => this.tone(midi(n), 1.2, { type: 'sine', vol: 0.08, delay: 0.6, attack: 0.05 }));
        break;
    }
  }

  // ---------- Music ----------

  startMusic(): void {
    this.musicWanted = true;
    this.startMusicLoop();
  }

  stopMusic(): void {
    this.musicWanted = false;
    this.stopMusicLoop();
  }

  private startMusicLoop(): void {
    if (!this.ctx || !this.musicOn || this.musicTimer !== null) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 60);
  }

  private stopMusicLoop(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    while (this.nextNoteTime < ctx.currentTime + 0.3) {
      const delay = Math.max(0, this.nextNoteTime - ctx.currentTime);
      const i = this.musicStep % MELODY.length;
      const note = MELODY[i];
      if (note !== null) this.tone(midi(note), STEP * 1.6, { type: 'triangle', vol: 0.05, delay, attack: 0.02 });
      if (i % 8 === 0) {
        const bass = BASS[Math.floor(i / 8) % BASS.length];
        this.tone(midi(bass), STEP * 7, { type: 'sine', vol: 0.06, delay, attack: 0.05 });
      }
      this.musicStep++;
      this.nextNoteTime += STEP;
    }
  }
}

export const audio = new AudioManager();
