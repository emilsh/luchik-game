import type { QuestionDef, RobotCmd } from '../../../types/game';
import { runProgram } from '../robotProgram';

// Проверка задания: одно верное решение, понятные варианты, числа в пределах.
// Используется и в игре (непрошедший вариант заменяется исходным заданием),
// и в автотестах.

const MAX_NUMBER = 20;

function routeOk(rows: string[], label: string): boolean {
  let r = rows.findIndex((row) => row.includes('S'));
  let c = rows[r].indexOf('S');
  for (const step of label.split(' ').filter(Boolean)) {
    if (step === '→') c++;
    else if (step === '←') c--;
    else if (step === '↓') r++;
    else if (step === '↑') r--;
    const cell = rows[r]?.[c];
    if (cell === undefined || cell === '#') return false;
  }
  return rows[r]?.[c] === 'G';
}

export function validateQuestion(q: QuestionDef): string[] {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`${q.id}: ${m}`);
  if (!q.prompt) err('нет вопроса');
  if (!q.hint || q.hint.length < 6) err('нет подсказки');
  const ids = q.options.map((o) => o.id);
  if (new Set(ids).size !== ids.length) err('повторяются варианты');
  const looks = q.options.map((o) => `${o.emoji ?? ''}|${o.label ?? ''}`);
  if (new Set(looks).size !== looks.length) err('варианты выглядят одинаково');

  if (q.program) {
    if (!runProgram(q.program.track, q.program.solution).success) err('программа-решение не работает');
    if (q.program.solution.length > q.program.slots) err('решение длиннее ячеек');
    const allForward = Array(q.program.slots).fill('forward') as RobotCmd[];
    if (runProgram(q.program.track, allForward).success) err('решается без прыжков');
    return errors;
  }
  if (q.order) {
    if (q.order.length !== q.options.length || [...q.order].sort().join() !== [...ids].sort().join()) err('порядок не совпадает с вариантами');
    if (ids.join() === q.order.join()) err('карточки уже лежат по порядку');
    return errors;
  }

  if (q.options.length < 2 || q.options.length > 3) err('нужно 2–3 варианта');
  if (q.options.filter((o) => o.id === q.correct).length !== 1) err('верный вариант не найден');

  const v = q.visual;
  if (v?.kind === 'equation') {
    const r = v.op === '+' ? v.a + v.b : v.a - v.b;
    const expected = v.unknown === 'b' ? v.b : r;
    if (String(expected) !== q.correct) err(`ответ ${q.correct}, а должен быть ${expected}`);
    if (r < 0 || v.a < 0 || v.b <= 0) err('отрицательные числа');
    if (Math.max(v.a, v.b, r) > MAX_NUMBER) err('число больше 20');
  }
  if (v?.kind === 'count' && String(v.count) !== q.correct) err('счёт не совпадает');
  if (v?.kind === 'energy') {
    const left = v.total - v.steps.reduce((n, s) => n + s.amount, 0);
    if (left < 0 || String(left) !== q.correct) err('энергия не сходится');
  }
  if (v?.kind === 'sequence' && v.items.every((x) => /^\d+$/.test(x))) {
    const n = v.items.map(Number);
    const step = n[1] - n[0];
    if (!n.every((x, i) => i === 0 || x - n[i - 1] === step)) err('ряд без постоянного шага');
    if (String(n[n.length - 1] + step) !== q.correct) err('следующее число неверно');
  }
  if (v?.kind === 'code') {
    if (runProgram(v.track, v.steps).success) err('в программе нет ошибки');
    const toggle = (c: RobotCmd): RobotCmd => (c === 'jump' ? 'forward' : 'jump');
    const fixes = v.steps.map((_, i) => i).filter((i) => runProgram(v.track, v.steps.map((c, k) => (k === i ? toggle(c) : c))).success);
    if (fixes.length !== 1 || String(fixes[0]) !== q.correct) err('ошибку можно исправить не одним способом');
  }
  if (v?.kind === 'grid') {
    const good = q.options.filter((o) => routeOk(v.rows, o.label ?? ''));
    if (good.length !== 1 || good[0].id !== q.correct) err('верный маршрут не единственный');
  }
  for (const o of q.options) {
    if (o.label && /^\d+$/.test(o.label) && (Number(o.label) < 0 || Number(o.label) > MAX_NUMBER + 5)) err('вариант вне диапазона');
  }
  return errors;
}
