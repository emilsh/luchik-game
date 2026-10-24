import type { AnswerOption, ProgramDef, QuestionDef, RobotCmd } from '../../../types/game';
import { VOCABULARY, vocab } from '../../../data/vocabulary';
import { CMD_ICON, CMD_LABEL, runProgram } from '../robotProgram';
import type { Rng } from './rng';
import { cap, plural, SMALL_MASC, type Noun } from './ru';
import { BUTTON_ACC, COLOR_BUTTONS, type OrderEntry, type StoryEntry } from './banks';

// Builders of variable tasks. Each returns a variant key (for the history
// of repeats) and task fields that are layered over the slot's base definition
// (id, skill, and the reward effect in the world stay the same).

export type Tier = 1 | 2 | 3;

export interface Ctx {
  rng: Rng;
  tier: Tier;
  /** Tasks of the level already created in this playthrough — for linked questions. */
  resolved: Record<string, QuestionDef>;
}

export interface Variant {
  key: string;
  q: Partial<QuestionDef>;
}

const num = (v: number): AnswerOption => ({ id: String(v), label: String(v) });

/** The correct answer and two close wrong ones (±1, ±2), within [lo, hi], in random order. */
export function numberOptions(rng: Rng, correct: number, lo: number, hi: number, n = 3): AnswerOption[] {
  const set = new Set([correct]);
  const near = [...rng.shuffle([correct - 1, correct + 1]), ...rng.shuffle([correct - 2, correct + 2]), correct + 3, correct - 3];
  for (const v of near) {
    if (set.size >= n) break;
    if (v >= lo && v <= hi) set.add(v);
  }
  return rng.shuffle([...set]).map(num);
}

// ---------- Counting ----------

export function countQ(ctx: Ctx, o: { nouns: Noun[]; ranges: Record<Tier, [number, number]>; max: number }): Variant {
  const { rng, tier } = ctx;
  const noun = rng.pick(o.nouns);
  const [lo, hi] = o.ranges[tier];
  const n = rng.int(lo, Math.min(hi, o.max));
  return {
    key: `count:${noun.emoji}:${n}`,
    q: {
      prompt: `Сколько ${noun.forms[2]}?`,
      visual: { kind: 'count', emoji: noun.emoji, count: n },
      options: numberOptions(rng, n, 1, o.max),
      correct: String(n),
      hint: n > 8 ? 'Считай по рядам и не торопись.' : 'Считай по одной: дотронься до каждой пальчиком.',
      explanation: `${n} ${plural(n, noun.forms)}!`,
      meta: { result: n },
    },
  };
}

// ---------- Comparison ----------

export function compareQ(
  ctx: Ctx,
  o: { max: number; min?: number; frame?: (mode: 'more' | 'less') => string },
): Variant {
  const { rng, tier } = ctx;
  const min = o.min ?? 1;
  const mode: 'more' | 'less' = tier === 1 ? 'more' : rng.pick(['more', 'less'] as const);
  const count = tier === 3 ? 3 : 2;
  const nums = new Set<number>();
  const minGap = tier === 1 ? 3 : 1;
  const maxGap = tier === 1 ? 6 : 3;
  const first = rng.int(min, o.max);
  nums.add(first);
  let guard = 0;
  while (nums.size < count && guard++ < 50) {
    const gap = rng.int(minGap, maxGap) * (rng.chance(0.5) ? 1 : -1);
    const v = first + gap * nums.size;
    if (v >= min && v <= o.max) nums.add(v);
  }
  while (nums.size < count) nums.add(nums.size === 1 ? Math.min(o.max, first + minGap) : min);
  const list = rng.shuffle([...nums]);
  const answer = mode === 'more' ? Math.max(...list) : Math.min(...list);
  const others = list.filter((v) => v !== answer);
  const word = mode === 'more' ? 'больше' : 'меньше';
  return {
    key: `cmp:${mode}:${[...list].sort((a, b) => a - b).join('-')}`,
    q: {
      prompt: o.frame ? o.frame(mode) : `Какое число ${word}?`,
      options: list.map((v) => ({ id: String(v), label: String(v), dots: v })),
      correct: String(answer),
      hint: mode === 'more' ? 'Посмотри на точки: где их больше?' : 'Посмотри на точки: где их меньше?',
      explanation:
        others.length === 1
          ? `${answer} ${word}, чем ${others[0]}!`
          : `${answer} — самое ${mode === 'more' ? 'большое' : 'маленькое'} число!`,
    },
  };
}

// ---------- Addition and subtraction ----------

export interface ArithOpts {
  op: '+' | '-';
  max: number;
  nouns: Noun[];
  /** The first number is given in advance (a linked task or collected items). */
  fixedA?: number;
  /** A story wording for the regular form; without it, a set of generic wordings. */
  frame?: (a: number, b: number) => string;
}

