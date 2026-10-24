// Общие типы Lamp Quest: задания, уровни, сохранение.

export type SkillType =
  | 'reading'
  | 'counting'
  | 'comparison'
  | 'addition'
  | 'subtraction'
  | 'english-word-to-picture'
  | 'english-picture-to-word'
  | 'story-order'
  | 'patterns'
  | 'logic'
  | 'algorithms';

export const SKILLS: SkillType[] = [
  'reading',
  'counting',
  'comparison',
  'addition',
  'subtraction',
  'english-word-to-picture',
  'english-picture-to-word',
  'story-order',
  'patterns',
  'logic',
  'algorithms',
];

export interface AnswerOption {
  id: string;
  /** Подпись (число, слово или короткая фраза). */
  label?: string;
  /** Картинка-эмодзи. */
  emoji?: string;
  /** Количество точек под числом — визуальная поддержка для сравнения. */
  dots?: number;
}

export type QuestionVisual =
  | { kind: 'count'; emoji: string; count: number }
  /** unknown: 'b' — пропущено второе число («3 + ? = 7»). */
  | { kind: 'equation'; a: number; b: number; op: '+' | '-'; emoji: string; unknown?: 'result' | 'b' }
  | { kind: 'word'; word: string }
  | { kind: 'picture'; emoji: string }
  | { kind: 'find'; word?: string; emoji?: string }
  /** Ряд элементов с «?» в конце — продолжи закономерность. */
  | { kind: 'sequence'; items: string[] }
  /** Индикатор энергии: всего ячеек и сколько тратится по шагам. */
  | { kind: 'energy'; total: number; steps: { label: string; amount: number }[] }
  /** Мини-карта: S — старт, G — цель, # — туча, . — небо. */
  | { kind: 'grid'; rows: string[] }
  /** Программа робота на дорожке (для поиска ошибки). */
  | { kind: 'code'; track: string; steps: RobotCmd[] };

export type RobotCmd = 'forward' | 'jump';

/**
 * Дорожка робота: R — старт, . — пол, _ — яма, G — цель.
 * «Вперёд» — на 1 клетку, «Прыжок» — на 2 клетки (над ямой).
 */
export interface ProgramDef {
  track: string;
  slots: number;
  /** Одна из верных программ (для подсказки и тестов). */
  solution: RobotCmd[];
}

export interface QuestionDef {
  id: string;
  skill: SkillType;
  /** Короткий текст вопроса. */
  prompt: string;
  /** Текст для чтения (история или инструкция), показывается над вопросом. */
  story?: string[];
  visual?: QuestionVisual;
  /** Английское слово для озвучки. */
  word?: string;
  options: AnswerOption[];
  /** Верный вариант (для режима выбора). */
  correct: string;
  /** Режим «расставь по порядку»: верный порядок id вариантов. */
  order?: string[];
  /** Режим «составь программу»: варианты — команды палитры. */
  program?: ProgramDef;
  /** Дружелюбная подсказка после неверного ответа. */
  hint: string;
  /** Объяснение после верного ответа. */
  explanation: string;
  /** Что изменится в мире после решения. */
  reward: string;
  /** Короткая подпись цели для поиска по описанию («дом светлячка»). */
  findLabel?: string;
  /** Служебные данные варианта (связь между заданиями, порядок деталей и т. п.). */
  meta?: QuestionMeta;
}

export interface QuestionMeta {
  /** Ключ варианта — чтобы не повторять его в следующих прохождениях. */
  variant?: string;
  /** Ключ истории, общей для нескольких вопросов одной станции. */
  storyKey?: string;
  /** Числовой результат — для связанных заданий. */
  result?: number;
  /** Порядок деталей машины (уровень 4). */
  partsOrder?: string[];
  /** Целевое слово — чтобы соседние вопросы не спрашивали одно и то же. */
  target?: string;
  /** Уровень сложности, с которым создано задание. */
  tier?: number;
}

export type QuestionStatus = 'new' | 'active' | 'solved';

export interface QuestionRuntimeState {
  status: QuestionStatus;
  attempts: number;
  hints: number;
  /** Верный ответ, которым ребёнок решил задание (например, его программа для робота). */
  answer?: string;
}

