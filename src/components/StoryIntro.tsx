import type { LevelDef } from '../types/game';
import { SPRITES, type SpriteKey } from '../game/art/sprites';
import { chapterOf } from '../data/chapters';
import { speakRussian, speechAvailable } from '../game/systems/Speech';
import { useProgress } from '../app/useProgress';
import { SpriteImg } from './common';

const PORTRAIT: Record<number, SpriteKey> = { 1: 'lampFull', 2: 'robot', 3: 'owl', 4: 'machine' };

export function StoryIntro({
  level,
  showChapterIntro = false,
  onStart,
}: {
  level: LevelDef;
  showChapterIntro?: boolean;
  onStart: () => void;
}) {
  const { settings } = useProgress();
  const chapter = chapterOf(level.id);
  const portrait = (level.portrait && level.portrait in SPRITES ? level.portrait : PORTRAIT[level.id]) as SpriteKey | undefined;
  const lines = showChapterIntro ? [...chapter.intro, ...level.intro] : level.intro;
  return (
    <div className="overlay" data-testid="story-intro">
      <div className="card intro-card">
        <SpriteImg name={portrait ?? 'lampFull'} size={130} className="intro-portrait" />
        <div className="intro-text">
          {showChapterIntro && (
            <div className="chapter-badge" data-testid="chapter-intro">
              {chapter.title}. {chapter.subtitle}
            </div>
          )}
          <div className="intro-level">
            {chapter.title} · Уровень {level.id} · {level.emoji}
          </div>
          <h2>{level.name}</h2>
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          <div className="intro-buttons">
            <button className="btn btn-primary btn-xl" data-testid="start-level" onClick={onStart} autoFocus>
              Вперёд! ▶
            </button>
            {settings.readAloud && speechAvailable() && (
              <button className="icon-btn" onClick={() => speakRussian(lines.join(' '))} aria-label="Послушать">
                🔊
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
