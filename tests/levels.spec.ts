import { expect, test } from '@playwright/test';
import { LEVELS } from '../src/game/levels';
import { QUESTIONS } from '../src/data/questions';
import { PHYS, PLAYER_BODY } from '../src/game/config';
import { runProgram } from '../src/game/systems/robotProgram';
import type { LevelDef, PlatformDef } from '../src/types/game';

// Проверка данных уровней без браузера: каждый уровень проходим от старта
// до портала, все задания достижимы и имеют однозначное решение.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'проверка данных — один раз');
});

interface Surface {
  l: number;
  r: number;
  y: number;
  bounce?: number;
  /** Пара концов вертикального лифта. */
  liftPair?: number;
}

/** Высота подъёма за прыжок и горизонтальная дальность до поверхности на перепаде dh. */
function physics(level: LevelDef) {
  const g = PHYS.gravity * (level.physics?.gravityScale ?? 1);
  const v = PHYS.jumpVelocity * (level.physics?.jumpScale ?? 1);
  const height = (v * v) / (2 * g);
  const reach = (dh: number, vy = v) => {
    // dh > 0 — цель выше. Время полёта до высоты цели на спуске.
    const disc = vy * vy - 2 * g * dh;
    if (disc < 0) return -1;
    const t = (vy + Math.sqrt(disc)) / g;
    return PHYS.runSpeed * t * 0.85; // запас 15%: ребёнок не всегда разгоняется полностью
  };
  return { g, v, height, reach };
}

function surfacesFor(level: LevelDef, flags: Set<string>): Surface[] {
  const out: Surface[] = [];
  let pair = 0;
  const shown = (p: PlatformDef) => !p.showWhen || flags.has(p.showWhen);
  for (const p of level.platforms) {
    if (!shown(p)) continue;
    if (p.move?.dy) {
      pair++;
      out.push({ l: p.x, r: p.x + p.w, y: p.y, liftPair: pair });
      out.push({ l: p.x, r: p.x + p.w, y: p.y + p.move.dy, liftPair: pair });
    } else if (p.move?.dx) {
      out.push({ l: p.x, r: p.x + p.w + p.move.dx, y: p.y });
    } else {
      out.push({ l: p.x, r: p.x + p.w, y: p.y, bounce: p.kind === 'bouncy' ? p.bounce ?? 980 : undefined });
    }
  }
  // Закрытые ворота делят поверхности, на которых стоят.
  for (const gate of level.gates) {
    if (flags.has(gate.openWhen)) continue;
    const gl = gate.x - 55;
    const gr = gate.x + 55;
    for (let i = out.length - 1; i >= 0; i--) {
      const s = out[i];
      if (s.y < gate.y - 1 || s.l >= gr || s.r <= gl) continue;
      if (s.y > gate.y + 1) continue;
      out.splice(i, 1);
      if (s.l < gl) out.push({ ...s, r: gl });
      if (s.r > gr) out.push({ ...s, l: gr });
    }
  }
  return out;
}

function blockedByGate(level: LevelDef, flags: Set<string>, a: Surface, b: Surface): boolean {
  return level.gates.some((gate) => {
    if (flags.has(gate.openWhen)) return false;
    const left = (s: Surface) => s.r <= gate.x;
    const right = (s: Surface) => s.l >= gate.x;
    const opposite = (left(a) && right(b)) || (right(a) && left(b));
    return opposite && Math.min(a.y, b.y) <= gate.y + 1;
  });
}

function canMove(level: LevelDef, flags: Set<string>, a: Surface, b: Surface): boolean {
  if (blockedByGate(level, flags, a, b)) return false;
  if (a.liftPair && a.liftPair === b.liftPair) return true;
  const ph = physics(level);
  const gap = Math.max(0, b.l - a.r, a.l - b.r) - PLAYER_BODY.w / 2;
  const dh = a.y - b.y;
  const vy = a.bounce ? a.bounce : ph.v;
  const rise = (vy * vy) / (2 * ph.g);
  if (dh > rise - 30) return false; // нужно подняться выше цели с запасом
  if (gap <= 0) return true;
  return ph.reach(dh, vy) >= gap;
}

