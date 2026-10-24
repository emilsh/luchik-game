// Adventure chapters. Levels are numbered continuously across chapters.

export interface ChapterDef {
  id: number;
  title: string;
  subtitle: string;
  levels: number[];
  intro: string[];
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 1,
    title: 'Глава 1',
    subtitle: 'Свет долины',
    levels: [1, 2, 3, 4],
    intro: [],
  },
  {
    id: 2,
    title: 'Глава 2',
    subtitle: 'В поисках утраченного света',
    levels: [5, 6, 7, 8, 9, 10, 11, 12],
    intro: [
      'В мире Lamp Quest снова гаснет свет.',
      'Древний Кристалл Света разбился на 8 осколков.',
      'Найди все осколки, и свет вернётся!',
    ],
  },
];

export const LEVEL_COUNT = 12;

export function chapterOf(levelId: number): ChapterDef {
  return CHAPTERS.find((c) => c.levels.includes(levelId)) ?? CHAPTERS[0];
}
