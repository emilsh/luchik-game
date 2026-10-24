import { SKILLS, type SaveData, type SkillStats, type SkillType } from '../types/game';
import { LEVEL_COUNT } from '../data/chapters';
import { ALL_REWARD_IDS } from '../data/rewards';

// Ключ не меняется между версиями формата: старые сохранения читаются
// и мигрируют на месте, ничего не теряется.
const SAVE_KEY = 'lampquest.save.v1';
const LEVEL_IDS = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1);
const byNumber = (a: number, b: number) => a - b;

export function defaultSave(): SaveData {
  const skillStats = {} as Record<SkillType, SkillStats>;
  const mastery = {} as Record<SkillType, number[]>;
  for (const s of SKILLS) {
    skillStats[s] = { seen: 0, solved: 0, hints: 0 };
    mastery[s] = [];
  }
  return {
    version: 2,
    unlockedLevels: [1],
    completedLevels: [],
    bestStars: {},
    rewards: [],
    skillStats,
    solvedQuestions: [],
    currentLevel: 1,
    settings: { sound: true, music: true, readAloud: false },
    tutorialSeen: false,
    chapterIntrosSeen: [],
    mastery,
    variantHistory: {},
  };
}

export const MASTERY_WINDOW = 6;
export const HISTORY_WINDOW = 4;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const nonNegInt = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;

function levelList(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((n): n is number => LEVEL_IDS.includes(n as number)))].sort(byNumber);
}

/**
 * Проверяет данные из хранилища и подставляет значения по умолчанию для всего
 * повреждённого. Заодно мигрирует формат: v1 (4 уровня) → v2 (12 уровней, главы).
 * Новые поля v2 получают значения по умолчанию, всё старое переносится как есть.
 */
export function sanitizeSave(raw: unknown): SaveData {
  const d = defaultSave();
  if (!isObj(raw)) return d;

  const unlocked = levelList(raw.unlockedLevels);
  d.unlockedLevels = [...new Set([1, ...unlocked])].sort(byNumber);
  d.completedLevels = levelList(raw.completedLevels);
  // Пройденный уровень всегда открывает следующий.
  for (const id of d.completedLevels) {
    if (id < LEVEL_COUNT && !d.unlockedLevels.includes(id + 1)) d.unlockedLevels.push(id + 1);
  }
  d.unlockedLevels.sort(byNumber);

  if (isObj(raw.bestStars)) {
    for (const id of LEVEL_IDS) {
      const v = raw.bestStars[String(id)];
      if (v !== undefined) d.bestStars[String(id)] = nonNegInt(v);
    }
  }
  if (Array.isArray(raw.rewards)) {
    d.rewards = ALL_REWARD_IDS.filter((r) => (raw.rewards as unknown[]).includes(r));
  }
  if (isObj(raw.skillStats)) {
    for (const s of SKILLS) {
      const st = raw.skillStats[s];
      if (isObj(st)) d.skillStats[s] = { seen: nonNegInt(st.seen), solved: nonNegInt(st.solved), hints: nonNegInt(st.hints) };
    }
  }
  if (Array.isArray(raw.solvedQuestions)) {
    d.solvedQuestions = raw.solvedQuestions.filter((q): q is string => typeof q === 'string').slice(0, 500);
  }
  if (typeof raw.currentLevel === 'number' && d.unlockedLevels.includes(raw.currentLevel)) {
    d.currentLevel = raw.currentLevel;
  }
  if (isObj(raw.settings)) {
    const s = raw.settings;
    d.settings = {
      sound: typeof s.sound === 'boolean' ? s.sound : true,
      music: typeof s.music === 'boolean' ? s.music : true,
      readAloud: typeof s.readAloud === 'boolean' ? s.readAloud : false,
    };
  }
  d.tutorialSeen = raw.tutorialSeen === true;
  if (isObj(raw.mastery)) {
    for (const s of SKILLS) {
      const m = raw.mastery[s];
      if (Array.isArray(m)) d.mastery[s] = m.filter((v) => v === 0 || v === 1).slice(-MASTERY_WINDOW);
    }
  }
  if (isObj(raw.variantHistory)) {
    for (const [slot, list] of Object.entries(raw.variantHistory).slice(0, 300)) {
      if (Array.isArray(list)) {
        d.variantHistory[slot] = list.filter((v): v is string => typeof v === 'string').slice(-HISTORY_WINDOW);
      }
    }
  }
  if (Array.isArray(raw.chapterIntrosSeen)) {
    d.chapterIntrosSeen = raw.chapterIntrosSeen.filter((n): n is number => n === 1 || n === 2);
  }
  return d;
}

export function loadSave(): SaveData {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return sanitizeSave(JSON.parse(raw));
  } catch {
    // Повреждённый JSON или недоступное хранилище (приватный режим) — начинаем заново.
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Хранилище недоступно — игра продолжает работать без сохранения.
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

export const SAVE_STORAGE_KEY = SAVE_KEY;