export function arithQ(ctx: Ctx, o: ArithOpts): Variant {
  const { rng, tier } = ctx;
  const noun = rng.pick(o.nouns);
  let a: number;
  let b: number;
  if (o.op === '+') {
    const maxSum = tier === 1 ? Math.min(o.max, Math.max(6, Math.round(o.max * 0.6))) : o.max;
    a = o.fixedA ?? rng.int(tier === 1 ? 1 : 2, Math.max(2, maxSum - 2));
    const bMax = Math.max(1, Math.min(tier === 1 ? 3 : 9, maxSum - a, o.max - a));
    b = rng.int(Math.min(tier === 1 ? 1 : 2, bMax), bMax);
  } else {
    a = o.fixedA ?? rng.int(tier === 1 ? 3 : 5, tier === 1 ? Math.min(o.max, 7) : o.max);
    const bMax = Math.max(1, Math.min(tier === 1 ? 3 : a - 1, a - 1));
    b = rng.int(Math.min(2, bMax), bMax);
  }
  const r = o.op === '+' ? a + b : a - b;
  // High difficulty: the second number is missing (3 + ? = 7). Linked tasks stay in the regular form.
  const unknownB = tier === 3 && o.fixedA === undefined && rng.chance(0.6);
  const sym = o.op === '+' ? '+' : '−';
  const answer = unknownB ? b : r;
  let prompt: string;
  let style: string;
  if (unknownB) {
    style = 'unknown';
    prompt = o.op === '+' ? `${a} + ? = ${r}. Сколько не хватает?` : `${a} − ? = ${r}. Сколько убрали?`;
  } else if (o.frame && (rng.chance(0.65) || o.fixedA !== undefined)) {
    style = 'frame';
    prompt = o.frame(a, b);
  } else if (rng.chance(0.5)) {
    style = 'story';
    prompt =
      o.op === '+'
        ? `Было ${a} ${plural(a, noun.forms)}. Добавили ещё ${b}. Сколько стало?`
        : `Было ${a} ${plural(a, noun.forms)}. Убрали ${b}. Сколько осталось?`;
  } else {
    style = 'plain';
    prompt = 'Сколько получится?'; // the equation itself is shown large above the question
  }
  const hint = unknownB
    ? o.op === '+'
      ? `Сколько нужно добавить к ${a}, чтобы стало ${r}? Посчитай пустые места.`
      : `Сколько предметов зачёркнуто?`
    : o.op === '+'
      ? a >= 6 && b >= 3
        ? `Дополни ${a} до 10, потом прибавь остальное. Или посчитай все предметы.`
        : 'Посчитай все предметы вместе.'
      : `Закрой пальчиком ${b} и посчитай остальные.`;
  return {
    key: `${o.op}:${a}:${b}:${style}`,
    q: {
      prompt,
      visual: { kind: 'equation', a, b, op: o.op, emoji: noun.emoji, unknown: unknownB ? 'b' : 'result' },
      options: numberOptions(rng, answer, 0, Math.max(o.max, answer + 2)),
      correct: String(answer),
      hint,
      explanation: `${a} ${sym} ${b} = ${r}`,
      meta: { result: r },
    },
  };
}

// ---------- Energy: a problem in one or two steps ----------

export function energyQ(
  ctx: Ctx,
  o: { max: number; steps: 1 | 2; labels: string[]; frame: (total: number, spend: number[]) => string },
): Variant {
  const { rng, tier } = ctx;
  const total = rng.int(tier === 1 ? 8 : 10, tier === 1 ? Math.min(10, o.max) : o.max);
  const stepsN = o.steps === 2 && tier === 1 ? 2 : o.steps;
  const spend: number[] = [];
  let left = total;
  for (let i = 0; i < stepsN; i++) {
    const most = Math.max(1, Math.min(tier === 1 ? 4 : 7, left - 1 - (stepsN - 1 - i)));
    const v = rng.int(Math.min(2, most), most);
    spend.push(v);
    left -= v;
  }
  return {
    key: `energy:${total}:${spend.join('-')}`,
    q: {
      prompt: o.frame(total, spend),
      visual: {
        kind: 'energy',
        total,
        steps: spend.map((amount, i) => ({ label: o.labels[i] ?? `Шаг ${i + 1}`, amount })),
      },
      options: numberOptions(rng, left, 0, total),
      correct: String(left),
      hint:
        spend.length === 2
          ? `Сначала ${total} − ${spend[0]}, потом отними ещё ${spend[1]}. Или посчитай светящиеся молнии.`
          : 'Посчитай светящиеся молнии, которые остались.',
      explanation: `${total} − ${spend.join(' − ')} = ${left}`,
      meta: { result: left },
    },
  };
}

// ---------- Patterns ----------