function windLinks(level: LevelDef, flags: Set<string>, all: Surface[]): [Surface, Surface][] {
  const links: [Surface, Surface][] = [];
  for (const w of level.winds ?? []) {
    if (w.activeWhen && !flags.has(w.activeWhen)) continue;
    const near = (s: Surface, pad: number) => s.r >= w.x - pad && s.l <= w.x + w.w + pad;
    const from = all.filter((s) => near(s, 40) && s.y >= w.top);
    const to = all.filter((s) => near(s, 120) && s.y >= w.top + 10);
    for (const a of from) for (const b of to) links.push([a, b]);
  }
  return links;
}

function reachable(level: LevelDef, flags: Set<string>): Surface[] {
  const all = surfacesFor(level, flags);
  const start = all.find((s) => s.l <= level.spawn.x && s.r >= level.spawn.x && s.y >= level.spawn.y);
  if (!start) throw new Error(`level ${level.id}: нет поверхности под стартом`);
  const seen = new Set<Surface>([start]);
  const queue = [start];
  const winds = windLinks(level, flags, all);
  while (queue.length) {
    const a = queue.shift() as Surface;
    for (const b of all) {
      if (seen.has(b)) continue;
      const viaWind = winds.some(([x, y]) => x === a && y === b);
      if (viaWind || canMove(level, flags, a, b)) {
        seen.add(b);
        queue.push(b);
      }
    }
  }
  return [...seen];
}

/** Точка (x, y) достижима, если над доступной поверхностью и не выше прыжка. */
function pointReachable(level: LevelDef, surfaces: Surface[], x: number, y: number, flags: Set<string>): boolean {
  const ph = physics(level);
  const onSurface = surfaces.some((s) => x >= s.l - 30 && x <= s.r + 30 && s.y - y >= -10 && s.y - y <= ph.height + PLAYER_BODY.h * 0.6);
  if (onSurface) return true;
  // Над пропастью: звезда на дуге прыжка между соседними поверхностями.
  const arc = surfaces.some((a) =>
    surfaces.some((b) => a !== b && canMove(level, flags, a, b) && x > Math.min(a.r, b.r) - 10 && x < Math.max(a.l, b.l) + 10 && Math.min(a.y, b.y) - y < ph.height),
  );
  if (arc) return true;
  // В воздушном потоке.
  return (level.winds ?? []).some(
    (w) => (!w.activeWhen || flags.has(w.activeWhen)) && x >= w.x - 20 && x <= w.x + w.w + 20 && y >= w.top - 80 && y <= w.bottom,
  );
}

function playLevel(level: LevelDef) {
  const flags = new Set<string>();
  let changed = true;
  let surfaces: Surface[] = [];
  while (changed) {
    changed = false;
    surfaces = reachable(level, flags);
    const set = (f: string) => {
      if (!flags.has(f)) {
        flags.add(f);
        changed = true;
      }
    };
    const at = (x: number, y: number) => pointReachable(level, surfaces, x, y - 50, flags);
    for (const it of level.items) if (pointReachable(level, surfaces, it.x, it.y, flags)) set(`item:${it.id}`);
    for (const st of level.stations) {
      if (!at(st.x, st.y)) continue;
      const ok = (req?: string[]) => (req ?? []).every((f) => flags.has(f));
      if (st.type === 'quest' && ok(st.requires)) {
        st.questions.forEach((_, i) => set(`${st.id}:${i}`));
        set(st.id);
      } else if (st.type === 'lock' && ok(st.requires)) {
        set(st.id);
      } else if (st.type === 'find') {
        set(`${st.id}:active`);
        // Верный постамент меняется от прохождения к прохождению — достижимы должны быть все.
        if (st.pedestals.every((p) => at(p.x, p.y))) set(st.id);
      }
    }
    for (const h of level.helpers ?? []) if (flags.has(h.trigger)) set(h.doneFlag);
  }
  return { flags, surfaces };
}