// ---------- Уровни ----------

export type ThemeId =
  | 'valley'
  | 'canyon'
  | 'forest'
  | 'workshop'
  | 'enchanted'
  | 'cave'
  | 'sky'
  | 'library'
  | 'factory'
  | 'ice'
  | 'underwater'
  | 'observatory';

export type PlatformKind =
  | 'ground'
  | 'ledge'
  | 'cloud'
  | 'bridge'
  | 'mushroom'
  | 'crystal'
  | 'shelf'
  /** Гриб-батут: подбрасывает лампу. */
  | 'bouncy'
  /** Скользкий лёд: лампа разгоняется и тормозит мягче. */
  | 'ice'
  /** Конвейер: плавно везёт стоящую лампу. */
  | 'conveyor'
  /** Твёрдый парящий блок (сталкивается со всех сторон, бывает потолком). */
  | 'block'
  /** Полка с книгами. */
  | 'books'
  /** Парящий остров. */
  | 'island';

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  /** Высота; по умолчанию у земли — до низа мира, у остальных — 28. */
  h?: number;
  kind?: PlatformKind;
  /** Платформа появляется, когда установлен флаг. */
  showWhen?: string;
  /** Плавно ездит туда-обратно на dx (вправо) или dy (вниз) пикселей. */
  move?: { dx?: number; dy?: number; speed: number };
  /** Скорость подброса для батута (по умолчанию 980). */
  bounce?: number;
  /** Скорость конвейера, px/s (минус — влево). */
  conveyor?: number;
}

/** Восходящий поток воздуха или пузырей: поднимает лампу до top. */
export interface WindDef {
  x: number;
  w: number;
  /** Нижняя граница потока (обычно поверхность земли). */
  bottom: number;
  /** До какой высоты поднимает. */
  top: number;
  /** Поток работает только после флага. */
  activeWhen?: string;
}

/** Декоративный объект уровня (мельница, маяк, кристалл…). */
export interface DecorDef {
  key: string;
  x: number;
  /** Низ объекта. */
  y: number;
  scale?: number;
  /** Вращение, градусов в секунду (для лопастей мельницы). */
  spin?: number;
  /** Вращение начинается только после флага. */
  spinWhen?: string;
  /** Нарисовать перед платформами. */
  front?: boolean;
  /** Имя для финальной сцены. */
  role?: 'finale';
}

/** Помощник, который проходит маршрут после флага и сам ставит флаг в конце. */
export interface HelperDef {
  id: string;
  x: number;
  y: number;
  trigger: string;
  path: { x: number; y: number; jump?: boolean }[];
  doneFlag: string;
  /**
   * Задание-программа: робот повторяет в мире программу, которую составил ребёнок.
   * Старт дорожки — в x помощника, флажок — в последней точке path.
   */
  fromProgram?: string;
}

export interface StarDef {
  x: number;
  y: number;
}

export type ItemKind =
  | 'key'
  | 'gear'
  | 'spring'
  | 'bulb'
  | 'light'
  | 'gem'
  | 'page'
  | 'battery'
  | 'pearl'
  | 'lens';

export interface ItemDef {
  id: string;
  kind: ItemKind;
  x: number;
  y: number;
  /** Текст всплывающего сообщения при подборе. */
  label: string;
}

export interface CheckpointDef {
  x: number;
  /** Верх поверхности, на которой стоит фонарик. */
  y: number;
}

export type GateKind = 'hedge' | 'vines' | 'door' | 'crystal' | 'ice' | 'bookcase';

export interface GateDef {
  id: string;
  kind: GateKind;
  x: number;
  /** Верх поверхности, на которой стоят ворота. */
  y: number;
  /** Ворота исчезают, когда установлен флаг. */
  openWhen: string;
}

export type NpcKind =
  | 'sign'
  | 'snail'
  | 'robot'
  | 'owl'
  | 'machine'
  | 'lever'
  | 'firefly'
  | 'numlock'
  | 'penguin'
  | 'turtle'
  | 'telescope'
  | 'bookstand';

interface StationBase {
  id: string;
  x: number;
  /** Верх поверхности, на которой стоит объект. */
  y: number;
}

