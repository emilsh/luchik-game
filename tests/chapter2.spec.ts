import { expect, test, type Page } from '@playwright/test';
import {
  SAVE_KEY,
  answerOpenCard,
  hasFlag,
  levelDef,
  openGame,
  playThrough,
  runtimeQuestion,
  settle,
  startLevel,
  state,
  teleport,
  trackErrors,
} from './helpers';

const ALL = Array.from({ length: 12 }, (_, i) => i + 1);
const saveWith = (extra: Record<string, unknown>) =>
  JSON.stringify({ tutorialSeen: true, settings: { sound: false, music: false }, ...extra });

const setFlag = (page: Page, f: string) =>
  page.evaluate((flag) => (window as unknown as { __LQ: { setFlag: (x: string) => void } }).__LQ.setFlag(flag), f);

const saved = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);

test.describe('Сохранения и переходы', () => {
  test('старое сохранение (v1, четыре уровня) переносится без потерь и открывает главу 2', async ({ page }) => {
    const errors = trackErrors(page);
    const v1 = {
      version: 1,
      unlockedLevels: [1, 2, 3, 4],
      completedLevels: [1, 2, 3, 4],
      bestStars: { '1': 18, '2': 15, '3': 20, '4': 17 },
      rewards: ['gold-star', 'workshop-gear', 'magic-crystal', 'golden-bulb'],
      skillStats: { reading: { seen: 3, solved: 3, hints: 2 }, counting: { seen: 1, solved: 1, hints: 0 } },
      solvedQuestions: ['l1-sign'],
      currentLevel: 4,
      settings: { sound: false, music: false, readAloud: false },
      tutorialSeen: true,
    };
    await openGame(page, JSON.stringify(v1));
    await page.getByTestId('play').click();
    await page.getByTestId('chapter-1').click();
    for (const id of [1, 2, 3, 4]) await expect(page.getByTestId(`level-${id}`)).toContainText('✓');
    await expect(page.getByTestId('level-1')).toContainText('18/21');
    await page.getByTestId('chapter-2').click();
    await expect(page.getByTestId('level-5')).toBeEnabled();
    await expect(page.getByTestId('level-6')).toBeDisabled();
    await page.getByTestId('back').click();
    await page.getByTestId('collection').click();
    await expect(page.getByTestId('reward-golden-bulb')).toContainText('Золотая лампочка');
    await expect(page.getByTestId('shards-panel')).toContainText('0 из 8');
    // The first write saves data in v2 format, with the old fields intact.
    await page.getByTestId('toggle-music').click();
    const s = await saved(page);
    expect(s.version).toBe(2);
    expect(s.completedLevels).toEqual([1, 2, 3, 4]);
    expect(s.unlockedLevels).toEqual([1, 2, 3, 4, 5]);
    expect(s.bestStars['3']).toBe(20);
    expect(s.skillStats.reading).toEqual({ seen: 3, solved: 3, hints: 2 });
    expect(s.skillStats.algorithms).toEqual({ seen: 0, solved: 0, hints: 0 });
    expect(errors).toEqual([]);
  });

  test('после уровня 4 открывается уровень 5 со вступлением главы 2', async ({ page }) => {
    await openGame(page, saveWith({ unlockedLevels: [1, 2, 3, 4], completedLevels: [1, 2, 3], currentLevel: 4 }));
    await startLevel(page, 4);
    await playThrough(page, false);
    await expect(page.getByTestId('unlocked-next')).toContainText('5');
    await page.getByTestId('next-level').click();
    await expect(page.getByTestId('chapter-intro')).toContainText('В поисках утраченного света');
    await page.getByTestId('start-level').click();
    await expect.poll(async () => (await state(page)).levelId).toBe(5);
    // The chapter intro is shown once.
    await page.reload();
    await startLevel(page, 5);
    await expect(page.getByTestId('chapter-intro')).toBeHidden();
  });
});

