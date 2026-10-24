import type { LevelDef } from '../../types/game';
import { LEVEL_INTROS } from '../../data/stories';

// 9. Фабрика роботов: действия в пределах 20, программа для робота, поиск ошибки.
// Новые механики — конвейеры, подъёмник и робот-помощник, который выполняет программу.
export const level9: LevelDef = {
  id: 9,
  chapter: 2,
  name: 'Фабрика роботов',
  subtitle: 'Команды для робота',
  emoji: '🤖',
  theme: 'factory',
  portrait: 'robot',
  width: 8000,
  spawn: { x: 260, y: 520 },
  intro: LEVEL_INTROS[9],
  platforms: [
    { x: 0, y: 600, w: 1640 },
    { x: 500, y: 510, w: 400, kind: 'conveyor', conveyor: 70 },
    // Подъёмник на верхний цех
    { x: 1500, y: 300, w: 140, kind: 'shelf', move: { dy: 280, speed: 60 }, showWhen: 'r1' },
    { x: 1640, y: 300, w: 1600 },
    { x: 2100, y: 280, w: 300, kind: 'conveyor', conveyor: -60 },
    { x: 3240, y: 600, w: 1700 },
    { x: 3600, y: 510, w: 360, kind: 'conveyor', conveyor: -60 },
    { x: 4960, y: 560, w: 140, kind: 'shelf', move: { dx: 140, speed: 70 } },
    { x: 5240, y: 600, w: 2760 },
  ],
  stars: [
    { x: 400, y: 545 }, { x: 600, y: 455 }, { x: 750, y: 455 }, { x: 1100, y: 545 },
    { x: 1570, y: 400 }, { x: 1800, y: 245 }, { x: 2250, y: 225 }, { x: 2500, y: 245 },
    { x: 3050, y: 245 }, { x: 3400, y: 545 }, { x: 3700, y: 455 },
    { x: 4300, y: 545 }, { x: 4600, y: 545 }, { x: 5030, y: 500 }, { x: 5170, y: 500 },
    { x: 5600, y: 545 }, { x: 6500, y: 545 }, { x: 6900, y: 545 },
  ],
  items: [
    { id: 'b1', kind: 'battery', x: 850, y: 460, label: 'Батарейка!' },
    { id: 'b2', kind: 'battery', x: 2350, y: 230, label: 'Батарейка!' },
    { id: 'b3', kind: 'battery', x: 3700, y: 460, label: 'Батарейка!' },
  ],
  checkpoints: [
    { x: 1700, y: 300 },
    { x: 3300, y: 600 },
    { x: 5300, y: 600 },
    { x: 6300, y: 600 },
  ],
  gates: [{ id: 'fgate', kind: 'door', x: 3180, y: 300, openWhen: 'button' }],
  helpers: [
    {
      id: 'helper',
      x: 2800,
      y: 300,
      trigger: 'prog',
      // Робот повторяет программу, которую составил ребёнок, и доходит до кнопки у ворот.
      path: [{ x: 3120, y: 300 }],
      fromProgram: 'l9-program',
      doneFlag: 'button',
    },
  ],
  stations: [
    { type: 'hint', id: 'h-conv', x: 450, y: 600, text: 'Конвейер везёт тебя сам. Можно идти и против него!' },
    { type: 'quest', id: 'r1', npc: 'robot', x: 1320, y: 600, questions: ['l9-add'] },
    { type: 'quest', id: 'prog', npc: 'numlock', x: 2650, y: 300, questions: ['l9-program'] },
    {
      type: 'quest',
      id: 'fix',
      npc: 'robot',
      x: 5900,
      y: 600,
      questions: ['l9-debug', 'l9-sub'],
      requires: ['item:b1', 'item:b2', 'item:b3'],
      requiresText: 'Роботу нужны 3 батарейки',
    },
  ],
  goals: [
    { text: 'Включи подъёмник', emoji: '🛗', done: ['r1'] },
    { text: 'Составь программу', emoji: '🤖', done: ['prog'] },
    { text: 'Подожди робота-помощника', emoji: '🔘', done: ['button'] },
    { text: 'Собери батарейки', emoji: '🔋', done: ['item:b1', 'item:b2', 'item:b3'] },
    { text: 'Исправь программу робота', emoji: '🛠️', done: ['fix'] },
  ],
  decor: [
    { key: 'bigGear', x: 5760, y: 320, scale: 0.6, spin: 60, spinWhen: 'fix' },
    { key: 'bigGear', x: 6060, y: 300, scale: 0.45, spin: -80, spinWhen: 'fix' },
  ],
  portal: { x: 7500, y: 600, requires: ['fix'] },
  reward: 'shard-5',
  finaleFlag: 'fix',
  finaleText: 'Фабрика снова работает! Портал открыт',
};
