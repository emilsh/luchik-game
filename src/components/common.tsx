import { useMemo } from 'react';
import { svgDataUri, type SpriteKey } from '../game/art/sprites';
import { progress } from '../game/systems/ProgressManager';
import { useProgress } from '../app/useProgress';

export function SpriteImg({ name, size, className }: { name: SpriteKey; size: number; className?: string }) {
  const src = useMemo(() => svgDataUri(name, 2), [name]);
  return <img src={src} alt="" draggable={false} className={className} style={{ height: size }} />;
}

export function SoundToggles() {
  const { settings } = useProgress();
  return (
    <div className="sound-toggles">
      <button
        className="icon-btn"
        aria-label={settings.sound ? 'Выключить звук' : 'Включить звук'}
        aria-pressed={settings.sound}
        data-testid="toggle-sound"
        onClick={() => progress.setSetting('sound', !settings.sound)}
      >
        {settings.sound ? '🔊' : '🔇'}
      </button>
      <button
        className={`icon-btn ${settings.music ? '' : 'off'}`}
        aria-label={settings.music ? 'Выключить музыку' : 'Включить музыку'}
        aria-pressed={settings.music}
        data-testid="toggle-music"
        onClick={() => progress.setSetting('music', !settings.music)}
      >
        🎵
      </button>
    </div>
  );
}

export function BackButton({ onClick, label = 'Назад' }: { onClick: () => void; label?: string }) {
  return (
    <button className="back-btn" onClick={onClick} data-testid="back">
      ← {label}
    </button>
  );
}

/** Фоновое небо с облаками для меню. */
export function MenuSky() {
  return (
    <div className="menu-sky" aria-hidden>
      <SpriteImg name="cloud" size={90} className="menu-cloud c1" />
      <SpriteImg name="cloud" size={60} className="menu-cloud c2" />
      <SpriteImg name="cloud" size={74} className="menu-cloud c3" />
      <div className="menu-hills" />
    </div>
  );
}
