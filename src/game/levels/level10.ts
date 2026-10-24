import type { LevelDef } from '../../types/game';
import { LEVEL_INTROS } from '../../data/stories';

// 10. Ледяная гора: сравнение, задачи в несколько действий, связанные примеры.
// Новые механики — скользкий лёд (мягкий разгон и торможение) и тающие ворота.
export const level10: LevelDef = {
  id: 10,
  chapter: 2,
  name: 'Ледяная гора',
  subtitle: 'Задачи в несколько шагов',
  emoji: '🏔️',
  theme: 'ice',
  portrait: 'penguin',
  width: 8200,
  spawn: { x: 260, y: 520 },
  intro: LEVEL_INTROS[10],
  platforms: [
    { x: 0, y: 600, w: 1500 },
    { x: 500, y: 500, w: 260, kind: 'ice' },
    // Ледяной мост после выбора пути
    { x: 1500, y: 600, w: 250, kind: 'ice', showWhen: 'path' },
    { x: 1750, y: 600, w: 250, kind: 'ice', showWhen: 'path' },
    { x: 2000, y: 600, w: 1400 },
    { x: 2320, y: 500, w: 160, kind: 'ledge' },
    // Ступеньки после задачи про энергию
    { x: 3420, y: 495, w: 140, kind: 'ledge', showWhen: 'energy' },
    { x: 3580, y: 400, w: 120, kind: 'ledge', showWhen: 'energy' },
    { x: 3700, y: 360, w: 1200 },
    { x: 4900, y: 600, w: 3300 },
    // Длинная ледяная дорожка
    { x: 5200, y: 600, w: 600, kind: 'ice' },
    { x: 5500, y: 490, w: 160, kind: 'ledge' },
  ],
  stars: [
    { x: 400, y: 545 }, { x: 560, y: 445 }, { x: 700, y: 445 }, { x: 1000, y: 545 },
    { x: 1625, y: 545 }, { x: 1875, y: 545 },
    { x: 2200, y: 545 }, { x: 2400, y: 445 }, { x: 2800, y: 545 },
    { x: 3490, y: 440 }, { x: 3640, y: 345 }, { x: 3900, y: 305 }, { x: 4300, y: 305 },
    { x: 5100, y: 545 }, { x: 5350, y: 545 }, { x: 5580, y: 435 }, { x: 5750, y: 545 },
    { x: 7000, y: 545 }, { x: 7300, y: 545 },
  ],
  items: [
    { id: 'l1', kind: 'light', x: 630, y: 450, label: 'Огонёк для маяка!' },
    { id: 'l2', kind: 'light', x: 2400, y: 450, label: 'Огонёк для маяка!' },
    { id: 'l3', kind: 'light', x: 4100, y: 310, label: 'Огонёк для маяка!' },
  ],
  checkpoints: [
    { x: 2060, y: 600 },
    { x: 3760, y: 360 },
    { x: 4960, y: 600 },
    { x: 6000, y: 600 },
  ],
  gates: [{ id: 'icegate', kind: 'ice', x: 4650, y: 360, openWhen: 'thaw' }],
  stations: [
    { type: 'hint', id: 'h-ice', x: 420, y: 600, text: 'Лёд скользкий — отпускай кнопку чуть раньше!' },
    { type: 'quest', id: 'path', npc: 'penguin', x: 1300, y: 600, questions: ['l10-path'] },
    { type: 'quest', id: 'energy', npc: 'penguin', x: 3200, y: 600, questions: ['l10-energy'] },
    { type: 'quest', id: 'thaw', npc: 'numlock', x: 4480, y: 360, questions: ['l10-gate-a', 'l10-gate-b'] },
    {
      type: 'lock',
      id: 'beacon',
      npc: 'lever',
      x: 6400,
      y: 600,
      requires: ['item:l1', 'item:l2', 'item:l3'],
      requiresText: 'Для маяка нужны 3 огонька',
      doneText: 'Маяк зажигается!',
    },
  ],
  goals: [
    { text: 'Выбери крепкий мост', emoji: '🐧', done: ['path'] },
    { text: 'Посчитай энергию', emoji: '⚡', done: ['energy'] },
    { text: 'Растопи ледяные ворота', emoji: '🧊', done: ['thaw'] },
    { text: 'Собери огоньки', emoji: '💡', done: ['item:l1', 'item:l2', 'item:l3'] },
    { text: 'Зажги маяк', emoji: '🗼', done: ['beacon'] },
  ],
  decor: [{ key: 'lighthouse', x: 6700, y: 604, scale: 1.1 }],
  portal: { x: 7700, y: 600, requires: ['beacon'] },
  reward: 'shard-6',
  finaleFlag: 'beacon',
  finaleText: 'Горный маяк светит снова! Портал открыт',
};
