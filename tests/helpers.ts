import { expect, type Page } from '@playwright/test';
import type { LevelDef, QuestionDef } from '../src/types/game';

export const SAVE_KEY = 'lampquest.save.v1';

export interface LQState {
  levelId: number;
  x: number;
  y: number;
  feetY: number;
  vx: number;
  vy: number;
  onGround: boolean;
  stars: number;
  totalStars: number;
  flags: string[];
  modal: boolean;
  completed: boolean;
  respawn: { x: number; y: number };
  portalActive: boolean;
  textureCount: number;
  gravity: number;
}

/** Собирает ошибки консоли и необработанные исключения страницы. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

/** Открывает игру с чистым (или заданным) сохранением. Звук выключен, чтобы не шуметь. */
export async function openGame(page: Page, save?: Record<string, unknown> | string): Promise<void> {
  await page.goto('/?debug');
  await page.evaluate(
    ([key, data]) => {
      localStorage.clear();
      if (data !== null) localStorage.setItem(key as string, data as string);
    },
    [SAVE_KEY, save === undefined ? JSON.stringify({ settings: { sound: false, music: false } }) : typeof save === 'string' ? save : JSON.stringify(save)],
  );
  await page.reload();
  await expect(page.getByTestId('play')).toBeVisible();
}

export const state = (page: Page): Promise<LQState> =>
  page.evaluate(() => (window as unknown as { __LQ: { state: () => LQState } }).__LQ.state());

export const teleport = (page: Page, x: number, y: number) =>
  page.evaluate(([px, py]) => (window as unknown as { __LQ: { teleport: (a: number, b: number) => void } }).__LQ.teleport(px, py), [x, y]);

export async function startLevel(page: Page, id: number): Promise<void> {
  await page.getByTestId('play').click();
  await page.getByTestId(`chapter-${id >= 5 ? 2 : 1}`).click();
  await page.getByTestId(`level-${id}`).click();
  await page.getByTestId('start-level').click();
  const tut = page.getByTestId('tutorial');
  if (await tut.isVisible().catch(() => false)) await page.getByTestId('tutorial-ok').click();
  await expect.poll(async () => (await state(page)).modal).toBe(false);
}

/** Ждёт, пока лампа встанет на опору. */
export async function settle(page: Page): Promise<LQState> {
  await expect.poll(async () => (await state(page)).onGround, { timeout: 5000 }).toBe(true);
  return state(page);
}

/** Задание, выпавшее в этом прохождении (задания вариативны). */
export const runtimeQuestion = (page: Page, id: string): Promise<QuestionDef> =>
  page.evaluate((qid) => (window as unknown as { __LQ: { question: (x: string) => QuestionDef } }).__LQ.question(qid), id);

export const runVariants = (page: Page): Promise<Record<string, string>> =>
  page.evaluate(() => (window as unknown as { __LQ: { variants: () => Record<string, string> } }).__LQ.variants());

/** Отвечает на открытую карточку правильно (по заданию этого прохождения). */
export async function answerOpenCard(page: Page, firstWrong = false): Promise<string> {
  const card = page.getByTestId('question-card');
  await expect(card).toBeVisible();
  const qid = (await card.getAttribute('data-question')) as string;
  const q = await runtimeQuestion(page, qid);
  if (q.order) {
    if (firstWrong) {
      await page.getByTestId(`option-${q.order[1]}`).click();
      await expect(page.getByTestId('q-hint')).toBeVisible();
    }
    for (const id of q.order) await page.getByTestId(`option-${id}`).click();
  } else if (q.program) {
    if (firstWrong) {
      // Программа без прыжка: робот падает в яму, показывается подсказка.
      for (let i = 0; i < q.program.slots; i++) await page.getByTestId('cmd-forward').click();
      await page.getByTestId('program-run').click();
      await expect(page.getByTestId('q-hint')).toBeVisible({ timeout: 6000 });
      await expect(page.getByTestId('program-run')).toBeEnabled({ timeout: 4000 });
      await page.getByTestId('program-clear').click();
    }
    for (const c of q.program.solution) await page.getByTestId(`cmd-${c}`).click();
    await page.getByTestId('program-run').click();
  } else {
    if (firstWrong) {
      const wrong = q.options.find((o) => o.id !== q.correct)!;
      await page.getByTestId(`option-${wrong.id}`).click();
      await expect(page.getByTestId('q-hint')).toBeVisible();
    }
    await page.getByTestId(`option-${q.correct}`).click();
  }
  await expect(page.getByTestId('q-success')).toBeVisible({ timeout: 8000 });
  await expect(card).toBeHidden({ timeout: 5000 });
  return qid;
}

export async function hasFlag(page: Page, flag: string): Promise<boolean> {
  return (await state(page)).flags.includes(flag);
}

export const levelDef = (page: Page) =>
  page.evaluate(() => (window as unknown as { __LQ: { level: () => LevelDef } }).__LQ.level());

/** Проходит текущий уровень по всем станциям через настоящий интерфейс заданий. */
export async function playThrough(page: Page, wrongFirst: boolean): Promise<void> {
  const L = await levelDef(page);
  for (const it of L.items) {
    await teleport(page, it.x, it.y);
    await expect.poll(() => hasFlag(page, `item:${it.id}`)).toBe(true);
  }
  for (const st of L.stations) {
    if (st.type === 'hint' || st.type === 'word') continue;
    // Ждём робота-помощника, если станция за воротами, которые он открывает.
    for (const h of L.helpers ?? []) {
      if ((await hasFlag(page, h.trigger)) && !(await hasFlag(page, h.doneFlag))) {
        await expect.poll(() => hasFlag(page, h.doneFlag), { timeout: 10_000 }).toBe(true);
      }
    }
    await teleport(page, st.x, st.y - 50);
    if (st.type === 'quest') {
      for (let i = 0; i < st.questions.length; i++) await answerOpenCard(page, wrongFirst && i === 0);
    } else if (st.type === 'find') {
      await expect(page.getByTestId('find-card')).toBeVisible();
      await page.getByTestId('find-accept').click();
      const q = await runtimeQuestion(page, st.question);
      const correctIdx = q.options.findIndex((o) => o.id === q.correct);
      if (wrongFirst) {
        const wrongIdx = correctIdx === 0 ? 1 : 0;
        const p = st.pedestals[wrongIdx];
        await teleport(page, p.x, p.y - 50);
        await expect(page.getByTestId('toast').filter({ hasText: q.hint })).toBeVisible();
        expect(await hasFlag(page, st.id)).toBe(false);
      }
      const p = st.pedestals[correctIdx];
      await teleport(page, p.x, p.y - 50);
    }
    await expect.poll(() => hasFlag(page, st.id), { message: `station ${st.id}` }).toBe(true);
  }
  await expect.poll(async () => (await state(page)).portalActive, { timeout: 8000 }).toBe(true);
  await expect.poll(async () => (await state(page)).modal, { timeout: 8000 }).toBe(false);
  await teleport(page, L.portal.x, L.portal.y - 60);
  await expect(page.getByTestId('level-complete')).toBeVisible({ timeout: 10_000 });
}
