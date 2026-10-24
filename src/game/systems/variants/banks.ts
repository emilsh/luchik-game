import type { AnswerOption } from '../../../types/game';

// Банки коротких текстов для вариативных заданий. Каждый текст согласован
// с миром своего уровня (например, у улитки звёзды всегда улетают на облака —
// потому что после ответа появляется облачный мостик).

export interface StoryQuestion {
  /** literal — ответ прямо в тексте; cause — «почему?» (сложнее). */
  kind: 'literal' | 'cause';
  prompt: string;
  options: AnswerOption[];
  correct: string;
  hint: string;
  explanation: string;
}

export interface StoryEntry {
  key: string;
  story: string[];
  questions: StoryQuestion[];
}

const WHERE_CLOUDS: StoryQuestion = {
  kind: 'literal',
  prompt: 'Куда улетели звёзды?',
  options: [
    { id: 'clouds', emoji: '☁️', label: 'На облака' },
    { id: 'river', emoji: '🌊', label: 'В речку' },
    { id: 'tree', emoji: '🌳', label: 'На дерево' },
  ],
  correct: 'clouds',
  hint: 'Посмотри на последнее предложение.',
  explanation: 'Правильно! Звёзды на облаках.',
};

/** Уровень 1: история улитки Ули. */
export const SNAIL_STORIES: StoryEntry[] = [
  {
    key: 'wind',
    story: [
      'Улитка Уля несла звёзды домой в корзинке.',
      'Вдруг подул сильный ветер.',
      'Корзинка упала, и звёзды улетели на облака.',
    ],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему Уля потеряла звёзды?',
        options: [
          { id: 'rain', emoji: '🌧️', label: 'Пошёл дождь' },
          { id: 'sleep', emoji: '😴', label: 'Уля уснула' },
          { id: 'wind', emoji: '🌬️', label: 'Подул ветер' },
        ],
        correct: 'wind',
        hint: 'Прочитай второе предложение ещё раз.',
        explanation: 'Да! Сильный ветер сдул звёзды.',
      },
      WHERE_CLOUDS,
      {
        kind: 'literal',
        prompt: 'Что несла Уля в корзинке?',
        options: [
          { id: 'stars', emoji: '⭐', label: 'Звёзды' },
          { id: 'apples', emoji: '🍎', label: 'Яблоки' },
          { id: 'leaves', emoji: '🍂', label: 'Листья' },
        ],
        correct: 'stars',
        hint: 'Ответ — в первом предложении.',
        explanation: 'Верно! Уля несла звёзды.',
      },
    ],
  },
  {
    key: 'bird',
    story: [
      'Улитка Уля собирала звёзды в корзинку.',
      'Мимо пролетела весёлая птица и задела корзинку крылом.',
      'Звёзды рассыпались и улетели на облака.',
    ],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему звёзды рассыпались?',
        options: [
          { id: 'bird', emoji: '🐦', label: 'Птица задела корзинку' },
          { id: 'wind', emoji: '🌬️', label: 'Подул ветер' },
          { id: 'sleep', emoji: '😴', label: 'Уля уснула' },
        ],
        correct: 'bird',
        hint: 'Кто пролетел мимо Ули?',
        explanation: 'Да! Птица задела корзинку крылом.',
      },
      {
        kind: 'literal',
        prompt: 'Кто задел корзинку?',
        options: [
          { id: 'cat', emoji: '🐱', label: 'Кошка' },
          { id: 'bird', emoji: '🐦', label: 'Птица' },
          { id: 'frog', emoji: '🐸', label: 'Лягушка' },
        ],
        correct: 'bird',
        hint: 'Прочитай второе предложение.',
        explanation: 'Верно! Это была весёлая птица.',
      },
      WHERE_CLOUDS,
    ],
  },
  {
    key: 'stone',
    story: [
      'Улитка Уля несла звёзды на праздник.',
      'По дороге она споткнулась о камешек.',
      'Корзинка упала, и звёзды улетели на облака.',
    ],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему корзинка упала?',
        options: [
          { id: 'rain', emoji: '🌧️', label: 'Пошёл дождь' },
          { id: 'stone', emoji: '🪨', label: 'Уля споткнулась' },
          { id: 'bird', emoji: '🐦', label: 'Птица задела' },
        ],
        correct: 'stone',
        hint: 'Что случилось по дороге?',
        explanation: 'Да! Уля споткнулась о камешек.',
      },
      {
        kind: 'literal',
        prompt: 'Куда Уля несла звёзды?',
        options: [
          { id: 'home', emoji: '🏠', label: 'Домой' },
          { id: 'party', emoji: '🎉', label: 'На праздник' },
          { id: 'river', emoji: '🌊', label: 'К речке' },
        ],
        correct: 'party',
        hint: 'Ответ — в первом предложении.',
        explanation: 'Верно! Звёзды были для праздника.',
      },
      WHERE_CLOUDS,
    ],
  },
];

