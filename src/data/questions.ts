import type { QuestionDef } from '../types/game';
import { vocab } from './vocabulary';
import { CHAPTER2_QUESTIONS } from './questions2';

// Все обучающие задания игры. Уровни ссылаются на них по id.

function numberOptions(values: number[]) {
  return values.map((v) => ({ id: String(v), label: String(v) }));
}

function pictureOptions(words: string[]) {
  return words.map((w) => ({ id: w, emoji: vocab(w).emoji }));
}

function wordOptions(words: string[]) {
  return words.map((w) => ({ id: w, label: w }));
}

const LIST: QuestionDef[] = [
  // ---------- Уровень 1: Зелёная долина ----------
  {
    id: 'l1-sign',
    skill: 'reading',
    story: ['Найди золотой ключ и открой ворота.'],
    prompt: 'Что нужно найти?',
    options: [
      { id: 'apple', emoji: '🍎', label: 'Яблоко' },
      { id: 'key', emoji: '🔑', label: 'Ключ' },
      { id: 'flower', emoji: '🌼', label: 'Цветок' },
    ],
    correct: 'key',
    hint: 'Прочитай табличку ещё раз. Что там золотое?',
    explanation: 'Верно! Ищем золотой ключ.',
    reward: 'Ключ где-то наверху!',
  },
  {
    id: 'l1-snail-why',
    skill: 'reading',
    story: [
      'Улитка Уля несла звёзды домой в корзинке.',
      'Вдруг подул сильный ветер.',
      'Корзинка упала, и звёзды улетели на облака.',
    ],
    prompt: 'Почему Уля потеряла звёзды?',
    options: [
      { id: 'rain', emoji: '🌧️', label: 'Пошёл дождь' },
      { id: 'sleep', emoji: '😴', label: 'Уля уснула' },
      { id: 'wind', emoji: '🌬️', label: 'Подул ветер' },
    ],
    correct: 'wind',
    hint: 'Прочитай второе предложение ещё раз.',
    explanation: 'Да! Сильный ветер сдул звёзды.',
    reward: 'Первое облако спустилось!',
  },
  {
    id: 'l1-snail-where',
    skill: 'reading',
    story: [
      'Улитка Уля несла звёзды домой в корзинке.',
      'Вдруг подул сильный ветер.',
      'Корзинка упала, и звёзды улетели на облака.',
    ],
    prompt: 'Куда улетели звёзды?',
    options: [
      { id: 'clouds', emoji: '☁️', label: 'На облака' },
      { id: 'river', emoji: '🌊', label: 'В речку' },
    ],
    correct: 'clouds',
    hint: 'Посмотри на последнее предложение.',
    explanation: 'Правильно! Звёзды на облаках.',
    reward: 'Облачный мостик готов!',
  },

  // ---------- Уровень 2: Мост чисел ----------
  {
    id: 'l2-count',
    skill: 'counting',
    prompt: 'Сколько шестерёнок?',
    visual: { kind: 'count', emoji: '⚙️', count: 5 },
    options: numberOptions([4, 5, 6]),
    correct: '5',
    hint: 'Считай по одной: дотронься до каждой пальчиком.',
    explanation: 'Пять шестерёнок!',
    reward: 'Первая часть моста готова!',
  },
  {
    id: 'l2-compare',
    skill: 'comparison',
    prompt: 'Какое число больше?',
    options: [
      { id: '4', label: '4', dots: 4 },
      { id: '7', label: '7', dots: 7 },
    ],
    correct: '7',
    hint: 'Посмотри на точки: где их больше?',
    explanation: '7 больше, чем 4!',
    reward: 'Мост стал длиннее!',
  },
  {
    id: 'l2-add',
    skill: 'addition',
    prompt: 'Сколько будет 3 + 2?',
    visual: { kind: 'equation', a: 3, b: 2, op: '+', emoji: '🪵' },
    options: numberOptions([4, 5, 6]),
    correct: '5',
    hint: 'Посчитай все доски вместе.',
    explanation: '3 + 2 = 5',
    reward: 'Доски легли на место!',
  },
  {
    id: 'l2-sub',
    skill: 'subtraction',
    prompt: 'Было 6 шариков. 2 улетели. Сколько осталось?',
    visual: { kind: 'equation', a: 6, b: 2, op: '-', emoji: '🎈' },
    options: numberOptions([3, 4, 5]),
    correct: '4',
    hint: 'Закрой пальчиком 2 шарика и посчитай остальные.',
    explanation: '6 − 2 = 4',
    reward: 'Мост починен!',
  },

  // ---------- Уровень 3: Английский лес ----------
  {
    id: 'l3-star',
    skill: 'english-word-to-picture',
    prompt: 'Где STAR?',
    word: 'STAR',
    visual: { kind: 'word', word: 'STAR' },
    options: pictureOptions(['APPLE', 'STAR', 'TREE']),
    correct: 'STAR',
    hint: 'STAR светит ночью в небе.',
    explanation: 'STAR — звезда!',
    reward: 'Вырос волшебный гриб!',
  },
  {
    id: 'l3-cat',
    skill: 'english-picture-to-word',
    prompt: 'Как это по-английски?',
    word: 'CAT',
    visual: { kind: 'picture', emoji: vocab('CAT').emoji },
    options: wordOptions(['DOG', 'CAT', 'SUN']),
    correct: 'CAT',
    hint: 'Вспомни табличку с котиком.',
    explanation: 'CAT — кошка!',
    reward: 'Грибы выросли до самого верха!',
  },
  {
    id: 'l3-find-apple',
    skill: 'english-word-to-picture',
    prompt: 'Найди в лесу:',
    word: 'APPLE',
    visual: { kind: 'find', word: 'APPLE', emoji: vocab('APPLE').emoji },
    options: [
      { id: 'BOOK', emoji: vocab('BOOK').emoji, label: 'BOOK' },
      { id: 'APPLE', emoji: vocab('APPLE').emoji, label: 'APPLE' },
      { id: 'DOG', emoji: vocab('DOG').emoji, label: 'DOG' },
    ],
    correct: 'APPLE',
    hint: 'APPLE — это фрукт. Красный и круглый.',
    explanation: 'APPLE — яблоко!',
    reward: 'Лианы расступились!',
  },
  {
    id: 'l3-moon',
    skill: 'english-picture-to-word',
    prompt: 'Как это по-английски?',
    word: 'MOON',
    visual: { kind: 'picture', emoji: vocab('MOON').emoji },
    options: wordOptions(['SUN', 'MOON', 'STAR']),
    correct: 'MOON',
    hint: 'Вспомни табличку с луной.',
    explanation: 'MOON — луна!',
    reward: 'Появился кристальный мостик!',
  },
  {
    id: 'l3-fish',
    skill: 'english-word-to-picture',
    prompt: 'Где FISH?',
    word: 'FISH',
    visual: { kind: 'word', word: 'FISH' },
    options: pictureOptions(['CAT', 'BOOK', 'FISH']),
    correct: 'FISH',
    hint: 'FISH живёт в воде.',
    explanation: 'FISH — рыба!',
    reward: 'Мостик до портала готов!',
  },

  // ---------- Уровень 4: Мастерская изобретателя ----------
  {
    id: 'l4-read',
    skill: 'reading',
    story: [
      'Сначала вставь шестерёнку.',
      'Потом вставь пружину.',
      'Лампочку вставь последней.',
    ],
    prompt: 'Что нужно вставить последним?',
    options: [
      { id: 'gear', emoji: '⚙️', label: 'Шестерёнку' },
      { id: 'bulb', emoji: '💡', label: 'Лампочку' },
      { id: 'spring', emoji: '🌀', label: 'Пружину' },
    ],
    correct: 'bulb',
    hint: 'Найди в инструкции слово «последней».',
    explanation: 'Да! Лампочка — последняя.',
    reward: 'Детали встали на место!',
  },
  {
    id: 'l4-math',
    skill: 'addition',
    prompt: 'Машине нужны искры. Сколько будет 4 + 3?',
    visual: { kind: 'equation', a: 4, b: 3, op: '+', emoji: '⚡' },
    options: numberOptions([6, 7, 8]),
    correct: '7',
    hint: 'Посчитай все искры вместе.',
    explanation: '4 + 3 = 7',
    reward: 'Машина загудела! Открылась кладовая.',
  },
  {
    id: 'l4-find-key',
    skill: 'english-word-to-picture',
    prompt: 'Найди в кладовой:',
    word: 'KEY',
    visual: { kind: 'find', word: 'KEY', emoji: vocab('KEY').emoji },
    options: [
      { id: 'FISH', emoji: vocab('FISH').emoji, label: 'FISH' },
      { id: 'BOOK', emoji: vocab('BOOK').emoji, label: 'BOOK' },
      { id: 'KEY', emoji: vocab('KEY').emoji, label: 'KEY' },
    ],
    correct: 'KEY',
    hint: 'KEY открывает замки.',
    explanation: 'KEY — ключ!',
    reward: 'Ключ у тебя! Беги к большому рубильнику.',
  },
];

export const QUESTIONS: Record<string, QuestionDef> = Object.fromEntries(
  [...LIST, ...CHAPTER2_QUESTIONS].map((q) => [q.id, q]),
);

export const SKILL_NAMES: Record<QuestionDef['skill'], string> = {
  reading: 'Чтение',
  counting: 'Счёт',
  comparison: 'Сравнение чисел',
  addition: 'Сложение',
  subtraction: 'Вычитание',
  'english-word-to-picture': 'Английский: слово → картинка',
  'english-picture-to-word': 'Английский: картинка → слово',
  'story-order': 'Порядок событий',
  patterns: 'Последовательности',
  logic: 'Логика и маршруты',
  algorithms: 'Команды для робота',
};
