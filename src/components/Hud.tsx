import type { HudState } from '../game/events';

export function Hud({ hud, onPause }: { hud: HudState | null; onPause: () => void }) {
  return (
    <div className="hud">
      <button
        className="hud-btn"
        aria-label="Пауза"
        data-testid="pause"
        onPointerUp={(e) => e.currentTarget.blur()}
        onClick={onPause}
      >
        ⏸
      </button>
      {hud && (
        <div className="hud-goal" data-testid="goal">
          <span className="hud-goal-emoji">{hud.goal.emoji}</span>
          <span>{hud.goal.text}</span>
          {hud.goal.progress && <span className="hud-goal-progress">{hud.goal.progress}</span>}
        </div>
      )}
      {hud && (
        <div className="hud-stars" data-testid="stars">
          <span className="hud-star-icon">⭐</span>
          <span>
            {hud.stars}
            <small>/{hud.totalStars}</small>
          </span>
        </div>
      )}
    </div>
  );
}
