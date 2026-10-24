import { useMemo, useState } from 'react';
import type { Screen } from '../app/routes';
import { useProgress } from '../app/useProgress';
import { SKILL_NAMES } from '../data/questions';
import { LEVELS } from '../game/levels';
import { progress } from '../game/systems/ProgressManager';
import { SKILLS } from '../types/game';
import { tierFor } from '../game/systems/variants';
import { BackButton } from './common';

function ParentGate({ onPass }: { onPass: () => void }) {
  const [a, b] = useMemo(() => [6 + Math.floor(Math.random() * 4), 3 + Math.floor(Math.random() * 6)], []);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(value) === a * b) onPass();
    else {
      setWrong(true);
      setValue('');
    }
  };
  return (
    <form className="parent-gate" onSubmit={submit}>
      <h2>Раздел для взрослых</h2>
      <p>
        Чтобы войти, решите пример: <b>{a} × {b}</b>
      </p>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
        aria-label="Ответ"
        data-testid="gate-input"
        autoFocus
      />
      <button type="submit" className="btn btn-primary" data-testid="gate-submit">
        Войти
      </button>
      {wrong && <p className="gate-wrong">Неверно, попробуйте ещё раз.</p>}
    </form>
  );
}

export function ParentDashboard({ go }: { go: (s: Screen) => void }) {
  const save = useProgress();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const hintLeaders = SKILLS.filter((s) => save.skillStats[s].hints > 0)
    .map((s) => ({ s, ratio: save.skillStats[s].hints / Math.max(1, save.skillStats[s].solved) }))
    .sort((x, y) => y.ratio - x.ratio)
    .slice(0, 3);

  return (
    <div className="screen parents-screen scrollable">
      <BackButton onClick={() => go({ name: 'menu' })} label="В меню" />
      {!open ? (
        <ParentGate onPass={() => setOpen(true)} />
      ) : (
        <div className="parents-panel" data-testid="parents-panel">
          <h2>Панель для родителей</h2>
          <p className="note">
            Это игровая статистика, а не оценка знаний или развития ребёнка. Все данные хранятся только в этом
            браузере и никуда не отправляются.
          </p>

          <section>
            <h3>Уровни</h3>
            <table>
              <thead>
                <tr>
                  <th>Уровень</th>
                  <th>Доступен</th>
                  <th>Пройден</th>
                  <th>Лучший результат</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.id}. {l.name}
                    </td>
                    <td>{save.unlockedLevels.includes(l.id) ? 'да' : 'нет'}</td>
                    <td data-testid={`parents-level-${l.id}-done`}>{save.completedLevels.includes(l.id) ? '✓' : '—'}</td>
                    <td>
                      {save.bestStars[String(l.id)] !== undefined
                        ? `⭐ ${save.bestStars[String(l.id)]} из ${l.stars.length}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3>Задания по навыкам</h3>
            <table>
              <thead>
                <tr>
                  <th>Навык</th>
                  <th>Встречался</th>
                  <th>Выполнено заданий</th>
                  <th>Показано подсказок</th>
                  <th>Сложность сейчас</th>
                </tr>
              </thead>
              <tbody>
                {SKILLS.map((s) => {
                  const st = save.skillStats[s];
                  return (
                    <tr key={s}>
                      <td>{SKILL_NAMES[s]}</td>
                      <td>{st.seen > 0 ? 'да' : 'ещё нет'}</td>
                      <td>{st.solved}</td>
                      <td>{st.hints}</td>
                      <td aria-label={`Сложность ${tierFor(save.currentLevel, save.mastery[s])} из 3`}>
                        {'●'.repeat(tierFor(save.currentLevel, save.mastery[s]))}
                        {'○'.repeat(3 - tierFor(save.currentLevel, save.mastery[s]))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="note">
              Задания меняются при каждом прохождении. Сложность подбирается автоматически по последним
              ответам: если задания решаются с первой попытки — становятся чуть сложнее, если нужны
              подсказки — проще. Числа никогда не выходят за пределы уровня (до 10, 15 или 20).
            </p>
            <p className="note">
              {hintLeaders.length > 0
                ? `Подсказки чаще всего показывались в заданиях: ${hintLeaders.map((h) => SKILL_NAMES[h.s].toLowerCase()).join(', ')}.`
                : 'Подсказки пока не показывались.'}
            </p>
          </section>

          <section>
            <h3>Настройки</h3>
            <label className="setting">
              <input
                type="checkbox"
                checked={save.settings.sound}
                onChange={(e) => progress.setSetting('sound', e.target.checked)}
              />
              Звуковые эффекты
            </label>
            <label className="setting">
              <input
                type="checkbox"
                checked={save.settings.music}
                onChange={(e) => progress.setSetting('music', e.target.checked)}
              />
              Музыка в меню
            </label>
            <label className="setting">
              <input
                type="checkbox"
                checked={save.settings.readAloud}
                data-testid="setting-read-aloud"
                onChange={(e) => progress.setSetting('readAloud', e.target.checked)}
              />
              Кнопка «Послушать» для русского текста (помощь в чтении)
            </label>
          </section>

          <section>
            <h3>Сброс прогресса</h3>
            {resetDone && <p className="note">Прогресс сброшен.</p>}
            {!confirmReset ? (
              <button className="btn btn-danger" data-testid="reset" onClick={() => setConfirmReset(true)}>
                Сбросить прогресс…
              </button>
            ) : (
              <div className="confirm-row">
                <span>Удалить все уровни, награды и статистику?</span>
                <button
                  className="btn btn-danger"
                  data-testid="reset-confirm"
                  onClick={() => {
                    progress.reset();
                    setConfirmReset(false);
                    setResetDone(true);
                  }}
                >
                  Да, сбросить
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
                  Отмена
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
