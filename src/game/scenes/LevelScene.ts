import Phaser from 'phaser';
import { FALL_LIMIT, PICKUP_RADIUS, PHYS, WORLD_H } from '../config';
import { bus, EV, type HudState, type LevelCompleteEvent, type ToastEvent } from '../events';
import { getLevel } from '../levels';
import { LampPlayer, type Surface } from '../entities/LampPlayer';
import { addSprite } from '../art/textures';
import { TEX_RES } from '../config';
import type { SpriteKey } from '../art/sprites';
import { Platform } from '../entities/Platform';
import { Collectible } from '../entities/Collectible';
import {
  Checkpoint,
  Gate,
  Pedestal,
  Portal,
  StationView,
  WordBoard,
  machineParts,
} from '../entities/WorldObjects';
import { Backdrop, DEPTH } from '../world/background';
import { THEMES, type Theme } from '../world/themes';
import { questions } from '../systems/QuestionManager';
import { input } from '../systems/InputController';
import { audio } from '../systems/AudioManager';
import { speakEnglish } from '../systems/Speech';
import { decodeProgram, runProgram } from '../systems/robotProgram';
import { VOCABULARY, vocab } from '../../data/vocabulary';
import type {
  DecorDef,
  FindStation,
  HelperDef,
  LevelDef,
  WindDef,
  LockStation,
  QuestStation,
  StationDef,
} from '../../types/game';

interface StationRt {
  def: StationDef;
  halfW: number;
  inside: boolean;
  view?: StationView;
  board?: WordBoard;
  parts?: Phaser.GameObjects.Image[];
}

interface WindRt {
  def: WindDef;
  fx: Phaser.GameObjects.Particles.ParticleEmitter;
  active: boolean;
}

interface DecorRt {
  def: DecorDef;
  img: Phaser.GameObjects.Image;
  spinning: boolean;
}

interface HelperRt {
  def: HelperDef;
  img: Phaser.GameObjects.Image;
  started: boolean;
}

interface PedestalRt {
  station: FindStation;
  optionId: string;
  view: Pedestal;
  inside: boolean;
}

const isTouchDevice = () => {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
};

export class LevelScene extends Phaser.Scene {
  private level!: LevelDef;
  private theme!: Theme;
  private backdrop!: Backdrop;
  private player!: LampPlayer;
  private flags = new Set<string>();
  private platforms: Platform[] = [];
  private gates: Gate[] = [];
  private stars: Collectible[] = [];
  private items: Collectible[] = [];
  private checkpoints: Checkpoint[] = [];
  private stations: StationRt[] = [];
  private pedestals: PedestalRt[] = [];
  private portal!: Portal;
  private respawnPoint = { x: 0, y: 0 };
  private starCount = 0;
  /** Мир «на паузе»: открыта карточка, вступление или финальная сцена. */
  private modal = true;
  private completed = false;
  private respawning = false;
  private falls = 0;
  private lookAhead = 0;
  private lastDt = 1 / 60;
  private textureKeys: string[] = [];
  private specialPlatforms: Platform[] = [];
  private winds: WindRt[] = [];
  private decor: DecorRt[] = [];
  private helpers: HelperRt[] = [];

  constructor() {
    super('Level');
  }

  init(data: { levelId: number }): void {
    this.level = getLevel(data.levelId);
    this.theme = THEMES[this.level.theme];
    this.flags = new Set();
    this.platforms = [];
    this.gates = [];
    this.stars = [];
    this.items = [];
    this.checkpoints = [];
    this.stations = [];
    this.pedestals = [];
    this.starCount = 0;
    this.modal = true;
    this.completed = false;
    this.respawning = false;
    this.falls = 0;
    this.lookAhead = 0;
    this.textureKeys = [];
    this.specialPlatforms = [];
    this.winds = [];
    this.decor = [];
    this.helpers = [];
  }

