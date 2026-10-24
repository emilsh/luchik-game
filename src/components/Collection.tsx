import type { Screen } from '../app/routes';
import { useProgress } from '../app/useProgress';
import { REWARDS, REWARD_ORDER, SHARD_IDS } from '../data/rewards';
import { ShardRow } from './LevelSelect';
import { VOCABULARY } from '../data/vocabulary';
import { LEVELS } from '../game/levels';
import { speakEnglish } from '../game/systems/Speech';
import { BackButton, MenuSky, SoundToggles } from './common';

export function Collection({ go }: { go: (s: Screen) => void }) {
  const save = useProgress();
  const totalStars = LEVELS.reduce((n, l) => n + (save.bestStars[String(l.id)] ?? 0), 0);
  const maxStars = LEVELS.reduce((n, l) => n + l.stars.length, 0);
  const wordsOpen = save.unlockedLevels.includes(3);
  // Слова подводного города появляются, когда открыт 11-й уровень.
  const sea = new Set(['SHELL', 'WATER', 'BOAT', 'BLUE', 'GREEN']);
  const seaOpen = save.unlockedLevels.includes(11);
  const shards = SHARD_IDS.filter((id) => save.rewards.includes(id)).length;
  const chapter2Open = save.unlockedLevels.includes(5);

  return (
    <div className="screen collection-screen scrollable">
      <MenuSky />
      <SoundToggles />
      <BackButton onClick={() => go({ name: 'menu' })} />
      <h2 className="screen-title">Мастерская Лучика</h2>
      <div className="shelf">
        {REWARD_ORDER.map((id) => {
          const r = REWARDS[id];
          const has = save.rewards.includes(id);
          return (
            <div key={id} className={`reward ${has ? 'got' : 'missing'}`} data-testid={`reward-${id}`}>
              <div className="reward-icon">{has ? r.emoji : '❔'}</div>
              <div className="reward-name">{has ? r.name : '???'}</div>
              {has && <div className="reward-desc">{r.description}</div>}
            </div>
          );
        })}
      </div>
      {chapter2Open && (
        <div className="shards-panel" data-testid="shards-panel">
          <h3>Осколки Кристалла Света: {shards} из 8</h3>
          <ShardRow found={save.rewards} size={46} />
          {save.rewards.includes('light-crystal') && <div className="shards-done">🔮 Кристалл Света собран!</div>}
        </div>
      )}
      <div className="collection-stars">
        ⭐ Звёзд найдено: <b>{totalStars}</b> из {maxStars}
      </div>
      {wordsOpen && (
        <div className="words">
          <h3>Английские слова — нажми, чтобы послушать</h3>
          <div className="word-grid">
            {Object.values(VOCABULARY)
              .filter((v) => seaOpen || !sea.has(v.word))
              .map((v) => (
              <button key={v.word} className="word-chip" onClick={() => speakEnglish(v.word)}>
                <span className="word-emoji">{v.emoji}</span>
                <span className="word-en">{v.word}</span>
                <span className="word-ru">{v.ru}</span>
              </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
