export function Tutorial({ touch, onDone }: { touch: boolean; onDone: () => void }) {
  return (
    <div className="overlay" data-testid="tutorial">
      <div className="card tutorial-card">
        <h2>Как играть</h2>
        {touch ? (
          <div className="tut-row">
            <div className="tut-item">
              <div className="tut-keys">
                <span className="tut-btn">◀</span>
                <span className="tut-btn">▶</span>
              </div>
              <div>Держи кнопку — Лучик идёт</div>
            </div>
            <div className="tut-item">
              <div className="tut-keys">
                <span className="tut-btn big">▲</span>
              </div>
              <div>Нажми — Лучик прыгает</div>
            </div>
          </div>
        ) : (
          <div className="tut-row">
            <div className="tut-item">
              <div className="tut-keys">
                <kbd>←</kbd>
                <kbd>→</kbd>
              </div>
              <div>или A / D — идти</div>
            </div>
            <div className="tut-item">
              <div className="tut-keys">
                <kbd className="wide">Пробел</kbd>
              </div>
              <div>или ↑ — прыжок</div>
            </div>
            <div className="tut-item">
              <div className="tut-keys">
                <kbd>Esc</kbd>
              </div>
              <div>пауза</div>
            </div>
          </div>
        )}
        <div className="tut-row small">
          <div className="tut-item">⭐ Собирай звёзды</div>
          <div className="tut-item">❗ Подходи к друзьям</div>
          <div className="tut-item">✨ Найди портал</div>
        </div>
        <button className="btn btn-primary btn-xl" data-testid="tutorial-ok" onClick={onDone} autoFocus>
          Понятно!
        </button>
      </div>
    </div>
  );
}
