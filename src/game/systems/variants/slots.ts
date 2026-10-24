import { CAUSE_STORIES, FIREFLY_STORIES, OBSERVATORY_ORDERS, ORDER_STORIES, SIGN_NOTES, SNAIL_STORIES } from './banks';
import {
  arithQ,
  bookDescQ,
  colorQ,
  compareQ,
  countQ,
  debugQ,
  energyQ,
  findWordQ,
  homeDescQ,
  instructionQ,
  keyDescQ,
  logicQ,
  numberSeqQ,
  orderQ,
  patternQ,
  pictureToWordQ,
  programQ,
  routeQ,
  storyQ,
  wordToPictureQ,
  type Ctx,
  type Variant,
} from './builders';
import { NOUNS, plural } from './ru';

// Слот = id задания на станции уровня. Награда и эффект в мире (мост, ворота,
// лифт) привязаны к слоту и не меняются; содержимое задания собирается заново
// на каждое прохождение. Потолки чисел: глава 1 — до 10, уровни 5–6 и 10–11 — до 15,
// остальные уровни главы 2 — до 20.

export type Generator = (ctx: Ctx) => Variant;

const resultOf = (ctx: Ctx, id: string) => ctx.resolved[id]?.meta?.result;
const targetsOf = (ctx: Ctx, ids: string[]) =>
  ids.map((id) => ctx.resolved[id]?.meta?.target).filter((t): t is string => !!t);

// Слова, которые ребёнок уже видел на табличках к моменту вопроса.
const L3_FIRST = ['CAT', 'DOG', 'SUN', 'STAR'];
const L3_UPPER = [...L3_FIRST, 'MOON', 'FISH', 'APPLE', 'BOOK'];
const L3_ALL = [...L3_UPPER, 'TREE'];
const SEA = ['FISH', 'SHELL', 'BOAT', 'STAR', 'KEY', 'WATER'];

