import type { Screen } from '../app/routes';
import { useProgress } from '../app/useProgress';
import { LEVEL_COUNT } from '../data/chapters';
import { MenuSky, SoundToggles, SpriteImg } from './common';

export function MainMenu({ go }: { go: (s: Screen) => void }) {
  const save = useProgress();
  const hasProgress = save.completedLevels.length > 0 || save.tutorialSeen;
  const allDone = save.completedLevels.length === LEVEL_COUNT;

  return (
    <div className="screen menu-screen">
      <MenuSky />
      <SoundToggles />
      <div className="menu-content">
        <div className="hero">
          <div className="hero-glow" />
          <SpriteImg name="lampFull" size={190} className="hero-lamp" />
        </div>
        <div className="menu-side">
          <h1 className="title">
            Lamp <span>Quest</span>
          </h1>
          <p className="subtitle">Приключения лампы Лучика</p>
          <div className="menu-buttons">
            <button className="btn btn-primary btn-xl" data-testid="play" onClick={() => go({ name: 'levels' })}>
              ▶ Играть
            </button>
            {hasProgress && !allDone && (
              <button
                className="btn btn-secondary"
                data-testid="continue"
                onClick={() => go({ name: 'game', levelId: save.currentLevel })}
              >
                ⏩ Продолжить: уровень {save.currentLevel}
              </button>
            )}
            <button className="btn btn-secondary" data-testid="collection" onClick={() => go({ name: 'collection' })}>
              🏆 Коллекция
            </button>
          </div>
        </div>
      </div>
      <button className="parents-link" data-testid="parents" onClick={() => go({ name: 'parents' })}>
        👪 Для родителей
      </button>
    </div>
  );
}
