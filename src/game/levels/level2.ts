import type { LevelDef } from '../../types/game';
import { LEVEL_INTROS } from '../../data/stories';

// Bridge of Numbers: counting, comparison, addition, subtraction.
export const level2: LevelDef = {
  id: 2,
  chapter: 1,
  name: 'Мост чисел',
  subtitle: 'Считаем и чиним мост',
  emoji: '🌉',
  theme: 'canyon',
  width: 6200,
  spawn: { x: 260, y: 520 },
  intro: LEVEL_INTROS[2],
  platforms: [
    { x: 0, y: 600, w: 1500 },
    { x: 500, y: 495, w: 180, kind: 'ledge' },
    { x: 760, y: 395, w: 180, kind: 'ledge' },
    { x: 1060, y: 495, w: 180, kind: 'ledge' },
    { x: 1240, y: 400, w: 160, kind: 'ledge' },
    // First bridge
    { x: 1500, y: 600, w: 280, h: 34, kind: 'bridge', showWhen: 'bridge1:0' },
    { x: 1780, y: 600, w: 280, h: 34, kind: 'bridge', showWhen: 'bridge1:1' },
    { x: 2060, y: 600, w: 840 },
    { x: 2350, y: 495, w: 160, kind: 'ledge' },
    // Moving platform
    { x: 2920, y: 560, w: 140, kind: 'ledge', move: { dx: 140, speed: 60 } },
    { x: 3200, y: 600, w: 900 },
    { x: 3400, y: 490, w: 160, kind: 'ledge' },
    { x: 3640, y: 390, w: 160, kind: 'ledge' },
    // Second bridge
    { x: 4100, y: 600, w: 280, h: 34, kind: 'bridge', showWhen: 'bridge2:0' },
    { x: 4380, y: 600, w: 280, h: 34, kind: 'bridge', showWhen: 'bridge2:1' },
    { x: 4660, y: 600, w: 1540 },
    { x: 4900, y: 495, w: 180, kind: 'ledge' },
    { x: 5160, y: 400, w: 180, kind: 'ledge' },
  ],
  stars: [
    { x: 400, y: 545 },
    { x: 590, y: 440 }, { x: 850, y: 300 },
    { x: 1150, y: 440 },
    { x: 1640, y: 545 }, { x: 1920, y: 545 },
    { x: 2200, y: 545 }, { x: 2430, y: 440 }, { x: 2700, y: 545 },
    { x: 2990, y: 490 }, { x: 3130, y: 490 },
    { x: 3480, y: 435 }, { x: 3720, y: 335 },
    { x: 4240, y: 545 }, { x: 4520, y: 545 },
    { x: 4990, y: 440 }, { x: 5250, y: 345 }, { x: 5450, y: 545 }, { x: 5550, y: 545 },
  ],
  items: [
    { id: 'gear1', kind: 'gear', x: 850, y: 345, label: 'Шестерёнка!' },
    { id: 'gear2', kind: 'gear', x: 1150, y: 545, label: 'Шестерёнка!' },
    { id: 'gear3', kind: 'gear', x: 1320, y: 350, label: 'Шестерёнка!' },
  ],
  checkpoints: [
    { x: 2150, y: 600 },
    { x: 3270, y: 600 },
    { x: 4740, y: 600 },
  ],
  gates: [],
  stations: [
    {
      type: 'quest',
      id: 'bridge1',
      npc: 'robot',
      x: 1420,
      y: 600,
      questions: ['l2-count', 'l2-compare'],
      requires: ['item:gear1', 'item:gear2', 'item:gear3'],
      requiresText: 'Болтику нужны 3 шестерёнки ⚙️',
    },
    { type: 'hint', id: 'h-ride', x: 2800, y: 600, text: 'Запрыгни на платформу — она довезёт!' },
    { type: 'quest', id: 'bridge2', npc: 'robot', x: 3990, y: 600, questions: ['l2-add', 'l2-sub'] },
  ],
  goals: [
    { text: 'Собери шестерёнки', emoji: '⚙️', done: ['item:gear1', 'item:gear2', 'item:gear3'] },
    { text: 'Почини мост с Болтиком', emoji: '🤖', done: ['bridge1'] },
    { text: 'Почини второй мост', emoji: '🌉', done: ['bridge2'] },
  ],
  portal: { x: 5900, y: 600, requires: ['bridge2'] },
  reward: 'workshop-gear',
};
