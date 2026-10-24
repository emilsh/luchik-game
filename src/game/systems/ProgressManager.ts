import { HISTORY_WINDOW, MASTERY_WINDOW, clearSave, defaultSave, loadSave, writeSave } from '../../storage/saveManager';
import { LEVEL_COUNT } from '../../data/chapters';
import type { RewardId, SaveData, Settings, SkillType } from '../../types/game';

type Listener = () => void;

export interface CompletionResult {
  /** Rewards received for the first time in this playthrough. */
  newRewards: RewardId[];
  unlockedLevel: number | null;
  bestStars: number;
}

/** The only place that changes the save. React subscribes via subscribe/getSnapshot. */
class ProgressManager {
  private data: SaveData = loadSave();
  private listeners = new Set<Listener>();

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): SaveData => this.data;

  private update(mutator: (d: SaveData) => void): void {
    const next: SaveData = structuredCloneSafe(this.data);
    mutator(next);
    this.data = next;
    writeSave(next);
    this.listeners.forEach((l) => l());
  }

  isUnlocked(levelId: number): boolean {
    return this.data.unlockedLevels.includes(levelId);
  }

  hasProgress(): boolean {
    return this.data.completedLevels.length > 0 || this.data.tutorialSeen;
  }

  setCurrentLevel(levelId: number): void {
    if (this.data.currentLevel === levelId) return;
    this.update((d) => {
      d.currentLevel = levelId;
    });
  }

  completeLevel(levelId: number, stars: number, rewards: RewardId[]): CompletionResult {
    const nextId = levelId + 1;
    const newRewards = rewards.filter((r) => !this.data.rewards.includes(r));
    const wasUnlocked = nextId > LEVEL_COUNT || this.data.unlockedLevels.includes(nextId);
    let best = 0;
    this.update((d) => {
      if (!d.completedLevels.includes(levelId)) d.completedLevels.push(levelId);
      d.completedLevels.sort((a, b) => a - b);
      if (nextId <= LEVEL_COUNT && !d.unlockedLevels.includes(nextId)) d.unlockedLevels.push(nextId);
      d.unlockedLevels.sort((a, b) => a - b);
      for (const r of newRewards) d.rewards.push(r);
      best = Math.max(d.bestStars[String(levelId)] ?? 0, stars);
      d.bestStars[String(levelId)] = best;
      d.currentLevel = nextId <= LEVEL_COUNT ? nextId : levelId;
    });
    return {
      newRewards,
      unlockedLevel: wasUnlocked ? null : nextId,
      bestStars: best,
    };
  }

  recordQuestion(skill: SkillType, event: 'seen' | 'solved' | 'hints', questionId?: string): void {
    this.update((d) => {
      d.skillStats[skill][event] += 1;
      if (event === 'solved' && questionId && !d.solvedQuestions.includes(questionId)) {
        d.solvedQuestions.push(questionId);
      }
    });
  }

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.update((d) => {
      d.settings[key] = value;
    });
  }

  /** Task outcome for difficulty tuning: solved on the first try or not. */
  recordMastery(skill: SkillType, firstTry: boolean): void {
    this.update((d) => {
      d.mastery[skill] = [...d.mastery[skill], firstTry ? 1 : 0].slice(-MASTERY_WINDOW);
    });
  }

  /** Remembers the task variants drawn in this playthrough. */
  recordVariants(variants: Record<string, string>): void {
    if (Object.keys(variants).length === 0) return;
    this.update((d) => {
      for (const [slot, key] of Object.entries(variants)) {
        d.variantHistory[slot] = [...(d.variantHistory[slot] ?? []), key].slice(-HISTORY_WINDOW);
      }
    });
  }

  markChapterIntroSeen(chapter: number): void {
    if (this.data.chapterIntrosSeen.includes(chapter)) return;
    this.update((d) => {
      d.chapterIntrosSeen.push(chapter);
    });
  }

  markTutorialSeen(): void {
    if (this.data.tutorialSeen) return;
    this.update((d) => {
      d.tutorialSeen = true;
    });
  }

  reset(): void {
    clearSave();
    const settings = this.data.settings;
    // The variant history is not erased by a reset: tasks should not repeat after a reset either.
    const history = this.data.variantHistory;
    this.data = defaultSave();
    this.data.variantHistory = history;
    this.data.settings = settings;
    writeSave(this.data);
    this.listeners.forEach((l) => l());
  }
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export const progress = new ProgressManager();
