import type { LevelDef } from '../../types/game';
import { LEVEL_INTROS } from '../../data/stories';

// 6. Crystal Cave: operations within 15, comparison, logic.
// New mechanics — number locks, a lever, and a crystal lift.
export const level6: LevelDef = {
  id: 6,
  chapter: 2,
  name: 'Кристальная пещера',
  subtitle: 'Замки с числами',
  emoji: '💎',
  theme: 'cave',
  portrait: 'numlock',
  width: 7400,
  spawn: { x: 260, y: 520 },
  intro: LEVEL_INTROS[6],
  platforms: [
    { x: 0, y: 600, w: 1900 },
    { x: 500, y: 495, w: 180, kind: 'crystal' },
    // Low cave ceiling
    { x: 1450, y: 380, w: 250, h: 60, kind: 'block' },
    // Lift to the upper tier — after the lever
    { x: 1760, y: 300, w: 140, kind: 'crystal', move: { dy: 280, speed: 60 }, showWhen: 'lever' },
    { x: 1900, y: 300, w: 1000 },
    { x: 2900, y: 600, w: 1700 },
    { x: 3300, y: 500, w: 140, kind: 'crystal' },
    { x: 3500, y: 400, w: 140, kind: 'crystal' },
    { x: 3700, y: 300, w: 140, kind: 'crystal' },
    // Floating crystal over the chasm
    { x: 4620, y: 560, w: 140, kind: 'crystal', move: { dx: 140, speed: 60 } },
    { x: 4900, y: 600, w: 2500 },
  ],
  stars: [
    { x: 400, y: 545 }, { x: 560, y: 440 }, { x: 640, y: 440 }, { x: 900, y: 545 },
    { x: 1575, y: 325 }, { x: 1830, y: 240 },
    { x: 2050, y: 245 }, { x: 2200, y: 245 }, { x: 2500, y: 245 },
    { x: 3100, y: 545 }, { x: 3370, y: 445 }, { x: 3570, y: 345 },
    { x: 4200, y: 545 }, { x: 4690, y: 500 }, { x: 4830, y: 500 },
    { x: 5200, y: 545 }, { x: 6100, y: 545 }, { x: 6400, y: 545 },
  ],
  items: [
    { id: 'g1', kind: 'gem', x: 590, y: 445, label: 'Кристалл!' },
    { id: 'g2', kind: 'gem', x: 2350, y: 250, label: 'Кристалл!' },
    { id: 'g3', kind: 'gem', x: 3770, y: 250, label: 'Кристалл!' },
  ],
  checkpoints: [
    { x: 1150, y: 600 },
    { x: 1960, y: 300 },
    { x: 2980, y: 600 },
    { x: 4960, y: 600 },
  ],
  gates: [
    { id: 'gate1', kind: 'crystal', x: 1340, y: 600, openWhen: 'lock1' },
    { id: 'gate2', kind: 'crystal', x: 2760, y: 300, openWhen: 'lock2' },
  ],
  stations: [
    { type: 'quest', id: 'lock1', npc: 'numlock', x: 1180, y: 600, questions: ['l6-add'] },
    { type: 'quest', id: 'lever', npc: 'lever', x: 1580, y: 600, questions: ['l6-compare'] },
    { type: 'hint', id: 'h-lift', x: 1700, y: 600, text: 'Встань на кристалл — он поднимет тебя!' },
    { type: 'quest', id: 'lock2', npc: 'numlock', x: 2620, y: 300, questions: ['l6-logic'] },
    {
      type: 'quest',
      id: 'mech',
      npc: 'machine',
      x: 5700,
      y: 600,
      questions: ['l6-sub'],
      requires: ['item:g1', 'item:g2', 'item:g3'],
      requiresText: 'Механизму нужны 3 кристалла',
    },
  ],
  goals: [
    { text: 'Открой кристальный замок', emoji: '🔐', done: ['lock1'] },
    { text: 'Включи рычаг', emoji: '🕹️', done: ['lever'] },
    { text: 'Открой второй замок', emoji: '🔐', done: ['lock2'] },
    { text: 'Собери кристаллы', emoji: '💎', done: ['item:g1', 'item:g2', 'item:g3'] },
    { text: 'Запусти древний механизм', emoji: '⚙️', done: ['mech'] },
  ],
  decor: [
    { key: 'bigGear', x: 5560, y: 280, scale: 0.7, spin: 50, spinWhen: 'mech' },
    { key: 'bigGear', x: 5860, y: 240, scale: 0.5, spin: -70, spinWhen: 'mech' },
  ],
  portal: { x: 7000, y: 600, requires: ['mech'] },
  reward: 'shard-2',
  finaleFlag: 'mech',
  finaleText: 'Древний механизм запущен! Пещера засияла',
};
