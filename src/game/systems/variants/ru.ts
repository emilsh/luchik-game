// Russian numeral agreement: 1 шестерёнка, 2 шестерёнки, 5 шестерёнок (gear).

export type Forms = [one: string, few: string, many: string];

export function plural(n: number, [one, few, many]: Forms): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

export const withNoun = (n: number, forms: Forms) => `${n} ${plural(n, forms)}`;

/** "два", "три", "четыре" (two, three, four) in the masculine gender (for цветок, фонарик). */
export const SMALL_MASC: Record<number, string> = { 1: 'один', 2: 'два', 3: 'три', 4: 'четыре' };

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface Noun {
  emoji: string;
  forms: Forms;
}

export const NOUNS = {
  gear: { emoji: '⚙️', forms: ['шестерёнка', 'шестерёнки', 'шестерёнок'] },
  bolt: { emoji: '🔩', forms: ['гайка', 'гайки', 'гаек'] },
  plank: { emoji: '🪵', forms: ['доска', 'доски', 'досок'] },
  balloon: { emoji: '🎈', forms: ['шарик', 'шарика', 'шариков'] },
  apple: { emoji: '🍎', forms: ['яблоко', 'яблока', 'яблок'] },
  spark: { emoji: '⚡', forms: ['искра', 'искры', 'искр'] },
  lantern: { emoji: '🏮', forms: ['фонарик', 'фонарика', 'фонариков'] },
  crystal: { emoji: '💎', forms: ['кристалл', 'кристалла', 'кристаллов'] },
  box: { emoji: '📦', forms: ['коробка', 'коробки', 'коробок'] },
  fire: { emoji: '🔥', forms: ['огонёк', 'огонька', 'огоньков'] },
  ice: { emoji: '🧊', forms: ['льдинка', 'льдинки', 'льдинок'] },
  pearl: { emoji: '⚪', forms: ['жемчужина', 'жемчужины', 'жемчужин'] },
  star: { emoji: '⭐', forms: ['звезда', 'звезды', 'звёзд'] },
  shell: { emoji: '🐚', forms: ['ракушка', 'ракушки', 'ракушек'] },
  mushroom: { emoji: '🍄', forms: ['гриб', 'гриба', 'грибов'] },
} satisfies Record<string, Noun>;
