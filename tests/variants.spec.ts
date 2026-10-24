import { expect, test } from '@playwright/test';
import { LEVELS } from '../src/game/levels';
import { buildLevelQuestions, tierFor, validateQuestion } from '../src/game/systems/variants';
import { SLOTS } from '../src/game/systems/variants/slots';
import { QUESTIONS } from '../src/data/questions';
import type { LevelDef, QuestionDef, SkillType } from '../src/types/game';

// Variable tasks: correctness, coherence, variety, absence of repeats
// and difficulty tuning. Without a browser — directly on the generator.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'проверка генератора — один раз');
});

const idsOf = (l: LevelDef) =>
  l.stations.flatMap((s) => (s.type === 'quest' ? s.questions : s.type === 'find' ? [s.question] : []));

const masteryAll = (v: 0 | 1 | null): Partial<Record<SkillType, number[]>> => {
  const out: Partial<Record<SkillType, number[]>> = {};
  for (const q of Object.values(QUESTIONS)) out[q.skill] = v === null ? [] : [v, v, v, v, v];
  return out;
};

const build = (l: LevelDef, seed: number, mastery = masteryAll(null), history: Record<string, string[]> = {}) =>
  buildLevelQuestions({ levelId: l.id, ids: idsOf(l), seed, mastery, history });

const CAP: Record<number, number> = { 1: 10, 2: 10, 3: 10, 4: 10, 5: 15, 6: 15, 7: 20, 8: 20, 9: 20, 10: 15, 11: 15, 12: 20 };
const L3_TAUGHT: Record<string, string[]> = {
  'l3-star': ['CAT', 'DOG', 'SUN', 'STAR'],
  'l3-cat': ['CAT', 'DOG', 'SUN', 'STAR'],
  'l3-find-apple': ['CAT', 'DOG', 'SUN', 'STAR', 'MOON', 'FISH', 'APPLE', 'BOOK'],
  'l3-moon': ['CAT', 'DOG', 'SUN', 'STAR', 'MOON', 'FISH', 'APPLE', 'BOOK', 'TREE'],
  'l3-fish': ['CAT', 'DOG', 'SUN', 'STAR', 'MOON', 'FISH', 'APPLE', 'BOOK', 'TREE'],
};

function numbersIn(q: QuestionDef): number[] {
  const v = q.visual;
  const out: number[] = [];
  if (v?.kind === 'equation') out.push(v.a, v.b, v.op === '+' ? v.a + v.b : v.a - v.b);
  if (v?.kind === 'count') out.push(v.count);
  if (v?.kind === 'energy') out.push(v.total);
  for (const o of q.options) if (o.label && /^\d+$/.test(o.label) && o.id === q.correct) out.push(Number(o.label));
  return out;
}

test('у каждого задания уровней есть генератор вариантов', () => {
  for (const l of LEVELS) for (const id of idsOf(l)) expect(SLOTS[id], id).toBeTruthy();
});

test('все варианты корректны, связны и в пределах уровня', () => {
  for (const l of LEVELS) {
    const finds = l.stations.filter((s) => s.type === 'find');
    for (const m of [masteryAll(0), masteryAll(null), masteryAll(1)]) {
      for (let seed = 1; seed <= 40; seed++) {
        const { questions, keys } = build(l, seed * 977, m);
        for (const id of idsOf(l)) {
          const q = questions[id];
          expect(validateQuestion(q), `${id} seed ${seed}`).toEqual([]);
          expect(keys[id], `${id}: использован исходный вариант`).not.toBe('base');
          expect(q.reward).toBe(QUESTIONS[id].reward);
          for (const n of numbersIn(q)) expect(n, `${id}: ${q.prompt}`).toBeLessThanOrEqual(CAP[l.id]);
          if (L3_TAUGHT[id]) {
            for (const o of q.options) expect(L3_TAUGHT[id], `${id}: слово ${o.id} ещё не показано`).toContain(o.id);
          }
        }
        for (const st of finds) {
          if (st.type !== 'find') continue;
          expect(questions[st.question].options).toHaveLength(st.pedestals.length);
        }
        // Linked tasks use shared data.
        const eq = (id: string) => questions[id]?.visual as { a: number; b: number } | undefined;
        if (l.id === 5) expect(eq('l5-add')?.a).toBe(questions['l5-count'].meta?.result);
        if (l.id === 10) expect(eq('l10-gate-b')?.a).toBe(questions['l10-gate-a'].meta?.result);
        if (l.id === 12) expect(eq('l12-sub')?.a).toBe(questions['l12-add'].meta?.result);
        if (l.id === 11) expect(eq('l11-pearls')?.a).toBe(5);
        if (l.id === 1) {
          const [a, b] = [questions['l1-snail-why'], questions['l1-snail-where']];
          expect(a.story).toEqual(b.story);
          expect(a.prompt).not.toBe(b.prompt);
        }
        if (l.id === 5) {
          const [a, b] = [questions['l5-why'], questions['l5-name']];
          expect(a.story).toEqual(b.story);
          expect(a.prompt).not.toBe(b.prompt);
        }
        if (l.id === 8) expect(questions['l8-order'].meta?.storyKey).not.toBe(questions['l8-order2'].meta?.storyKey);
        if (l.id === 3) {
          const targets = ['l3-star', 'l3-cat', 'l3-find-apple', 'l3-moon', 'l3-fish'].map((id) => questions[id].meta?.target);
          expect(new Set(targets).size, `уровень 3: слова не повторяются (${targets})`).toBe(targets.length);
        }
        if (l.id === 4) {
          const q = questions['l4-read'];
          expect([...(q.meta?.partsOrder ?? [])].sort()).toEqual(['bulb', 'gear', 'spring']);
        }
      }
    }
  }
});