/** Персонаж или предмет с одним или несколькими заданиями подряд. */
export interface QuestStation extends StationBase {
  type: 'quest';
  npc: NpcKind;
  questions: string[];
  requires?: string[];
  requiresText?: string;
}

/** Замок / рычаг: срабатывает, если у игрока есть нужные флаги. */
export interface LockStation extends StationBase {
  type: 'lock';
  npc: NpcKind | 'keyhole';
  requires: string[];
  requiresText: string;
  doneText: string;
}

/** Учебная табличка с английским словом. */
export interface WordStation extends StationBase {
  type: 'word';
  word: string;
}

/** Поиск предмета в мире по английскому слову. */
export interface FindStation extends StationBase {
  type: 'find';
  npc: NpcKind;
  question: string;
  /** Позиции постаментов; порядок совпадает с вариантами ответа. */
  pedestals: { x: number; y: number }[];
  /** Вид постаментов: каменные (по умолчанию) или просто место на земле. */
  pedestalStyle?: 'stone' | 'ground';
}

/** Обучающая подсказка, всплывающая один раз. */
export interface HintStation extends StationBase {
  type: 'hint';
  text: string;
  touchText?: string;
}

export type StationDef = QuestStation | LockStation | WordStation | FindStation | HintStation;

export interface GoalDef {
  text: string;
  emoji: string;
  /** К тексту добавляется английское слово из этого задания (оно меняется от прохождения к прохождению). */
  question?: string;
  /** Цель выполнена, когда установлены все флаги. */
  done: string[];
}

export type RewardId =
  | 'gold-star'
  | 'workshop-gear'
  | 'magic-crystal'
  | 'golden-bulb'
  | 'shard-1'
  | 'shard-2'
  | 'shard-3'
  | 'shard-4'
  | 'shard-5'
  | 'shard-6'
  | 'shard-7'
  | 'shard-8'
  | 'light-crystal';

export interface LevelPhysics {
  /** Множитель гравитации (под водой меньше 1). */
  gravityScale?: number;
  /** Множитель скорости прыжка. */
  jumpScale?: number;
  /** Множитель максимальной скорости падения. */
  fallScale?: number;
}

export interface LevelDef {
  id: number;
  chapter: 1 | 2;
  name: string;
  subtitle: string;
  emoji: string;
  theme: ThemeId;
  width: number;
  spawn: { x: number; y: number };
  intro: string[];
  platforms: PlatformDef[];
  stars: StarDef[];
  items: ItemDef[];
  checkpoints: CheckpointDef[];
  gates: GateDef[];
  stations: StationDef[];
  goals: GoalDef[];
  portal: { x: number; y: number; requires: string[] };
  reward: RewardId;
  /** Дополнительные награды (финал главы даёт и фрагмент, и кристалл). */
  extraRewards?: RewardId[];
  /** Флаг, запускающий финальную сцену восстановления света. */
  finaleFlag?: string;
  /** Текст финальной сцены уровня. */
  finaleText?: string;
  /** Портрет персонажа во вступлении (ключ спрайта). */
  portrait?: string;
  winds?: WindDef[];
  helpers?: HelperDef[];
  decor?: DecorDef[];
  physics?: LevelPhysics;
}

// ---------- Сохранение ----------

export interface SkillStats {
  seen: number;
  solved: number;
  hints: number;
}

export interface Settings {
  sound: boolean;
  music: boolean;
  /** Озвучивать русский текст заданий (помощь в чтении). */
  readAloud: boolean;
}

export interface SaveData {
  version: 2;
  unlockedLevels: number[];
  completedLevels: number[];
  bestStars: Record<string, number>;
  rewards: RewardId[];
  skillStats: Record<SkillType, SkillStats>;
  solvedQuestions: string[];
  currentLevel: number;
  settings: Settings;
  tutorialSeen: boolean;
  /** Главы, вступление к которым уже показано. */
  chapterIntrosSeen: number[];
  /** Последние ответы по навыкам: 1 — с первой попытки, 0 — с подсказкой. */
  mastery: Record<SkillType, number[]>;
  /** Недавние варианты каждого задания — чтобы не повторяться. */
  variantHistory: Record<string, string[]>;
}
