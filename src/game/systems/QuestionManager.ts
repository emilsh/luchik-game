import { QUESTIONS } from '../../data/questions';
import type { QuestionDef, QuestionRuntimeState } from '../../types/game';
import { progress } from './ProgressManager';
import { decodeProgram, runProgram } from './robotProgram';
import { buildLevelQuestions } from './variants';

export interface AnswerResult {
  correct: boolean;
  hint?: string;
  explanation?: string;
}

/** Зерно из адреса (?seed=N) — для воспроизводимых тестов; иначе каждый раз новое. */
function seedFromUrl(): number | null {
  try {
    const v = new URLSearchParams(window.location.search).get('seed');
    return v !== null && /^\d+$/.test(v) ? Number(v) : null;
  } catch {
    return null;
  }
}

/**
 * Универсальная система заданий: на каждое прохождение уровня собирает свой
 * набор вариантов, проверяет ответы, хранит состояние выполнения и пишет
 * статистику и «историю успехов» по навыкам в прогресс.
 */
class QuestionManager {
  private runtime = new Map<string, QuestionRuntimeState>();
  private resolved: Record<string, QuestionDef> = {};
  private runCounter = 0;
  /** Варианты текущего прохождения — для отладки и тестов. */
  variantKeys: Record<string, string> = {};

  get(id: string): QuestionDef {
    const q = this.resolved[id] ?? QUESTIONS[id];
    if (!q) throw new Error(`Unknown question ${id}`);
    return q;
  }

  state(id: string): QuestionRuntimeState {
    let s = this.runtime.get(id);
    if (!s) {
      s = { status: 'new', attempts: 0, hints: 0 };
      this.runtime.set(id, s);
    }
    return s;
  }

  /** Начало прохождения уровня: новые варианты всех заданий уровня. */
  beginRun(levelId: number, ids: string[]): void {
    this.runtime.clear();
    const save = progress.getSnapshot();
    const fixed = seedFromUrl();
    this.runCounter++;
    const seed = fixed !== null ? fixed + this.runCounter * 7919 : (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
    const built = buildLevelQuestions({
      levelId,
      ids,
      seed,
      mastery: save.mastery,
      history: save.variantHistory,
    });
    this.resolved = built.questions;
    this.variantKeys = built.keys;
    progress.recordVariants(built.keys);
  }

  open(id: string): QuestionDef {
    const q = this.get(id);
    const s = this.state(id);
    if (s.status === 'new') {
      s.status = 'active';
      progress.recordQuestion(q.skill, 'seen');
    }
    return q;
  }

  /** Верен ли ответ. Для «порядка» ответ — id через запятую, для программы — команды через запятую. */
  isCorrect(q: QuestionDef, answer: string): boolean {
    if (q.program) return runProgram(q.program.track, decodeProgram(answer)).success;
    if (q.order) return answer === q.order.join(',');
    return answer === q.correct;
  }

  answer(id: string, optionId: string): AnswerResult {
    const q = this.get(id);
    const s = this.state(id);
    if (s.status === 'new') this.open(id);
    s.attempts += 1;
    if (this.isCorrect(q, optionId)) {
      if (s.status !== 'solved') {
        s.status = 'solved';
        s.answer = optionId;
        progress.recordQuestion(q.skill, 'solved', q.id);
        progress.recordMastery(q.skill, s.attempts === 1);
      }
      return { correct: true, explanation: q.explanation };
    }
    s.hints += 1;
    progress.recordQuestion(q.skill, 'hints');
    return { correct: false, hint: q.hint };
  }

  isSolved(id: string): boolean {
    return this.state(id).status === 'solved';
  }
}

export const questions = new QuestionManager();
