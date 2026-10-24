// Shared Lamp Quest types: tasks, levels, saves.

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
  /** Label (a number, a word, or a short phrase). */
  label?: string;
  /** Emoji picture. */
  emoji?: string;
  /** Number of dots under a number — visual support for comparison. */
  dots?: number;
}

export type QuestionVisual =
  | { kind: 'count'; emoji: string; count: number }
  /** unknown: 'b' — the second number is missing ("3 + ? = 7"). */
  | { kind: 'equation'; a: number; b: number; op: '+' | '-'; emoji: string; unknown?: 'result' | 'b' }
  | { kind: 'word'; word: string }
  | { kind: 'picture'; emoji: string }
  | { kind: 'find'; word?: string; emoji?: string }
  /** A row of items with a "?" at the end — continue the pattern. */
  | { kind: 'sequence'; items: string[] }
  /** Energy indicator: total cells and how many are spent per step. */
  | { kind: 'energy'; total: number; steps: { label: string; amount: number }[] }
  /** Mini-map: S — start, G — goal, # — cloud, . — sky. */
  | { kind: 'grid'; rows: string[] }
  /** A robot program on a track (for bug finding). */
  | { kind: 'code'; track: string; steps: RobotCmd[] };

export type RobotCmd = 'forward' | 'jump';

/**
 * Robot track: R — start, . — floor, _ — pit, G — goal.
 * "Forward" — 1 cell, "Jump" — 2 cells (over a pit).
 */
export interface ProgramDef {
  track: string;
  slots: number;
  /** One of the valid programs (for hints and tests). */
  solution: RobotCmd[];
}

export interface QuestionDef {
  id: string;
  skill: SkillType;
  /** Short question text. */
  prompt: string;
  /** Text to read (a story or instruction), shown above the question. */
  story?: string[];
  visual?: QuestionVisual;
  /** English word for voice-over. */
  word?: string;
  options: AnswerOption[];
  /** The correct option (for choice mode). */
  correct: string;
  /** "Put in order" mode: the correct order of option ids. */
  order?: string[];
  /** "Build a program" mode: the options are palette commands. */
  program?: ProgramDef;
  /** A friendly hint after a wrong answer. */
  hint: string;
  /** Explanation after a correct answer. */
  explanation: string;
  /** What will change in the world after solving. */
  reward: string;
  /** Short label of the goal for search by description ("the firefly's home"). */
  findLabel?: string;
  /** Service data of the variant (links between tasks, the order of parts, etc.). */
  meta?: QuestionMeta;
}

export interface QuestionMeta {
  /** Variant key — so it is not repeated in later playthroughs. */
  variant?: string;
  /** Key of a story shared by several questions of one station. */
  storyKey?: string;
  /** Numeric result — for linked tasks. */
  result?: number;
  /** Order of the machine's parts (level 4). */
  partsOrder?: string[];
  /** Target word — so neighboring questions don't ask about the same thing. */
  target?: string;
  /** Difficulty tier the task was created with. */
  tier?: number;
}

export type QuestionStatus = 'new' | 'active' | 'solved';

export interface QuestionRuntimeState {
  status: QuestionStatus;
  attempts: number;
  hints: number;
  /** The correct answer the child solved the task with (for example, their robot program). */
  answer?: string;
}

// ---------- Levels ----------

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
  /** Trampoline mushroom: launches the lamp. */
  | 'bouncy'
  /** Slippery ice: the lamp accelerates and brakes more softly. */
  | 'ice'
  /** Conveyor: gently carries a standing lamp. */
  | 'conveyor'
  /** Solid floating block (collides from all sides, can be a ceiling). */
  | 'block'
  /** Shelf with books. */
  | 'books'
  /** Floating island. */
  | 'island';

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  /** Height; by default for ground — down to the bottom of the world, for the others — 28. */
  h?: number;
  kind?: PlatformKind;
  /** The platform appears when the flag is set. */
  showWhen?: string;
  /** Moves back and forth smoothly by dx (right) or dy (down) pixels. */
  move?: { dx?: number; dy?: number; speed: number };
  /** Launch speed for a trampoline (980 by default). */
  bounce?: number;
  /** Conveyor speed, px/s (negative — left). */
  conveyor?: number;
}