export const SLOTS: Record<string, Generator> = {
  // ---------- Глава 1 ----------
  'l1-sign': (c) => storyQ(c, { bank: SIGN_NOTES }),
  'l1-snail-why': (c) => storyQ(c, { bank: SNAIL_STORIES }),
  'l1-snail-where': (c) => storyQ(c, { bank: SNAIL_STORIES, sameAs: 'l1-snail-why' }),

  'l2-count': (c) =>
    countQ(c, { nouns: [NOUNS.gear, NOUNS.bolt], ranges: { 1: [3, 5], 2: [4, 7], 3: [6, 9] }, max: 10 }),
  'l2-compare': (c) => compareQ(c, { max: 10 }),
  'l2-add': (c) =>
    arithQ(c, {
      op: '+',
      max: 10,
      nouns: [NOUNS.plank, NOUNS.gear],
      frame: (a, b) => `Болтик принёс ${a} ${plural(a, NOUNS.plank.forms)}, потом ещё ${b}. Сколько всего?`,
    }),
  'l2-sub': (c) =>
    arithQ(c, {
      op: '-',
      max: 10,
      nouns: [NOUNS.balloon, NOUNS.apple],
      frame: (a, b) =>
        `Было ${a} ${plural(a, NOUNS.balloon.forms)}. ${b} ${b === 1 ? 'улетел' : 'улетели'}. Сколько осталось?`,
    }),

  'l3-star': (c) => wordToPictureQ(c, { targets: L3_FIRST, pool: L3_FIRST }),
  'l3-cat': (c) => pictureToWordQ(c, { targets: L3_FIRST, pool: L3_FIRST, avoid: targetsOf(c, ['l3-star']) }),
  'l3-find-apple': (c) =>
    findWordQ(c, { targets: ['MOON', 'FISH', 'APPLE', 'BOOK'], pool: L3_UPPER, avoid: targetsOf(c, ['l3-star', 'l3-cat']) }),
  'l3-moon': (c) =>
    pictureToWordQ(c, { targets: L3_ALL, pool: L3_ALL, avoid: targetsOf(c, ['l3-star', 'l3-cat', 'l3-find-apple']) }),
  'l3-fish': (c) =>
    wordToPictureQ(c, {
      targets: L3_ALL,
      pool: L3_ALL,
      avoid: targetsOf(c, ['l3-star', 'l3-cat', 'l3-find-apple', 'l3-moon']),
    }),

  'l4-read': (c) => instructionQ(c),
  'l4-math': (c) =>
    arithQ(c, { op: '+', max: 10, nouns: [NOUNS.spark], frame: (a, b) => `Машине нужны искры. Сколько будет ${a} + ${b}?` }),
  // Рубильник открывается именно ключом — слово KEY не меняется, меняются соседи и места.
  'l4-find-key': (c) => findWordQ(c, { targets: ['KEY'], pool: ['FISH', 'BOOK', 'CAT', 'DOG', 'APPLE', 'STAR', 'MOON', 'TREE'] }),

  // ---------- Глава 2 ----------
  'l5-why': (c) => storyQ(c, { bank: FIREFLY_STORIES }),
  'l5-name': (c) => storyQ(c, { bank: FIREFLY_STORIES, sameAs: 'l5-why' }),
  'l5-home': (c) => homeDescQ(c),
  'l5-count': (c) =>
    countQ(c, { nouns: [NOUNS.lantern, NOUNS.mushroom], ranges: { 1: [6, 9], 2: [8, 12], 3: [10, 13] }, max: 13 }),
  // Сосчитанные фонарики — это те, что уже горят: число переходит в следующую задачу.
  'l5-add': (c) =>
    arithQ(c, {
      op: '+',
      max: 15,
      nouns: [NOUNS.lantern],
      fixedA: resultOf(c, 'l5-count'),
      frame: (a, b) => `Горят ${a} ${plural(a, NOUNS.lantern.forms)}. Ты зажёг ещё ${b}. Сколько теперь горит?`,
    }),

  'l6-add': (c) =>
    arithQ(c, { op: '+', max: 15, nouns: [NOUNS.crystal], frame: (a, b) => `Код замка: сколько будет ${a} + ${b}?` }),
  'l6-compare': (c) =>
    compareQ(c, { max: 15, frame: (m) => `Рычаг включает ${m === 'more' ? 'большее' : 'меньшее'} число. Какое?` }),
  'l6-logic': (c) => logicQ(c),
  'l6-sub': (c) =>
    energyQ(c, {
      max: 15,
      steps: 1,
      labels: ['Механизм'],
      frame: (t, [x]) => `Было ${t} единиц энергии. Механизм потратил ${x}. Сколько осталось?`,
    }),

  'l7-seq': (c) => numberSeqQ(c, { max: 20 }),
  'l7-pattern': (c) => patternQ(c),
  'l7-route': (c) => {
    const v = routeQ(c);
    return { ...v, q: { prompt: 'Какой дорожкой долететь до флажка и не попасть в тучу?', ...v.q } };
  },

  'l8-order': (c) => orderQ(c, { bank: ORDER_STORIES }),
  'l8-cause': (c) => storyQ(c, { bank: CAUSE_STORIES }),
  'l8-find-book': (c) => bookDescQ(c),
  'l8-order2': (c) => orderQ(c, { bank: ORDER_STORIES, avoidSameAs: 'l8-order' }),

  'l9-add': (c) =>
    arithQ(c, {
      op: '+',
      max: 20,
      nouns: [NOUNS.gear, NOUNS.bolt],
      frame: (a, b) => `Робот собрал ${a} ${plural(a, NOUNS.gear.forms)}, потом ещё ${b}. Сколько всего?`,
    }),
  'l9-program': (c) => programQ(c),
  'l9-debug': (c) => debugQ(c),
  'l9-sub': (c) =>
    arithQ(c, {
      op: '-',
      max: 20,
      nouns: [NOUNS.box],
      frame: (a, b) => `На конвейере ${a} ${plural(a, NOUNS.box.forms)}. ${b} ${b === 1 ? 'уехала' : 'уехали'}. Сколько осталось?`,
    }),

  'l10-path': (c) =>
    compareQ(c, {
      max: 15,
      min: 3,
      frame: (m) => `Мост крепкий там, где число ${m === 'more' ? 'больше' : 'меньше'}. Куда идти?`,
    }),
  'l10-energy': (c) =>
    energyQ(c, {
      max: 15,
      steps: 2,
      labels: ['Механизм 1', 'Механизм 2'],
      frame: (t, [x, y]) => `У Лучика ${t} единиц энергии. Первому механизму нужно ${x}, второму — ${y}. Сколько останется?`,
    }),
  'l10-gate-a': (c) =>
    arithQ(c, { op: '+', max: 12, nouns: [NOUNS.fire], frame: (a, b) => `Ворота заморожены. Первый шаг: ${a} + ${b}` }),
  // Второй шаг продолжает первый: из полученного числа вычитаем.
  'l10-gate-b': (c) =>
    arithQ(c, {
      op: '-',
      max: 12,
      nouns: [NOUNS.ice],
      fixedA: resultOf(c, 'l10-gate-a'),
      frame: (a, b) => `Второй шаг: из ${a} убери ${b}`,
    }),

  'l11-fish': (c) =>
    wordToPictureQ(c, { targets: ['FISH', 'SHELL', 'BOAT', 'STAR', 'KEY'], pool: SEA, prompt: (w) => `Find the ${w}` }),
  'l11-water': (c) =>
    pictureToWordQ(c, { targets: ['WATER', 'SHELL', 'BOAT', 'FISH'], pool: SEA, avoid: targetsOf(c, ['l11-fish']) }),
  'l11-blue': (c) => colorQ(c),
  'l11-key': (c) => keyDescQ(c),
  // Первое число — пять жемчужин, которые ребёнок собрал на уровне.
  'l11-pearls': (c) =>
    arithQ(c, {
      op: '+',
      max: 15,
      nouns: [NOUNS.pearl],
      fixedA: 5,
      frame: (a, b) => `Ты нашёл ${a} жемчужин, у Черепахи ещё ${b}. Сколько вместе?`,
    }),

  'l12-order': (c) => orderQ(c, { bank: OBSERVATORY_ORDERS, buttons: true }),
  'l12-add': (c) =>
    arithQ(c, { op: '+', max: 20, nouns: [NOUNS.star], frame: (a, b) => `Звёздный механизм: ${a} + ${b} = ?` }),
  'l12-sub': (c) =>
    arithQ(c, {
      op: '-',
      max: 20,
      nouns: [NOUNS.star],
      fixedA: resultOf(c, 'l12-add'),
      frame: (a, b) => `Звёзд всего: ${a}. Уже горят: ${b}. Сколько ещё зажечь?`,
    }),
  'l12-seq': (c) => numberSeqQ(c, { max: 20 }),
  'l12-star': (c) => findWordQ(c, { targets: ['STAR', 'MOON', 'SUN'], pool: ['STAR', 'MOON', 'SUN', 'KEY', 'FISH', 'TREE'] }),
};
