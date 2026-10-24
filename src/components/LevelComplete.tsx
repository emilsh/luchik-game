import { REWARDS, SHARD_IDS } from '../data/rewards';
import { CHAPTER2_FINALE, FINALE_TEXT } from '../data/stories';
import { CHAPTERS } from '../data/chapters';
import type { LevelDef, RewardId } from '../types/game';
import type { CompletionResult } from '../game/systems/ProgressManager';
import { levelRewards } from '../game/levels';
import { useProgress } from '../app/useProgress';
import { ShardRow } from './LevelSelect';
import { SpriteImg } from './common';

function RewardCard({ id, isNew }: { id: RewardId; isNew: boolean }) {
  const r = REWARDS[id];
  const shardIndex = SHARD_IDS.indexOf(id);
  return (
    <div className={`complete-reward ${isNew ? 'new' : ''}`} data-testid={`complete-reward-${id}`}>
      <div className="complete-reward-icon">{shardIndex >= 0 ? <SpriteImg name="shard" size={64} /> : r.emoji}</div>
      <div>
        <div className="complete-reward-name">
          {isNew ? (shardIndex >= 0 ? 'Найден ' : 'Новая награда: ') : ''}
          {shardIndex >= 0 ? `осколок ${shardIndex + 1} из 8` : r.name}
        </div>
        <div className="complete-reward-desc">{r.description}</div>
      </div>
    </div>
  );
}

export function LevelComplete({
  level,
  stars,
  totalStars,
  result,
  onNext,
  onReplay,
  onLevels,
  onCollection,
}: {
  level: LevelDef;
  stars: number;
  totalStars: number;
  result: CompletionResult;
  onNext: (() => void) | null;
  onReplay: () => void;
  onLevels: () => void;
  onCollection: () => void;
}) {
  const save = useProgress();
  const chapter = CHAPTERS.find((c) => c.levels.includes(level.id)) ?? CHAPTERS[0];
  const isChapterEnd = chapter.levels[chapter.levels.length - 1] === level.id;
  const isChapter2End = isChapterEnd && chapter.id === 2;
  // For chapter 2 show the shard first, then the other rewards.
  const rewards = levelRewards(level).sort((a, b) => Number(b.startsWith('shard')) - Number(a.startsWith('shard')));

  return (
    <div className={`overlay complete-overlay ${isChapterEnd ? 'final' : ''}`} data-testid="level-complete">
      <div className="confetti" aria-hidden>
        {Array.from({ length: 24 }, (_, i) => (
          <i key={i} style={{ ['--i' as string]: i }} />
        ))}
      </div>
      <div className={`card complete-card scrollable ${isChapter2End ? 'chapter-end' : ''}`}>
        {isChapter2End ? (
          <>
            <div className="chapter-badge" data-testid="chapter-complete">
              Глава 2 пройдена!
            </div>
            <h2>Кристалл Света собран!</h2>
            <p className="final-text">{CHAPTER2_FINALE}</p>
            <div className="crystal-assembly" aria-hidden>
              {SHARD_IDS.map((id, i) => (
                <span key={id} style={{ ['--i' as string]: i }}>
                  <SpriteImg name="shard" size={40} />
                </span>
              ))}
              <div className="crystal-core">🔮</div>
            </div>
          </>
        ) : (
          <>
            <h2>{isChapterEnd ? 'Победа!' : 'Уровень пройден!'}</h2>
            {isChapterEnd && <p className="final-text">{FINALE_TEXT}</p>}
          </>
        )}
        <div className="complete-stars" data-testid="complete-stars">
          ⭐ {stars} <small>из {totalStars}</small>
        </div>
        {result.bestStars > stars && <div className="complete-best">Лучший результат: {result.bestStars}</div>}
        {rewards.map((r) => (
          <RewardCard key={r} id={r} isNew={result.newRewards.includes(r)} />
        ))}
        {chapter.id === 2 && !isChapter2End && <ShardRow found={save.rewards} size={28} />}
        {result.unlockedLevel && (
          <div className="complete-unlocked" data-testid="unlocked-next">
            🔓 Открыт уровень {result.unlockedLevel}!
          </div>
        )}
        <div className="complete-buttons">
          {onNext && (
            <button className="btn btn-primary btn-xl" data-testid="next-level" onClick={onNext} autoFocus>
              Дальше ▶
            </button>
          )}
          {isChapterEnd && (
            <button className="btn btn-primary btn-xl" data-testid="open-collection" onClick={onCollection}>
              🏆 Коллекция
            </button>
          )}
          <button className="btn btn-secondary" data-testid="replay" onClick={onReplay}>
            ↻ Ещё раз
          </button>
          <button className="btn btn-secondary" data-testid="complete-levels" onClick={onLevels}>
            🗺️ {isChapter2End ? 'Карта мира: играть любой уровень' : 'Карта'}
          </button>
        </div>
      </div>
    </div>
  );
}
