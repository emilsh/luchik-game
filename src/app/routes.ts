export type Screen =
  | { name: 'menu' }
  | { name: 'levels' }
  | { name: 'game'; levelId: number }
  | { name: 'collection' }
  | { name: 'parents' };