const KEY_WHAT: StoryQuestion = {
  kind: 'literal',
  prompt: 'Что нужно найти?',
  options: [
    { id: 'apple', emoji: '🍎', label: 'Яблоко' },
    { id: 'key', emoji: '🔑', label: 'Ключ' },
    { id: 'flower', emoji: '🌼', label: 'Цветок' },
  ],
  correct: 'key',
  hint: 'Прочитай записку ещё раз. Что там золотое?',
  explanation: 'Верно! Ищем золотой ключ.',
};

const KEY_OPENS: StoryQuestion = {
  kind: 'cause',
  prompt: 'Что откроет золотой ключ?',
  options: [
    { id: 'window', emoji: '🪟', label: 'Окно' },
    { id: 'chest', emoji: '🧰', label: 'Сундук' },
    { id: 'gate', emoji: '🚪', label: 'Ворота' },
  ],
  correct: 'gate',
  hint: 'Что закрыто на этой дороге?',
  explanation: 'Да! Ключ откроет ворота.',
};

const KEY_WHICH: StoryQuestion = {
  kind: 'literal',
  prompt: 'Какой ключ нужен?',
  options: [
    { id: 'silver', emoji: '⚪', label: 'Серебряный' },
    { id: 'gold', emoji: '🟡', label: 'Золотой' },
    { id: 'wood', emoji: '🟤', label: 'Деревянный' },
  ],
  correct: 'gold',
  hint: 'Какого цвета ключ в записке?',
  explanation: 'Верно! Нужен золотой ключ.',
};

/** Уровень 1: записка на табличке (ключ всегда наверху, ворота впереди). */
export const SIGN_NOTES: StoryEntry[] = [
  { key: 'short', story: ['Найди золотой ключ и открой ворота.'], questions: [KEY_WHAT, KEY_OPENS, KEY_WHICH] },
  {
    key: 'up',
    story: ['Золотой ключ лежит наверху.', 'Возьми его и открой ворота.'],
    questions: [
      KEY_WHAT,
      KEY_OPENS,
      {
        kind: 'literal',
        prompt: 'Где лежит ключ?',
        options: [
          { id: 'down', emoji: '⬇️', label: 'Внизу' },
          { id: 'up', emoji: '⬆️', label: 'Наверху' },
          { id: 'river', emoji: '🌊', label: 'В речке' },
        ],
        correct: 'up',
        hint: 'Прочитай первое предложение.',
        explanation: 'Верно! Ключ наверху — прыгай по уступам.',
      },
    ],
  },
  { key: 'closed', story: ['Ворота закрыты.', 'Их откроет только золотой ключ.'], questions: [KEY_OPENS, KEY_WHICH, KEY_WHAT] },
];

/** Все три имени — в каждом варианте, чтобы ответ нужно было прочитать в тексте. */
const nameOptions = (): AnswerOption[] => [
  { id: 'Искра', emoji: '✨', label: 'Искра' },
  { id: 'Огонёк', emoji: '🔥', label: 'Огонёк' },
  { id: 'Пушок', emoji: '💫', label: 'Пушок' },
];