test.describe('Глава 2 целиком', () => {
  test('уровни 5–12 проходятся по порядку, осколки сохраняются, финал главы', async ({ page }) => {
    test.setTimeout(480_000);
    const errors = trackErrors(page);
    await openGame(page, saveWith({ unlockedLevels: [1, 2, 3, 4, 5], completedLevels: [1, 2, 3, 4], currentLevel: 5 }));
    for (const id of [5, 6, 7, 8, 9, 10, 11, 12]) {
      if (id === 5) await startLevel(page, 5);
      else {
        await page.getByTestId('next-level').click();
        await page.getByTestId('start-level').click();
        await expect.poll(async () => (await state(page)).levelId).toBe(id);
        await expect.poll(async () => (await state(page)).modal).toBe(false);
      }
      // At every level we first make a mistake — the game must not get blocked.
      await playThrough(page, true);
      if (id < 12) {
        await expect(page.getByTestId(`complete-reward-shard-${id - 4}`)).toBeVisible();
        await expect(page.getByTestId('unlocked-next')).toContainText(String(id + 1));
      }
    }
    await expect(page.getByTestId('chapter-complete')).toBeVisible();
    await expect(page.getByTestId('complete-reward-light-crystal')).toBeVisible();
    const s = await saved(page);
    expect(s.completedLevels).toEqual(ALL);
    for (let i = 1; i <= 8; i++) expect(s.rewards).toContain(`shard-${i}`);
    expect(s.rewards).toContain('light-crystal');
    for (const skill of ['story-order', 'patterns', 'logic', 'algorithms']) {
      expect(s.skillStats[skill].solved, skill).toBeGreaterThan(0);
      expect(s.skillStats[skill].hints, skill).toBeGreaterThan(0);
    }
    // World map: any level can be replayed.
    await page.getByTestId('complete-levels').click();
    for (const id of [5, 9, 12]) await expect(page.getByTestId(`level-${id}`)).toBeEnabled();
    await page.reload();
    await page.getByTestId('collection').click();
    await expect(page.getByTestId('shards-panel')).toContainText('8 из 8');
    await expect(page.getByTestId('shards-panel')).toContainText('Кристалл Света собран');
    expect(errors).toEqual([]);
  });
});

test.describe('Механики второй главы', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page, saveWith({ unlockedLevels: ALL, completedLevels: [1, 2, 3, 4] }));
  });

  test('гриб-батут подбрасывает выше обычного прыжка', async ({ page }) => {
    await startLevel(page, 5);
    await setFlag(page, 'firefly');
    await teleport(page, 1455, 480);
    let minY = 9999;
    for (let i = 0; i < 20; i++) {
      minY = Math.min(minY, (await state(page)).feetY);
      await page.waitForTimeout(50);
    }
    expect(560 - minY).toBeGreaterThan(200); // a regular jump is about 160
  });

  test('ветер мельницы поднимает лампу к высокому острову', async ({ page }) => {
    await startLevel(page, 7);
    await teleport(page, 3390, 640);
    // The wind is not blowing yet — the lamp falls and returns to the windmill island.
    await expect.poll(async () => (await state(page)).x, { timeout: 5000 }).toBeLessThan(3000);
    await setFlag(page, 'wind');
    await teleport(page, 3390, 640);
    await expect.poll(async () => (await state(page)).feetY, { timeout: 5000 }).toBeLessThan(300);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(700);
    await page.keyboard.up('ArrowRight');
    const s = await settle(page);
    expect(s.feetY).toBeCloseTo(300, 0);
    expect(s.x).toBeGreaterThan(3500);
  });

  test('на льду лампа тормозит мягче, но управление остаётся', async ({ page }) => {
    await startLevel(page, 10);
    const slide = async (x: number) => {
      await teleport(page, x, 540);
      await settle(page);
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(500);
      await page.keyboard.up('ArrowRight');
      const from = (await state(page)).x;
      await page.waitForTimeout(600);
      return (await state(page)).x - from;
    };
    const ground = await slide(4960);
    const ice = await slide(5230);
    expect(ice).toBeGreaterThan(ground + 15);
    expect(ice).toBeLessThan(250); // the slide is limited and predictable
  });

  test('конвейер везёт стоящую лампу', async ({ page }) => {
    await startLevel(page, 9);
    await teleport(page, 560, 450);
    const s0 = await settle(page);
    await page.waitForTimeout(800);
    expect((await state(page)).x).toBeGreaterThan(s0.x + 30);
  });

  test('лифт появляется после рычага и поднимает лампу', async ({ page }) => {
    await startLevel(page, 6);
    await setFlag(page, 'lever');
    await teleport(page, 1830, 200);
    await settle(page);
    // A full lift cycle (down and up) — up to ~9.5 s.
    await expect.poll(async () => (await state(page)).feetY, { timeout: 14_000 }).toBeLessThan(330);
  });

  test('под водой гравитация мягче, прыжок дольше', async ({ page }) => {
    await startLevel(page, 11);
    expect((await state(page)).gravity).toBe(750);
    await settle(page);
    // Measure the flight time inside the browser frame by frame — no test-runner delays.
    await page.keyboard.down('Space');
    const airMs = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const lq = (window as unknown as { __LQ: { state: () => { onGround: boolean } } }).__LQ;
          let t0 = 0;
          const tick = (now: number) => {
            const s = lq.state();
            if (!t0 && !s.onGround) t0 = now;
            if (t0 && s.onGround) return resolve(now - t0);
            if (now > 5000 + (t0 || now)) return resolve(-1);
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
    );
    await page.keyboard.up('Space');
    expect(airMs).toBeGreaterThan(1100); // on land a jump lasts ~0.9 s
  });

  test('робот-помощник выполняет программу и открывает ворота', async ({ page }) => {
    await startLevel(page, 9);
    await setFlag(page, 'r1');
    await teleport(page, 2650, 250);
    await answerOpenCard(page, true);
    await expect.poll(() => hasFlag(page, 'button'), { timeout: 10_000 }).toBe(true);
    // The gate is open — walk right.
    await teleport(page, 3100, 250);
    await settle(page);
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => (await state(page)).x, { timeout: 5000 }).toBeGreaterThan(3260);
    await page.keyboard.up('ArrowRight');
  });

  test('порядок событий: ошибка не сбрасывает уже расставленное', async ({ page }) => {
    await startLevel(page, 8);
    await teleport(page, 1100, 540);
    await expect(page.getByTestId('question-card')).toBeVisible();
    const order = (await runtimeQuestion(page, 'l8-order')).order as string[];
    await page.getByTestId(`option-${order[0]}`).click();
    await expect(page.getByTestId('slot-0')).toHaveClass(/filled/);
    await page.getByTestId(`option-${order[2]}`).click(); // a mistake: skipped over the second step
    await expect(page.getByTestId('q-hint')).toBeVisible();
    await expect(page.getByTestId('slot-0')).toHaveClass(/filled/);
    await expect(page.getByTestId('slot-1')).not.toHaveClass(/filled/);
    await page.getByTestId(`option-${order[1]}`).click();
    await page.getByTestId(`option-${order[2]}`).click();
    await expect(page.getByTestId('q-success')).toBeVisible();
    await expect.poll(() => hasFlag(page, 'story1'), { timeout: 5000 }).toBe(true);
  });

  test('контрольная точка во второй главе возвращает после падения', async ({ page }) => {
    await startLevel(page, 7);
    await teleport(page, 1850, 500);
    await expect.poll(async () => (await state(page)).respawn.x).toBe(1800);
    await teleport(page, 1690, 700);
    await expect.poll(async () => (await state(page)).x, { timeout: 5000 }).toBeCloseTo(1800, 0);
  });
});

