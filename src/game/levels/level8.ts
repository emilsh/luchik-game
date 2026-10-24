import type { LevelDef } from '../../types/game';
import { LEVEL_INTROS } from '../../data/stories';

// 8. Библиотека времени: порядок событий, причина и следствие, поиск книги.
// Новые механики — летающая книга-лифт, тайная дверь-шкаф, лесенка из книг.
export const level8: LevelDef = {
  id: 8,
  chapter: 2,
  name: 'Библиотека времени',
  subtitle: 'Порядок событий',
  emoji: '📚',
  theme: 'library',
  portrait: 'bookstand',
  width: 7800,
  spawn: { x: 260, y: 520 },
  intro: LEVEL_INTROS[8],
  platforms: [
    { x: 0, y: 600, w: 1460 },
    { x: 520, y: 500, w: 170, kind: 'books' },
    // Летающая книга-лифт
    { x: 1300, y: 300, w: 160, kind: 'books', move: { dy: 280, speed: 60 }, showWhen: 'story1' },
    { x: 1460, y: 300, w: 1700 },
    { x: 1800, y: 190, w: 160, kind: 'books' },
    { x: 3160, y: 600, w: 1700 },
    // Лесенка из книг после поиска
    { x: 4450, y: 490, w: 140, kind: 'books', showWhen: 'findbook' },
    { x: 4650, y: 380, w: 140, kind: 'books', showWhen: 'findbook' },
    { x: 4850, y: 270, w: 140, kind: 'books', showWhen: 'findbook' },
    { x: 5050, y: 270, w: 1200 },
    { x: 6250, y: 600, w: 1550 },
  ],
  stars: [
    { x: 400, y: 545 }, { x: 560, y: 445 }, { x: 650, y: 445 }, { x: 950, y: 545 },
    { x: 1380, y: 400 }, { x: 1600, y: 245 }, { x: 1880, y: 135 },
    { x: 2200, y: 245 }, { x: 2900, y: 245 }, { x: 3050, y: 245 },
    { x: 3300, y: 545 }, { x: 4520, y: 435 }, { x: 4720, y: 325 }, { x: 4920, y: 215 },
    { x: 5300, y: 215 }, { x: 5600, y: 215 }, { x: 6500, y: 545 }, { x: 6800, y: 545 },
  ],
  items: [
    { id: 'p1', kind: 'page', x: 605, y: 450, label: 'Волшебная страница!' },
    { id: 'p2', kind: 'page', x: 2950, y: 250, label: 'Волшебная страница!' },
    { id: 'p3', kind: 'page', x: 5450, y: 220, label: 'Волшебная страница!' },
  ],
  checkpoints: [
    { x: 1530, y: 300 },
    { x: 3230, y: 600 },
    { x: 5120, y: 270 },
    { x: 6320, y: 600 },
  ],
  gates: [{ id: 'secret', kind: 'bookcase', x: 2700, y: 300, openWhen: 'cause' }],
  stations: [
    { type: 'quest', id: 'story1', npc: 'bookstand', x: 1100, y: 600, questions: ['l8-order'] },
    { type: 'quest', id: 'cause', npc: 'owl', x: 2480, y: 300, questions: ['l8-cause'] },
    {
      type: 'find',
      id: 'findbook',
      npc: 'owl',
      x: 3420,
      y: 600,
      question: 'l8-find-book',
      pedestals: [
        { x: 3700, y: 600 },
        { x: 3950, y: 600 },
        { x: 4200, y: 600 },
      ],
    },
    {
      type: 'quest',
      id: 'story2',
      npc: 'bookstand',
      x: 5900,
      y: 270,
      questions: ['l8-order2'],
      requires: ['item:p1', 'item:p2', 'item:p3'],
      requiresText: 'Найди 3 волшебные страницы',
    },
  ],
  goals: [
    { text: 'Расставь историю по порядку', emoji: '📖', done: ['story1'] },
    { text: 'Узнай, почему упала книга', emoji: '🦉', done: ['cause'] },
    { text: 'Найди книгу про море', emoji: '🔎', done: ['findbook'] },
    { text: 'Собери страницы', emoji: '📜', done: ['item:p1', 'item:p2', 'item:p3'] },
    { text: 'Восстанови последнюю историю', emoji: '📖', done: ['story2'] },
  ],
  portal: { x: 7400, y: 600, requires: ['story2'] },
  reward: 'shard-4',
  finaleFlag: 'story2',
  finaleText: 'Истории вернулись на свои места! Портал открыт',
};