for (const level of LEVELS) {
  test(`уровень ${level.id} «${level.name}» проходим без тупиков`, () => {
    const { flags, surfaces } = playLevel(level);
    for (const st of level.stations) {
      if (st.type === 'hint' || st.type === 'word') continue;
      expect(flags.has(st.id), `станция ${st.id} должна выполняться`).toBe(true);
    }
    for (const it of level.items) expect(flags.has(`item:${it.id}`), `предмет ${it.id}`).toBe(true);
    for (const g of level.goals) for (const f of g.done) expect(flags.has(f), `цель «${g.text}»: ${f}`).toBe(true);
    for (const f of level.portal.requires) expect(flags.has(f), `портал требует ${f}`).toBe(true);
    if (level.finaleFlag) expect(flags.has(level.finaleFlag)).toBe(true);
    expect(pointReachable(level, surfaces, level.portal.x, level.portal.y - 60, flags), 'портал достижим').toBe(true);
    const lostStars = level.stars.filter((s) => !pointReachable(level, surfaces, s.x, s.y, flags));
    expect(lostStars, 'все звёзды достижимы').toEqual([]);
    for (const cp of level.checkpoints) {
      expect(surfaces.some((s) => cp.x >= s.l && cp.x <= s.r && Math.abs(s.y - cp.y) < 2), `чекпойнт ${cp.x}`).toBe(true);
    }
  });
}

test('без ответов на задания уровни второй главы пройти нельзя', () => {
  for (const level of LEVELS.filter((l) => l.chapter === 2)) {
    const flags = new Set<string>();
    for (const it of level.items) flags.add(`item:${it.id}`);
    const surfaces = reachable(level, flags);
    expect(pointReachable(level, surfaces, level.portal.x, level.portal.y - 60, flags), `уровень ${level.id}`).toBe(false);
  }
});

test('задания корректны и однозначны', () => {
  const used = new Set<string>();
  for (const level of LEVELS) {
    for (const st of level.stations) {
      const ids = st.type === 'quest' ? st.questions : st.type === 'find' ? [st.question] : [];
      for (const id of ids) {
        expect(QUESTIONS[id], `задание ${id}`).toBeTruthy();
        used.add(id);
      }
      if (st.type === 'find') expect(QUESTIONS[st.question].options.length).toBe(st.pedestals.length);
    }
  }
  for (const q of Object.values(QUESTIONS)) {
    expect(used.has(q.id), `задание ${q.id} используется на уровне`).toBe(true);
    expect(q.hint.length, `${q.id}: есть подсказка`).toBeGreaterThan(5);
    if (q.order) {
      expect([...q.order].sort()).toEqual(q.options.map((o) => o.id).sort());
      expect(q.options.map((o) => o.id)).not.toEqual(q.order); // карточки перемешаны
    } else if (q.program) {
      expect(runProgram(q.program.track, q.program.solution).success, q.id).toBe(true);
      expect(q.program.solution.length).toBeLessThanOrEqual(q.program.slots);
    } else {
      expect(q.options.filter((o) => o.id === q.correct)).toHaveLength(1);
      expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
    }
    if (q.visual?.kind === 'code') {
      const v = q.visual;
      expect(runProgram(v.track, v.steps).success).toBe(false);
      // Ровно одна замена «вперёд» → «прыжок» исправляет программу, и это верный ответ.
      const fixes = v.steps
        .map((_, i) => i)
        .filter((i) => runProgram(v.track, v.steps.map((c, k) => (k === i ? 'jump' : c))).success);
      expect(fixes.map(String)).toEqual([q.correct]);
    }
    if (q.visual?.kind === 'grid') {
      const rows = q.visual.rows;
      const start = rows.findIndex((r) => r.includes('S'));
      const routeOk = (label: string) => {
        let r = start;
        let c = rows[start].indexOf('S');
        for (const step of label.split(' ')) {
          if (step === '→') c++;
          if (step === '←') c--;
          if (step === '↓') r++;
          if (step === '↑') r--;
          const cell = rows[r]?.[c];
          if (cell === undefined || cell === '#') return false;
        }
        return rows[r][c] === 'G';
      };
      const good = q.options.filter((o) => routeOk(o.label ?? ''));
      expect(good.map((o) => o.id)).toEqual([q.correct]);
    }
    if (q.visual?.kind === 'equation') {
      const v = q.visual;
      expect(String(v.op === '+' ? v.a + v.b : v.a - v.b), q.id).toBe(q.correct);
      expect(Math.max(v.a, v.b, Number(q.correct))).toBeLessThanOrEqual(20);
    }
    if (q.visual?.kind === 'count') expect(String(q.visual.count)).toBe(q.correct);
    if (q.visual?.kind === 'energy') {
      const v = q.visual;
      expect(String(v.total - v.steps.reduce((n, s) => n + s.amount, 0))).toBe(q.correct);
    }
  }
});
