// English words of the "English Forest" level (and KEY for the workshop).

export interface VocabWord {
  word: string;
  ru: string;
  emoji: string;
  /** A hint based on meaning — does not name the answer directly. */
  hint: string;
}

export const VOCABULARY: Record<string, VocabWord> = {
  CAT: { word: 'CAT', ru: 'кошка', emoji: '🐱', hint: 'CAT говорит «мяу».' },
  DOG: { word: 'DOG', ru: 'собака', emoji: '🐶', hint: 'DOG говорит «гав».' },
  SUN: { word: 'SUN', ru: 'солнце', emoji: '☀️', hint: 'SUN светит днём и греет.' },
  MOON: { word: 'MOON', ru: 'луна', emoji: '🌙', hint: 'MOON светит ночью.' },
  STAR: { word: 'STAR', ru: 'звезда', emoji: '⭐', hint: 'STAR — маленький огонёк в ночном небе.' },
  APPLE: { word: 'APPLE', ru: 'яблоко', emoji: '🍎', hint: 'APPLE — фрукт, красный и круглый.' },
  BOOK: { word: 'BOOK', ru: 'книга', emoji: '📖', hint: 'BOOK читают, у неё есть страницы.' },
  KEY: { word: 'KEY', ru: 'ключ', emoji: '🔑', hint: 'KEY открывает замки.' },
  TREE: { word: 'TREE', ru: 'дерево', emoji: '🌳', hint: 'TREE растёт в лесу, у него есть листья.' },
  FISH: { word: 'FISH', ru: 'рыба', emoji: '🐟', hint: 'FISH живёт в воде и плавает.' },
  // Underwater City
  SHELL: { word: 'SHELL', ru: 'ракушка', emoji: '🐚', hint: 'SHELL лежит на дне моря, в ней прячется улитка.' },
  WATER: { word: 'WATER', ru: 'вода', emoji: '💧', hint: 'WATER можно пить, она течёт.' },
  BOAT: { word: 'BOAT', ru: 'лодка', emoji: '⛵', hint: 'BOAT плывёт по воде.' },
  BLUE: { word: 'BLUE', ru: 'синий', emoji: '🔵', hint: 'BLUE — синий, как море.' },
  GREEN: { word: 'GREEN', ru: 'зелёный', emoji: '🟢', hint: 'GREEN — зелёный, как трава.' },
};

export function vocab(word: string): VocabWord {
  const v = VOCABULARY[word];
  if (!v) throw new Error(`Unknown word ${word}`);
  return v;
}