export function numberSeqQ(ctx: Ctx, o: { max: number }): Variant {
  const { rng, tier } = ctx;
  for (let guard = 0; guard < 40; guard++) {
    const down = tier === 3 && rng.chance(0.5);
    const step = tier === 1 ? rng.pick([1, 2]) : tier === 2 ? rng.pick([2, 3, 5]) : rng.pick(down ? [1, 2, 3] : [3, 4, 5]);
    const len = tier === 1 ? 3 : rng.pick([3, 4]);
    const start = down ? rng.int(step * len + 1, o.max) : rng.int(tier === 1 ? 1 : 0, 5);
    const items = Array.from({ length: len }, (_, i) => start + (down ? -1 : 1) * step * i);
    const answer = start + (down ? -1 : 1) * step * len;
    if (answer < 0 || answer > o.max || items.some((v) => v < 0 || v > o.max)) continue;
    const word = down ? 'отнимаем' : 'прибавляем';
    return {
      key: `seq:${start}:${down ? '-' : '+'}${step}:${len}`,
      q: {
        prompt: 'Какое число дальше?',
        visual: { kind: 'sequence', items: items.map(String) },
        options: numberOptions(rng, answer, 0, o.max + 5),
        correct: String(answer),
        hint: `Каждый раз ${word} ${step}: ${items.join(' → ')} → ?`,
        explanation: `${[...items, answer].join(', ')} — каждый раз ${down ? '−' : '+'}${step}!`,
        meta: { result: answer },
      },
    };
  }
  return { key: 'seq:fallback', q: {} };
}

export const PATTERN_SETS: string[][] = [
  ['☀️', '🌙', '⭐'],
  ['☁️', '🌈', '⚡'],
  ['🍎', '🍐', '🍊'],
  ['🔴', '🔵', '🟢'],
  ['🐱', '🐶', '🐰'],
  ['🌸', '🍀', '🌻'],
];

export function patternQ(ctx: Ctx, o: { sets?: string[][] } = {}): Variant {
  const { rng, tier } = ctx;
  const sets = o.sets ?? PATTERN_SETS;
  const setIdx = rng.int(0, sets.length - 1);
  const [A, B, C] = rng.shuffle(sets[setIdx]);
  const type = tier === 1 ? 'AB' : tier === 2 ? rng.pick(['ABB', 'AAB'] as const) : rng.pick(['ABC', 'ABB'] as const);
  const unit = type === 'AB' ? [A, B] : type === 'ABB' ? [A, B, B] : type === 'AAB' ? [A, A, B] : [A, B, C];
  const len = type === 'AB' ? rng.pick([4, 5]) : rng.pick([5, 6, 7].filter((l) => l % unit.length !== 0));
  const items = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
  const answer = unit[len % unit.length];
  const ids = { [A]: 'a', [B]: 'b', [C]: 'c' } as Record<string, string>;
  return {
    key: `pat:${type}:${setIdx}:${len}:${A}${B}`,
    q: {
      prompt: 'Что будет дальше?',
      visual: { kind: 'sequence', items },
      options: rng.shuffle([A, B, C]).map((e) => ({ id: ids[e], emoji: e })),
      correct: ids[answer],
      hint: `Повторяется кусочек: ${unit.join(' ')}. Найди его в ряду.`,
      explanation: `Узор ${unit.join(' ')} повторяется!`,
    },
  };
}

// ---------- English ----------

const others = (rng: Rng, pool: string[], exclude: string[], n: number) =>
  rng.shuffle(pool.filter((w) => !exclude.includes(w))).slice(0, n);

export function wordToPictureQ(
  ctx: Ctx,
  o: { targets: string[]; pool: string[]; avoid?: string[]; prompt?: (w: string) => string },
): Variant {
  const { rng, tier } = ctx;
  const choices = o.targets.filter((w) => !(o.avoid ?? []).includes(w));
  const W = rng.pick(choices.length ? choices : o.targets);
  const rest = others(rng, o.pool, [W], tier === 1 ? 1 : 2);
  const opts = rng.shuffle([W, ...rest]);
  const v = vocab(W);
  return {
    key: `w2p:${W}:${[...rest].sort().join('-')}`,
    q: {
      prompt: o.prompt ? o.prompt(W) : `Где ${W}?`,
      word: W,
      visual: { kind: 'word', word: W },
      options: opts.map((w) => ({ id: w, emoji: vocab(w).emoji })),
      correct: W,
      hint: v.hint,
      explanation: `${W} — ${v.ru}!`,
      meta: { target: W },
    },
  };
}

export function pictureToWordQ(ctx: Ctx, o: { targets: string[]; pool: string[]; avoid?: string[] }): Variant {
  const { rng, tier } = ctx;
  const choices = o.targets.filter((w) => !(o.avoid ?? []).includes(w));
  const W = rng.pick(choices.length ? choices : o.targets);
  const rest = others(rng, o.pool, [W], tier === 1 ? 1 : 2);
  const v = vocab(W);
  return {
    key: `p2w:${W}:${[...rest].sort().join('-')}`,
    q: {
      prompt: 'Как это по-английски?',
      word: W,
      visual: { kind: 'picture', emoji: v.emoji },
      options: rng.shuffle([W, ...rest]).map((w) => ({ id: w, label: w })),
      correct: W,
      hint: `Вспомни табличку: ${v.emoji} — это ${v.ru}.`,
      explanation: `${W} — ${v.ru}!`,
      meta: { target: W },
    },
  };
}

