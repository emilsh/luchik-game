import { expect, test } from '@playwright/test';
import {
  SAVE_KEY,
  answerOpenCard,
  openGame,
  runVariants,
  runtimeQuestion,
  startLevel,
  state,
  teleport,
  trackErrors,
} from './helpers';

// Повторные прохождения: задания меняются, история сохраняется, сложность учитывается.

const ALL = Array.from({ length: 12 }, (_, i) => i + 1);
const save = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ unlockedLevels: ALL, tutorialSeen: true, settings: { sound: false, music: false }, ...extra });

const restart = async (page: import('@playwright/test').Page) => {
  await page.getByTestId('pause').click();
  await page.getByTestId('restart').click();
  await expect.poll(async () => (await state(page)).modal).toBe(false);
};

test('при каждом новом прохождении задания другие — и после перезагрузки тоже', async ({ page }) => {
  const errors = trackErrors(page);
  await openGame(page, save());
  await startLevel(page, 2);
  const runs = [await runVariants(page)];
  await restart(page);
  runs.push(await runVariants(page));
  // Перезагрузка страницы: история вариантов берётся из сохранения.
  await page.reload();
  await startLevel(page, 2);
  runs.push(await runVariants(page));
  for (let i = 1; i < runs.length; i++) {
    for (const id of Object.keys(runs[i])) expect(runs[i][id], `${id}, прохождение ${i + 1}`).not.toBe(runs[i - 1][id]);
  }
  const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
  expect(stored.variantHistory['l2-count'].length).toBeGreaterThanOrEqual(3);
  expect(errors).toEqual([]);
});

test('на экране — именно выпавший вариант: карточка, слово и цель', async ({ page }) => {
  await openGame(page, save());
  await startLevel(page, 3);
  const q = await runtimeQuestion(page, 'l3-find-apple');
  // Цели идут по порядку: сначала «Ответь Сове».
  await page.evaluate(() => (window as unknown as { __LQ: { setFlag: (f: string) => void } }).__LQ.setFlag('owl1'));
  await teleport(page, 3940, 540);
  await expect(page.getByTestId('find-card')).toContainText(q.word as string);
  await page.getByTestId('find-accept').click();
  await expect(page.getByTestId('goal')).toContainText(`Найди: ${q.word}`);

  await restart(page);
  const q2 = await runtimeQuestion(page, 'l3-find-apple');
  expect(`${q2.word}|${q2.options.map((o) => o.id).join()}`).not.toBe(`${q.word}|${q.options.map((o) => o.id).join()}`);
});

test('успехи ребёнка запоминаются для подбора сложности', async ({ page }) => {
  await openGame(page, save());
  await startLevel(page, 6);
  await teleport(page, 1180, 540);
  await answerOpenCard(page, false); // замок: с первой попытки
  await teleport(page, 1580, 540);
  await answerOpenCard(page, true); // рычаг: сначала ошибка
  const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
  expect(stored.mastery.addition).toEqual([1]);
  expect(stored.mastery.comparison).toEqual([0]);
  const tier = (await runtimeQuestion(page, 'l6-add')).meta?.tier;
  expect([1, 2, 3]).toContain(tier);
});