test.describe('Управление, пауза, ресурсы', () => {
  test.use({ hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await openGame(page, saveWith({ unlockedLevels: ALL, completedLevels: [1, 2, 3, 4] }));
  });

  const tap = (page: Page, testId: string, type: string, id: number) =>
    page.evaluate(
      ([tid, t, pid]) => {
        const el = document.querySelector(`[data-testid="${tid}"]`) as HTMLElement;
        const r = el.getBoundingClientRect();
        el.dispatchEvent(
          new PointerEvent(t as string, {
            pointerId: pid as number,
            pointerType: 'touch',
            bubbles: true,
            clientX: r.left + r.width / 2,
            clientY: r.top + r.height / 2,
          }),
        );
      },
      [testId, type, id] as const,
    );

  test('после закрытия карточки сенсорное управление снова работает', async ({ page }) => {
    await startLevel(page, 8);
    await teleport(page, 1100, 540);
    await expect(page.getByTestId('question-card')).toBeVisible();
    await expect(page.getByTestId('dpad')).toBeHidden(); // the buttons do not cover the card
    await page.getByTestId('question-close').click();
    await expect(page.getByTestId('dpad')).toBeVisible();
    const s0 = await settle(page);
    await tap(page, 'btn-left', 'pointerdown', 7);
    await page.waitForTimeout(300);
    await tap(page, 'btn-jump', 'pointerdown', 8);
    await expect.poll(async () => (await state(page)).vy).toBeLessThan(0);
    expect((await state(page)).vx).toBeLessThan(-100);
    await tap(page, 'btn-jump', 'pointerup', 8);
    await tap(page, 'btn-left', 'pointerup', 7);
    await settle(page);
    expect((await state(page)).x).toBeLessThan(s0.x - 50);
  });

  test('пауза останавливает сцену', async ({ page }) => {
    await startLevel(page, 10);
    await teleport(page, 700, 300); // in the air
    await page.getByTestId('pause').click();
    const a = await state(page);
    await page.waitForTimeout(600);
    const b = await state(page);
    expect(b.y).toBe(a.y);
    await page.getByTestId('resume').click();
    await expect.poll(async () => (await state(page)).y).toBeGreaterThan(a.y + 20);
  });

  test('текстуры освобождаются при перезапуске и смене уровней', async ({ page }) => {
    await startLevel(page, 12);
    const base = (await state(page)).textureCount;
    for (let i = 0; i < 3; i++) {
      await page.getByTestId('pause').click();
      await page.getByTestId('restart').click();
      await expect.poll(async () => (await state(page)).modal).toBe(false);
    }
    await page.waitForTimeout(300);
    expect((await state(page)).textureCount).toBeLessThanOrEqual(base + 2);
  });

  test('каждый новый уровень загружается быстро и без ошибок', async ({ page }) => {
    const errors = trackErrors(page);
    for (const id of [5, 6, 7, 8, 9, 10, 11, 12]) {
      await page.goto('/?debug');
      const t0 = Date.now();
      await startLevel(page, id);
      expect(Date.now() - t0, `уровень ${id}`).toBeLessThan(6000);
      const L = await levelDef(page);
      expect(L.id).toBe(id);
      await settle(page);
    }
    expect(errors).toEqual([]);
  });
});