/** Finding an item in the world: always 3 options — one per pedestal. */
export function findWordQ(ctx: Ctx, o: { targets: string[]; pool: string[]; avoid?: string[] }): Variant {
  const { rng } = ctx;
  const choices = o.targets.filter((w) => !(o.avoid ?? []).includes(w));
  const W = rng.pick(choices.length ? choices : o.targets);
  const rest = others(rng, o.pool, [W], 2);
  const v = vocab(W);
  return {
    key: `find:${W}:${[...rest].sort().join('-')}`,
    q: {
      word: W,
      visual: { kind: 'find', word: W, emoji: v.emoji },
      options: rng.shuffle([W, ...rest]).map((w) => ({ id: w, emoji: vocab(w).emoji, label: w })),
      correct: W,
      hint: v.hint,
      explanation: `${W} — ${v.ru}!`,
      meta: { target: W },
    },
  };
}

const COLOR_ITEMS: Record<string, string[]> = {
  BLUE: ['🫐', '💙', '🧢'],
  GREEN: ['🥦', '🍏', '🐸', '🍀'],
  red: ['🍓', '🍎', '❤️'],
  yellow: ['🍌', '🌻', '🐥'],
  orange: ['🍊', '🥕'],
};

export function colorQ(ctx: Ctx): Variant {
  const { rng, tier } = ctx;
  const W = rng.pick(['BLUE', 'GREEN']);
  const other = W === 'BLUE' ? 'GREEN' : 'BLUE';
  // At low difficulty the distractors are clearly a different color; higher up there is also a "neighboring" color.
  const distractColors = tier === 1 ? rng.shuffle(['red', 'yellow', 'orange']).slice(0, 2) : [other, rng.pick(['red', 'yellow', 'orange'])];
  const right = rng.pick(COLOR_ITEMS[W]);
  const wrong = distractColors.map((c) => rng.pick(COLOR_ITEMS[c]));
  const v = vocab(W);
  return {
    key: `color:${W}:${right}:${wrong.join('')}`,
    q: {
      prompt: `Выбери что-то ${W}`,
      word: W,
      visual: { kind: 'word', word: W },
      options: rng.shuffle([right, ...wrong]).map((e, i) => ({ id: e === right ? 'right' : `w${i}`, emoji: e })),
      correct: 'right',
      hint: v.hint,
      explanation: `${W} — ${v.ru}!`,
      meta: { target: W },
    },
  };
}

// ---------- Reading ----------

/**
 * A question about a story from the bank. The second question station of the same story passes
 * sameAs — then the story is the same, but the question is different.
 */
export function storyQ(ctx: Ctx, o: { bank: StoryEntry[]; sameAs?: string; avoidStory?: string }): Variant {
  const { rng, tier } = ctx;
  const prev = o.sameAs ? ctx.resolved[o.sameAs] : undefined;
  const entry =
    (prev && o.bank.find((e) => e.key === prev.meta?.storyKey)) ??
    rng.pick(o.bank.filter((e) => e.key !== o.avoidStory).length ? o.bank.filter((e) => e.key !== o.avoidStory) : o.bank);
  const used = prev?.prompt;
  let pool = entry.questions.filter((q) => q.prompt !== used);
  // Low difficulty — questions whose answer is right in the text first; high — "why?".
  if (!prev) {
    const preferred = pool.filter((q) => (tier === 1 ? q.kind === 'literal' : tier === 3 ? q.kind === 'cause' : true));
    if (preferred.length) pool = preferred;
  }
  const sq = rng.pick(pool);
  return {
    key: `story:${entry.key}:${entry.questions.indexOf(sq)}`,
    q: {
      story: entry.story,
      prompt: sq.prompt,
      options: rng.shuffle(sq.options),
      correct: sq.correct,
      hint: sq.hint,
      explanation: sq.explanation,
      meta: { storyKey: entry.key },
    },
  };
}

/** "Put in order": a story from the bank or (at high difficulty) buttons in arbitrary order. */
export function orderQ(ctx: Ctx, o: { bank: OrderEntry[]; avoidSameAs?: string; buttons?: boolean }): Variant {
  const { rng, tier } = ctx;
  const avoid = o.avoidSameAs ? ctx.resolved[o.avoidSameAs]?.meta?.storyKey : undefined;
  if (o.buttons && tier === 3 && rng.chance(0.5)) {
    const steps = rng.shuffle(COLOR_BUTTONS);
    const story = [
      `Сначала нажми ${BUTTON_ACC[steps[0].id]} кнопку.`,
      `Потом — ${BUTTON_ACC[steps[1].id]}.`,
      `В конце — ${BUTTON_ACC[steps[2].id]}.`,
    ];
    return finishOrder(rng, `buttons:${steps.map((s) => s.id).join('-')}`, story, steps, 'Читай по порядку: «сначала», «потом», «в конце».');
  }
  const pool = o.bank.filter((e) => e.key !== avoid);
  const entry = rng.pick(pool.length ? pool : o.bank);
  return finishOrder(rng, `order:${entry.key}`, entry.story, entry.steps, entry.hint, entry.key);
}

