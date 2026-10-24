import { QUESTIONS } from '../../../data/questions';
import type { QuestionDef, SkillType } from '../../../types/game';
import type { Ctx, Tier } from './builders';
import { makeRng } from './rng';
import { SLOTS } from './slots';
import { validateQuestion } from './validate';

// Assembling a level's tasks for one playthrough: difficulty per skill, no repeats
// of recent variants, with every task validated.

export { validateQuestion } from './validate';
export type { Tier } from './builders';

/**
 * Skill difficulty 1–3. The baseline is the level number (easier on the first levels),
 * the adjustment is the latest answers: solves on the first try — harder, needs hints — easier.
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
  /** Key of the chosen variant for each slot. */
  keys: Record<string, string>;
}

export function buildLevelQuestions(opts: {
  levelId: number;
  /** The level's tasks in playthrough order (linked ones come after their "sources"). */
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
      // Fallback (if the bank is small) — any variant except the one drawn last time.
      else if (v.key !== last) fallback ??= q;
    }
    // If all variants were recent (a small bank), take any valid one; failing that, the original task.
    const q = chosen ?? fallback ?? { ...base, meta: { variant: 'base', tier } };
    questions[id] = q;
    keys[id] = q.meta?.variant ?? 'base';
  }
  return { questions, keys };
}