/** Уровень 5: история светлячка. */
export const FIREFLY_STORIES: StoryEntry[] = [
  {
    key: 'dark',
    story: ['Светлячок Искра летал по лесу.', 'Вдруг погасли все фонари.', 'Стало темно, и Искра не нашёл дорогу домой.'],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему Искра не нашёл дорогу?',
        options: [
          { id: 'rain', emoji: '🌧️', label: 'Пошёл дождь' },
          { id: 'dark', emoji: '🌑', label: 'Стало темно' },
          { id: 'sleep', emoji: '😴', label: 'Он уснул' },
        ],
        correct: 'dark',
        hint: 'Прочитай второе и третье предложения.',
        explanation: 'Да! Фонари погасли, и стало темно.',
      },
      {
        kind: 'literal',
        prompt: 'Как зовут светлячка?',
        options: nameOptions(),
        correct: 'Искра',
        hint: 'Имя есть в первом предложении.',
        explanation: 'Правильно! Его зовут Искра.',
      },
      {
        kind: 'literal',
        prompt: 'Что погасло в лесу?',
        options: [
          { id: 'lamps', emoji: '🏮', label: 'Фонари' },
          { id: 'sun', emoji: '☀️', label: 'Солнце' },
          { id: 'fire', emoji: '🔥', label: 'Костёр' },
        ],
        correct: 'lamps',
        hint: 'Прочитай второе предложение.',
        explanation: 'Верно! Погасли фонари.',
      },
    ],
  },
  {
    key: 'fog',
    story: ['Светлячок Огонёк играл с друзьями.', 'Вдруг пришёл густой туман.', 'Огонёк ничего не видел и потерялся.'],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему Огонёк потерялся?',
        options: [
          { id: 'fog', emoji: '🌫️', label: 'Пришёл туман' },
          { id: 'rain', emoji: '🌧️', label: 'Пошёл дождь' },
          { id: 'sleep', emoji: '😴', label: 'Он уснул' },
        ],
        correct: 'fog',
        hint: 'Что пришло в лес? Прочитай второе предложение.',
        explanation: 'Да! В тумане ничего не видно.',
      },
      {
        kind: 'literal',
        prompt: 'Как зовут светлячка?',
        options: nameOptions(),
        correct: 'Огонёк',
        hint: 'Имя есть в первом предложении.',
        explanation: 'Правильно! Его зовут Огонёк.',
      },
      {
        kind: 'literal',
        prompt: 'Что делал Огонёк?',
        options: [
          { id: 'sleep', emoji: '😴', label: 'Спал' },
          { id: 'play', emoji: '🎈', label: 'Играл с друзьями' },
          { id: 'eat', emoji: '🍰', label: 'Ел торт' },
        ],
        correct: 'play',
        hint: 'Ответ — в первом предложении.',
        explanation: 'Верно! Он играл с друзьями.',
      },
    ],
  },
  {
    key: 'wind',
    story: ['Светлячок Пушок летал над поляной.', 'Подул сильный ветер.', 'Ветер унёс Пушка далеко от дома.'],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему Пушок оказался далеко от дома?',
        options: [
          { id: 'fog', emoji: '🌫️', label: 'Пришёл туман' },
          { id: 'dark', emoji: '🌑', label: 'Стало темно' },
          { id: 'wind', emoji: '🌬️', label: 'Его унёс ветер' },
        ],
        correct: 'wind',
        hint: 'Что подуло? Прочитай второе предложение.',
        explanation: 'Да! Сильный ветер унёс Пушка.',
      },
      {
        kind: 'literal',
        prompt: 'Как зовут светлячка?',
        options: nameOptions(),
        correct: 'Пушок',
        hint: 'Имя есть в первом предложении.',
        explanation: 'Правильно! Его зовут Пушок.',
      },
      {
        kind: 'literal',
        prompt: 'Где летал Пушок?',
        options: [
          { id: 'sea', emoji: '🌊', label: 'Над морем' },
          { id: 'roof', emoji: '🏠', label: 'Над крышей' },
          { id: 'meadow', emoji: '🌼', label: 'Над поляной' },
        ],
        correct: 'meadow',
        hint: 'Ответ — в первом предложении.',
        explanation: 'Верно! Он летал над поляной.',
      },
    ],
  },
];