function finishOrder(rng: Rng, key: string, story: string[], steps: AnswerOption[], hint: string, storyKey?: string): Variant {
  let opts = rng.shuffle(steps);
  // The cards are never already in the correct order.
  while (opts.every((s, i) => s.id === steps[i].id)) opts = rng.shuffle(steps);
  return {
    key,
    q: {
      story,
      prompt: 'Нажимай картинки по порядку',
      options: opts,
      order: steps.map((s) => s.id),
      correct: '',
      hint,
      explanation: `${steps.map((s) => s.label).join(' → ')}!`,
      meta: { storyKey: storyKey ?? key },
    },
  };
}

const PARTS = [
  { id: 'gear', emoji: '⚙️', acc: 'шестерёнку', label: 'Шестерёнку' },
  { id: 'spring', emoji: '🌀', acc: 'пружину', label: 'Пружину' },
  { id: 'bulb', emoji: '💡', acc: 'лампочку', label: 'Лампочку' },
];

/** Level 4: assembly instructions — the order of parts and the question change. */
export function instructionQ(ctx: Ctx): Variant {
  const { rng, tier } = ctx;
  const order = rng.shuffle(PARTS);
  const story = [`Сначала вставь ${order[0].acc}.`, `Потом вставь ${order[1].acc}.`, `${cap(order[2].acc)} вставь последней.`];
  const which = tier === 1 ? rng.pick([0, 2]) : rng.pick([0, 1, 2]);
  const word = ['первой', 'второй', 'последней'][which];
  const marker = ['сначала', 'потом', 'последней'][which];
  return {
    key: `instr:${order.map((p) => p.id).join('-')}:${which}`,
    q: {
      story,
      prompt: `Какую деталь нужно вставить ${word}?`,
      options: rng.shuffle(PARTS).map((p) => ({ id: p.id, emoji: p.emoji, label: p.label })),
      correct: order[which].id,
      hint: `Найди в инструкции слово «${marker}».`,
      explanation: `Да! ${cap(order[which].acc)} — ${word}.`,
      meta: { partsOrder: order.map((p) => p.id) },
    },
  };
}

// ---------- Logic: color and shape ----------

interface Stone {
  emoji: string;
  color: 'blue' | 'red' | 'orange' | 'green';
  shape: 'circle' | 'square' | 'diamond';
}

const STONES: Stone[] = [
  { emoji: '🔵', color: 'blue', shape: 'circle' },
  { emoji: '🔷', color: 'blue', shape: 'diamond' },
  { emoji: '🟦', color: 'blue', shape: 'square' },
  { emoji: '🔴', color: 'red', shape: 'circle' },
  { emoji: '🟥', color: 'red', shape: 'square' },
  { emoji: '🟠', color: 'orange', shape: 'circle' },
  { emoji: '🔶', color: 'orange', shape: 'diamond' },
  { emoji: '🟧', color: 'orange', shape: 'square' },
  { emoji: '🟢', color: 'green', shape: 'circle' },
  { emoji: '🟩', color: 'green', shape: 'square' },
];

const COLOR_ADJ = { blue: 'синий', red: 'красный', orange: 'оранжевый', green: 'зелёный' };
const COLOR_PL = { blue: 'синие', red: 'красные', orange: 'оранжевые', green: 'зелёные' };
const SHAPE_ADJ = { circle: 'круглый', square: 'квадратный', diamond: 'ромбик' };

export function logicQ(ctx: Ctx): Variant {
  const { rng, tier } = ctx;
  for (let guard = 0; guard < 60; guard++) {
    const c = rng.pick(['blue', 'red', 'orange', 'green'] as const);
    const sh = rng.pick(['circle', 'square', 'diamond'] as const);
    let test: (s: Stone) => boolean;
    let story: string[];
    let hint: string;
    if (tier === 1) {
      test = (s) => s.color !== c;
      story = [`Дверь откроет камень, который не ${COLOR_ADJ[c]}.`];
      hint = `Убери все ${COLOR_PL[c]} камни. Что осталось?`;
    } else if (tier === 2) {
      test = (s) => s.color !== c && s.shape !== sh;
      story = [`Дверь откроет камень, который не ${COLOR_ADJ[c]}.`, `И он не ${SHAPE_ADJ[sh]}.`];
      hint = `Сначала убери все ${COLOR_PL[c]} камни. Потом посмотри на форму.`;
    } else {
      test = (s) => s.color === c && s.shape !== sh;
      story = [`Дверь откроет ${COLOR_ADJ[c]} камень.`, `Но он не ${SHAPE_ADJ[sh]}.`];
      hint = `Найди все ${COLOR_PL[c]} камни. Какой из них не ${SHAPE_ADJ[sh]}?`;
    }
    const good = STONES.filter(test);
    const bad = STONES.filter((s) => !test(s));
    if (good.length === 0 || bad.length < 2) continue;
    const right = rng.pick(good);
    // Wrong ones are "almost right": they match the correct one in a single attribute.
    const near = bad.filter((s) => s.color === right.color || s.shape === right.shape);
    const wrongPool = near.length >= 2 ? near : bad;
    const wrong = rng.shuffle(wrongPool).slice(0, 2);
    return {
      key: `logic:${tier}:${c}:${sh}:${right.emoji}`,
      q: {
        story,
        prompt: 'Какой камень откроет дверь?',
        options: rng.shuffle([right, ...wrong]).map((s) => ({ id: s === right ? 'right' : s.emoji, emoji: s.emoji })),
        correct: 'right',
        hint,
        explanation: `Да! ${right.emoji} подходит ко всем словам записки.`,
      },
    };
  }
  return { key: 'logic:fallback', q: {} };
}