/** Upward current of air or bubbles: lifts the lamp up to top. */
export interface WindDef {
  x: number;
  w: number;
  /** Lower bound of the current (usually the ground surface). */
  bottom: number;
  /** The height it lifts to. */
  top: number;
  /** The current works only after a flag. */
  activeWhen?: string;
}

/** A decorative level object (windmill, lighthouse, crystal…). */
export interface DecorDef {
  key: string;
  x: number;
  /** Bottom of the object. */
  y: number;
  scale?: number;
  /** Rotation, degrees per second (for windmill blades). */
  spin?: number;
  /** Rotation starts only after a flag. */
  spinWhen?: string;
  /** Draw in front of the platforms. */
  front?: boolean;
  /** Name for the final scene. */
  role?: 'finale';
}

/** A helper that walks a route after a flag and sets a flag itself at the end. */
export interface HelperDef {
  id: string;
  x: number;
  y: number;
  trigger: string;
  path: { x: number; y: number; jump?: boolean }[];
  doneFlag: string;
  /**
   * Program task: the robot repeats in the world the program the child built.
   * The track starts at the helper's x, the flag is at the last point of path.
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
  /** Text of the pop-up message on pickup. */
  label: string;
}

export interface CheckpointDef {
  x: number;
  /** Top of the surface the lantern stands on. */
  y: number;
}

export type GateKind = 'hedge' | 'vines' | 'door' | 'crystal' | 'ice' | 'bookcase';

export interface GateDef {
  id: string;
  kind: GateKind;
  x: number;
  /** Top of the surface the gate stands on. */
  y: number;
  /** The gate disappears when the flag is set. */
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
  /** Top of the surface the object stands on. */
  y: number;
}

/** A character or item with one or several tasks in a row. */
export interface QuestStation extends StationBase {
  type: 'quest';
  npc: NpcKind;
  questions: string[];
  requires?: string[];
  requiresText?: string;
}

/** Lock / lever: triggers if the player has the required flags. */
export interface LockStation extends StationBase {
  type: 'lock';
  npc: NpcKind | 'keyhole';
  requires: string[];
  requiresText: string;
  doneText: string;
}

/** An educational sign with an English word. */
export interface WordStation extends StationBase {
  type: 'word';
  word: string;
}

/** Finding an item in the world by an English word. */
export interface FindStation extends StationBase {
  type: 'find';
  npc: NpcKind;
  question: string;
  /** Pedestal positions; the order matches the answer options. */
  pedestals: { x: number; y: number }[];
  /** Pedestal style: stone (default) or just a spot on the ground. */
  pedestalStyle?: 'stone' | 'ground';
}

/** An educational hint that pops up once. */
export interface HintStation extends StationBase {
  type: 'hint';
  text: string;
  touchText?: string;
}

export type StationDef = QuestStation | LockStation | WordStation | FindStation | HintStation;

export interface GoalDef {
  text: string;
  emoji: string;
  /** The English word from this task is appended to the text (it changes from playthrough to playthrough). */
  question?: string;
  /** The goal is done when all flags are set. */
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
  /** Gravity multiplier (below 1 underwater). */
  gravityScale?: number;
  /** Jump speed multiplier. */
  jumpScale?: number;
  /** Maximum fall speed multiplier. */
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
  /** Extra rewards (the end of a chapter gives both a shard and a crystal). */
  extraRewards?: RewardId[];
  /** Flag that triggers the final light-restoration scene. */
  finaleFlag?: string;
  /** Text of the level's final scene. */
  finaleText?: string;
  /** Portrait of the character in the intro (sprite key). */
  portrait?: string;
  winds?: WindDef[];
  helpers?: HelperDef[];
  decor?: DecorDef[];
  physics?: LevelPhysics;
}

// ---------- Saving ----------

export interface SkillStats {
  seen: number;
  solved: number;
  hints: number;
}

export interface Settings {
  sound: boolean;
  music: boolean;
  /** Read Russian task text aloud (reading help). */
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
  /** Chapters whose intro has already been shown. */
  chapterIntrosSeen: number[];
  /** Latest answers per skill: 1 — on the first try, 0 — with a hint. */
  mastery: Record<SkillType, number[]>;
  /** Recent variants of each task — to avoid repeats. */
  variantHistory: Record<string, string[]>;
}
