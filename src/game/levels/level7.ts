import type { LevelDef } from '../../types/game';
import { LEVEL_INTROS } from '../../data/stories';

// 7. Sky Islands: patterns and routes.
// New mechanics — an updraft (turned on by the windmill) and a cloud lift.
export const level7: LevelDef = {
  id: 7,
  chapter: 2,
  name: 'Небесные острова',
  subtitle: 'Закономерности и ветер',
  emoji: '☁️',
  theme: 'sky',
  portrait: 'owl',
  width: 7600,
  spawn: { x: 260, y: 520 },
  intro: LEVEL_INTROS[7],
  platforms: [
    { x: 0, y: 600, w: 1000 },
    { x: 500, y: 500, w: 160, kind: 'ledge' },
    // Cloud bridge after the first riddle
    { x: 1080, y: 560, w: 140, kind: 'cloud', showWhen: 'seq' },
    { x: 1300, y: 520, w: 140, kind: 'cloud', showWhen: 'seq' },
    { x: 1520, y: 560, w: 140, kind: 'cloud', showWhen: 'seq' },
    { x: 1720, y: 560, w: 600, kind: 'island' },
    // Drifting cloud
    { x: 2380, y: 520, w: 140, kind: 'cloud', move: { dx: 200, speed: 70 } },
    { x: 2780, y: 520, w: 500, kind: 'island' },
    // High island — only with the wind
    { x: 3500, y: 300, w: 600, kind: 'island' },
    // Rainbow bridge after the route
    { x: 4150, y: 320, w: 150, kind: 'cloud', showWhen: 'route' },
    { x: 4380, y: 360, w: 150, kind: 'cloud', showWhen: 'route' },
    { x: 4600, y: 420, w: 700, kind: 'island' },
    { x: 5450, y: 520, w: 500, kind: 'island' },
    // Cloud lift
    { x: 6020, y: 380, w: 150, kind: 'cloud', move: { dy: 140, speed: 50 } },
    { x: 6250, y: 400, w: 1350 },
  ],
  stars: [
    { x: 400, y: 545 }, { x: 580, y: 445 }, { x: 800, y: 545 },
    { x: 1150, y: 500 }, { x: 1370, y: 460 }, { x: 1590, y: 500 },
    { x: 1900, y: 505 }, { x: 2200, y: 505 },
    { x: 2450, y: 460 }, { x: 2650, y: 460 },
    { x: 3000, y: 465 }, { x: 3390, y: 400 }, { x: 3390, y: 300 },
    { x: 3700, y: 245 }, { x: 4225, y: 265 }, { x: 4455, y: 305 },
    { x: 4900, y: 365 }, { x: 5700, y: 465 }, { x: 6095, y: 330 }, { x: 6600, y: 345 },
  ],
  items: [
    { id: 'l1', kind: 'light', x: 580, y: 450, label: 'Огонёк!' },
    { id: 'l2', kind: 'light', x: 2050, y: 510, label: 'Огонёк!' },
    { id: 'l3', kind: 'light', x: 3850, y: 250, label: 'Огонёк!' },
  ],
  checkpoints: [
    { x: 1800, y: 560 },
    { x: 2850, y: 520 },
    { x: 3560, y: 300 },
    { x: 4660, y: 420 },
    { x: 5520, y: 520 },
    { x: 6320, y: 400 },
  ],
  gates: [],
  winds: [{ x: 3285, w: 205, bottom: 720, top: 240, activeWhen: 'wind' }],
  stations: [
    { type: 'quest', id: 'seq', npc: 'owl', x: 860, y: 600, questions: ['l7-seq'] },
    { type: 'quest', id: 'wind', npc: 'sign', x: 3060, y: 520, questions: ['l7-pattern'] },
    { type: 'hint', id: 'h-wind', x: 3220, y: 520, text: 'Шагни в ветер — он поднимет тебя к острову!' },
    {
      type: 'quest',
      id: 'route',
      npc: 'owl',
      x: 3980,
      y: 300,
      questions: ['l7-route'],
      requires: ['item:l1', 'item:l2', 'item:l3'],
      requiresText: 'Сове нужны 3 огонька',
    },
  ],
  goals: [
    { text: 'Реши загадку Совы', emoji: '🦉', done: ['seq'] },
    { text: 'Запусти мельницу', emoji: '🌀', done: ['wind'] },
    { text: 'Собери огоньки', emoji: '💡', done: ['item:l1', 'item:l2', 'item:l3'] },
    { text: 'Выбери путь по небу', emoji: '🗺️', done: ['route'] },
  ],
  decor: [
    { key: 'windmill', x: 3190, y: 524, scale: 0.8 },
    { key: 'windBlades', x: 3190, y: 386, scale: 0.8, spin: 120, spinWhen: 'wind' },
  ],
  portal: { x: 7200, y: 400, requires: ['route'] },
  reward: 'shard-3',
  finaleFlag: 'route',
  finaleText: 'Небо снова сияет! Портал открыт',
};