// ---------- Route on the map ----------

type Cell = [number, number];

function monotonePaths(rows: number, cols: number): string[][] {
  const out: string[][] = [];
  const walk = (r: number, c: number, path: string[]) => {
    if (r === rows - 1 && c === cols - 1) return out.push(path);
    if (c < cols - 1) walk(r, c + 1, [...path, '→']);
    if (r < rows - 1) walk(r + 1, c, [...path, '↓']);
    return undefined;
  };
  walk(0, 0, []);
  return out;
}

function cellsOf(path: string[]): Cell[] {
  let r = 0;
  let c = 0;
  return path.map((step) => {
    if (step === '→') c++;
    else r++;
    return [r, c] as Cell;
  });
}

export function routeQ(ctx: Ctx): Variant {
  const { rng, tier } = ctx;
  const rows = 3;
  const cols = tier === 3 ? 4 : 3;
  const paths = monotonePaths(rows, cols);
  for (let guard = 0; guard < 80; guard++) {
    const good = rng.pick(paths);
    const goodCells = new Set(cellsOf(good).map(([r, c]) => `${r},${c}`));
    const wrongs = rng.shuffle(paths.filter((p) => p !== good)).slice(0, 2);
    const storms = new Set<string>();
    for (const w of wrongs) {
      const blockable = cellsOf(w)
        .slice(0, -1)
        .map(([r, c]) => `${r},${c}`)
        .filter((k) => !goodCells.has(k));
      if (!blockable.length) break;
      storms.add(rng.pick(blockable));
    }
    if (storms.size === 0) continue;
    // Medium and high difficulty — more clouds on the map (only off the correct path).
    const extra = tier === 1 ? 0 : tier === 2 ? 1 : 2;
    const free: string[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const k = `${r},${c}`;
        if (!goodCells.has(k) && k !== '0,0' && !storms.has(k)) free.push(k);
      }
    rng.shuffle(free).slice(0, extra).forEach((k) => storms.add(k));
    const blocked = (p: string[]) => cellsOf(p).some(([r, c]) => storms.has(`${r},${c}`));
    if (blocked(good) || !wrongs.every(blocked)) continue;
    const grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) =>
        r === 0 && c === 0 ? 'S' : r === rows - 1 && c === cols - 1 ? 'G' : storms.has(`${r},${c}`) ? '#' : '.',
      ).join(''),
    );
    const opts = rng.shuffle([good, ...wrongs]).map((p, i) => ({ id: p === good ? 'right' : `w${i}`, label: p.join(' ') }));
    return {
      key: `route:${grid.join('/')}:${good.join('')}`,
      q: {
        visual: { kind: 'grid', rows: grid },
        options: opts,
        correct: 'right',
        hint: 'Проведи пальцем по каждой дорожке. Где нет тучек?',
        explanation: `${good.join(' ')} — тучи позади!`,
      },
    };
  }
  return { key: 'route:fallback', q: {} };
}

// ---------- Robot programs ----------

function makeTrack(rng: Rng, len: number, pits: number): string | null {
  const cells = Array(len).fill('.');
  cells[0] = 'R';
  cells[len - 1] = 'G';
  const spots = rng.shuffle(Array.from({ length: len - 3 }, (_, i) => i + 2)); // not next to the start and not on the flag
  let placed = 0;
  for (const i of spots) {
    if (placed >= pits) break;
    if (cells[i - 1] === '_' || cells[i + 1] === '_' || i >= len - 1) continue;
    cells[i] = '_';
    placed++;
  }
  return placed === pits ? cells.join('') : null;
}

/** Shortest program: go forward, jump before a pit. */
export function greedyProgram(track: string): RobotCmd[] {
  const prog: RobotCmd[] = [];
  let pos = track.indexOf('R');
  while (pos < track.length - 1) {
    if (track[pos + 1] === '_') {
      prog.push('jump');
      pos += 2;
    } else {
      prog.push('forward');
      pos += 1;
    }
  }
  return prog;
}