  create(): void {
    const L = this.level;
    questions.beginRun(L.id, levelQuestionIds(L));
    input.reset();

    this.physics.world.gravity.y = PHYS.gravity * (L.physics?.gravityScale ?? 1);
    this.physics.world.setBounds(0, -400, L.width, WORLD_H + 800);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.physics.world.pause();

    this.backdrop = new Backdrop(this, this.theme, L);

    L.platforms.forEach((p, i) => {
      const plat = new Platform(this, p, this.theme, L.id * 100 + i);
      this.platforms.push(plat);
      if (p.kind === 'ice' || p.kind === 'conveyor' || p.kind === 'bouncy') this.specialPlatforms.push(plat);
      this.textureKeys.push(...plat.textureKeys);
    });
    L.gates.forEach((g) => this.gates.push(new Gate(this, g)));
    L.checkpoints.forEach((c) => this.checkpoints.push(new Checkpoint(this, c.x, c.y)));
    this.portal = new Portal(this, L.portal.x, L.portal.y);
    (L.decor ?? []).forEach((d) => this.createDecor(d));
    (L.winds ?? []).forEach((w) => this.createWind(w));
    (L.helpers ?? []).forEach((h) => {
      const img = addSprite(this, h.x, h.y + 4, 'robot').setDepth(DEPTH.station + 0.5);
      img.setScale(0.75 / TEX_RES);
      this.helpers.push({ def: h, img, started: false });
    });
    L.stations.forEach((s) => this.createStation(s));
    L.stars.forEach((s) => this.stars.push(new Collectible(this, s.x, s.y, 'star')));
    L.items.forEach((it) => this.items.push(new Collectible(this, it.x, it.y, it.kind, it)));

    this.respawnPoint = { x: L.spawn.x, y: L.spawn.y };
    this.player = new LampPlayer(this, L.spawn.x, L.spawn.y, this.theme.lampGlow, L.physics);

    const statics = [
      ...this.platforms.filter((p) => p.zone).map((p) => p.collider),
      ...this.gates.map((g) => g.zone),
    ];
    this.physics.add.collider(this.player.sprite, statics);
    const movers = this.platforms.filter((p) => p.mover).map((p) => p.collider);
    if (movers.length) this.physics.add.collider(this.player.sprite, movers);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, L.width, WORLD_H);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setBackgroundColor(this.theme.sky[1]);
    this.onResize();
    this.scale.on('resize', this.onResize, this);

    this.events.on('postupdate', this.postUpdate, this);
    bus.on(EV.QUESTION_SOLVED, this.onQuestionSolved, this);
    bus.on(EV.QUESTION_CLOSED, this.onQuestionClosed, this);
    bus.on(EV.FIND_ACCEPT, this.onFindAccept, this);
    bus.on(EV.LEVEL_START, this.onLevelStart, this);
    this.events.once('shutdown', this.cleanup, this);

