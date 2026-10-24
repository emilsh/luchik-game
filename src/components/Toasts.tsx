import type { ToastEvent } from '../game/events';
import { speakEnglish } from '../game/systems/Speech';

export interface ToastItem extends ToastEvent {
  id: number;
}

export function Toasts({ items }: { items: ToastItem[] }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind ?? 'info'}`} data-testid="toast">
          {t.emoji && <span className="toast-emoji">{t.emoji}</span>}
          <span>{t.text}</span>
          {t.word && (
            <button className="toast-speak" onClick={() => speakEnglish(t.word as string)} aria-label="Послушать">
              🔊
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