export function programQ(ctx: Ctx): Variant {
  const { rng, tier } = ctx;
  for (let guard = 0; guard < 40; guard++) {
    const len = tier === 1 ? 5 : tier === 2 ? rng.pick([6, 7]) : rng.pick([7, 8]);
    const track = makeTrack(rng, len, tier === 1 ? 1 : 2);
    if (!track) continue;
    const solution = greedyProgram(track);
    if (!runProgram(track, solution).success) continue;
    // Exactly as many slots as steps in the shortest program: this makes the solution unambiguous in length.
    const program: ProgramDef = { track, slots: solution.length, solution };
    return {
      key: `prog:${track}`,
      q: {
        prompt: 'Составь программу: робот должен дойти до флажка 🚩',
        options: [],
        correct: '',
        program,
        hint: 'Перед каждой ямой нужен прыжок ⤴️. Иди по дорожке пальцем.',
      },
    };
  }
  return { key: 'prog:fallback', q: {} };
}

export function debugQ(ctx: Ctx): Variant {
  const { rng, tier } = ctx;
  const toggle = (c: RobotCmd): RobotCmd => (c === 'jump' ? 'forward' : 'jump');
  for (let guard = 0; guard < 80; guard++) {
    const len = tier === 1 ? 5 : tier === 2 ? rng.pick([5, 6]) : rng.pick([6, 7]);
    const track = makeTrack(rng, len, tier === 1 ? 1 : tier === 2 ? rng.pick([1, 2]) : 2);
    if (!track) continue;
    const good = greedyProgram(track);
    if (good.length !== 3) continue; // exactly three commands — at most three answer options
    // The bug is one wrong command: "forward" instead of a jump, or an extra jump.
    // At low difficulty — only a missed jump (the robot falls into a pit, which is clearer).
    const candidates = good.map((_, i) => i).filter((i) => tier > 1 || good[i] === 'jump');
    const bugAt = rng.pick(candidates);
    const buggy = good.map((c, i) => (i === bugAt ? toggle(c) : c));
    if (runProgram(track, buggy).success) continue;
    const fixes = buggy.map((_, i) => i).filter((i) => runProgram(track, buggy.map((c, k) => (k === i ? toggle(c) : c))).success);
    if (fixes.length !== 1 || fixes[0] !== bugAt) continue;
    const need = good[bugAt] === 'jump' ? 'нужен прыжок ⤴️' : 'нужен шаг вперёд ➡️';
    return {
      key: `debug:${track}:${bugAt}`,
      q: {
        prompt: 'В программе одна ошибка. Нажми на неправильную команду.',
        visual: { kind: 'code', track, steps: buggy },
        options: buggy.map((c, i) => ({ id: String(i), label: `${i + 1}. ${CMD_ICON[c]} ${CMD_LABEL[c]}` })),
        correct: String(bugAt),
        hint: 'Пройди пальцем по дорожке шаг за шагом. Где робот упадёт?',
        explanation: `Верно! На ${bugAt + 1}-м шаге ${need}.`,
      },
    };
  }
  return { key: 'debug:fallback', q: {} };
}

// ---------- Finding by description ----------

const NUM_WORD = (n: number) => SMALL_MASC[n] ?? String(n);

/** Level 5: the firefly's home — a tree, a color, and the number of flowers. Each wrong option differs by one attribute. */
export function homeDescQ(ctx: Ctx): Variant {
  const { rng, tier } = ctx;
  const TREES = [
    { id: 'oak', emoji: '🌳', loc: 'возле большого дуба', hint: 'Дуб — круглое дерево.' },
    { id: 'pine', emoji: '🌲', loc: 'возле высокой ёлки', hint: 'Ёлка — острая, как треугольник.' },
  ];
  const FLOWERS = [
    { id: 'red', emoji: '🌹', adj: 'красных' },
    { id: 'yellow', emoji: '🌼', adj: 'жёлтых' },
    { id: 'pink', emoji: '🌷', adj: 'розовых' },
  ];
  const tree = rng.pick(TREES);
  const flower = rng.pick(FLOWERS);
  const n = rng.int(2, tier === 1 ? 3 : 4);
  const make = (t: typeof tree, f: typeof flower, k: number) => t.emoji + f.emoji.repeat(k);
  const otherTree = TREES.find((t) => t !== tree) ?? tree;
  const otherFlower = rng.pick(FLOWERS.filter((f) => f !== flower));
  const otherN = n === 2 ? 3 : n - 1;
  // Low difficulty: the difference is in the tree and color; higher — in the number of flowers (they must be counted).
  const wrongA = make(otherTree, flower, n);
  const wrongB = tier === 1 ? make(tree, otherFlower, n) : make(tree, flower, otherN);
  const right = make(tree, flower, n);
  return {
    key: `home:${tree.id}:${flower.id}:${n}:${tier === 1 ? 'color' : 'count'}`,
    q: {
      story: [`Светлячок живёт ${tree.loc}.`, `Рядом растут ${NUM_WORD(n)} ${flower.adj} цветка.`],
      prompt: 'Найди дом светлячка',
      findLabel: 'дом светлячка',
      visual: { kind: 'find' },
      options: rng.shuffle([
        { id: 'right', emoji: right },
        { id: 'wrongA', emoji: wrongA },
        { id: 'wrongB', emoji: wrongB },
      ]),
      correct: 'right',
      hint: `${tree.hint} И посчитай цветы: нужно ${NUM_WORD(n)}.`,
      explanation: 'Нашёл! Это дом светлячка.',
    },
  };
}

