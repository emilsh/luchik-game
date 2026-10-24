import type { LevelDef } from '../../types/game';
import { LEVEL_INTROS } from '../../data/stories';

// 5. Зачарованный лес: чтение историй, поиск по описанию, счёт до 15.
// Новая механика — грибы-батуты.
export const level5: LevelDef = {
  id: 5,
  chapter: 2,
  name: 'Зачарованный лес',
  subtitle: 'Истории и счёт до 15',
  emoji: '🍄',
  theme: 'enchanted',
  portrait: 'firefly',
  width: 7000,
  spawn: { x: 260, y: 520 },
  intro: LEVEL_INTROS[5],
  platforms: [
    { x: 0, y: 600, w: 1300 },
    { x: 600, y: 500, w: 180, kind: 'ledge' },
    // Грибы-батуты через овраг появляются после разговора со светлячком
    { x: 1390, y: 560, w: 130, kind: 'bouncy', bounce: 900, showWhen: 'firefly' },
    { x: 1560, y: 500, w: 100, kind: 'mushroom', showWhen: 'firefly' },
    { x: 1700, y: 420, w: 1100 },
    // Секретная тропинка наверху (по желанию)
    { x: 2150, y: 400, w: 110, kind: 'bouncy', bounce: 900 },
    { x: 2300, y: 180, w: 200, kind: 'ledge' },
    { x: 2560, y: 170, w: 180, kind: 'ledge' },
    { x: 2800, y: 600, w: 1500 },
    { x: 4450, y: 600, w: 1100 },
    { x: 4560, y: 500, w: 160, kind: 'mushroom' },
    { x: 4760, y: 400, w: 160, kind: 'mushroom' },
    { x: 5700, y: 600, w: 1300 },
  ],
  stars: [
    { x: 420, y: 545 }, { x: 650, y: 445 }, { x: 740, y: 445 }, { x: 1000, y: 545 },
    { x: 1450, y: 420 }, { x: 1610, y: 440 },
    { x: 1850, y: 365 }, { x: 2350, y: 125 }, { x: 2430, y: 125 }, { x: 2650, y: 115 },
    { x: 3000, y: 545 }, { x: 3400, y: 545 }, { x: 3700, y: 545 }, { x: 4000, y: 545 },
    { x: 4375, y: 500 }, { x: 4640, y: 445 },
    { x: 5100, y: 545 }, { x: 5600, y: 480 },
    { x: 5900, y: 545 }, { x: 6100, y: 545 },
  ],
  items: [
    { id: 'l1', kind: 'light', x: 690, y: 450, label: 'Огонёк!' },
    { id: 'l2', kind: 'light', x: 2450, y: 370, label: 'Огонёк!' },
    { id: 'l3', kind: 'light', x: 4840, y: 350, label: 'Огонёк!' },
  ],
  checkpoints: [
    { x: 1760, y: 420 },
    { x: 2880, y: 600 },
    { x: 4510, y: 600 },
    { x: 5760, y: 600 },
  ],
  gates: [{ id: 'vines', kind: 'vines', x: 4150, y: 600, openWhen: 'home' }],
  stations: [
    { type: 'quest', id: 'firefly', npc: 'firefly', x: 1130, y: 600, questions: ['l5-why', 'l5-name'] },
    { type: 'hint', id: 'h-bounce', x: 1270, y: 600, text: 'Прыгни на зелёный гриб — он подбросит!' },
    {
      type: 'find',
      id: 'home',
      npc: 'firefly',
      x: 2960,
      y: 600,
      question: 'l5-home',
      pedestalStyle: 'ground',
      pedestals: [
        { x: 3250, y: 600 },
        { x: 3550, y: 600 },
        { x: 3850, y: 600 },
      ],
    },
    {
      type: 'quest',
      id: 'oak',
      npc: 'owl',
      x: 5300,
      y: 600,
      questions: ['l5-count', 'l5-add'],
      requires: ['item:l1', 'item:l2', 'item:l3'],
      requiresText: 'Принеси 3 огонька для фонарей',
    },
  ],
  goals: [
    { text: 'Поговори со светлячком', emoji: '✨', done: ['firefly'] },
    { text: 'Найди дом светлячка', emoji: '🌳', done: ['home'] },
    { text: 'Собери огоньки', emoji: '💡', done: ['item:l1', 'item:l2', 'item:l3'] },
    { text: 'Зажги фонари с Совой', emoji: '🏮', done: ['oak'] },
  ],
  portal: { x: 6600, y: 600, requires: ['oak'] },
  reward: 'shard-1',
  finaleFlag: 'oak',
  finaleText: 'Фонари леса зажглись! Портал открыт',
};