/** Уровень 8: причина и следствие. */
export const CAUSE_STORIES: StoryEntry[] = [
  {
    key: 'cat',
    story: ['Кот Мурзик прыгнул на полку.', 'Книга упала на пол.'],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему книга упала?',
        options: [
          { id: 'wind', emoji: '🌬️', label: 'Подул ветер' },
          { id: 'cat', emoji: '🐈', label: 'Кот прыгнул на полку' },
          { id: 'ball', emoji: '⚽', label: 'Мальчик бросил мяч' },
        ],
        correct: 'cat',
        hint: 'Кто прыгнул на полку?',
        explanation: 'Да! Кот прыгнул — и книга упала.',
      },
    ],
  },
  {
    key: 'rain',
    story: ['Ночью шёл сильный дождь.', 'Утром во дворе появились лужи.'],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему появились лужи?',
        options: [
          { id: 'rain', emoji: '🌧️', label: 'Ночью шёл дождь' },
          { id: 'dog', emoji: '🐶', label: 'Собака принесла воду' },
          { id: 'sun', emoji: '☀️', label: 'Светило солнце' },
        ],
        correct: 'rain',
        hint: 'Что было ночью?',
        explanation: 'Да! После дождя бывают лужи.',
      },
    ],
  },
  {
    key: 'icecream',
    story: ['Маша оставила мороженое на солнце.', 'Мороженое растаяло.'],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему мороженое растаяло?',
        options: [
          { id: 'snow', emoji: '❄️', label: 'Пошёл снег' },
          { id: 'cat', emoji: '🐱', label: 'Его лизнул кот' },
          { id: 'sun', emoji: '☀️', label: 'Оно лежало на солнце' },
        ],
        correct: 'sun',
        hint: 'Где Маша оставила мороженое?',
        explanation: 'Да! На солнце мороженое тает.',
      },
    ],
  },
  {
    key: 'flower',
    story: ['Петя каждый день поливал цветок.', 'Скоро на цветке распустились бутоны.'],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему распустились бутоны?',
        options: [
          { id: 'water', emoji: '💧', label: 'Цветок поливали' },
          { id: 'night', emoji: '🌙', label: 'Наступила ночь' },
          { id: 'ball', emoji: '🎈', label: 'Пете подарили шарик' },
        ],
        correct: 'water',
        hint: 'Что Петя делал каждый день?',
        explanation: 'Да! Цветку нужна вода.',
      },
    ],
  },
  {
    key: 'apple',
    story: ['Сильный ветер раскачал яблоню.', 'С ветки упало яблоко.'],
    questions: [
      {
        kind: 'cause',
        prompt: 'Почему упало яблоко?',
        options: [
          { id: 'rain', emoji: '🌧️', label: 'Пошёл дождь' },
          { id: 'wind', emoji: '🌬️', label: 'Ветер раскачал яблоню' },
          { id: 'night', emoji: '🌙', label: 'Наступила ночь' },
        ],
        correct: 'wind',
        hint: 'Что раскачало яблоню?',
        explanation: 'Да! Ветер раскачал дерево.',
      },
    ],
  },
];

export interface OrderEntry {
  key: string;
  story: string[];
  /** События в верном порядке. */
  steps: AnswerOption[];
  hint: string;
}

