import type { RewardId } from '../types/game';

export interface RewardDef {
  id: RewardId;
  name: string;
  emoji: string;
  description: string;
}

export const REWARDS = {
  'gold-star': {
    id: 'gold-star',
    name: 'Золотая звезда',
    emoji: '🌟',
    description: 'Первая звезда Lamp Quest из Зелёной долины.',
  },
  'workshop-gear': {
    id: 'workshop-gear',
    name: 'Шестерёнка',
    emoji: '⚙️',
    description: 'Новая деталь для мастерской Лучика.',
  },
  'magic-crystal': {
    id: 'magic-crystal',
    name: 'Волшебный кристалл',
    emoji: '💎',
    description: 'Открывает дорогу в мастерскую.',
  },
  'golden-bulb': {
    id: 'golden-bulb',
    name: 'Золотая лампочка',
    emoji: '💡',
    description: 'Свет, который ты вернул в долину.',
  },
  ...shards(),
  'light-crystal': {
    id: 'light-crystal',
    name: 'Кристалл Света',
    emoji: '🔮',
    description: 'Собран из восьми осколков. Свет вернулся в мир!',
  },
} as Record<RewardId, RewardDef>;

function shards(): Record<string, RewardDef> {
  const places = [
    'Зачарованного леса',
    'Кристальной пещеры',
    'Небесных островов',
    'Библиотеки времени',
    'Фабрики роботов',
    'Ледяной горы',
    'Подводного города',
    'Обсерватории света',
  ];
  const out: Record<string, RewardDef> = {};
  places.forEach((place, i) => {
    const id = `shard-${i + 1}` as RewardId;
    out[id] = { id, name: `Осколок ${i + 1}`, emoji: '💠', description: `Осколок Кристалла Света из ${place}.` };
  });
  return out;
}

export const SHARD_IDS = Array.from({ length: 8 }, (_, i) => `shard-${i + 1}` as RewardId);

/** Награды-предметы на полке коллекции (осколки показываются отдельно). */
export const REWARD_ORDER: RewardId[] = ['gold-star', 'workshop-gear', 'magic-crystal', 'golden-bulb', 'light-crystal'];

export const ALL_REWARD_IDS = Object.keys(REWARDS) as RewardId[];
