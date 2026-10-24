import { useEffect, useRef } from 'react';
import { mountGame, startLevel, unmountGame } from '../game/gameHost';

/** Контейнер для канваса Phaser. Сама игра живёт в gameHost и переиспользуется. */
export function GameCanvas({ levelId, runId }: { levelId: number; runId: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    mountGame(ref.current);
    return () => unmountGame();
  }, []);

  useEffect(() => {
    void startLevel(levelId);
  }, [levelId, runId]);

  return <div ref={ref} className="game-canvas" data-testid="game-canvas" />;
}