/** Уровень 8: истории из трёх событий. */
export const ORDER_STORIES: OrderEntry[] = [
  {
    key: 'seed',
    story: ['Мальчик посадил семя.', 'Из земли появился росток.', 'На растении распустился цветок.'],
    steps: [
      { id: 'seed', emoji: '🌰', label: 'Семя' },
      { id: 'sprout', emoji: '🌱', label: 'Росток' },
      { id: 'flower', emoji: '🌸', label: 'Цветок' },
    ],
    hint: 'Что было в самом начале? Прочитай первое предложение.',
  },
  {
    key: 'morning',
    story: ['Утром Лиза проснулась.', 'Потом она почистила зубы.', 'После этого Лиза позавтракала.'],
    steps: [
      { id: 'wake', emoji: '🛏️', label: 'Проснулась' },
      { id: 'teeth', emoji: '🪥', label: 'Зубы' },
      { id: 'eat', emoji: '🥣', label: 'Завтрак' },
    ],
    hint: 'Слова «утром», «потом» и «после этого» подскажут порядок.',
  },
  {
    key: 'pie',
    story: ['Мама замесила тесто.', 'Потом она испекла пирог.', 'Вечером все ели пирог с чаем.'],
    steps: [
      { id: 'dough', emoji: '🥣', label: 'Тесто' },
      { id: 'pie', emoji: '🥧', label: 'Пирог' },
      { id: 'tea', emoji: '☕', label: 'Чай' },
    ],
    hint: 'Что мама сделала сначала?',
  },
  {
    key: 'snowman',
    story: ['Зимой выпал снег.', 'Дети слепили снеговика.', 'Весной снеговик растаял.'],
    steps: [
      { id: 'snow', emoji: '❄️', label: 'Снег' },
      { id: 'snowman', emoji: '⛄', label: 'Снеговик' },
      { id: 'melt', emoji: '💧', label: 'Растаял' },
    ],
    hint: 'Снеговика можно слепить, только когда есть снег.',
  },
  {
    key: 'butterfly',
    story: ['Гусеница ела листья.', 'Потом она уснула в коконе.', 'Из кокона вылетела бабочка.'],
    steps: [
      { id: 'caterpillar', emoji: '🐛', label: 'Гусеница' },
      { id: 'cocoon', emoji: '🍂', label: 'Кокон' },
      { id: 'butterfly', emoji: '🦋', label: 'Бабочка' },
    ],
    hint: 'Кем бабочка была сначала?',
  },
  {
    key: 'chick',
    story: ['Курица снесла яйцо.', 'Из яйца вылупился цыплёнок.', 'Цыплёнок вырос и стал петушком.'],
    steps: [
      { id: 'egg', emoji: '🥚', label: 'Яйцо' },
      { id: 'chick', emoji: '🐣', label: 'Цыплёнок' },
      { id: 'rooster', emoji: '🐓', label: 'Петушок' },
    ],
    hint: 'С чего всё началось? Прочитай первое предложение.',
  },
];

/** Уровень 12: инструкции обсерватории. */
export const OBSERVATORY_ORDERS: OrderEntry[] = [
  {
    key: 'dome',
    story: ['Сначала открой купол.', 'Потом поверни телескоп к звёздам.', 'В конце включи кристалл.'],
    steps: [
      { id: 'dome', emoji: '🏛️', label: 'Купол' },
      { id: 'scope', emoji: '🔭', label: 'Телескоп' },
      { id: 'crystal', emoji: '💎', label: 'Кристалл' },
    ],
    hint: 'Слова «сначала», «потом» и «в конце» подскажут.',
  },
  {
    key: 'lens',
    story: ['Сначала протри линзу.', 'Потом поверни телескоп.', 'В конце нажми звёздную кнопку.'],
    steps: [
      { id: 'lens', emoji: '🔍', label: 'Линза' },
      { id: 'scope', emoji: '🔭', label: 'Телескоп' },
      { id: 'button', emoji: '⭐', label: 'Кнопка' },
    ],
    hint: 'Слова «сначала», «потом» и «в конце» подскажут.',
  },
  {
    key: 'lamp',
    story: ['Сначала зажги звёздную лампу.', 'Потом открой купол.', 'В конце включи кристалл.'],
    steps: [
      { id: 'lamp', emoji: '💡', label: 'Лампа' },
      { id: 'dome', emoji: '🏛️', label: 'Купол' },
      { id: 'crystal', emoji: '💎', label: 'Кристалл' },
    ],
    hint: 'Что нужно сделать в самом начале?',
  },
];

/** Кнопки для инструкции в произвольном порядке (на высокой сложности — только чтение поможет). */
export const COLOR_BUTTONS: AnswerOption[] = [
  { id: 'blue', emoji: '🔵', label: 'Синяя' },
  { id: 'red', emoji: '🔴', label: 'Красная' },
  { id: 'green', emoji: '🟢', label: 'Зелёная' },
];

export const BUTTON_ACC: Record<string, string> = { blue: 'синюю', red: 'красную', green: 'зелёную' };
