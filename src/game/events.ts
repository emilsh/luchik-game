import Phaser from 'phaser';
import type { QuestionDef } from '../types/game';

// Event bus between the game scene (Phaser) and the interface (React).

export interface HudState {
  levelId: number;
  stars: number;
  totalStars: number;
  goal: { text: string; emoji: string; progress?: string };
}

export interface QuestionOpenEvent {
  stationId: string;
  /** Who asks the question — for the picture on the card. */
  npc?: string;
  question: QuestionDef;
  index: number;
  total: number;
}

export interface ToastEvent {
  text: string;
  emoji?: string;
  /** English word for voice-over. */
  word?: string;
  kind?: 'info' | 'success' | 'hint';
}

export interface LevelCompleteEvent {
  levelId: number;
  stars: number;
  totalStars: number;
}

export const EV = {
  HUD: 'hud',
  QUESTION_OPEN: 'question:open',
  QUESTION_SOLVED: 'question:solved',
  QUESTION_CLOSED: 'question:closed',
  FIND_ANNOUNCE: 'find:announce',
  FIND_ACCEPT: 'find:accept',
  TOAST: 'toast',
  LEVEL_READY: 'level:ready',
  LEVEL_START: 'level:start',
  LEVEL_COMPLETE: 'level:complete',
  FINALE: 'finale',
} as const;

export const bus = new Phaser.Events.EventEmitter();
