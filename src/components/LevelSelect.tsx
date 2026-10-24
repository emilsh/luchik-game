import { useState } from 'react';
import type { Screen } from '../app/routes';
import { useProgress } from '../app/useProgress';
import { CHAPTERS, chapterOf } from '../data/chapters';
import { SHARD_IDS } from '../data/rewards';
import { getLevel } from '../game/levels';
import { THEMES } from '../game/world/themes';
import { BackButton, MenuSky, SoundToggles, SpriteImg } from './common';

/** Ряд из восьми осколков Кристалла Света: найденные светятся. */
export function ShardRow({ found, size = 34 }: { found: string[]; size?: number }) {
  return (
    <div className="shard-row" data-testid="shard-row" aria-label={`Осколков найдено: ${SHARD_IDS.filter((s) => found.includes(s)).length} из 8`}>
      {SHARD_IDS.map((id) => (
        <span key={id} className={`shard-slot ${found.includes(id) ? 'got' : ''}`}>
          <SpriteImg name="shard" size={size} />
        </span>
      ))}
    </div>
  );
}

/** Карта мира: главы как вкладки, уровни — точки на извилистой дорожке. */
export function LevelSelect({ go }: { go: (s: Screen) => void }) {
  const save = useProgress();
  const [chapterId, setChapterId] = useState(() => chapterOf(save.currentLevel).id);
  const chapter = CHAPTERS.find((c) => c.id === chapterId) ?? CHAPTERS[0];
  const chapter2Open = save.unlockedLevels.includes(CHAPTERS[1].levels[0]);
  const perRow = chapter.levels.length > 4 ? 4 : chapter.levels.length;

  return (
    <div className="screen levels-screen">
      <MenuSky />
      <SoundToggles />
      <BackButton onClick={() => go({ name: 'menu' })} />
      <h2 className="screen-title">Карта мира</h2>

      <div className="chapter-tabs" role="tablist">
        {CHAPTERS.map((c) => {
          const open = c.id === 1 || chapter2Open;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === chapterId}
              className={`chapter-tab ${c.id === chapterId ? 'active' : ''}`}
              data-testid={`chapter-${c.id}`}
              disabled={!open}
              onClick={() => setChapterId(c.id)}
            >
              {open ? '' : '🔒 '}
              {c.title}. {c.subtitle}
            </button>
          );
        })}
      </div>

      {chapter.id === 2 && <ShardRow found={save.rewards} />}

      <div className="map" style={{ ['--per-row' as string]: perRow }} data-testid="world-map">
        {chapter.levels.map((id, i) => {
          const lv = getLevel(id);
          const unlocked = save.unlockedLevels.includes(id);
          const done = save.completedLevels.includes(id);
          const best = save.bestStars[String(id)];
          const current = unlocked && !done && id === Math.max(...save.unlockedLevels);
          const row = Math.floor(i / perRow);
          // Змейка: чётные ряды слева направо, нечётные — справа налево.
          const col = row % 2 === 0 ? i % perRow : perRow - 1 - (i % perRow);
          return (
            <button
              key={id}
              className={`map-node ${unlocked ? '' : 'locked'} ${done ? 'done' : ''} ${current ? 'current' : ''}`}
              style={{ gridRow: row + 1, gridColumn: col + 1, ['--card' as string]: THEMES[lv.theme].card }}
              disabled={!unlocked}
              data-testid={`level-${id}`}
              aria-label={`${lv.name}${unlocked ? '' : ' — закрыт'}`}
              onClick={() => go({ name: 'game', levelId: id })}
            >
              <span className="map-badge">
                <span className="map-emoji">{unlocked ? lv.emoji : '🔒'}</span>
                <span className="level-num">{id}</span>
                {done && <span className="level-done">✓</span>}
                {current && <span className="map-here">⬇</span>}
              </span>
              <span className="map-name">{lv.name}</span>
              {unlocked && best !== undefined && (
                <span className="level-stars">
                  ⭐ {best}/{lv.stars.length}
                </span>
              )}
              {done && lv.chapter === 2 && (
                <SpriteImg name="shard" size={26} className="map-shard" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
