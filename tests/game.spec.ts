import { expect, test, type Page } from '@playwright/test';
import {
  SAVE_KEY,
  answerOpenCard,
  hasFlag,
  openGame,
  playThrough,
  runtimeQuestion,
  settle,
  startLevel,
  state,
  teleport,
  trackErrors,
} from './helpers';

test.describe('Меню и сохранение', () => {
  test('главное меню, выбор уровня и заблокированные уровни', async ({ page }) => {
    const errors = trackErrors(page);
    await openGame(page);
    await expect(page.getByText('Lamp')).toBeVisible();
    await expect(page.getByTestId('continue')).toBeHidden();
    await page.getByTestId('play').click();
    await expect(page.getByTestId('level-1')).toBeEnabled();
    for (const id of [2, 3, 4]) await expect(page.getByTestId(`level-${id}`)).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test('повреждённое сохранение не ломает игру', async ({ page }) => {
    const errors = trackErrors(page);
    await openGame(page, '{not json!!');
    await page.getByTestId('play').click();
    await expect(page.getByTestId('level-1')).toBeEnabled();
    await expect(page.getByTestId('level-2')).toBeDisabled();
    await openGame(page, JSON.stringify({ unlockedLevels: 'oops', completedLevels: [1, 99], skillStats: 5 }));
    await page.getByTestId('play').click();
    // Пройденный уровень 1 корректно открывает уровень 2, мусор отброшен.
    await expect(page.getByTestId('level-2')).toBeEnabled();
    await expect(page.getByTestId('level-3')).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test('звук отключается, и настройка сохраняется после перезагрузки', async ({ page }) => {
    await openGame(page, JSON.stringify({}));
    const btn = page.getByTestId('toggle-sound');
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await page.reload();
    await expect(page.getByTestId('toggle-sound')).toHaveAttribute('aria-pressed', 'false');
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
    expect(saved.settings.sound).toBe(false);
  });

  test('родительская панель: статистика и сброс с подтверждением', async ({ page }) => {
    await openGame(page, JSON.stringify({ unlockedLevels: [1, 2], completedLevels: [1], settings: { sound: false } }));
    await page.getByTestId('parents').click();
    const text = await page.locator('.parent-gate p').innerText();
    const [, a, b] = text.match(/(\d+)\s*×\s*(\d+)/) ?? [];
    await page.getByTestId('gate-input').fill(String(Number(a) * Number(b)));
    await page.getByTestId('gate-submit').click();
    await expect(page.getByTestId('parents-panel')).toBeVisible();
    await expect(page.getByTestId('parents-level-1-done')).toHaveText('✓');
    await page.getByTestId('reset').click();
    await page.getByTestId('reset-confirm').click();
    await expect(page.getByTestId('parents-level-1-done')).toHaveText('—');
    await page.getByTestId('back').click();
    await page.getByTestId('play').click();
    await expect(page.getByTestId('level-2')).toBeDisabled();
  });
});

test.describe('Платформер (клавиатура)', () => {
  test('движение, торможение, прыжок и приземление на платформу', async ({ page }) => {
    const errors = trackErrors(page);
    await openGame(page);
    await startLevel(page, 1);
    const s0 = await settle(page);
    expect(s0.feetY).toBeCloseTo(600, 0);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    const s1 = await state(page);
    expect(s1.x).toBeGreaterThan(s0.x + 60);
    expect(s1.vx).toBeGreaterThan(200);

    // Прыжок во время движения.
    await page.keyboard.press('Space');
    await expect.poll(async () => (await state(page)).vy).toBeLessThan(0);
    const air = await state(page);
    expect(air.vx).toBeGreaterThan(100);
    await page.keyboard.up('ArrowRight');

    const landed = await settle(page);
    expect(landed.feetY).toBeLessThanOrEqual(601);
    await expect.poll(async () => Math.abs((await state(page)).vx)).toBeLessThan(1);

    // Ступенька на высоте 500: запрыгиваем и стоим на ней.
    await teleport(page, 700, 400);
    const onLedge = await settle(page);
    expect(onLedge.feetY).toBeCloseTo(500, 0);

    // Влево (A) тоже работает.
    await teleport(page, 400, 540);
    await settle(page);
    const before = await state(page);
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyA');
    expect((await state(page)).x).toBeLessThan(before.x - 40);
    expect(errors).toEqual([]);
  });

  test('звёзды собираются', async ({ page }) => {
    await openGame(page);
    await startLevel(page, 1);
    await teleport(page, 1220, 480);
    await expect.poll(async () => (await state(page)).stars).toBe(1);
    await expect(page.getByTestId('stars')).toContainText('1');
  });

  test('падение возвращает к последней контрольной точке', async ({ page }) => {
    await openGame(page);
    await startLevel(page, 1);
    await teleport(page, 1420, 540);
    await expect.poll(async () => (await state(page)).respawn.x).toBe(1360);
    await teleport(page, 1220, 680); // в яму
    await expect.poll(async () => (await state(page)).x, { timeout: 5000 }).toBeCloseTo(1360, 0);
    const s = await settle(page);
    expect(s.feetY).toBeCloseTo(600, 0);
  });

  test('пауза по Escape и продолжение', async ({ page }) => {
    await openGame(page);
    await startLevel(page, 1);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu')).toBeHidden();
    await page.getByTestId('pause').click();
    await page.getByTestId('resume').click();
    await expect(page.getByTestId('game-screen')).toHaveAttribute('data-phase', 'play');
  });
});

test.describe('Задания уровня 1', () => {
  test('чтение: ошибка даёт подсказку без штрафа, верный ответ продолжает игру', async ({ page }) => {
    await openGame(page);
    await startLevel(page, 1);
    await teleport(page, 1530, 540);
    const card = page.getByTestId('question-card');
    await expect(card).toBeVisible();
    const q = await runtimeQuestion(page, 'l1-sign');
    // Записка вариативна, но всегда про золотой ключ и ворота.
    await expect(page.getByTestId('q-story')).toContainText('ключ');
    const wrong = q.options.find((o) => o.id !== q.correct)!;
    await page.getByTestId(`option-${wrong.id}`).click();
    await expect(page.getByTestId('q-hint')).toBeVisible();
    await expect(card).toBeVisible();
    await expect(page.getByTestId(`option-${wrong.id}`)).toBeDisabled();
    await page.getByTestId(`option-${q.correct}`).click();
    await expect(page.getByTestId('q-success')).toBeVisible();
    await expect(card).toBeHidden({ timeout: 5000 });
    expect(await hasFlag(page, 'sign')).toBe(true);
    await expect(page.getByTestId('goal')).toContainText('Найди золотой ключ');
    expect((await state(page)).modal).toBe(false);
  });

  test('карточку можно закрыть и вернуться позже', async ({ page }) => {
    await openGame(page);
    await startLevel(page, 1);
    await teleport(page, 1530, 540);
    await page.getByTestId('question-close').click();
    await expect(page.getByTestId('question-card')).toBeHidden();
    expect((await state(page)).modal).toBe(false);
    await teleport(page, 1300, 540);
    await page.waitForTimeout(200);
    await teleport(page, 1530, 540);
    await expect(page.getByTestId('question-card')).toBeVisible();
  });

  test('ворота не пускают без ключа и открываются ключом', async ({ page }) => {
    await openGame(page);
    await startLevel(page, 1);
    await teleport(page, 2480, 540);
    await settle(page);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(900);
    await page.keyboard.up('ArrowRight');
    expect((await state(page)).x).toBeLessThan(2600);
    await expect(page.getByTestId('toast').filter({ hasText: 'ключ' })).toBeVisible();
    expect(await hasFlag(page, 'gate')).toBe(false);

    await teleport(page, 2380, 250);
    await expect.poll(() => hasFlag(page, 'item:key')).toBe(true);
    await teleport(page, 2480, 540);
    await settle(page);
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => (await state(page)).x, { timeout: 5000 }).toBeGreaterThan(2750);
    await page.keyboard.up('ArrowRight');
    expect(await hasFlag(page, 'gate')).toBe(true);
  });

  test('полное прохождение уровня 1, открытие уровня 2 и сохранение после перезагрузки', async ({ page }) => {
    const errors = trackErrors(page);
    await openGame(page);
    await startLevel(page, 1);
    await playThrough(page, true);
    await expect(page.getByTestId('unlocked-next')).toContainText('2');
    await page.reload();
    await page.getByTestId('play').click();
    await expect(page.getByTestId('level-2')).toBeEnabled();
    await expect(page.getByTestId('level-1')).toContainText('✓');
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
    expect(saved.completedLevels).toContain(1);
    expect(saved.rewards).toContain('gold-star');
    expect(saved.skillStats.reading.solved).toBe(3);
    expect(saved.skillStats.reading.hints).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test('облачный мостик появляется после ответа и держит лампу', async ({ page }) => {
    await openGame(page);
    await startLevel(page, 1);
    await teleport(page, 5085, 440);
    // Облаков ещё нет — лампа падает и возвращается к пройденной контрольной точке (x=3950).
    await expect.poll(async () => (await state(page)).x, { timeout: 5000 }).toBeCloseTo(3950, 0);
    await teleport(page, 4660, 540);
    await answerOpenCard(page);
    await answerOpenCard(page);
    await teleport(page, 5085, 440);
    const s = await settle(page);
    expect(s.feetY).toBeCloseTo(540, 0);
  });
});

test.describe('Все уровни', () => {
  test('четыре уровня проходятся строго по порядку до финала', async ({ page }) => {
    test.setTimeout(240_000);
    const errors = trackErrors(page);
    await openGame(page);
    for (const id of [1, 2, 3, 4]) {
      if (id === 1) await startLevel(page, 1);
      else {
        await page.getByTestId('next-level').click();
        await page.getByTestId('start-level').click();
        await expect.poll(async () => (await state(page)).levelId).toBe(id);
        await expect.poll(async () => (await state(page)).modal).toBe(false);
      }
      await playThrough(page, id === 3);
    }
    await expect(page.getByTestId('level-complete')).toContainText('Победа');
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
    expect(saved.completedLevels).toEqual([1, 2, 3, 4]);
    expect(saved.rewards).toHaveLength(4);
    for (const skill of ['reading', 'counting', 'comparison', 'addition', 'subtraction', 'english-word-to-picture', 'english-picture-to-word']) {
      expect(saved.skillStats[skill].solved, skill).toBeGreaterThan(0);
    }
    await page.getByTestId('open-collection').click();
    await expect(page.getByTestId('reward-golden-bulb')).toContainText('Золотая лампочка');
    expect(errors).toEqual([]);
  });

  test('пройденный уровень можно перезапустить', async ({ page }) => {
    await openGame(page, JSON.stringify({ unlockedLevels: [1, 2], completedLevels: [1], tutorialSeen: true, settings: { sound: false } }));
    await startLevel(page, 1);
    await page.getByTestId('pause').click();
    await page.getByTestId('restart').click();
    await expect(page.getByTestId('game-screen')).toHaveAttribute('data-phase', 'play');
    const s = await state(page);
    expect(s.stars).toBe(0);
    expect(s.x).toBeLessThan(400);
  });
});

test.describe('Сенсорное управление', () => {
  test.use({ hasTouch: true });

  async function pointer(page: Page, testId: string, type: string, id: number, dx = 0) {
    await page.evaluate(
      ([tid, t, pid, off]) => {
        const el = document.querySelector(`[data-testid="${tid}"]`) as HTMLElement;
        const r = el.getBoundingClientRect();
        el.dispatchEvent(
          new PointerEvent(t as string, {
            pointerId: pid as number,
            pointerType: 'touch',
            isPrimary: pid === 1,
            bubbles: true,
            cancelable: true,
            clientX: r.left + r.width / 2 + (off as number),
            clientY: r.top + r.height / 2,
          }),
        );
      },
      [testId, type, id, dx] as const,
    );
  }

  test('удержание, одновременный прыжок, отпускание и уход пальца', async ({ page }) => {
    const errors = trackErrors(page);
    await openGame(page);
    await startLevel(page, 1);
    await expect(page.getByTestId('dpad')).toBeVisible();
    await expect(page.getByTestId('btn-jump')).toBeVisible();
    const s0 = await settle(page);

    // Удержание «вправо».
    await pointer(page, 'btn-right', 'pointerdown', 1);
    await page.waitForTimeout(500);
    const s1 = await state(page);
    expect(s1.x).toBeGreaterThan(s0.x + 60);
    await expect(page.getByTestId('btn-right')).toHaveClass(/active/);

    // Второй палец — прыжок, первый всё ещё держит движение.
    await pointer(page, 'btn-jump', 'pointerdown', 2);
    await expect.poll(async () => (await state(page)).vy).toBeLessThan(0);
    expect((await state(page)).vx).toBeGreaterThan(100);
    await pointer(page, 'btn-jump', 'pointerup', 2);
    await settle(page);
    expect((await state(page)).vx).toBeGreaterThan(100); // движение не сбросилось

    // Палец скользит на левую половину — лампа разворачивается.
    await pointer(page, 'dpad', 'pointermove', 1, -60);
    await expect.poll(async () => (await state(page)).vx).toBeLessThan(-100);

    // Палец уходит далеко за кнопки — движение останавливается.
    await pointer(page, 'dpad', 'pointermove', 1, 600);
    await expect.poll(async () => Math.abs((await state(page)).vx)).toBeLessThan(1);

    // Возврат и отпускание.
    await pointer(page, 'btn-right', 'pointermove', 1);
    await expect.poll(async () => (await state(page)).vx).toBeGreaterThan(100);
    await pointer(page, 'btn-right', 'pointerup', 1);
    await expect.poll(async () => Math.abs((await state(page)).vx)).toBeLessThan(1);

    // pointercancel (например, системный жест) тоже отпускает кнопку.
    await pointer(page, 'btn-left', 'pointerdown', 3);
    await expect.poll(async () => (await state(page)).vx).toBeLessThan(-100);
    await pointer(page, 'btn-left', 'pointercancel', 3);
    await expect.poll(async () => Math.abs((await state(page)).vx)).toBeLessThan(1);
    expect(errors).toEqual([]);
  });

  test('страница не прокручивается и не масштабируется жестами', async ({ page }) => {
    await openGame(page);
    await startLevel(page, 1);
    if (!test.info().project.name.includes('ipad')) await page.mouse.wheel(0, 800);
    const metrics = await page.evaluate(() => {
      const prevented = (() => {
        const ev = new TouchEvent('touchmove', { bubbles: true, cancelable: true });
        document.querySelector('[data-testid="game-canvas"]')!.dispatchEvent(ev);
        return ev.defaultPrevented;
      })();
      return {
        scrollY: window.scrollY,
        scrollTop: document.scrollingElement?.scrollTop ?? 0,
        overflow: getComputedStyle(document.body).overflow,
        touchAction: getComputedStyle(document.querySelector('.game-screen')!).touchAction,
        prevented,
      };
    });
    expect(metrics.scrollY).toBe(0);
    expect(metrics.scrollTop).toBe(0);
    expect(metrics.overflow).toBe('hidden');
    expect(metrics.touchAction).toBe('none');
    expect(metrics.prevented).toBe(true);
  });
});
