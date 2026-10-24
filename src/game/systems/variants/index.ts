import { QUESTIONS } from '../../../data/questions';
import type { QuestionDef, SkillType } from '../../../types/game';
import type { Ctx, Tier } from './builders';
import { makeRng } from './rng';
import { SLOTS } from './slots';
import { validateQuestion } from './validate';

// Сборка заданий уровня на одно прохождение: сложность по навыку, без повторов
// недавних вариантов, с проверкой каждого задания.

export { validateQuestion } from './validate';
export type { Tier } from './builders';

/**
 * Сложность навыка 1–3. Опора — номер уровня (на первых уровнях проще),
 * поправка — последние ответы: решает с первой попытки — сложнее, нужны подсказки — проще.
 */
export function tierFor(levelId: number, recent: number[]): Tier {
  let t = levelId <= 2 ? 1 : 2;
  const last = recent.slice(-5);
  if (last.length >= 3) {
    const avg = last.reduce((a, b) => a + b, 0) / last.length;
    if (avg >= 0.8) t += 1;
    else if (avg < 0.5) t -= 1;
  }
  return Math.min(3, Math.max(1, t)) as Tier;
}

export interface LevelVariants {
  questions: Record<string, QuestionDef>;
  /** Ключ выбранного варианта для каждого слота. */
  keys: Record<string, string>;
}

export function buildLevelQuestions(opts: {
  levelId: number;
  /** Задания уровня в порядке прохождения (связанные идут после своих «источников»). */
  ids: string[];
  seed: number;
  mastery: Partial<Record<SkillType, number[]>>;
  history: Record<string, string[]>;
}): LevelVariants {
  const rng = makeRng(opts.seed);
  const questions: Record<string, QuestionDef> = {};
  const keys: Record<string, string> = {};
  for (const id of opts.ids) {
    const base = QUESTIONS[id];
    const gen = SLOTS[id];
    if (!base) continue;
    if (!gen) {
      questions[id] = base;
      continue;
    }
    const tier = tierFor(opts.levelId, opts.mastery[base.skill] ?? []);
    const ctx: Ctx = { rng, tier, resolved: questions };
    const recent = opts.history[id] ?? [];
    const last = recent[recent.length - 1];
    let chosen: QuestionDef | null = null;
    let fallback: QuestionDef | null = null;
    for (let attempt = 0; attempt < 24 && !chosen; attempt++) {
      const v = gen(ctx);
      const q: QuestionDef = {
        id,
        skill: base.skill,
        reward: base.reward,
        prompt: v.q.prompt ?? base.prompt,
        options: v.q.options ?? base.options,
        correct: v.q.correct ?? base.correct,
        hint: v.q.hint ?? base.hint,
        explanation: v.q.explanation ?? base.explanation,
        ...v.q,
        meta: { ...v.q.meta, variant: v.key, tier },
      };
      if (v.key.endsWith(':fallback') || validateQuestion(q).length > 0) continue;
      if (!recent.includes(v.key)) chosen = q;
      // Запасной вариант (если банк маленький) — любой, кроме выпавшего в прошлый раз.
      else if (v.key !== last) fallback ??= q;
    }
    // Если все варианты недавно были (маленький банк) — берём любой корректный; если нет и его — исходное задание.
    const q = chosen ?? fallback ?? { ...base, meta: { variant: 'base', tier } };
    questions[id] = q;
    keys[id] = q.meta?.variant ?? 'base';
  }
  return { questions, keys };
}