/** Level 8: a book by description — the topic and the cover color. */
export function bookDescQ(ctx: Ctx): Variant {
  const { rng, tier } = ctx;
  const TOPICS = [
    { id: 'sea', pic: '🐳', about: 'про море', cover: 'кит' },
    { id: 'space', pic: '🚀', about: 'про космос', cover: 'ракета' },
    { id: 'dino', pic: '🦖', about: 'про динозавров', cover: 'динозавр' },
    { id: 'cats', pic: '🐱', about: 'про котят', cover: 'котёнок' },
    { id: 'forest', pic: '🌲', about: 'про лес', cover: 'ёлка' },
  ];
  const COLORS = [
    { id: 'blue', book: '📘', adj: 'синяя' },
    { id: 'green', book: '📗', adj: 'зелёная' },
    { id: 'orange', book: '📙', adj: 'оранжевая' },
    { id: 'red', book: '📕', adj: 'красная' },
  ];
  const topic = rng.pick(TOPICS);
  const color = rng.pick(COLORS);
  const otherTopic = rng.pick(TOPICS.filter((t) => t !== topic));
  const otherColor = rng.pick(COLORS.filter((c) => c !== color));
  const useColor = tier !== 1;
  const right = color.book + topic.pic;
  const wrongA = (useColor ? color : otherColor).book + otherTopic.pic;
  const wrongB = useColor ? otherColor.book + topic.pic : rng.pick(COLORS).book + rng.pick(TOPICS.filter((t) => t !== topic && t !== otherTopic)).pic;
  const story = useColor
    ? [`Нужна ${color.adj} книга ${topic.about}.`, `На обложке — ${topic.cover}.`]
    : [`Нужна книга ${topic.about}.`, `На обложке — ${topic.cover}.`];
  return {
    key: `book:${topic.id}:${useColor ? color.id : 'any'}`,
    q: {
      story,
      prompt: 'Найди нужную книгу',
      findLabel: `книга ${topic.about}`,
      visual: { kind: 'find' },
      options: rng.shuffle([
        { id: 'right', emoji: right },
        { id: 'wrongA', emoji: wrongA },
        { id: 'wrongB', emoji: wrongB },
      ]),
      correct: 'right',
      hint: useColor ? `Нужно и то и другое: ${color.adj} обложка и ${topic.cover}.` : `На обложке должен быть ${topic.cover}.`,
      explanation: 'Нашёл! Это та самая книга.',
    },
  };
}

/** Level 11: where the key is hidden — the hiding place and what is nearby. */
export function keyDescQ(ctx: Ctx): Variant {
  const { rng } = ctx;
  const HIDES = [
    { id: 'shell', emoji: '🐚', loc: 'в ракушке', nom: 'Ракушка' },
    { id: 'stone', emoji: '🪨', loc: 'под камнем', nom: 'Камень' },
  ];
  const NEAR = [
    { id: 'boat', emoji: '⛵', instr: 'лодкой' },
    { id: 'anchor', emoji: '⚓', instr: 'якорем' },
    { id: 'crab', emoji: '🦀', instr: 'крабом' },
    { id: 'fish', emoji: '🐟', instr: 'рыбкой' },
  ];
  const hide = rng.pick(HIDES);
  const near = rng.pick(NEAR);
  const otherHide = HIDES.find((h) => h !== hide) ?? hide;
  const otherNear = rng.pick(NEAR.filter((n) => n !== near));
  return {
    key: `key:${hide.id}:${near.id}`,
    q: {
      story: [`Ключ спрятан ${hide.loc}.`, `${hide.nom} лежит рядом с ${near.instr}.`],
      prompt: 'Найди ключ',
      findLabel: `${hide.nom.toLowerCase()} рядом с ${near.instr}`,
      visual: { kind: 'find' },
      options: rng.shuffle([
        { id: 'right', emoji: near.emoji + hide.emoji },
        { id: 'wrongA', emoji: otherNear.emoji + hide.emoji },
        { id: 'wrongB', emoji: near.emoji + otherHide.emoji },
      ]),
      correct: 'right',
      hint: 'Нужны сразу двое: тайник и тот, кто рядом.',
      explanation: 'Ключ найден!',
    },
  };
}

export const vocabWords = (list: string[]) => list.filter((w) => w in VOCABULARY);