    bus.emit(EV.LEVEL_READY, { levelId: L.id });
    this.applyFlags();
    this.emitHud();
    this.installDebugHooks();
  }

  private cleanup(): void {
    this.scale.off('resize', this.onResize, this);
    this.events.off('postupdate', this.postUpdate, this);
    bus.off(EV.QUESTION_SOLVED, this.onQuestionSolved, this);
    bus.off(EV.QUESTION_CLOSED, this.onQuestionClosed, this);
    bus.off(EV.FIND_ACCEPT, this.onFindAccept, this);
    bus.off(EV.LEVEL_START, this.onLevelStart, this);
    // Текстуры платформ создаются на каждый запуск — освобождаем память.
    const keys = this.textureKeys;
    window.setTimeout(() => keys.forEach((k) => this.textures.exists(k) && this.textures.remove(k)), 0);
  }

  private onResize(): void {
    const cam = this.cameras.main;
    cam.setSize(this.scale.width, this.scale.height);
    cam.setZoom(this.scale.height / WORLD_H);
    this.backdrop.layout(cam);
  }

  // ---------- Создание станций ----------

  private createStation(def: StationDef): void {
    const rt: StationRt = { def, halfW: 70, inside: false };
    switch (def.type) {
      case 'quest':
        rt.view = new StationView(this, def.x, def.y, def.npc, '!');
        rt.halfW = def.npc === 'machine' ? 120 : 80;
        if (def.npc === 'machine') rt.parts = machineParts(this, def.x, def.y);
        break;
      case 'lock':
        rt.view = new StationView(this, def.npc === 'keyhole' ? def.x + 90 : def.x, def.y, def.npc, '🔑');
        break;
      case 'word': {
        const v = vocab(def.word);
        rt.board = new WordBoard(this, def.x, def.y, v.emoji, v.word);
        rt.halfW = 50;
        break;
      }
      case 'find': {
        rt.view = new StationView(this, def.x, def.y, def.npc, '?');
        rt.halfW = 80;
        const q = questions.get(def.question);
        def.pedestals.forEach((pos, i) => {
          const opt = q.options[i];
          if (!opt) return;
          this.pedestals.push({
            station: def,
            optionId: opt.id,
            view: new Pedestal(this, pos.x, pos.y, opt.emoji ?? '?', def.pedestalStyle),
            inside: false,
          });
        });
        break;
      }
      case 'hint':
        rt.halfW = 40;
        break;
    }
    this.stations.push(rt);
  }

  // ---------- Игровой цикл ----------

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000;
    this.lastDt = dt;
    for (const p of this.platforms) p.update();
    if (this.completed) return;
    const px = this.player.x;
    const feet = this.player.feetY;
    // Особые поверхности (лёд, конвейер, батут) важнее обычной земли под ними.
    const under = this.player.onGround
      ? this.specialPlatforms.find((p) => p.supports(px, feet)) ?? this.platforms.find((p) => p.supports(px, feet))
      : undefined;
    if (!this.modal) {
      const kind = under?.def.kind;
      const surface: Surface = { ice: kind === 'ice', conveyor: under?.def.conveyor };
      this.player.update(dt, surface);
      if (kind === 'bouncy' && this.player.body.velocity.y >= 0) {
        this.player.launch(under?.def.bounce ?? 980);
        audio.play('jump');
        this.tweens.add({ targets: under?.visual, scaleY: 0.85, duration: 90, yoyo: true });
      }
      this.applyWinds(dt);
    }
    if (this.modal || this.respawning) return;

    if (this.player.y > FALL_LIMIT) {
      this.respawnPlayer();
      return;
    }

    for (const cp of this.checkpoints) {
      if (!cp.active && px >= cp.x - 20 && Math.abs(feet - cp.y) < 160) {
        cp.activate();
        this.respawnPoint = { x: cp.x, y: cp.y - 60 };
        audio.play('checkpoint');
      }
    }

    const cy = this.player.y - 10;
    for (const s of this.stars) {
      if (!s.collected && Phaser.Math.Distance.Between(px, cy, s.x, s.y) < PICKUP_RADIUS) {
        s.collect(px, this.player.y);
        this.starCount++;
        audio.play('star');
        this.emitHud();
      }
    }
    for (const it of this.items) {
      if (!it.collected && it.item && Phaser.Math.Distance.Between(px, cy, it.x, it.y) < PICKUP_RADIUS + 6) {
        it.collect(px, this.player.y);
        audio.play('item');
        const same = this.items.filter((o) => o.kind === it.kind);
        const got = same.filter((o) => o.collected).length;
        const suffix = same.length > 1 ? ` ${got}/${same.length}` : '';
        this.toast({ text: `${it.item.label}${suffix}`, emoji: ITEM_EMOJI[it.kind], kind: 'success' });
        this.setFlag(`item:${it.item.id}`);
      }
    }

    for (const st of this.stations) {
      const inside =
        Math.abs(px - st.def.x) < st.halfW && feet <= st.def.y + 12 && feet >= st.def.y - 260;
      if (inside && !st.inside) {
        st.inside = true;
        this.onEnterStation(st);
        if (this.modal) return;
      } else if (!inside) {
        st.inside = false;
      }
    }

    for (const p of this.pedestals) {
      const inside = Math.abs(px - p.view.x) < 46 && feet <= p.view.y + 12 && feet >= p.view.y - 200;
      if (inside && !p.inside) this.onEnterPedestal(p);
      p.inside = inside;
    }

    if (this.portal.active && Phaser.Math.Distance.Between(px, this.player.y, this.portal.cx, this.portal.cy) < 75) {
      this.completeLevel();
    }

    const cam = this.cameras.main;
    this.lookAhead += (this.player.facing * 100 - this.lookAhead) * Math.min(1, dt * 1.8);
    cam.setFollowOffset(-this.lookAhead, 0);
  }

  // ---------- Потоки, декор, помощники ----------

  private createWind(def: WindDef): void {
    const underwater = this.theme.id === 'underwater';
    const fx = this.add.particles(0, 0, underwater ? 'bubble' : 'spark', {
      x: { min: def.x, max: def.x + def.w },
      y: def.bottom,
      speedY: { min: -260, max: -160 },
      speedX: { min: -12, max: 12 },
      lifespan: ((def.bottom - def.top) / 200) * 1000,
      scale: underwater ? { start: 0.5, end: 0.9 } : { start: 0.35, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      tint: underwater ? 0xffffff : [0xffffff, 0xd8f0ff],
      frequency: 60,
      blendMode: underwater ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD,
      emitting: false,
    });
    fx.setDepth(DEPTH.decor + 2);
    const rt: WindRt = { def, fx, active: false };
    this.winds.push(rt);
    if (!def.activeWhen) this.activateWind(rt);
  }

  private activateWind(w: WindRt): void {
    w.active = true;
    w.fx.start();
  }

  /** Поток поднимает лампу плавно и предсказуемо до верхней границы. */
  private applyWinds(dt: number): void {
    const b = this.player.body;
    for (const w of this.winds) {
      if (!w.active) continue;
      const d = w.def;
      if (this.player.x < d.x || this.player.x > d.x + d.w) continue;
      const feet = this.player.feetY;
      if (feet > d.bottom + 10 || feet < d.top - 30) continue;
      if (feet > d.top) b.setVelocityY(Math.max(b.velocity.y - 3200 * dt, -320));
      else b.setVelocityY(Math.min(b.velocity.y, 40));
    }
  }

  private createDecor(d: DecorDef): void {
    const origin = d.spin ? 0.5 : 1;
    const img = addSprite(this, d.x, d.y, d.key as SpriteKey, 0.5, origin)
      .setDepth(d.front ? DEPTH.station - 0.5 : DEPTH.decor - 1)
      .setScale((d.scale ?? 1) / TEX_RES);
    const rt: DecorRt = { def: d, img, spinning: false };
    this.decor.push(rt);
    if (d.spin && !d.spinWhen) this.startSpin(rt);
  }

  private startSpin(rt: DecorRt): void {
    if (rt.spinning || !rt.def.spin) return;
    rt.spinning = true;
    this.tweens.add({ targets: rt.img, angle: 360, duration: (360 / rt.def.spin) * 1000, repeat: -1 });
  }

  /** Робот-помощник проходит свой маршрут: шаги и прыжки — как в программе. */
  private runHelper(h: HelperRt): void {
    h.started = true;
    const steps = h.def.fromProgram ? this.programPath(h.def) : h.def.path;
    const next = (i: number) => {
      if (i >= steps.length) {
        this.setFlag(h.def.doneFlag);
        return;
      }
      const p = steps[i];
      const img = h.img;
      this.tweens.add({ targets: img, x: p.x, duration: 600, ease: 'Sine.inOut' });
      if (p.jump) {
        this.tweens.add({
          targets: img,
          y: Math.min(img.y, p.y + 4) - 90,
          duration: 300,
          ease: 'Quad.out',
          yoyo: false,
          onComplete: () => this.tweens.add({ targets: img, y: p.y + 4, duration: 300, ease: 'Quad.in' }),
        });
      } else {
        this.tweens.add({ targets: img, y: p.y + 4, duration: 600 });
      }
      audio.play(p.jump ? 'jump' : 'click');
      this.time.delayedCall(700, () => next(i + 1));
    };
    this.time.delayedCall(400, () => next(0));
  }

  /**
   * Маршрут помощника по программе, которую составил ребёнок: старт дорожки —
   * текущее место робота, флажок — последняя точка path (кнопка ворот).
   */
  private programPath(def: HelperDef): HelperDef['path'] {
    const q = questions.get(def.fromProgram as string);
    const answer = questions.state(q.id).answer;
    const track = q.program?.track;
    const end = def.path[def.path.length - 1];
    if (!track || !answer || !end) return def.path;
    const run = runProgram(track, decodeProgram(answer));
    if (!run.success) return def.path;
    const start = track.indexOf('R');
    const cell = (end.x - def.x) / Math.max(1, track.length - 1 - start);
    return run.steps.map((st) => ({ x: def.x + (st.to - start) * cell, y: end.y, jump: st.cmd === 'jump' }));
  }

  private postUpdate(): void {
    for (const p of this.platforms) p.sync();
    if (!this.player.isAnimatingPortal) this.player.syncVisual(this.lastDt);
  }

  // ---------- Станции ----------

  private onEnterStation(st: StationRt): void {
    const def = st.def;
    switch (def.type) {
      case 'hint': {
        const text = isTouchDevice() && def.touchText ? def.touchText : def.text;
        this.toast({ text, emoji: '💡', kind: 'info' });
        st.halfW = -1; // показываем один раз
        break;
      }
      case 'word': {
        const v = vocab(def.word);
        speakEnglish(v.word);
        audio.play('pop');
        st.board?.bounce();
        this.toast({ text: `${v.word} — ${v.ru}`, emoji: v.emoji, word: v.word, kind: 'info' });
        break;
      }
      case 'quest':
        this.enterQuest(st, def);
        break;
      case 'lock':
        this.enterLock(st, def);
        break;
      case 'find':
        this.enterFind(st, def);
        break;
    }
  }

  private missing(req: string[] | undefined): string[] {
    return (req ?? []).filter((f) => !this.flags.has(f));
  }

  private enterQuest(st: StationRt, def: QuestStation): void {
    if (this.flags.has(def.id)) {
      st.view?.bounce();
      this.toast({ text: 'Спасибо, Лучик!', emoji: '💛', kind: 'info' });
      return;
    }
    const miss = this.missing(def.requires);
    if (miss.length) {
      const have = (def.requires?.length ?? 0) - miss.length;
      const progress = (def.requires?.length ?? 0) > 1 ? ` (${have}/${def.requires?.length})` : '';
      audio.play('pop');
      st.view?.bounce();
      this.toast({ text: `${def.requiresText ?? 'Сначала найди нужное'}${progress}`, emoji: '🧐', kind: 'hint' });
      return;
    }
    this.openQuestion(st);
  }

  private openQuestion(st: StationRt): void {
    const def = st.def as QuestStation;
    const idx = def.questions.findIndex((_, i) => !this.flags.has(`${def.id}:${i}`));
    if (idx < 0) return;
    const q = questions.open(def.questions[idx]);
    this.setModal(true);
    st.view?.bounce();
    bus.emit(EV.QUESTION_OPEN, { stationId: def.id, npc: def.npc, question: q, index: idx, total: def.questions.length });
  }

  private onQuestionSolved(e: { stationId: string; questionId: string }): void {
    const st = this.stations.find((s) => s.def.id === e.stationId);
    this.setModal(false);
    if (!st || st.def.type !== 'quest') return;
    const def = st.def;
    const idx = def.questions.indexOf(e.questionId);
    this.player.cheer();
    st.view?.bounce();
    this.setFlag(`${def.id}:${idx}`);
    if (def.questions.every((_, i) => this.flags.has(`${def.id}:${i}`))) {
      this.setFlag(def.id);
    } else {
      // Следующее задание этой станции — после того как ребёнок увидит изменение мира.
      this.time.delayedCall(1500, () => {
        if (st.inside && !this.modal && !this.completed) this.openQuestion(st);
      });
    }
  }

  private onQuestionClosed(): void {
    this.setModal(false);
  }

  private enterLock(st: StationRt, def: LockStation): void {
    if (this.flags.has(def.id)) return;
    if (this.missing(def.requires).length) {
      audio.play('pop');
      st.view?.bounce();
      this.toast({ text: def.requiresText, emoji: def.npc === 'lever' ? '🔒' : '🔑', kind: 'hint' });
      return;
    }
    this.toast({ text: def.doneText, emoji: '✨', kind: 'success' });
    this.setFlag(def.id);
  }

  private enterFind(st: StationRt, def: FindStation): void {
    const q = questions.get(def.question);
    const word = q.word ?? '';
    const target = q.word ?? q.findLabel ?? q.prompt;
    st.view?.bounce();
    if (this.flags.has(def.id)) {
      this.toast({ text: 'Спасибо, Лучик!', emoji: '💛', kind: 'info' });
      return;
    }
    if (this.flags.has(`${def.id}:active`)) {
      if (word) speakEnglish(word);
      this.toast({ text: `Ищи: ${target}`, emoji: '🔎', word: word || undefined, kind: 'info' });
      return;
    }
    this.setModal(true);
    bus.emit(EV.FIND_ANNOUNCE, { stationId: def.id, question: questions.open(def.question) });
  }

  private onFindAccept(e: { stationId: string }): void {
    this.setModal(false);
    this.setFlag(`${e.stationId}:active`);
  }

  private onEnterPedestal(p: PedestalRt): void {
    const def = p.station;
    if (this.flags.has(def.id) || !this.flags.has(`${def.id}:active`)) return;
    const q = questions.get(def.question);
    // Английские предметы озвучиваем и называем; для поиска по описанию — только подсказка.
    const v = VOCABULARY[p.optionId];
    const opt = q.options.find((o) => o.id === p.optionId);
    const res = questions.answer(q.id, p.optionId);
    if (v) speakEnglish(v.word);
    if (res.correct) {
      audio.play('correct');
      p.view.celebrate();
      this.player.cheer();
      this.toast({ text: `${q.explanation} ${q.reward}`, emoji: opt?.emoji ?? '✨', word: v?.word, kind: 'success' });
      this.setFlag(def.id);
    } else {
      audio.play('wrong');
      p.view.shake();
      const text = v ? `Это ${v.word} — ${v.ru}. ${q.hint}` : `Не здесь. ${q.hint}`;
      this.toast({ text, emoji: '🤔', word: v?.word, kind: 'hint' });
    }
  }

  // ---------- Флаги и изменения мира ----------

  private setFlag(flag: string): void {
    if (this.flags.has(flag)) return;
    this.flags.add(flag);
    this.applyFlags();
    this.emitHud();
    if (flag === this.level.finaleFlag) this.runFinale();
  }

  private applyFlags(): void {
    let revealDelay = 0;
    for (const p of this.platforms) {
      if (p.def.showWhen && !p.shown && this.flags.has(p.def.showWhen)) {
        p.reveal(revealDelay);
        revealDelay += 250;
        audio.play('pop');
      }
    }
    for (const g of this.gates) {
      if (!g.opened && this.flags.has(g.def.openWhen)) {
        g.open();
        audio.play('gate');
        this.cameras.main.shake(300, 0.004);
      }
    }
    for (const st of this.stations) {
      const done = this.flags.has(st.def.id);
      st.view?.setBubbleVisible(!done && !(st.def.type === 'find' && this.flags.has(`${st.def.id}:active`)));
      if (st.def.type === 'lock' && done && st.def.npc === 'lever') st.view?.img?.setTexture('leverOn');
      if (st.parts) this.updateMachine(st);
    }
    for (const w of this.winds) {
      if (!w.active && w.def.activeWhen && this.flags.has(w.def.activeWhen)) {
        this.activateWind(w);
        audio.play('pop');
      }
    }
    for (const d of this.decor) {
      if (d.def.spinWhen && this.flags.has(d.def.spinWhen)) this.startSpin(d);
    }
    for (const h of this.helpers) {
      if (!h.started && this.flags.has(h.def.trigger)) this.runHelper(h);
    }
    if (!this.portal.active && this.missing(this.level.portal.requires).length === 0) {
      this.portal.activate();
      audio.play('portal');
      if (!this.level.finaleFlag) {
        this.time.delayedCall(900, () => this.toast({ text: 'Портал открыт! Иди к нему', emoji: '✨', kind: 'success' }));
      }
    }
  }

  /** Машина уровня 4: детали встают по инструкции, затем машина оживает. */
  private updateMachine(st: StationRt): void {
    const parts = st.parts ?? [];
    const id = st.def.id;
    if (this.flags.has(`${id}:0`) && parts[0] && parts[0].alpha === 0 && !parts[0].getData('anim')) {
      // Детали встают в том порядке, который был в инструкции этого прохождения.
      const def = st.def as QuestStation;
      const order = questions.get(def.questions[0]).meta?.partsOrder ?? MACHINE_PARTS;
      parts.forEach((p, i) => {
        p.setData('anim', true);
        const y = p.y;
        p.y = y - 80;
        const turn = Math.max(0, order.indexOf(MACHINE_PARTS[i]));
        this.tweens.add({ targets: p, alpha: 1, y, delay: turn * 350, duration: 450, ease: 'Bounce.out' });
      });
    }
    if (this.flags.has(id) && !st.view?.img?.getData('on')) {
      st.view?.img?.setData('on', true);
      this.tweens.add({ targets: parts[0], angle: 360, duration: 1500, repeat: -1 });
      this.tweens.add({ targets: parts[1], scaleY: parts[1].scaleY * 0.8, duration: 220, yoyo: true, repeat: -1 });
      const glow = this.add
        .image(st.def.x, st.def.y - 120, 'halo')
        .setDepth(DEPTH.station + 0.3)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1.8)
        .setAlpha(0);
      this.tweens.add({ targets: glow, alpha: 0.9, duration: 600, yoyo: true, repeat: -1 });
    }
  }

  private runFinale(): void {
    this.setModal(true);
    const cam = this.cameras.main;
    cam.flash(900, 255, 246, 210);
    audio.play('win');
    if (this.backdrop.darkness) {
      this.tweens.add({ targets: this.backdrop.darkness, alpha: 0, duration: 2600, ease: 'Sine.inOut' });
    }
    this.backdrop.lampLights.forEach((l, i) =>
      this.tweens.add({ targets: l, alpha: 0.9, delay: 300 + i * 120, duration: 600 }),
    );
    this.player.setGlow(0.8);
    const p = this.add.particles(this.player.x, this.player.y - 40, 'spark', {
      speed: { min: 100, max: 420 },
      scale: { start: 0.7, end: 0 },
      lifespan: 1600,
      tint: [0xfff3a0, 0xffffff, 0xffc94a, 0xb8f0ff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    p.setDepth(DEPTH.fx);
    p.explode(80);
    this.time.delayedCall(2000, () => p.destroy());
    for (const d of this.decor) {
      if (d.def.role !== 'finale') continue;
      this.shardsFlyInto(d.img);
    }
    this.toast({ text: this.level.finaleText ?? 'Свет вернулся! Портал открыт', emoji: '🌟', kind: 'success' });
    bus.emit(EV.FINALE);
    this.time.delayedCall(2600, () => this.setModal(false));
  }

  /** Финал главы: восемь осколков слетаются в центральный кристалл. */
  private shardsFlyInto(target: Phaser.GameObjects.Image): void {
    const cx = target.x;
    const cy = target.y - (target.displayHeight * 0.55);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const sh = addSprite(this, cx + Math.cos(a) * 320, cy + Math.sin(a) * 220, 'shard', 0.5, 0.5)
        .setDepth(DEPTH.fx)
        .setScale(0.9 / TEX_RES)
        .setAlpha(0);
      this.tweens.add({ targets: sh, alpha: 1, duration: 300, delay: i * 120 });
      this.tweens.add({
        targets: sh,
        x: cx,
        y: cy,
        angle: 360,
        scale: 0.3 / TEX_RES,
        delay: 400 + i * 120,
        duration: 900,
        ease: 'Cubic.in',
        onComplete: () => sh.destroy(),
      });
    }
    const glow = this.add.image(cx, cy, 'halo').setDepth(DEPTH.fx).setBlendMode(Phaser.BlendModes.ADD).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: glow, alpha: 1, scale: 4, delay: 1800, duration: 900, yoyo: true, hold: 600 });
    this.tweens.add({ targets: target, scale: target.scale * 1.15, delay: 1800, duration: 400, yoyo: true });
  }

  // ---------- Падение, портал, пауза ----------

  private respawnPlayer(): void {
    this.respawning = true;
    this.falls++;
    audio.play('respawn');
    const cam = this.cameras.main;
    cam.fadeOut(200, 255, 255, 255);
    this.time.delayedCall(220, () => {
      this.player.teleport(this.respawnPoint.x, this.respawnPoint.y);
      cam.centerOn(this.respawnPoint.x + this.lookAhead, WORLD_H / 2);
      cam.fadeIn(350, 255, 255, 255);
      this.respawning = false;
      if (this.falls === 1) this.toast({ text: 'Ничего страшного! Пробуем ещё раз', emoji: '🙂', kind: 'info' });
    });
  }

  private completeLevel(): void {
    this.completed = true;
    input.reset();
    audio.play('portal');
    this.player.enterPortal(this.portal.cx, this.portal.cy, () => {
      const e: LevelCompleteEvent = {
        levelId: this.level.id,
        stars: this.starCount,
        totalStars: this.level.stars.length,
      };
      bus.emit(EV.LEVEL_COMPLETE, e);
    });
  }

  private onLevelStart(): void {
    this.setModal(false);
  }

  private setModal(on: boolean): void {
    this.modal = on;
    input.reset();
    if (on) this.physics.world.pause();
    else this.physics.world.resume();
  }

  // ---------- HUD ----------

  private emitHud(): void {
    const goalDef = this.level.goals.find((g) => this.missing(g.done).length > 0);
    let goal: HudState['goal'];
    if (goalDef) {
      const total = goalDef.done.length;
      const have = total - this.missing(goalDef.done).length;
      const word = goalDef.question ? questions.get(goalDef.question).word : undefined;
      const text = word ? `${goalDef.text} ${word}` : goalDef.text;
      goal = { text, emoji: goalDef.emoji, progress: total > 1 ? `${have}/${total}` : undefined };
    } else {
      goal = { text: 'Иди к порталу', emoji: '✨' };
    }
    const hud: HudState = {
      levelId: this.level.id,
      stars: this.starCount,
      totalStars: this.level.stars.length,
      goal,
    };
    bus.emit(EV.HUD, hud);
  }

  private toast(t: ToastEvent): void {
    bus.emit(EV.TOAST, t);
  }

  // ---------- Отладка и автотесты ----------

  private installDebugHooks(): void {
    let enabled = false;
    try {
      enabled = new URLSearchParams(window.location.search).has('debug');
    } catch {
      enabled = false;
    }
    if (!enabled) return;
    (window as unknown as { __LQ: unknown }).__LQ = {
      state: () => ({
        levelId: this.level.id,
        x: this.player.x,
        y: this.player.y,
        feetY: this.player.feetY,
        vx: this.player.body.velocity.x,
        vy: this.player.body.velocity.y,
        onGround: this.player.onGround,
        stars: this.starCount,
        totalStars: this.level.stars.length,
        flags: [...this.flags],
        modal: this.modal,
        completed: this.completed,
        respawn: { ...this.respawnPoint },
        portalActive: this.portal.active,
        cameraZoom: this.cameras.main.zoom,
        textureCount: this.textures.getTextureKeys().length,
        gravity: this.physics.world.gravity.y,
      }),
      teleport: (x: number, y: number) => this.player.teleport(x, y),
      question: (id: string) => questions.get(id),
      variants: () => ({ ...questions.variantKeys }),
      setFlag: (f: string) => this.setFlag(f),
      level: () => this.level,
      physics: PHYS,
    };
  }
}

const MACHINE_PARTS = ['gear', 'spring', 'bulb'];

/** Все задания уровня в порядке станций (связанные вопросы — после своих «источников»). */
function levelQuestionIds(level: LevelDef): string[] {
  return level.stations.flatMap((s) => (s.type === 'quest' ? s.questions : s.type === 'find' ? [s.question] : []));
}

const ITEM_EMOJI: Record<string, string> = {
  light: '✨',
  gem: '💎',
  page: '📜',
  battery: '🔋',
  pearl: '⚪',
  lens: '🔍',
  key: '🔑',
  gear: '⚙️',
  spring: '🌀',
  bulb: '💡',
  star: '⭐',
};
