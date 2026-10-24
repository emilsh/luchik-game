import { SoundToggles } from './common';

export function PauseMenu({
  onResume,
  onRestart,
  onLevels,
}: {
  onResume: () => void;
  onRestart: () => void;
  onLevels: () => void;
}) {
  return (
    <div className="overlay" data-testid="pause-menu">
      <div className="card pause-card">
        <h2>Пауза</h2>
        <SoundToggles />
        <button className="btn btn-primary btn-xl" data-testid="resume" onClick={onResume} autoFocus>
          ▶ Продолжить
        </button>
        <button className="btn btn-secondary" data-testid="restart" onClick={onRestart}>
          ↻ Начать уровень заново
        </button>
        <button className="btn btn-secondary" data-testid="to-levels" onClick={onLevels}>
          🗺️ Выбор уровня
        </button>
      </div>
    </div>
  );
}
