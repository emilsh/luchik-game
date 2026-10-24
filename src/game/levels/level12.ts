import type { LevelDef } from '../../types/game';
import { LEVEL_INTROS } from '../../data/stories';

// 12. Observatory of Light — the finale of chapter 2. Four stages:
// A — platforms and lenses, B — instructions and order of actions,
// C — problems for the star mechanism, D — an English word and assembling the Crystal of Light.
export const level12: LevelDef = {
  id: 12,
  chapter: 2,
  name: 'Обсерватория света',
  subtitle: 'Финал: Кристалл Света',
  emoji: '🔭',
  theme: 'observatory',
  portrait: 'telescope',
  width: 8600,
  spawn: { x: 260, y: 520 },
  intro: LEVEL_INTROS[12],
  platforms: [
    // Stage A
    { x: 0, y: 600, w: 1200 },
    { x: 450, y: 500, w: 160, kind: 'ledge' },
    { x: 1240, y: 560, w: 140, kind: 'ledge', move: { dx: 160, speed: 70 } },
    { x: 1600, y: 600, w: 900 },
    { x: 1900, y: 580, w: 120, kind: 'bouncy', bounce: 1050 },
    { x: 2060, y: 280, w: 180, kind: 'ledge' },
    { x: 2540, y: 400, w: 140, kind: 'ledge', move: { dy: 190, speed: 60 } },
    { x: 2700, y: 400, w: 1000 },
    // Stage B → star bridge
    { x: 3700, y: 400, w: 300, kind: 'crystal', showWhen: 'scope' },
    { x: 4000, y: 400, w: 1100 },
    // Stage C → lift to the dome
    { x: 5100, y: 240, w: 140, kind: 'crystal', move: { dy: 160, speed: 60 }, showWhen: 'mech' },
    { x: 5240, y: 240, w: 1300 },
    { x: 6540, y: 600, w: 2060 },
  ],
  stars: [
    { x: 380, y: 545 }, { x: 530, y: 445 }, { x: 900, y: 545 },
    { x: 1310, y: 500 }, { x: 1450, y: 500 }, { x: 1800, y: 545 },
    { x: 1960, y: 400 }, { x: 2150, y: 225 }, { x: 2610, y: 470 },
    { x: 2900, y: 345 }, { x: 3200, y: 345 }, { x: 3850, y: 345 },
    { x: 4300, y: 345 }, { x: 4900, y: 345 }, { x: 5170, y: 300 },
    { x: 5500, y: 185 }, { x: 6900, y: 545 }, { x: 7300, y: 545 }, { x: 7700, y: 545 },
  ],
  items: [
    { id: 'lens1', kind: 'lens', x: 530, y: 450, label: 'Звёздная линза!' },
    { id: 'lens2', kind: 'lens', x: 2150, y: 230, label: 'Звёздная линза!' },
    { id: 'lens3', kind: 'lens', x: 3050, y: 350, label: 'Звёздная линза!' },
  ],
  checkpoints: [
    { x: 1660, y: 600 },
    { x: 2760, y: 400 },
    { x: 4060, y: 400 },
    { x: 5300, y: 240 },
    { x: 6600, y: 600 },
  ],
  gates: [],
  stations: [
    {
      type: 'quest',
      id: 'scope',
      npc: 'telescope',
      x: 3450,
      y: 400,
      questions: ['l12-order'],
      requires: ['item:lens1', 'item:lens2', 'item:lens3'],
      requiresText: 'Телескопу нужны 3 звёздные линзы',
    },
    { type: 'quest', id: 'mech', npc: 'numlock', x: 4700, y: 400, questions: ['l12-add', 'l12-sub', 'l12-seq'] },
    {
      type: 'find',
      id: 'star',
      npc: 'owl',
      x: 5400,
      y: 240,
      question: 'l12-star',
      pedestalStyle: 'ground',
      pedestals: [
        { x: 5650, y: 240 },
        { x: 5880, y: 240 },
        { x: 6110, y: 240 },
      ],
    },
  ],
  goals: [
    { text: 'Собери звёздные линзы', emoji: '🔍', done: ['item:lens1', 'item:lens2', 'item:lens3'] },
    { text: 'Настрой телескоп по инструкции', emoji: '🔭', done: ['scope'] },
    { text: 'Запусти звёздный механизм', emoji: '⚙️', done: ['mech'] },
    { text: 'Поговори с Совой', emoji: '🦉', done: ['star:active'] },
    { text: 'Найди:', emoji: '🔎', done: ['star'], question: 'l12-star' },
  ],
  decor: [
    { key: 'telescope', x: 3200, y: 404, scale: 0.8 },
    { key: 'centralCrystal', x: 6380, y: 244, scale: 0.75, front: true, role: 'finale' },
  ],
  portal: { x: 8100, y: 600, requires: ['star'] },
  reward: 'light-crystal',
  extraRewards: ['shard-8'],
  finaleFlag: 'star',
  finaleText: 'Кристалл Света собран! Свет вернулся в мир!',
};