test('задания разнообразны: у каждого слота много разных вариантов', () => {
  for (const l of LEVELS) {
    const seen: Record<string, Set<string>> = {};
    const prompts: Record<string, Set<string>> = {};
    for (let seed = 1; seed <= 30; seed++) {
      const { questions, keys } = build(l, seed * 131, masteryAll(null));
      for (const [id, k] of Object.entries(keys)) {
        (seen[id] ??= new Set()).add(k);
        const q = questions[id];
        (prompts[id] ??= new Set()).add(
          `${q.story?.join(' ') ?? ''}|${q.prompt}|${q.options.map((o) => o.emoji ?? o.label).join()}|${q.program?.track ?? ''}`,
        );
      }
    }
    for (const id of Object.keys(seen)) {
      expect(seen[id].size, `${id}: вариантов`).toBeGreaterThanOrEqual(3);
      expect(prompts[id].size, `${id}: разных формулировок/картинок`).toBeGreaterThanOrEqual(3);
    }
  }
});

test('повторное прохождение не повторяет недавние варианты', () => {
  for (const l of LEVELS) {
    const history: Record<string, string[]> = {};
    let prev: Record<string, string> | null = null;
    for (let run = 0; run < 8; run++) {
      const { keys } = build(l, 1000 + run * 31, masteryAll(null), history);
      if (prev) for (const id of Object.keys(keys)) expect(keys[id], `уровень ${l.id}, ${id}, прохождение ${run}`).not.toBe(prev[id]);
      for (const [id, k] of Object.entries(keys)) history[id] = [...(history[id] ?? []), k].slice(-4);
      prev = keys;
    }
  }
});

test('сложность подстраивается по успехам ребёнка', () => {
  expect(tierFor(1, [])).toBe(1);
  expect(tierFor(5, [])).toBe(2);
  expect(tierFor(5, [1, 1, 1, 1, 1])).toBe(3);
  expect(tierFor(5, [0, 0, 1, 0])).toBe(1);
  expect(tierFor(1, [1, 1, 1])).toBe(2);

  // Level 6: baseline difficulty 2, for a top student — 3, if hints are needed — 1.
  const l6 = LEVELS[5];
  const forms = (m: ReturnType<typeof masteryAll>) => {
    let unknownB = 0;
    let three = 0;
    let maxSum = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const { questions } = build(l6, seed * 53, m);
      const add = questions['l6-add'].visual as { a: number; b: number; unknown?: string };
      if (add.unknown === 'b') unknownB++;
      maxSum = Math.max(maxSum, add.a + add.b);
      if (questions['l6-compare'].options.length === 3) three++;
    }
    return { unknownB, three, maxSum };
  };
  const easy = forms(masteryAll(0));
  const hard = forms(masteryAll(1));
  // Easy: no missing numbers, comparing two numbers, smaller sums.
  expect(easy.unknownB).toBe(0);
  expect(easy.three).toBe(0);
  expect(easy.maxSum).toBeLessThanOrEqual(9);
  // Hard: "3 + ? = 7" appears and a choice from three numbers.
  expect(hard.unknownB).toBeGreaterThan(10);
  expect(hard.three).toBe(60);
});
